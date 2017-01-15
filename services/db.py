"""
DB connection utilities
"""
__author__    = "CNRS"
__copyright__ = "Copyright 2016 ISCPIF-CNRS"
__email__     = "romain.loth@iscpif.fr"

from MySQLdb          import connect
from MySQLdb.cursors  import DictCursor

if __package__ == 'services':
    # when we're run via import
    from services.tools import mlog, REALCONFIG
else:
    # when this script is run directly
    from tools          import mlog, REALCONFIG


# sorted columns as declared in DB, as a tuple
USER_COLS = [
#          NAME,               NOT NULL,  N or MAXCHARS (if applicable)
         ("doors_uid",              True,        36),
         ("last_modified_date",     True,        24),
         ("email",                  True,       255),
         ("country",                True,        60),
         ("first_name",             True,        30),
         ("middle_name",           False,        30),
         ("last_name",              True,        50),
         ("initials",               True,         7),
         ("affiliation_id",        False,      None),   # from db_get_or_create_affiliation
         ("position",              False,        30),
         ("hon_title",             False,        30),
         ("interests_text",        False,      1200),
         ("community_hashtags",    False,       350),
         ("gender",                False,         1),
         ("job_looking_date",      False,        24),
         ("home_url",              False,       120),
         ("pic_url",               False,       120),
         ("pic_file",              False,      None)
      ]

ORG_COLS = [
         ("org",                    True,       120),
         ("org_type",               True,        50),
         ("team_lab",              False,       120),
         ("org_city",              False,        50)
    ]


FIELDS_FRONTEND_TO_SQL = {
    "keywords": "keywords.kwstr",
    "countries": "scholars.country",
    "organizations": "affiliations.org",
    "laboratories": "affiliations.team_lab",
    "tags": "scholars.community_hashtags",

    # new
    "gender": "scholars.gender",
    "cities": "affiliations.org_city",
    "linked": "linked_ids.ext_id_type"
}


def connect_db(config=REALCONFIG):
    """
    Simple connection

    TODO decide if we'll use one or multiple (<= atm multiple)
    """
    return connect(
        host=config['SQL_HOST'],
        port=int(config['SQL_PORT']),
        user="root",   # POSS change db ownership to a comexreg user
        passwd="very-safe-pass",
        db="comex_shared"
    )

def get_field_aggs(a_field, hapax_threshold=int(REALCONFIG['HAPAX_THRESHOLD'])):
    """
    Use case: api/aggs?field=a_field
       => Retrieves distinct field values and count having it

       => about *n* vs *occs*:
           - for tables != keywords count is scholar count
           - for table keywords count is occurrences count

    NB relies on FIELDS_FRONTEND_TO_SQL mapping
    POSS: allow other fields than those in the mapping
          if they are already in sql table.col format?
    """

    agg_rows = []

    if a_field in FIELDS_FRONTEND_TO_SQL:

        sql_col = FIELDS_FRONTEND_TO_SQL[a_field]
        sql_tab = sql_col.split('.')[0]

        mlog('INFO', "AGG API sql_col", sql_col)

        db = connect_db()
        db_c = db.cursor(DictCursor)

        if type(hapax_threshold) == int and hapax_threshold > 0:
            count_col = 'occs' if sql_tab == 'keywords' else 'n'
            where_clause = "WHERE %s > %i" % (count_col, hapax_threshold)
        else:
            where_clause = ""

        if sql_tab == 'scholars':
            stmt = """
                SELECT * FROM (
                    SELECT %(col)s AS x, COUNT(*) AS n
                    FROM scholars
                    GROUP BY %(col)s
                ) AS allcounts
                %(filter)s
                ORDER BY n DESC
            """ % {'col': sql_col, 'filter': where_clause}

        elif sql_tab == 'affiliations':
            stmt = """
                SELECT * FROM (
                    SELECT %(col)s AS x, COUNT(*) AS n
                    FROM scholars
                    -- 0 or 1
                    LEFT JOIN affiliations
                        ON scholars.affiliation_id = affiliations.affid
                    GROUP BY %(col)s
                ) AS allcounts
                %(filter)s
                ORDER BY n DESC
            """ % {'col': sql_col, 'filter': where_clause}

        elif sql_tab == 'linked_ids':
            stmt = """
                SELECT * FROM (
                    SELECT %(col)s AS x, COUNT(*) AS n
                    FROM scholars
                    -- 0 or 1
                    LEFT JOIN linked_ids
                        ON scholars.doors_uid = linked_ids.uid
                    GROUP BY %(col)s
                ) AS allcounts
                %(filter)s
                ORDER BY n DESC
            """ % {'col': sql_col, 'filter': where_clause}

        elif sql_tab == 'keywords':
            stmt = """
                SELECT * FROM (
                    SELECT %(col)s AS x, COUNT(*) AS occs
                    FROM scholars
                    -- 0 or many
                    LEFT JOIN sch_kw
                        ON scholars.doors_uid = sch_kw.uid
                    JOIN keywords
                        ON sch_kw.kwid = keywords.kwid
                    GROUP BY %(col)s
                ) AS allcounts
                %(filter)s
                ORDER BY occs DESC
            """ % {'col': sql_col, 'filter': where_clause}


        mlog("DEBUGSQL", "get_field_aggs STATEMENT:\n-- SQL\n%s\n-- /SQL" % stmt)

        # do it
        n_rows = db_c.execute(stmt)

        if n_rows > 0:
            agg_rows = db_c.fetchall()

        db.close()

    mlog('INFO', agg_rows)
    return agg_rows


