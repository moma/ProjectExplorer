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
         ("luid",                   True,        15),
         ("doors_uid",             False,        36),
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
         ("gender",                False,         1),
         ("job_looking_date",      False,        24),
         ("home_url",              False,       120),
         ("pic_url",               False,       120),
         ("pic_fname",             False,       120),
         ("valid_date",            False,       None),
         ("record_status",         False,        25)
      ]

ORG_COLS = [
         ("org",                   False,       120),
         ("org_type",              False,        50),
         ("team_lab",               True,       120),
         ("org_city",              False,        50)
    ]


FIELDS_FRONTEND_TO_SQL = {
    "keywords":      {'col':"keywords.kwstr",        "type": "LIKE_relation"},
    "tags":          {'col':"hashtags.htstr",        'type': "LIKE_relation"},

    "countries":     {'col':"scholars.country",      'type': "EQ_relation"},
    "gender":        {'col':"scholars.gender",       'type': "EQ_relation"},

    "organizations": {'col':"affiliations.org",      'type': "LIKE_relation"},
    "laboratories":  {'col':"affiliations.team_lab", 'type': "LIKE_relation"},
    "cities":        {'col':"affiliations.org_city", 'type': "EQ_relation"},

    "linked":          {'col':"linked_ids.ext_id_type", 'type': "EQ_relation"}
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
        db="comex_shared",
        charset="utf8"
    )

def doors_uid_to_luid(doors_uid):
    """
    Find corresponding luid
    """
    db = connect_db()
    db_c = db.cursor()

    stmt = """
        SELECT luid FROM scholars
        WHERE doors_uid = "%s"
    """ % doors_uid

    n_rows = db_c.execute(stmt)

    luid = None
    if n_rows > 1:
        db.close()
        raise ValueError("non unique doors_uid %s" % doors_uid)
    elif n_rows == 1:
        luid =  db_c.fetchone()[0]
        db.close()

    return luid


def email_exists(email):
    """
    Tests if there is already a user with this email
    """
    db = connect_db()
    db_c = db.cursor()

    stmt = """
        SELECT luid FROM scholars
        WHERE email = "%s"
    """ % email

    n_rows = db_c.execute(stmt)

    exi_bool = (n_rows >= 1)
    db.close()

    return exi_bool

