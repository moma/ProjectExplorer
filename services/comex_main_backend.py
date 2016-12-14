"""
Flask server used for the registration page for **COMEX** app
Context:
    - templates-based input form validated fields and checked if all were present
      (base_form.html + static/js/comex_reg_form_controllers.js)

    - Doors already validated and recorded the (email, password) combination

    - labels of SOURCE_FIELDS are identical to the name of their target COLS
        - fields will land into the 3 main db tables:
            - *scholars*
            - *affiliations*
            - *keywords* (and *sch_kw* mapping table)
        - a few fields give no columns, for ex: "other_org_type"

    - webapp is exposed as "server_comex_registration.app" for the outside
        - can be served in dev by python3 server_comex_registration.py
        - better to serve it via gunicorn (cf run.sh)
"""
__author__    = "CNRS"
__copyright__ = "Copyright 2016 ISCPIF-CNRS"
__version__   = "1.3"
__email__     = "romain.loth@iscpif.fr"
__status__    = "Dev"

from flask       import Flask, render_template, request
from ctypes      import c_int32
from MySQLdb     import connect, ProgrammingError
from re          import sub
from os          import path
from traceback   import format_tb
from json        import dumps

if __package__ == 'services':
    # when we're run via import
    from services.user import comex_user
    from services.text import keywords
    from services.tools import read_config
    from services.db_to_tina_api.extractDataCustom import MyExtractor as MySQL
else:
    # when this script is run directly
    from user          import comex_user
    from text          import keywords
    from tools         import read_config
    from db_to_tina_api.extractDataCustom import MyExtractor as MySQL

# ============= read config ============

config = read_config()

# ============= verbose msg =============
if config['DEBUG_FLAG']:
    print("DEBUG: conf\n  "+"\n  ".join(["%s=%s"%(k,v) for k,v in config.items()]))

# ============= app creation ============
app = Flask("services",
             static_folder=path.join(config['HOME'],"static"),
             template_folder=path.join(config['HOME'],"templates"))

app.config['DEBUG'] = config['DEBUG_FLAG']

########### PARAMS ###########

# all inputs as they are declared in form, as a couple
SOURCE_FIELDS = [
#             NAME,              SANITIZE?
         ("doors_uid",             False  ),
         ("last_modified_date",    False  ),   # ex 2016-11-16T17:47:07.308Z
         ("email",                  True  ),
         ("country",                True  ),
         ("first_name",             True  ),
         ("middle_name",            True  ),
         ("last_name",              True  ),
         ("initials",               True  ),
         # => for *scholars* table

         ("position",               True  ),
         ("hon_title",              True  ),
         ("interests_text",         True  ),
         ("community_hashtags",     True  ),
         ("gender",                 True  ),   # M|F
         ("job_looking_date",       True  ),   # def null: not looking for a job
         ("home_url",               True  ),   # scholar's homepage
         ("pic_url",                True  ),
         ("pic_file",              False  ),   # mediumblob
         # => for *scholars* table (optional)

         ("org",                    True  ),
         ("org_type",              False  ),   # values are predefined for this
         (  "other_org_type",       True  ),   # +=> org_type in read_record()
         ("team_lab",               True  ),
         ("org_city",               True  ),
         # => for *affiliations* table

         ("keywords",               True  )
         # => for *keywords* table (after split str)
      ]

# NB password values have already been sent by ajax to Doors


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

# mandatory minimum of keywords
MIN_KW = 5


# ============= views =============

# -----------------------------------------------------------------------
# /!\ Routes are not prefixed by nginx in prod so we do it ourselves /!\
# -----------------------------------------------------------------------