def get_full_scholar(uid):
    """
    Autonomous function to be used by User class
       => Retrieves one line from *scholars* table, with joined optional concatenated *affiliations*, *keywords* and *linked_ids*
       => Parse it all into a structured python user info dict

       => NB: None if user doesn't exist in comex_db (but may exist in doors db)
    """
    u_row = None
    db = connect_db()
    db_c = db.cursor(DictCursor)

    # one user + all linked infos concatenated in one row
    #                                   <= 3 LEFT JOINS sequentially GROUPed
    #                                     (b/c if simultaneous, loses unicity)
    one_usr_stmt = """

        SELECT
            sch_n_aff_n_kws.*,

            -- linked_ids info condensed
            -- (format : "type1:ID1,type2:ID2,...")
            GROUP_CONCAT(
                        CONCAT(linked_ids.ext_id_type,":", linked_ids.ext_id)
                ) AS linked_ids,
            COUNT(linked_ids.ext_id) AS linked_ids_nb

        FROM (
                SELECT
                    sch_n_aff.*,

                    -- kws info condensed
                    COUNT(keywords.kwid) AS keywords_nb,
                    -- GROUP_CONCAT(keywords.kwid) AS kwids,
                    GROUP_CONCAT(keywords.kwstr) AS keywords

                FROM (
                    SELECT
                        scholars.*,
                        -- for debug replace scholars.* by
                        -- scholars.doors_uid,
                        -- scholars.email,
                        -- scholars.last_modified_date,
                        -- scholars.initials,

                        affiliations.*

                    FROM scholars

                    LEFT JOIN affiliations
                        ON scholars.affiliation_id = affiliations.affid

                    GROUP BY doors_uid

                    ) AS sch_n_aff

                -- two step JOIN for keywords
                LEFT JOIN sch_kw
                    ON sch_n_aff.doors_uid = sch_kw.uid
                LEFT JOIN keywords
                    ON sch_kw.kwid = keywords.kwid
                GROUP BY doors_uid

        ) AS sch_n_aff_n_kws

        LEFT JOIN linked_ids
            ON linked_ids.uid = sch_n_aff_n_kws.doors_uid

        -- WHERE our user UID
        WHERE  doors_uid = "%s"
        GROUP BY doors_uid
    """ % str(uid)

    mlog("DEBUGSQL", "DB get_full_scholar STATEMENT:\n-- SQL\n%s\n-- /SQL" % one_usr_stmt)

    n_rows = db_c.execute(one_usr_stmt)

    if n_rows > 1:
        raise IndexError("DB one_usr_stmt returned %i rows instead of 1 for user %s" % (n_rows, uid))

    elif n_rows == 0:
        mlog("WARNING", "DB get_full_scholar attempt got no rows for: %s" % uid)
        db.close()
        return None


    # normal case: we got exactly 1 user
    urow_dict = db_c.fetchone()
    db.close()

    # Exemple data in urow_dict
    # --------------------------
    # {'affid': 1, 'affiliation_id': 1, 'community_hashtags': '#something',
    #  'country': 'France', 'doors_uid': '5e3adbc1-bcfb-42da-a2c4-4af006fe2b91',
    #  'email': 'jfk@usa.com', 'first_name': 'John', 'gender': 'M',
    #  'home_url': 'http://localhost/regcomex/', 'hon_title': 'Student',
    #  'initials': 'JFK', 'interests_text': 'Blablabla',
    #  'job_looking_date': '2019_09_28T22:00:00.000Z',
    #  'keywords': 'complex networks,complex systems,text mining,machine learning',
    #  'keywords_nb': 4,
    #  'last_modified_date': '2016-12-07T15:56:09.721Z',
    #  'last_name': 'Kennedy',
    #  'linked_ids': 'yoyo:42,foobar:XWING', 'linked_ids_nb': 2,
    #  'middle_name': 'Fitzgerald',
    #  'org': 'Centre National de la Recherche Scientifique (CNRS)',
    #  'org_city': 'Paris', 'org_type': 'public R&D org',
    #  'pic_file': '', 'pic_url': None, 'position': 'Engineer',
    #  'record_status': None, 'team_lab': 'ISCPIF'}


    # post-treatments
    # ---------------
    # 1/ split concatenated kw lists and check correct length
    if urow_dict['keywords_nb'] == 0:
        urow_dict['keywords'] = []
    else:
        kws_array = urow_dict['keywords'].split(',')

        if len(kws_array) != urow_dict['keywords_nb']:
            raise ValueError("Can't correctly split keywords for user %s" % uid)
        else:
            urow_dict['keywords'] = kws_array

    # 2/ also split and parse all linked_ids
    if urow_dict['linked_ids_nb'] == 0:
        urow_dict['linked_ids'] = {}
    else:
        lkids_array = urow_dict['linked_ids'].split(',')
        if len(lkids_array) != urow_dict['linked_ids_nb']:
            raise ValueError("Can't correctly split linked_ids for user %s" % uid)
        else:
            # additionaly reparse dict for linked_ids
            # exemple ==> {type1:ID1, type2:ID2}
            urow_dict['linked_ids'] = {}
            for lkid_str in lkids_array:
                lkid_couple = lkid_str.split(':')
                if len(lkid_couple) != 2:
                    raise ValueError("Can't correctly find type and id value in linked_id string '%s' for user %s" % (lkid_str, uid))
                else:
                    lkid_type = lkid_couple[0]
                    lkid_id   = lkid_couple[1]
                    urow_dict['linked_ids'][lkid_type] = lkid_id

    mlog("INFO", "get_full_scholar %s: OK" % uid)

    # full user info as a dict
    return urow_dict