def get_field_aggs(a_field,
                   hapax_threshold=int(REALCONFIG['HAPAX_THRESHOLD']),
                   users_status = "ALL"):
    """
    Use case: api/aggs?field=a_field
    ---------------------------------
       => Retrieves distinct field values and count having it

       => about *n* vs *occs*:
           - for tables != keywords count is scholar count
           - for table keywords count is occurrences count

    Parameters
    ----------
        a_field: str
            a front-end fieldname to aggregate, like "keywords" "countries"
            (allowed values cf. FIELDS_FRONTEND_TO_SQL)

            POSS: allow other fields than those in the mapping
                  if they are already in sql table.col format?

        hapax_threshold: int
            for all data_types, categories with a total equal or below this will be excluded from results
            TODO: put them in an 'others' category
            POSS: have a different threshold by type

        users_status: str
            defines the perimeter (set of scholars over which we work),
            (allowed values are ['active', 'test', 'legacy', 'ALL'])

            NB: if the param is 'legacy' here, set is indifferent to call_date
                (because aggs useful for *entire* legacy group)
    """

    agg_rows = []

    if a_field in FIELDS_FRONTEND_TO_SQL:

        sql_col = FIELDS_FRONTEND_TO_SQL[a_field]['col']
        sql_tab = sql_col.split('.')[0]

        mlog('INFO', "AGG API sql_col", sql_col)

        db = connect_db()
        db_c = db.cursor(DictCursor)

        # constraints 2, if any
        postfilters = []

        if hapax_threshold > 0:
            count_col = 'occs' if sql_tab in ['keywords', 'hashtags'] else 'n'
            postfilters.append( "%s > %i" % (count_col, hapax_threshold) )

        if len(postfilters):
            post_where = "WHERE "+" AND ".join(
                                                ['('+f+')' for f in postfilters]
                                                    )
        else:
            post_where = ""


        # retrieval cases
        if sql_tab == 'scholars':
            stmt = """
                SELECT x, n FROM (
                    SELECT %(col)s AS x, COUNT(*) AS n
                    FROM scholars
                    GROUP BY %(col)s
                ) AS allcounts
                %(post_filter)s
                ORDER BY n DESC
            """ % {'col': sql_col, 'post_filter': post_where}

        elif sql_tab == 'affiliations':
            stmt = """
                SELECT x, n FROM (
                    SELECT %(col)s AS x, COUNT(*) AS n
                    FROM scholars
                    -- 0 or 1
                    LEFT JOIN affiliations
                        ON scholars.affiliation_id = affiliations.affid
                    GROUP BY %(col)s
                ) AS allcounts
                ORDER BY n DESC
            """ % {'col': sql_col, 'post_filter': post_where}

        elif sql_tab == 'linked_ids':
            stmt = """
                SELECT x, n FROM (
                    SELECT %(col)s AS x, COUNT(*) AS n
                    FROM scholars
                    -- 0 or 1
                    LEFT JOIN linked_ids
                        ON scholars.luid = linked_ids.uid
                    GROUP BY %(col)s
                ) AS allcounts
                %(post_filter)s
                ORDER BY n DESC
            """ % {'col': sql_col, 'post_filter': post_where}

        elif sql_tab == 'keywords':
            stmt = """
                SELECT x, occs FROM (
                    SELECT %(col)s AS x, COUNT(*) AS occs
                    FROM scholars
                    -- 0 or many
                    LEFT JOIN sch_kw
                        ON scholars.luid = sch_kw.uid
                    LEFT JOIN keywords
                        ON sch_kw.kwid = keywords.kwid
                    GROUP BY %(col)s
                ) AS allcounts
                %(post_filter)s
                ORDER BY occs DESC
            """ % {'col': sql_col, 'post_filter': post_where}

        elif sql_tab == 'hashtags':
            stmt = """
                SELECT x, occs FROM (
                    SELECT %(col)s AS x, COUNT(*) AS occs
                    FROM scholars
                    -- 0 or many
                    LEFT JOIN sch_ht
                        ON scholars.luid = sch_ht.uid
                    LEFT JOIN hashtags
                        ON sch_ht.htid = hashtags.htid
                    GROUP BY %(col)s
                ) AS allcounts
                %(post_filter)s
                ORDER BY occs DESC
            """ % {'col': sql_col, 'post_filter': post_where}

        mlog("DEBUGSQL", "get_field_aggs STATEMENT:\n-- SQL\n%s\n-- /SQL" % stmt)

        # do it
        n_rows = db_c.execute(stmt)

        if n_rows > 0:
            agg_rows = db_c.fetchall()

        db.close()

    # mlog('DEBUG', "aggregation over %s: result rows =" % a_field, agg_rows)

    return agg_rows


def rm_scholar(luid):
    """
    Remove a scholar by id

    (removals from sch_kw and sch_ht maps are triggered by cascade)
    """
    db = connect_db()
    db_c = db.cursor()
    stmt = 'DELETE FROM scholars WHERE luid = %s' % str(luid)
    mlog("DEBUGSQL", "rm_scholar STATEMENT:\n-- SQL\n%s\n-- /SQL" % stmt)
    dbresp = db_c.execute(stmt)
    db.commit()
    mlog('INFO', 'deleted user %i at his request' % int(luid))
    db.close()