# /services/user/register
print("register route: ", config['PREFIX'] + config['USR_ROUTE'] + '/register')
@app.route(config['PREFIX'] + config['USR_ROUTE'] + '/register', methods=['GET','POST'])
def register():
    if request.method == 'GET':
        return render_template(
            "base_form.html",
            doors_connect=config['DOORS_HOST']+':'+config['DOORS_PORT']
        )
    elif request.method == 'POST':
        # ex: request.form = ImmutableMultiDict([('initials', 'R.L.'), ('email', 'romain.loth@iscpif.fr'), ('last_name', 'Loth'), ('country', 'France'), ('first_name', 'Romain'), ('my-captchaHash', '-773776109'), ('my-captcha', 'TSZVIN')])
        # print("GOT ANSWERS <<========<<", request.form)

        # 1 - testing the captcha answer
        captcha_userinput = request.form['my-captcha']
        captcha_userhash = re_hash(captcha_userinput)
        captcha_verifhash = int(request.form['my-captchaHash'])

        # dbg
        # print(str(captcha_verifhash))

        if captcha_userhash != captcha_verifhash:
            print("INFO: pb captcha rejected")
            form_accepted = False

        # normal case
        else:
            print("INFO: ok form accepted")
            form_accepted = True

            # only safe values
            clean_records = {}
            kw_array = []

            # 1) handles all the inputs from form, no matter what target table
            (duuid, rdate, kw_array, clean_records) = read_record(request.form)

            # 2) handles the pic_file if present
            if hasattr(request, "files") and 'pic_file' in request.files:
                # type: werkzeug.datastructures.FileStorage.stream
                pic_blob = request.files['pic_file'].stream.read()
                if len(pic_blob) != 0:
                    clean_records['pic_file'] = pic_blob

            # 3) save to DB
            try:
                # A) DB config + connection
                reg_db = connect(
                    host=config['SQL_HOST'],
                    port=int(config['SQL_PORT']),
                    user="root",   # TODO change db ownership to a comexreg user
                    passwd="very-safe-pass",
                    db="comex_shared"
                )

                # B) read/fill the affiliation table to get associated id
                clean_records['affiliation_id'] = db_get_or_create_affiliation(clean_records, reg_db)

                # C) create record into the primary user table
                # ---------------------------------------------
                db_save_scholar(duuid, rdate, clean_records, reg_db)

                # D) read/fill each keyword and save the (uid <=> kwid) pairings
                kwids = db_get_or_create_keywords(kw_array, reg_db)
                db_save_pairs_sch_kw([(duuid, kwid) for kwid in kwids], reg_db)

                # E) end connection
                reg_db.close()

            except Exception as perr:
                return render_template("thank_you.html",
                                        debug_records = clean_records,
                                        form_accepted = False,
                                        backend_error = True,
                                        message = ("ERROR ("+str(perr.__doc__)+"):<br/>"
                                                    + ("<br/>".join(format_tb(perr.__traceback__)+[repr(perr)]))
                                                    )
                                       )

        return render_template("thank_you.html",
                                debug_records = (clean_records if config['DEBUG_FLAG'] else {}),
                                form_accepted = True,
                                backend_error = False,
                                message = "")


# API to provide json extracts of the DB to tinaweb
# (originally @ moma/legacy_php_comex/tree/master/comex_install)
# (original author S. Castillo)
# /services/api/
@app.route(config['PREFIX'] + config['API_ROUTE'])
def api_main():

    db=MySQL(config['SQL_HOST'])

    if 'qtype' in request.args:
        if request.args['qtype'] == "filters":
            # all the other args are a series of constraints for filtering
            # ex: qtype=filters&keywords[]=complex%20networks&keywords[]=complexity%20theory&countries[]=France&countries[]=USA
            scholars = db.getScholarsList("filter",request.query_string.decode())
        else:
            unique_id = request.args['unique_id']
            scholars = db.getScholarsList("unique_id",unique_id)
    else:
        raise TypeError("API query is missing qtype (should be 'filters' or 'uid')")

    if scholars and len(scholars):
        db.extract(scholars)
    # < / Data Extraction > #

    graphArray = db.buildJSON_sansfa2(db.Graph)
    return dumps(graphArray)


########### SUBS ###########
def re_hash(userinput, salt="verylonverylongverylonverylongverylonverylong"):
    """
    Build the captcha's verification hash server side
    (my rewrite of keith-wood.name/realPerson.html python's version)

    NB the number of iterations is prop to salt length

    << 5 pads binary repr by 5 zeros on the right (including possible change of sign)
    NB in all languages except python it truncates on the left
        => here we need to emulate the same mechanism
        => using c_int32() works well
    """
    hashk = 5381

    value = userinput.upper() + salt

    # debug
    # print("evaluated value:"+value)

    for i, char in enumerate(value):
        hashk = c_int32(hashk << 5).value + hashk + ord(char)

        # debug iterations
        # print(str(i) + ": " + str(hashk))

    return hashk