def save_scholar(uid, date, safe_recs, reg_db, uactive=True, update_flag=False):
    """
    For new registration:
      -> add to *scholars* table

    For profile change (just toggle update_flag to True)
      -> *update* scholars table

    see also COLS variable and doc/table_specifications.md
    """

    # we already have the first two columns
    db_tgtcols = ['doors_uid', 'last_modified_date']
    db_qstrvals = ["'"+str(uid)+"'", "'"+str(date)+"'"]
    actual_len_dbg = 2

    # REMARK:
    # => In theory should be possible to execute(statment, values) to insert all
    #    (or reg_db.literal(db_pyvals) to convert all)

    # => But currently bug in MySQLdb for binary values)
    #    (see also MySQLdb.converters)

    # => So for now we build the values string ourselves in db_qstrvals instead
    #                            -------------              -----------
    #    and then we execute(full_statmt)         :-)


    for colinfo in USER_COLS[2:]:
        colname = colinfo[0]

        # NB: each val already contains no quotes because of sanitize()
        val = safe_recs.get(colname, None)

        if val != None:
            actual_len_dbg += 1
            quotedstrval = ""
            if colname != 'pic_file':
                quotedstrval = "'"+str(val)+"'"

                mlog("DEBUG", "DB saving" + quotedstrval)

            else:
                mlog("DEBUG", "DB picture file is len0?", len(val) == 0 )
                # str(val) for a bin is already quoted but has the 'b' prefix
                quotedstrval = '_binary'+str(val)[1:]  # TODO check if \x needs to land in target sql ?

                mlog("DEBUG", "DB added pic blob: " + quotedstrval[:25] + '...' + quotedstrval[-10:])

            # anyways
            db_tgtcols.append(colname)
            db_qstrvals.append(quotedstrval)

    if uactive:
        db_tgtcols.append('record_status')
        db_qstrvals.append('"active"')

    reg_db_c = reg_db.cursor()

    if not update_flag:
        # expected colnames "(doors_uid, last_modified_date, email, ...)"
        db_tgtcols_str = ','.join(db_tgtcols)

        # fields converted to sql syntax
        db_vals_str = ','.join(db_qstrvals)

        # INSERT: full_statement with formated values
        full_statmt = 'INSERT INTO scholars (%s) VALUES (%s)' % (
                            db_tgtcols_str,
                            db_vals_str
                       )
    else:
        # we won't change the ID now
        db_tgtcols.pop(0)
        db_qstrvals.pop(0)
        set_full_str = ','.join([db_tgtcols[i] + '=' + db_qstrvals[i] for i in range(len(db_tgtcols))])

        # UPDATE: full_statement with formated values
        full_statmt = 'UPDATE scholars SET %s WHERE doors_uid = "%s"' % (
                            set_full_str,
                            uid
        )

    mlog("DEBUG", "UPDATE" if update_flag else "INSERT",  "SQL statement:", full_statmt)

    reg_db_c.execute(full_statmt)
    reg_db.commit()