def get_full_scholar(uid):
    """
    uid : str
          local user id aka luid

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
            sch_n_aff_n_kws_n_hts.*,

            -- linked_ids info condensed
            -- (format : "type1:ID1,type2:ID2,...")
            GROUP_CONCAT(
                        CONCAT(linked_ids.ext_id_type,":", linked_ids.ext_id)
                ) AS linked_ids,
            COUNT(linked_ids.ext_id) AS linked_ids_nb

        FROM (

            SELECT
                sch_n_aff_n_kws.*,
                -- hts info condensed
                COUNT(hashtags.htid) AS hashtags_nb,
                -- GROUP_CONCAT(hashtags.htid) AS htids,
                GROUP_CONCAT(hashtags.htstr) AS hashtags

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
                            -- scholars.luid,
                            -- scholars.doors_uid,
                            -- scholars.email,
                            -- scholars.last_modified_date,
                            -- scholars.initials,

                            affiliations.*

                        FROM scholars

                        LEFT JOIN affiliations
                            ON scholars.affiliation_id = affiliations.affid

                        GROUP BY luid

                        ) AS sch_n_aff

                    -- two step JOIN for keywords
                    LEFT JOIN sch_kw
                        ON sch_kw.uid = luid
                    LEFT JOIN keywords
                        ON sch_kw.kwid = keywords.kwid
                    GROUP BY luid

            ) AS sch_n_aff_n_kws

            -- also two step JOIN for hashtags
            LEFT JOIN sch_ht
                ON sch_ht.uid = luid
            LEFT JOIN hashtags
                ON sch_ht.htid = hashtags.htid
            GROUP BY luid

        ) AS sch_n_aff_n_kws_n_hts

        LEFT JOIN linked_ids
            ON linked_ids.uid = luid

        -- WHERE our user UID
        WHERE  luid = "%s"
        GROUP BY luid
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
    # {'affid': 1, 'affiliation_id': 1, 'hashtags': '#something, #another',
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
    #  'pic_fname': '12345.jpg', 'pic_url': None, 'position': 'Engineer',
    #  'record_status': None, 'team_lab': 'ISCPIF'}


    # post-treatments
    # ---------------
    # 1/ split concatenated kw an ht lists and check correct length
    for toktype in ['keywords', 'hashtags']:
        if urow_dict[toktype+'_nb'] == 0:
            urow_dict[toktype] = []
        else:
            tokarray = urow_dict[toktype].split(',')

            if len(tokarray) != urow_dict[toktype+'_nb']:
                raise ValueError("Can't correctly split %s for user %s" % (toktype, uid))
            else:
                urow_dict[toktype] = tokarray

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


def find_scholar(some_key, some_str_value):
    """
    Get the luid of a scholar based on some str value

    To make sense, the key should be a unique one
    but this function doesn't check it !
    """
    luid = None
    db = connect_db()
    db_c = db.cursor(DictCursor)

    try:
        db_c.execute('''SELECT luid
                        FROM scholars
                        WHERE %s = "%s"
                        ''' % (some_key, some_str_value))
        first_row = db_c.fetchone()
        if first_row:
            luid = first_row['luid']
    except:
        mlog('WARNING', 'unsuccessful attempt to identify a scholar on key %s' % some_key)
    db.close()
    return luid


def save_full_scholar(safe_recs, reg_db, uactive=True, update_user=None):
    """
    For new registration:
      -> add to *scholars* table, return new local uid

    For profile change (just pass previous local user info in update_user)
      -> *update* entire scholar row
         (if values are null or absent in safe_recs, they become null)


    see also COLS variable and doc/table_specifications.md
    """

    # column names and column quoted values
    db_tgtcols = []
    db_qstrvals = []
    actual_len_dbg = 0

    for colinfo in USER_COLS:
        colname = colinfo[0]
        # NB: each val already contains no quotes because of sanitize()
        val = safe_recs.get(colname, None)

        # when updating, we keep all values that have changed, including None
        if update_user:
            if colname in ["luid", "email"]:
                # these two can't be updated
                continue

            old_val = update_user[colname]
            if val != old_val:
                actual_len_dbg += 1

                if val == None:
                    quotedstrval = "NULL"
                else:
                    quotedstrval = "'"+str(val)+"'"

                mlog("DEBUG",
                     "DB update %s (was: %s)" % (quotedstrval, str(old_val)))

                db_tgtcols.append(colname)
                db_qstrvals.append(quotedstrval)


        # when inserting, we keep all values != None
        else:
            if val != None:
                actual_len_dbg += 1
                quotedstrval = "'"+str(val)+"'"

                mlog("DEBUG", "DB saving" + quotedstrval)

                db_tgtcols.append(colname)
                db_qstrvals.append(quotedstrval)


    if uactive:
        db_tgtcols.append('record_status')
        db_qstrvals.append('"active"')

    reg_db_c = reg_db.cursor()

    if not update_user:
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
        set_full_str = ','.join([db_tgtcols[i] + '=' + db_qstrvals[i] for i in range(len(db_tgtcols))])

        # UPDATE: full_statement with formated values
        full_statmt = 'UPDATE scholars SET %s WHERE luid = "%s"' % (
                            set_full_str,
                            update_user['luid']
        )

    mlog("DEBUG", "UPDATE" if update_user else "INSERT",  "SQL statement:", full_statmt)

    reg_db_c.execute(full_statmt)
    if not update_user:
        luid = reg_db_c.lastrowid
    else:
        luid = update_user['luid']
    reg_db.commit()
    return luid


def update_scholar_cols(selected_safe_recs, reg_db, where_luid=None):
    """
    For modification of selected columns:
      -> *update* row with the values that are present and are real columns

         (if values are null or absent, they are left unchanged)

    see also COLS variable and doc/table_specifications.md
    """

    # column names and column quoted values
    db_tgtcols = []
    db_qstrvals = []

    for colinfo in USER_COLS:
        colname = colinfo[0]
        val = selected_safe_recs.get(colname, None)

        # selective updating: ignoring None values
        if val != None and colname != 'luid':
            quotedstrval = "'"+str(val)+"'"
            mlog("DEBUG",
                 "DB selective update %s" % quotedstrval)

            db_tgtcols.append(colname)
            db_qstrvals.append(quotedstrval)

    reg_db_c = reg_db.cursor()
    set_full_str = ','.join([db_tgtcols[i] + '=' + db_qstrvals[i] for i in range(len(db_tgtcols))])

    # UPDATE: full_statement with formated values
    full_statmt = 'UPDATE scholars SET %s WHERE luid = "%s"' % (
                        set_full_str,
                        where_luid
    )
    reg_db_c.execute(full_statmt)
    reg_db.commit()
    return where_luid


def save_pairs_sch_tok(pairings_list, comex_db, map_table='sch_kw'):
    """
    Simply save all pairings (luid, kwid) or (luid, htid) in the list
    """
    db_cursor = comex_db.cursor()
    for id_pair in pairings_list:
        db_cursor.execute('INSERT INTO %s VALUES %s' % (map_table, str(id_pair)))
        comex_db.commit()
        mlog("DEBUG", "%s: saved %s pair" % (map_table, str(id_pair)))


def delete_pairs_sch_tok(uid, comex_db, map_table='sch_kw'):
    """
    Simply deletes all pairings (luid, *) in the table
    """
    if map_table not in ['sch_kw', 'sch_ht']:
        raise TypeError('ERROR: Unknown map_table')
    db_cursor = comex_db.cursor()
    n = db_cursor.execute('DELETE FROM %s WHERE uid = "%s"' % (map_table, uid))
    comex_db.commit()
    mlog("DEBUG", "%s: DELETED %i pairings for %s" % (map_table, n, str(uid)))


def get_or_create_tokitems(tok_list, comex_db, tok_table='keywords'):
    """
        kw_str -> lookup/add to *keywords* table -> kw_id
        ht_str -> lookup/add to *hashtags* table -> ht_id
        -------------------------------------------------

    tok_list is an array of strings

    NB keywords are mandatory: each registration should provide at least MIN_KW
       hashtags aren't

    for loop
       1) query to *keywords* or *hashtags* table (exact match)
       2) return id
          => if a keyword/tag matches return kwid/htid
          => if no keyword/tag matches create new and return kwid/htid
    """

    # sql names
    fill = {'tb': tok_table}
    if tok_table == 'keywords':
        fill['idc'] = 'kwid'
        fill['strc']= 'kwstr'
    elif tok_table == 'hashtags':
        fill['idc'] = 'htid'
        fill['strc']= 'htstr'

    db_cursor = comex_db.cursor()
    found_ids = []
    for tok_str in tok_list:

        # TODO better string normalization here or in read_record
        tok_str = tok_str.lower()
        fill['q'] = tok_str

        # ex: SELECT kwid FROM keywords WHERE kwstr = "complexity"
        n_matched = db_cursor.execute('SELECT %(idc)s FROM %(tb)s WHERE %(strc)s = "%(q)s"' % fill)

        # ok existing keyword => row id
        if n_matched == 1:
            found_ids.append(db_cursor.fetchone()[0])

        # no matching keyword => add => row id
        elif n_matched == 0:

            # ex: INSERT INTO keywords(kwstr) VALUES ("complexity")
            db_cursor.execute('INSERT INTO %(tb)s(%(strc)s) VALUES ("%(q)s")' % fill)
            comex_db.commit()

            mlog("INFO", "Added '%s' to %s table" % (tok_str, tok_table))

            found_ids.append(db_cursor.lastrowid)

        else:
            raise Exception("ERROR: non-unique token '%s'" % tok_str)
    return found_ids


def get_or_create_affiliation(org_info, comex_db):
    """
    (parent organization + lab) ---> lookup/add to *affiliations* table -> affid

    org_info should contain properties like in ORG_COLS names

     1) query to *affiliations* table
     2) return id
        => TODO if institution almost matches send suggestion
        => unicity constraint on institution + lab + org_type
        => if an institution matches return affid
        => if no institution matches create new and return affid

        TODO test more
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
            db_constraints.append("%s = %s" % (colname, quotedstrval))
        else:
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



