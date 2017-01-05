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
__version__   = "1.4"
__email__     = "romain.loth@iscpif.fr"
__status__    = "Dev"

from flask       import Flask, render_template, request, redirect, url_for
from flask_login import login_required, current_user, login_user
from re          import sub
from os          import path
from traceback   import format_tb
from json        import dumps

if __package__ == 'services':
    # when we're run via import
    print("*** comex services ***")
    from services.user  import User, login_manager, doors_login
    from services.text  import keywords
    from services.tools import restparse, mlog, re_hash, REALCONFIG
    from services.db    import connect_db, get_or_create_keywords, save_pairs_sch_kw, get_or_create_affiliation, save_scholar
    from services.db_to_tina_api.extractDataCustom import MyExtractor as MySQL
else:
    # when this script is run directly
    print("*** comex services (dev server mode) ***")
    from user           import User, login_manager, doors_login
    from text           import keywords
    from tools          import restparse, mlog, re_hash, REALCONFIG
    from db             import connect_db, get_or_create_keywords, save_pairs_sch_kw, get_or_create_affiliation, save_scholar
    from db_to_tina_api.extractDataCustom import MyExtractor as MySQL

# ============= read config ============
config = REALCONFIG

# ============= app creation ============
app = Flask("services",
             static_folder=path.join(config['HOME'],"static"),
             template_folder=path.join(config['HOME'],"templates"))

app.config['DEBUG'] = (config['LOG_LEVEL'] == "DEBUG")
app.config['SECRET_KEY'] = 'TODO fill secret key for sessions for login'
login_manager.init_app(app)

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

# mandatory minimum of keywords # TODO use
MIN_KW = 5


# ============= views =============

# -----------------------------------------------------------------------
# /!\ Routes are not prefixed by nginx in prod so we do it ourselves /!\
# -----------------------------------------------------------------------

# /services/
@app.route(config['PREFIX']+'/', methods=['GET'])
def services():
    return redirect(url_for('login', _external=True))


# /services/api/
@app.route(config['PREFIX'] + config['API_ROUTE'] + '/')
def api_main():
    """
    API to provide json extracts of the DB to tinaweb
    (originally @ moma/legacy_php_comex/tree/master/comex_install)
    (original author S. Castillo)
    """

    db=MySQL(config['SQL_HOST'])

    if 'qtype' in request.args:
        scholars = db.getScholarsList(request.args['qtype'], restparse(request.query_string.decode()))
    else:
        raise TypeError("API query is missing qtype (should be 'filters' or 'uid')")

    if scholars and len(scholars):
        # Data Extraction
        db.extract(scholars)

    graphArray = db.buildJSON_sansfa2(db.Graph)
    return dumps(graphArray)


# /services/user/
@app.route(config['PREFIX'] + config['USR_ROUTE']+'/', methods=['GET'])
def user():
    return redirect(url_for('login', _external=True))


# /services/user/login/
@app.route(config['PREFIX'] + config['USR_ROUTE'] + '/login/', methods=['GET', 'POST'])
def login():
    if request.method == 'GET':
        return render_template(
            "login.html",
            doors_connect = config['DOORS_HOST']+':'+config['DOORS_PORT']
        )
    elif request.method == 'POST':
        # TODO sanitize
        email = request.form['email']
        pwd = request.form['password']

        # we do our doors request here server-side to avoid MiM attack on result
        uid = doors_login(email, pwd, config)

        if uid:
            # £TODO usage ?
            login_user(User(uid))

        return redirect(url_for('profile', _external=True))


# /services/user/profile/
@app.route(config['PREFIX'] + config['USR_ROUTE'] + '/profile/', methods=['GET'])
@login_required
def profile():
    return render_template(
        "profile.html",
        logged_in = True
    )


# /services/user/register/
@app.route(config['PREFIX'] + config['USR_ROUTE'] + '/register/', methods=['GET','POST'])
def register():

    # debug
    # mlog("DEBUG", "register route: ", config['PREFIX'] + config['USR_ROUTE'] + '/register')

    if request.method == 'GET':
        return render_template(
            "registration_full_form.html",
            doors_connect=config['DOORS_HOST']+':'+config['DOORS_PORT']
        )
    elif request.method == 'POST':
        # ex: request.form = ImmutableMultiDict([('initials', 'R.L.'), ('email', 'romain.loth@iscpif.fr'), ('last_name', 'Loth'), ('country', 'France'), ('first_name', 'Romain'), ('my-captchaHash', '-773776109'), ('my-captcha', 'TSZVIN')])
        # mlog("DEBUG", "GOT ANSWERS <<========<<", request.form)

        # 1 - testing the captcha answer
        captcha_userinput = request.form['my-captcha']
        captcha_userhash = re_hash(captcha_userinput)
        captcha_verifhash = int(request.form['my-captchaHash'])

        # dbg
        # mlog("DEBUG", str(captcha_verifhash))

        if captcha_userhash != captcha_verifhash:
            mlog("INFO", "pb captcha rejected")
            form_accepted = False

        # normal case
        else:
            mlog("INFO", "ok form accepted")
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
                # A) a new DB connection
                reg_db = connect_db(config)

                # B) read/fill the affiliation table to get associated id
                clean_records['affiliation_id'] = get_or_create_affiliation(clean_records, reg_db)

                # C) create record into the primary user table
                # ---------------------------------------------
                save_scholar(duuid, rdate, clean_records, reg_db)

                # D) read/fill each keyword and save the (uid <=> kwid) pairings
                kwids = get_or_create_keywords(kw_array, reg_db)
                save_pairs_sch_kw([(duuid, kwid) for kwid in kwids], reg_db)

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
                                debug_records = (clean_records if app.config['DEBUG'] else {}),
                                form_accepted = True,
                                backend_error = False,
                                message = "")


########### SUBS ###########

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
    # TODO recheck b/c if post comes from elsewhere
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


# TODO move to text submodules
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


########### MAIN ###########
# this only uses the dev server (in prod we're run by unicorn and not as main)
if __name__ == "__main__":
    # our app should be bound to an ip (cf stackoverflow.com/a/30329547/2489184)
    app.run(host=config['COMEX_HOST'], port=int(config['COMEX_PORT']))