def save_pairs_sch_kw(pairings_list, comex_db):
    """
    Simply save all pairings (uid, kwid) in the list
    """
    db_cursor = comex_db.cursor()
    for id_pair in pairings_list:
        db_cursor.execute('INSERT INTO sch_kw VALUES %s' % str(id_pair))
        comex_db.commit()
        mlog("DEBUG", "Keywords: saved %s pair" % str(id_pair))


def delete_pairs_sch_kw(uid, comex_db):
    """
    Simply deletes all pairings (uid, *) in the table
    """
    db_cursor = comex_db.cursor()
    n = db_cursor.execute('DELETE FROM sch_kw WHERE uid = "%s"' % uid)
    comex_db.commit()
    mlog("DEBUG", "Keywords: DELETED %i pairings for %s" % (n, str(uid)))


def get_or_create_keywords(kw_list, comex_db):
    """
        kw_str -> lookup/add to *keywords* table -> kw_id
        -------------------------------------------------

    kw_list is an array of strings

    NB keywords are mandatory: each registration should provide at least MIN_KW


    for loop
       1) query to *keywords* table (exact match)
       2) return id
          => if a keyword matches return kwid
          => if no keyword matches create new and return kwid
    """

    db_cursor = comex_db.cursor()
    found_ids = []
    for kw_str in kw_list:

        # TODO better string normalization here or in read_record
        kw_str = kw_str.lower()

        n_matched = db_cursor.execute('SELECT kwid FROM keywords WHERE kwstr = "%s"' % kw_str)

        # ok existing keyword => row id
        if n_matched == 1:
            found_ids.append(db_cursor.fetchone()[0])

        # no matching keyword => add => row id
        elif n_matched == 0:
            db_cursor.execute('INSERT INTO keywords(kwstr) VALUES ("%s")' % kw_str)
            comex_db.commit()

            mlog("INFO", "Added keyword '%s'" % kw_str)

            found_ids.append(db_cursor.lastrowid)

        else:
            raise Exception("ERROR: non-unique keyword '%s'" % kw_str)
    return found_ids


def get_or_create_affiliation(org_info, comex_db):
    """
    (parent organization + lab) ---> lookup/add to *affiliations* table -> affid

    org_info should contain properties like in ORG_COLS names

     1) query to *affiliations* table
     2) return id
        => TODO if institution almost matches send suggestion
        => TODO unicity constraint on institution + lab
        => if an institution matches return affid
        => if no institution matches create new and return affid
    """

    the_aff_id = None
    db_tgtcols = []
    db_qstrvals = []
    db_constraints = []

    for colinfo in ORG_COLS:
        colname = colinfo[0]
        val = org_info.get(colname, None)

        if val != None:
             # TODO better string normalization but not lowercase for acronyms...
            quotedstrval = "'"+str(val)+"'"

            # for insert
            db_tgtcols.append(colname)
            db_qstrvals.append(quotedstrval)

            # for select
            if colname != 'org_type':
                db_constraints.append("%s = %s" % (colname, quotedstrval))
        else:
            if colname != 'org_type':
                db_constraints.append("%s IS NULL" % colname)

    db_cursor = comex_db.cursor()

    n_matched = db_cursor.execute(
                    'SELECT affid FROM affiliations WHERE %s' %
                                        " AND ".join(db_constraints)
                )

    # ok existing affiliation => row id
    if n_matched == 1:
        the_aff_id = db_cursor.fetchone()[0]
        mlog("DEBUG", "Found affiliation (affid %i) (WHERE %s)" % (the_aff_id, " AND ".join(db_constraints)))

    # no matching affiliation => add => row id
    elif n_matched == 0:
        db_cursor.execute('INSERT INTO affiliations(%s) VALUES (%s)' % (
                            ','.join(db_tgtcols),
                            ','.join(db_qstrvals)
                           )
                         )
        the_aff_id = db_cursor.lastrowid
        comex_db.commit()
        mlog("DEBUG", "Added affiliation '%s'" % str(db_qstrvals))
    else:
        raise Exception("ERROR: non-unique affiliation '%s'" % str(db_qstrvals))

    return the_aff_id