# for users coming in from doors with no profile yet, we keep their doors infos (email, also name in the future)

def save_doors_temp_user(doors_uid, doors_email):
    db = connect_db()
    db_c = db.cursor()
    stmt = "INSERT IGNORE INTO doors_temp_user(doors_uid, email) VALUES (%s,%s)"
    db_c.execute(stmt, (doors_uid, doors_email))
    db.commit()
    db.close()

def get_doors_temp_user(doors_uid):
    info_row = None
    db = connect_db()
    db_c = db.cursor(DictCursor)
    db_c.execute('''SELECT *
                    FROM doors_temp_user
                    WHERE doors_uid = "%s"''' % doors_uid)
    info_row = db_c.fetchone()
    db.close()
    return info_row

def rm_doors_temp_user(doors_uid):
    db = connect_db()
    db_c = db.cursor()
    db_c.execute('''DELETE FROM doors_temp_user
                    WHERE doors_uid = "%s"''' % doors_uid)
    db.commit()
    db.close()


# another temp table, for the secret return tokens
# of users coming back (= with a legacy profile)
def get_legacy_user(rettok):
    info_row = None
    db = connect_db()
    db_c = db.cursor(DictCursor)
    db_c.execute('''SELECT *
                    FROM legacy_temp_rettoks
                    WHERE rettok = "%s"''' % rettok)
    info_row = db_c.fetchone()
    db.close()

    if info_row and 'luid' in info_row:
        return info_row['luid']
    else:
        return None