def sanitize(value):
    """
    simple and radical: leaves only alphanum and '.' '-' ':' ',' '(', ')', '#', ' '

    TODO better
    """
    vtype = type(value)
    str_val = str(value)
    clean_val = sub(r'^\s+', '', str_val)
    clean_val = sub(r'\s+$', '', clean_val)
    san_val = sub(r'[^\w@\.-:,()# ]', '_', clean_val)

    if vtype not in [int, str]:
        raise ValueError("Value has an incorrect type %s" % str(vtype))
    else:
        # cast back to orginal type
        san_typed_val = vtype(san_val)
        return san_typed_val


def db_get_or_create_keywords(kw_list, comex_db):
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

            if config['DEBUG_FLAG']:
                print("DEBUG: Added keyword '%s'" % kw_str)

            found_ids.append(db_cursor.lastrowid)

        else:
            raise Exception("ERROR: non-unique keyword '%s'" % kw_str)
    return found_ids


def db_save_pairs_sch_kw(pairings_list, comex_db):
    """
    Simply save all pairings (uid, kwid) in the list
    """
    db_cursor = comex_db.cursor()
    for id_pair in pairings_list:
        db_cursor.execute('INSERT INTO sch_kw VALUES %s' % str(id_pair))
        comex_db.commit()
        if config['DEBUG_FLAG']:
            print("DEBUG: Keywords: saved %s pair" % str(id_pair))


def db_get_or_create_affiliation(org_info, comex_db):
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
        if config['DEBUG_FLAG']:
            print("DEBUG: Found affiliation (affid %i) (WHERE %s)" % (the_aff_id, " AND ".join(db_constraints)))

    # no matching affiliation => add => row id
    elif n_matched == 0:
        db_cursor.execute('INSERT INTO affiliations(%s) VALUES (%s)' % (
                            ','.join(db_tgtcols),
                            ','.join(db_qstrvals)
                           )
                         )
        the_aff_id = db_cursor.lastrowid
        comex_db.commit()
        if config['DEBUG_FLAG']:
            print("DEBUG: Added affiliation '%s'" % str(db_qstrvals))
    else:
        raise Exception("ERROR: non-unique affiliation '%s'" % str(db_qstrvals))

    return the_aff_id


def db_save_scholar(uid, date, safe_recs, reg_db):
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
                print("picture file is len0?", len(val) == 0 )
                # str(val) for a bin is already quoted but has the 'b' prefix
                quotedstrval = '_binary'+str(val)[1:]  # TODO check if \x needs to land in target sql ?

                if config['DEBUG_FLAG']:
                    print("DEBUG: added pic blob: " + quotedstrval[:25] + '...' + quotedstrval[-10:])

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


def read_record(incoming_data):
    """
    Runs sanitization + string normalization as needed
      - custom made for regcomex/templates/base_form
      - uses SOURCE_FIELDS
    """

    # init var
    clean_records = {}

    # read in + sanitize values
    duuid = None
    rdate = None

    # we should have all the mandatory fields (checked in client-side js)
    for field_info in SOURCE_FIELDS:
        field = field_info[0]
        do_sanitize = field_info[1]
        if field in incoming_data:
            if do_sanitize:
                val = sanitize(incoming_data[field])
                if val != '':
                    clean_records[field] = val
                else:
                    # mysql will want None instead of ''
                    val = None

            # these 2 fields already validated and useful separately
            elif field == 'doors_uid':
                duuid = incoming_data[field]
            elif field == 'last_modified_date':
                rdate = incoming_data[field]

            # any other fields that don't need sanitization (ex: menu options)
            else:
                clean_records[field] = incoming_data[field]

    # special treatment for "other" subquestions
    if clean_records['org_type'] == 'other' and 'other_org_type' in clean_records:
        clean_records['org_type'] = clean_records['other_org_type']


    # split for kw_array
    kw_array = []
    if 'keywords' in clean_records:
        for kw in clean_records['keywords'].split(','):
            kw = sanitize(kw)
            if kw != '':
                kw_array.append(kw)

    return (duuid, rdate, kw_array, clean_records)



########### MAIN ###########
if __name__ == "__main__":
    # our app should be bound to an ip (cf stackoverflow.com/a/30329547/2489184)
    app.run(host=config['COMEX_HOST'], port=config['COMEX_PORT'])
