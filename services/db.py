"""
DB connection utilities
"""
__author__    = "CNRS"
__copyright__ = "Copyright 2016 ISCPIF-CNRS"
__email__     = "romain.loth@iscpif.fr"

from MySQLdb     import connect

if __package__ == 'services':
    # when we're run via import
    from services.tools import mlog
else:
    # when this script is run directly
    from tools          import mlog


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

def connect_db(config):
    """
    Simple connection

    TODO decide if we'll use one or multiple (<= atm yes)
    """
    return connect(
        host=config['SQL_HOST'],
        port=int(config['SQL_PORT']),
        user="root",   # TODO change db ownership to a comexreg user
        passwd="very-safe-pass",
        db="comex_shared"
    )


def save_scholar(uid, date, safe_recs, reg_db):
    """
    Useful for new registration:
      -> add to *scholars* table

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

    # => So for now we buid the values string ourselves in db_qstrvals instead
    #                           -------------              -----------
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
            else:
                mlog("DEBUG", "picture file is len0?", len(val) == 0 )
                # str(val) for a bin is already quoted but has the 'b' prefix
                quotedstrval = '_binary'+str(val)[1:]  # TODO check if \x needs to land in target sql ?

                mlog("DEBUG", "added pic blob: " + quotedstrval[:25] + '...' + quotedstrval[-10:])

            # anyways
            db_tgtcols.append(colname)
            db_qstrvals.append(quotedstrval)

    # expected colnames "(doors_uid, last_modified_date, email, ...)"
    db_tgtcols_str = ','.join(db_tgtcols)

    # fields converted to sql syntax
    db_vals_str = ','.join(db_qstrvals)

    reg_db_c = reg_db.cursor()

    # full_statement with formated values
    full_statmt = 'INSERT INTO scholars (%s) VALUES (%s)' % (
                        db_tgtcols_str,
                        db_vals_str
                   )

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

            mlog("DEBUG", "Added keyword '%s'" % kw_str)

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
