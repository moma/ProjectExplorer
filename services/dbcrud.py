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
    from services.tools      import mlog, REALCONFIG
    from services.text.utils import normalize_chars, normalize_forms
else:
    # when this script is run directly
    from tools          import mlog, REALCONFIG
    from text.utils     import normalize_chars, normalize_forms


# sorted columns as declared in DB, as a tuple
USER_COLS = [
#          NAME,               NOT NULL,  N or MAXCHARS (if applicable)
         ("luid",                   True,        15),
         ("doors_uid",             False,        36),
         ("email",                  True,       255),
         ("country",                True,        60),
         ("first_name",             True,        30),
         ("middle_name",           False,        30),
         ("last_name",              True,        50),
         ("initials",               True,         7),
         ("position",              False,        30),
         ("hon_title",             False,        30),
         ("interests_text",        False,      1200),
         ("gender",                False,         1),
         ("job_looking",           False,         1),
         ("job_looking_date",      False,        24),
         ("home_url",              False,       120),
         ("pic_url",               False,       120),
         ("pic_fname",             False,       120),
         ("valid_date",            False,       None),
         ("record_status",         False,        25)
      ]

ORG_COLS = [
         ("class",                 False,        25),  # "lab" or "inst"
         ("name",                  False,       120),
         ("acro",                  False,        30),  # acronym or short name
         ("locname",              False,        120),
         ("inst_type",             False,        50),
         ("lab_code",              False,        25),  # not in GUI yet
         ("url",                  False,        180),  # not in GUI yet
         ("contact_name",         False,         80),  # not in GUI yet
         ("contact_email",        False,        255)   # not in GUI yet

         # also in concatenations:
         #  label    = name + acro
         #  tostring = name + acro + locname
    ]


def connect_db(config=REALCONFIG):
    """
    Simple connection

    By default we use one new connection per function, but it can be passed to prevent that (in which case it should be closed at the end)
    """
    return connect(
        host=config['SQL_HOST'],
        port=int(config['SQL_PORT']),
        user="root",   # POSS change db ownership to a comexreg user
        passwd="very-safe-pass",
        db="comex_shared",
        charset="utf8"
    )

def doors_uid_to_luid(doors_uid, cmx_db = None):
    """
    Find corresponding luid
    """
    if cmx_db:
        db = cmx_db
    else:
        db = connect_db()
    db_c = db.cursor()
    stmt = """
        SELECT luid FROM scholars
        WHERE doors_uid = "%s"
    """ % doors_uid
    n_rows = db_c.execute(stmt)
    luid = None
    if n_rows > 1:
        if not cmx_db:
            db.close()
        raise ValueError("non unique doors_uid %s" % doors_uid)
    elif n_rows == 1:
        luid =  db_c.fetchone()[0]
        if not cmx_db:
            db.close()
    return luid


def email_exists(email, cmx_db = None):
    """
    Tests if there is already a user with this email
    """
    if cmx_db:
        db = cmx_db
    else:
        db = connect_db()
    db_c = db.cursor()

    stmt = """
        SELECT luid FROM scholars
        WHERE email = "%s"
    """ % email

    n_rows = db_c.execute(stmt)

    exi_bool = (n_rows >= 1)

    if not cmx_db:
        db.close()

    return exi_bool


def rm_scholar(luid, cmx_db = None):
    """
    Remove a scholar by id

    (removals from sch_kw and sch_ht maps are triggered by cascade)
    """

    if cmx_db:
        db = cmx_db
    else:
        db = connect_db()
    db_c = db.cursor()
    stmt = 'DELETE FROM scholars WHERE luid = %s' % str(luid)
    mlog("DEBUGSQL", "rm_scholar STATEMENT:\n-- SQL\n%s\n-- /SQL" % stmt)
    dbresp = db_c.execute(stmt)
    db.commit()
    mlog('INFO', 'deleted user %i at his request' % int(luid))
    if not cmx_db:
        db.close()