def rm_legacy_user_rettoken(luid):
    db = connect_db()
    db_c = db.cursor()
    db_c.execute('''DELETE FROM legacy_temp_rettoks
                    WHERE luid = %s''' % int(luid))
    db.commit()
    db.close()


def create_legacy_user_rettokens(
            constraints=["record_status = 'legacy'"],
            validity_months = 3
            ):
    """
    Run this once for a new return campaign
      - creates a return token for a set of users defined by @constraints
      - also sets their valid_date to CURDATE + 3 months
    """
    db = connect_db()
    db_c = db.cursor()

    # creates the rettoks by doing a UUID() on each SELECTED luid
    stmt1 = """
            INSERT INTO legacy_temp_rettoks (luid, rettok)
                SELECT luid, UUID() FROM scholars
                WHERE %s
           """ % " AND ".join(['(%s)'%c for c in constraints])
    db_c.execute(stmt1)
    db.commit()

    # creates/updates the valid_date
    # same constraints <=> same set of luids
    stmt2 = """
            UPDATE scholars
                SET valid_date = DATE_ADD(CURDATE(), INTERVAL %i MONTH)
                WHERE %s
           """ % (int(validity_months),
                  " AND ".join(['(%s)'%c for c in constraints]))
    db_c.execute(stmt2)
    db.commit()
    db.close()

    # stmt2 variant for all users from legacy_temp_rettoks
    # stmt2 = """
    #         UPDATE scholars JOIN legacy_temp_rettoks
    #                         ON scholars.luid = legacy_temp_rettoks.uid
    #             SET valid_date = DATE_ADD(CURDATE(), INTERVAL 3 MONTH);
    #        """