def get_full_scholar(uid, cmx_db = None):
    """
    uid : str
          local user id aka luid

    Autonomous function to be used by User class
       => Retrieves one line from *scholars* table, with joined optional concatenated *affiliations*, *keywords* and *linked_ids*
       => Parse it all into a structured python user info dict

       => NB: None if user doesn't exist in cmx_db (but may exist in doors db)
    """
    u_row = None

    if cmx_db:
        db = cmx_db
    else:
        db = connect_db()
    db_c = db.cursor(DictCursor)


    print('DBG', 'uid', uid)
    print('DBG', 'type(uid)', type(uid))

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
                        sch_n_orgs.*,

                        -- kws info condensed
                        COUNT(keywords.kwid) AS keywords_nb,
                        -- GROUP_CONCAT(keywords.kwid) AS kwids,
                        GROUP_CONCAT(keywords.kwstr) AS keywords

                    FROM (
                        SELECT
                            sch_n_labs.*,
                            COUNT(insts.orgid) AS insts_ids_nb,
                            GROUP_CONCAT(insts.orgid) AS insts_ids

                        FROM (
                            SELECT
                                scholars.*,
                                COUNT(labs.orgid) AS labs_ids_nb,
                                GROUP_CONCAT(labs.orgid) AS labs_ids

                            FROM scholars

                            LEFT JOIN sch_org AS map_labs
                                ON map_labs.uid = luid
                            LEFT JOIN (
                                -- class constraint can't appear later,
                                -- it would give no scholar when empty
                                SELECT * FROM orgs WHERE class='lab'
                            ) AS labs
                                ON map_labs.orgid = labs.orgid

                            GROUP BY luid

                            ) AS sch_n_labs

                        LEFT JOIN sch_org AS map_insts
                            ON map_insts.uid = luid
                        LEFT JOIN (
                            SELECT * FROM orgs WHERE class='inst'
                        ) AS insts
                            ON map_insts.orgid = insts.orgid
                        GROUP BY luid
                        ) AS sch_n_orgs

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
        WHERE  luid = %i
        GROUP BY luid
    """ % int(uid)

    mlog("DEBUGSQL", "DB get_full_scholar STATEMENT:\n-- SQL\n%s\n-- /SQL" % one_usr_stmt)

    n_rows = db_c.execute(one_usr_stmt)

    if n_rows > 1:
        raise IndexError("DB one_usr_stmt returned %i rows instead of 1 for user %s" % (n_rows, uid))


    urow_dict = db_c.fetchone()

    # break with None if no results
    if urow_dict is None:
        mlog("WARNING", "DB get_full_scholar attempt got no rows for: %s" % uid)
        return None


    # normal case <=> exactly one row

    # Exemple initial data in urow_dict
    # ----------------------------------
    # {'hashtags': '#something, #another',
    #  'country': 'France', 'doors_uid': '5e3adbc1-bcfb-42da-a2c4-4af006fe2b91',
    #  'email': 'jfk@usa.com', 'first_name': 'John', 'gender': 'M',
    #  'home_url': 'http://localhost/regcomex/', 'hon_title': 'Student',
    #  'initials': 'JFK', 'interests_text': 'Blablabla',
    #  'job_looking_date': datetime.date(2019, 9, 28),
    #  'hashtags': '#eccs15', 'hashtags_nb': 1,
    #  'keywords': 'complex networks,complex systems,text mining,machine learning', 'keywords_nb': 4,
    #  'labs_ids': '3888,3444', 'labs_ids_nb': 2,
    #  'insts_ids': '3295', 'insts_ids_nb': 1,
    #  'last_modified_date': datetime.datetime(2017, 2, 22, 12, 25, 59),
    #  'last_name': 'Kennedy',
    #  'linked_ids': 'twitter:@jfk,yoyo:42,foobar:XWING', 'linked_ids_nb': 3,
    #  'middle_name': 'Fitzgerald',
    #  'pic_fname': '12345.jpg', 'pic_url': None, 'position': 'Research Fellow',
    #  'record_status': 'legacy', 'valid_date': datetime.date(2017, 5, 22)}

    # post-treatments
    # ---------------
    # 1/ split concatenated kw, ht, lab id, inst id lists and check correct length
    for toktype in ['keywords', 'hashtags', 'labs_ids', 'insts_ids']:
        if urow_dict[toktype+'_nb'] == 0:
            urow_dict[toktype] = []
        else:
            tokarray = urow_dict[toktype].split(',')

            if len(tokarray) != urow_dict[toktype+'_nb']:
                raise ValueError("Can't correctly split %s for user %s" % (toktype, uid))
            else:
                urow_dict[toktype] = tokarray

    # 2/ must do a secondary SELECT for detailed org info
    #       dict['labs_ids']: [id1,    id2    ..]
    #     => dict['labs']   : [{info1},{info2}..]

    for orgclass in ['labs', 'insts']:
        id_list = urow_dict[orgclass+"_ids"]  # <- ! naming convention
        if not len(id_list):
            urow_dict[orgclass] = []
        else:
            org_info = """SELECT name, acro, locname,
                                 inst_type, lab_code,
                                 tostring
                            FROM orgs WHERE orgid IN (%s)""" % ','.join(id_list)

            mlog('DEBUGSQL', "org_info stmt :", org_info)

            new_cursor = db.cursor(DictCursor)
            new_cursor.execute(org_info)

            urow_dict[orgclass] = new_cursor.fetchall()

    # print('===urow_dict with orgs[]===')
    # print(urow_dict)
    # print('==/urow_dict with orgs[]===')


    # 3/ also split and parse all linked_ids
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

    if not cmx_db:
        db.close()

    # full user info as a dict
    return urow_dict


def save_full_scholar(safe_recs, cmx_db, uactive=True, update_user=None):
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

    cmx_db_c = cmx_db.cursor()

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

    cmx_db_c.execute(full_statmt)
    if not update_user:
        luid = cmx_db_c.lastrowid
    else:
        luid = update_user['luid']
    cmx_db.commit()
    return luid


def update_scholar_cols(selected_safe_recs, cmx_db, where_luid=None):
    """
    For modification of selected columns:
      -> *update* row with the values that are present and are real columns

         (if values are absent, they are left unchanged)
         (if values are present and None, they are become NULL in db)

    see also COLS variable and doc/table_specifications.md
    """

    # column names and column quoted values
    db_tgtcols = []
    db_qstrvals = []

    mlog("INFO",
         "DB selective update %s" % selected_safe_recs)

    for colinfo in USER_COLS:
        colname = colinfo[0]

        # selective updating: only provided columns
        if colname in selected_safe_recs and colname != 'luid':
            val = selected_safe_recs[colname]
            if val is None:
                quotedstrval = "NULL"
            else:
                quotedstrval = "'"+str(val)+"'"
            mlog("DEBUG",
                 "DB selective update %s %s" % (colname, quotedstrval))

            db_tgtcols.append(colname)
            db_qstrvals.append(quotedstrval)

    cmx_db_c = cmx_db.cursor()
    set_full_str = ','.join([db_tgtcols[i] + '=' + db_qstrvals[i] for i in range(len(db_tgtcols))])

    # UPDATE: full_statement with formated values
    full_statmt = 'UPDATE scholars SET %s WHERE luid = "%s"' % (
                        set_full_str,
                        where_luid
    )
    cmx_db_c.execute(full_statmt)
    cmx_db.commit()
    return where_luid


def save_pairs_sch_tok(pairings_list, cmx_db, map_table='sch_kw'):
    """
    Simply save all pairings (luid, kwid) or (luid, htid) in the list
    """
    db_cursor = cmx_db.cursor()
    for id_pair in pairings_list:
        db_cursor.execute('INSERT INTO %s VALUES %s' % (map_table, str(id_pair)))
        cmx_db.commit()
        mlog("DEBUG", "%s: saved %s pair" % (map_table, str(id_pair)))


def delete_pairs_sch_tok(uid, cmx_db, map_table='sch_kw'):
    """
    Simply deletes all pairings (luid, *) in the table
    """
    if map_table not in ['sch_kw', 'sch_ht']:
        raise TypeError('ERROR: Unknown map_table')
    db_cursor = cmx_db.cursor()
    n = db_cursor.execute('DELETE FROM %s WHERE uid = "%s"' % (map_table, uid))
    cmx_db.commit()
    mlog("DEBUG", "%s: DELETED %i pairings for %s" % (map_table, n, str(uid)))


def get_or_create_tokitems(tok_list, cmx_db, tok_table='keywords'):
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

    db_cursor = cmx_db.cursor()
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
            cmx_db.commit()

            mlog("INFO", "Added '%s' to %s table" % (tok_str, tok_table))

            found_ids.append(db_cursor.lastrowid)

        else:
            raise Exception("ERROR: non-unique token '%s'" % tok_str)
    return found_ids


def record_sch_org_link(luid, orgid, cmx_db = None):
    if cmx_db:
        db = cmx_db
    else:
        db = connect_db()
    db_c = db.cursor(DictCursor)

    luid = int(luid)
    orgid = int(orgid)
    db_c.execute(
        'INSERT INTO sch_org(uid,orgid) VALUES (%i,%i)' % (luid, orgid)
    )
    if not cmx_db:
        db.close()


def record_org_org_link(orgid_src, orgid_tgt, cmx_db = None):
    """
    new mapping or freq++ if mapping already exists

    TODO LATER (not a priority)
               method cf. php_library/directory_content.php/$labs
    """
    pass

def get_or_create_org(org_info, cmx_db = None):
    """
    (scholar's parent org(s)) ---> lookup/add to *orgs* table -> orgid

     1) query to *orgs* table
     2) return id
        => TODO if institution almost matches API to send suggestion
        => unicity constraint on institution + lab + org_type
        => if an institution matches return orgid
        => if no institution matches create new and return orgid

        ! WIP !
    """
    if cmx_db:
        db = cmx_db
    else:
        db = connect_db()
    db_c = db.cursor(DictCursor)

    the_aff_id = None
    db_tgtcols = []
    db_qstrvals = []
    db_constraints = []

    mlog("INFO", "get_or_create_org, org_info:", org_info)

    for colinfo in ORG_COLS:
        colname = colinfo[0]
        val = org_info.get(colname, None)

        if val != None:
            val = str(normalize_forms(normalize_chars(val, rm_qt=True)))
            quotedstrval = "'"+val+"'"

            # for insert
            db_tgtcols.append(colname)
            db_qstrvals.append(quotedstrval)

            # for select
            db_constraints.append("%s = %s" % (colname, quotedstrval))
        else:
            db_constraints.append("%s IS NULL" % colname)

    db_cursor = cmx_db.cursor()

    mlog("DEBUGSQL", "SELECT org.. WHERE %s" % ("\n AND ".join(db_constraints)))

    n_matched = db_cursor.execute(
                    'SELECT orgid FROM orgs WHERE %s' %
                                        " AND ".join(db_constraints)
                )

    # ok existing affiliation => row id
    if n_matched == 1:
        the_aff_id = db_cursor.fetchone()[0]
        mlog("DEBUG", "Found affiliation (orgid %i) (WHERE %s)" % (the_aff_id, " AND ".join(db_constraints)))

    # no matching affiliation => add => row id
    elif n_matched == 0:
        db_cursor.execute('INSERT INTO orgs(%s) VALUES (%s)' % (
                            ','.join(db_tgtcols),
                            ','.join(db_qstrvals)
                           )
                         )
        the_aff_id = db_cursor.lastrowid
        cmx_db.commit()
        mlog("DEBUG", "dbcrud: added org '%s'" % str(db_qstrvals))
    else:
        raise Exception("ERROR: get_or_create_org non-unique match '%s'" % str(db_qstrvals))

    if not cmx_db:
        db.close()

    return the_aff_id



# for users coming in from doors with no profile yet, we keep their doors infos (email, also name in the future)

def save_doors_temp_user(doors_uid, doors_email, cmx_db = None):
    if cmx_db:
        db = cmx_db
    else:
        db = connect_db()
    db_c = db.cursor()
    stmt = "INSERT IGNORE INTO doors_temp_user(doors_uid, email) VALUES (%s,%s)"
    db_c.execute(stmt, (doors_uid, doors_email))
    db.commit()
    if not cmx_db:
        db.close()

def get_doors_temp_user(doors_uid, cmx_db = None):
    info_row = None
    if cmx_db:
        db = cmx_db
    else:
        db = connect_db()
    db_c = db.cursor(DictCursor)
    db_c.execute('''SELECT *
                    FROM doors_temp_user
                    WHERE doors_uid = "%s"''' % doors_uid)
    info_row = db_c.fetchone()
    if not cmx_db:
        db.close()
    return info_row

def rm_doors_temp_user(doors_uid, cmx_db = None):
    if cmx_db:
        db = cmx_db
    else:
        db = connect_db()
    db_c = db.cursor()
    db_c.execute('''DELETE FROM doors_temp_user
                    WHERE doors_uid = "%s"''' % doors_uid)
    db.commit()
    if not cmx_db:
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
