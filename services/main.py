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
__version__   = "1.5"
__email__     = "romain.loth@iscpif.fr"
__status__    = "Dev"


# ============== imports ==============
from re           import sub
from os           import path
from json         import dumps
from datetime     import timedelta
from urllib.parse import urlparse, urljoin, unquote
from traceback    import format_tb
from flask        import Flask, render_template, request, \
                         redirect, url_for, session
from flask_login  import fresh_login_required, login_required, \
                         current_user, login_user, logout_user


if __package__ == 'services':
    # when we're run via import
    print("*** comex services ***")
    from services.user  import User, login_manager, doors_login, UCACHE
    from services.text  import keywords
    from services.tools import restparse, mlog, re_hash, REALCONFIG
    from services.db    import connect_db, get_or_create_tokitems, save_pairs_sch_tok, delete_pairs_sch_tok, get_or_create_affiliation, save_scholar, get_field_aggs, doors_uid_to_luid, rm_scholar
    from services.db_to_tina_api.extractDataCustom import MyExtractor as MySQL
else:
    # when this script is run directly
    print("*** comex services (dev server mode) ***")
    from user           import User, login_manager, doors_login, UCACHE
    from text           import keywords
    from tools          import restparse, mlog, re_hash, REALCONFIG
    from db             import connect_db, get_or_create_tokitems, save_pairs_sch_tok, delete_pairs_sch_tok, get_or_create_affiliation, save_scholar, get_field_aggs, doors_uid_to_luid, rm_scholar
    from db_to_tina_api.extractDataCustom import MyExtractor as MySQL

# ============= app creation ============
config = REALCONFIG

app = Flask("services",
             static_folder=path.join(config['HOME'],"static"),
             template_folder=path.join(config['HOME'],"templates"))

app.config['DEBUG'] = (config['LOG_LEVEL'] in ["DEBUG","DEBUGSQL"])
app.config['SECRET_KEY'] = 'TODO fill secret key for sessions for login'

# for SSL
app.config['PREFERRED_URL_SCHEME'] = 'https'

# for flask_login
cookie_timer = timedelta(hours=2)
app.config['PERMANENT_SESSION_LIFETIME'] = cookie_timer
app.config['REMEMBER_COOKIE_DURATION'] = cookie_timer
app.config['REMEMBER_COOKIE_NAME'] = 'communityexplorer.org cookie'

login_manager.login_view = "login"
login_manager.session_protection = "strong"
login_manager.init_app(app)

########### PARAMS ###########

# all inputs as they are declared in form, as a couple
SOURCE_FIELDS = [
#             NAME,              SANITIZE?
         ("luid",                  False  ),
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
         ("gender",                False  ),   # M|F
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

         ("keywords",               True  ),
         # => for *keywords* table (after split str)

         ("hashtags",               True  )
         # => for *hashtags* table (after split str)
      ]

# NB password values have already been sent by ajax to Doors

# mandatory minimum of keywords # TODO use
MIN_KW = 5

# ============= views =============

# -----------------------------------------------------------------------
# /!\ Routes are not prefixed by nginx in prod so we do it ourselves /!\
# -----------------------------------------------------------------------

@login_manager.unauthorized_handler
def unauthorized():
    """
    Generic handler for all unauthorized
    (pages requires login)

    NB: Redirecting here is done by @login_required decorators
    """
    return render_template(
        "message.html",
        message = """
            Please <strong><a href="%(login)s">login here</a></strong>.
            <br/><br/>
            The page <span class='code'>%(tgt)s</span> is only available after login.
            """ % {'tgt': request.path,
                   'login': url_for('login', next=request.path, _external=True)}
    )


@app.route("/")
def rootstub():
    """
    Root of the comex2 app (new index)
    Demo CSS with alternative index (top like old index, then underneath some layout à la notebook)

    also useful to be able to url_for('rootstub') when redirecting to php
    """
    return render_template(
                            "alt_index.html"
                          )

# /services/
@app.route(config['PREFIX']+'/')
def services():
    return redirect(url_for('login', _external=True))

# /services/test
@app.route(config['PREFIX'] + '/test', methods=['GET'])
def test_stuff():
    return render_template("message.html",
                           message = "<br/>".join([
                               "dir(req)"        +  str(dir(request)),
                               "requrl:"        +  request.url,
                               "req.host:"      +  request.host,
                               "req.url_root:"   +  request.url_root,
                               "req.base_url:"    +  request.base_url,
                               "req.full_path:"    +  request.full_path,
                               "req.access_route:" + str(request.access_route)
                               ])
                           )

# /services/api/aggs
@app.route(config['PREFIX'] + config['API_ROUTE'] + '/aggs')
def aggs_api():
    """
    API to read DB aggregation data (ex: for autocompletes)
    """
    if 'field' in request.args:
        # field name itself is tested by db module
        result = get_field_aggs(request.args['field'])
        return dumps(result)

    else:
        raise TypeError("aggs API query is missing 'field' argument")

# /services/api/graph
@app.route(config['PREFIX'] + config['API_ROUTE'] + '/graph')
def graph_api():
    """
    API to provide json extracts of the DB to tinaweb
    (originally @ moma/legacy_php_comex/tree/master/comex_install)
    (original author S. Castillo)
    """
    if 'qtype' in request.args:
        graphdb=MySQL(config['SQL_HOST'])
        scholars = graphdb.getScholarsList(request.args['qtype'], restparse(request.query_string.decode()))
        if scholars and len(scholars):
            # Data Extraction
            graphdb.extract(scholars)

        graphArray = graphdb.buildJSON_sansfa2(graphdb.Graph)
        return dumps(graphArray)

    else:
        raise TypeError("graph API query is missing qtype (should be 'filters' or 'uid')")


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
        # testing the captcha answer
        captcha_userinput = request.form['my-captcha']
        captcha_userhash = re_hash(captcha_userinput)
        captcha_verifhash = int(request.form['my-captchaHash'])

        # dbg
        mlog("DEBUG", "login captcha verif", str(captcha_verifhash))
        mlog("DEBUG", "login captcha user", str(captcha_userhash))

        if captcha_userhash != captcha_verifhash:
            mlog("WARNING", "pb captcha rejected")
            return render_template(
                "message.html",
                message = """
                    We're sorry the "captcha" information you entered was wrong!
                    <br/>
                    <strong><a href="%s">Retry login here</a></strong>.
                    """ % url_for('login', _external=True)
                )
        else:
            # OK captcha accepted
            email = request.form['email']
            pwd = request.form['password']

            # we do our doors request here server-side to avoid MiM attack on result
            doors_uid = doors_login(email, pwd, config)
            luid = doors_uid_to_luid(doors_uid)

            if luid:
                login_ok = login_user(User(luid))

                mlog('INFO', 'login of %s was %s' % (luid, str(login_ok)))

                # TODO check cookie
                # login_ok = login_user(User(luid), remember=True)
                #                                   -------------
                #                            creates REMEMBER_COOKIE_NAME
                #                        which is itself bound to session cookie

                if login_ok:
                    # normal user
                    next_url = request.args.get('next', None)

                    if next_url:
                        next_url = unquote(next_url)
                        mlog("DEBUG", "login with next_url:", next_url)
                        safe_flag = is_safe_url(next_url, request.host_url)
                        # normal next_url
                        if safe_flag:
                            # if relative
                            if next_url[0] == '/':
                                next_url = url_for('rootstub', _external=True) + next_url[1:]
                                mlog("DEBUG", "reabsoluted next_url:", next_url)

                            return(redirect(next_url))
                        else:
                            # server name is different than ours
                            # in next_url so we won't go there
                            return(redirect(url_for('rootstub', _external=True)))
                    else:
                        # no specified next_url => profile
                        return redirect(url_for('profile', _external=True))

                else:
                    # user exists in doors but has no comex profile yet
                    #   => TODO
                    #       => we add him
                    #       => status = "fresh_profile"
                    #       => empty profile
                    # return redirect(url_for('fresh_profile', _external=True))
                    return redirect(url_for('register', _external=True))

            else:
                # user doesn't exist in doors nor comex_db
                # (shouldn't happen since client-side blocks submit and displays same message, but still possible if user tweaks the js)
                return render_template(
                    "message.html",
                    message = """
                        We're sorry but you don't exist in our database yet!
                        <br/>
                        However you can easily <strong><a href="%s">register here</a></strong>.
                        """ % url_for('register', _external=True)
                )


# /services/user/logout/
@app.route(config['PREFIX'] + config['USR_ROUTE'] + '/logout/')
def logout():
    logout_user()
    return redirect(url_for('rootstub', _external=True))


# /services/user/profile/
@app.route(config['PREFIX'] + config['USR_ROUTE'] + '/profile/', methods=['GET', 'POST'])
@fresh_login_required
def profile():
    """
    Entrypoint for users to load/re-save personal data

    @login_required uses flask_login to relay User object current_user
    """
    if request.method == 'GET':
        # login provides us current_user
        if current_user.empty:
            mlog("INFO",  "PROFILE: empty current_user %s" % current_user.uid)
        else:
            mlog("INFO",  "PROFILE: current_user %s" % current_user.uid)
            mlog("DEBUG",  "PROFILE: current_user details: \n  - %s" % (
                                '\n  - '.join([current_user.info['email'],
                                            current_user.info['initials'],
                                           current_user.info['doors_uid'],
                                        str(current_user.info['keywords']),
                                            current_user.info['country']]
                                          )
                              )
                )

        # debug session cookies
        # print("[k for k in session.keys()]",[k for k in session.keys()])
        mlog("DEBUG", "PROFILE view with flag session.new = ", session.new)

        return render_template(
            "profile.html",

            # doors info only for link
            doors_connect=config['DOORS_HOST']+':'+config['DOORS_PORT']

            # NB we also got user info in {{current_user.info}}
            #                         and {{current_user.json_info}}
        )
    elif request.method == 'POST':
        mlog("DEBUG", "saving profile with request.form=", request.form)

        # special action DELETE!!
        if 'delete_user' in request.form and request.form['delete_user'] == 'on':
            the_id_to_delete = current_user.uid
            mlog("INFO", "executing DELETE scholar's data at the request of user %s" % str(the_id_to_delete))
            logout_user()
            rm_scholar(the_id_to_delete)
            if the_id_to_delete in UCACHE: UCACHE.pop(the_id_to_delete)
            return(redirect(url_for('rootstub', _external=True)))

        # normal action UPDATE
        else:
            try:
                clean_records = save_form(
                          request.form,
                          request.files if hasattr(request, "files") else {},
                          update_flag = True
                         )


            except Exception as perr:
                return render_template("thank_you.html",
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


# /services/user/register/
@app.route(config['PREFIX'] + config['USR_ROUTE'] + '/register/', methods=['GET','POST'])
def register():

    # debug
    # mlog("DEBUG", "register route: ", config['PREFIX'] + config['USR_ROUTE'] + '/register')

    if request.method == 'GET':
        return render_template(
            "registration_short_form.html",
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

        clean_records = {}

        if captcha_userhash != captcha_verifhash:
            mlog("INFO", "pb captcha rejected")
            form_accepted = False

        # normal case
        else:
            mlog("INFO", "ok form accepted")
            form_accepted = True

            try:
                clean_records = save_form(
                                          request.form,
                                          request.files if hasattr(request, "files") else {}
                                         )

            except Exception as perr:
                return render_template("thank_you.html",
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
def save_form(request_form, request_files, update_flag=False):
    """
    wrapper function for save profile/register form actions
    """
    # only safe values
    clean_records = {}

    # 1) handles all the inputs from form, no matter what target table
    clean_records = read_record(request_form)

    mlog("DEBUG", "===== clean_records =====", clean_records)

    # 2) handles the pic_file if present
    if 'pic_file' in request_files:
        # type: werkzeug.datastructures.FileStorage.stream
        pic_blob = request_files['pic_file'].stream.read()
        if len(pic_blob) != 0:
            clean_records['pic_file'] = pic_blob

    # 3) save to DB
    # A) a new DB connection
    reg_db = connect_db(config)

    # B) read/fill the affiliation table to get associated id
    clean_records['affiliation_id'] = get_or_create_affiliation(clean_records, reg_db)

    # C) create/update record into the primary user table
    # ----------------------------------------------------
        # TODO class User method !!
    luid = None
    if update_flag:
        luid = clean_records['luid']
        save_scholar(clean_records, reg_db, update_luid=luid)
    else:
        luid = save_scholar(clean_records, reg_db)


    # D) read/fill each keyword and save the (uid <=> kwid) pairings
    #    read/fill each hashtag and save the (uid <=> htid) pairings
    for intable in ['keywords', 'hashtags']:
        tok_field = intable
        if tok_field in clean_records:
            tok_table = tok_field
            map_table = "sch_" + ('kw' if intable == 'keywords' else 'ht')

            tokids = get_or_create_tokitems(clean_records[tok_field], reg_db, tok_table)

                # TODO class User method !!
                # POSS selective delete ?
            if update_flag:
                delete_pairs_sch_tok(luid, reg_db, map_table)

            save_pairs_sch_tok([(luid, tokid) for tokid in tokids], reg_db, map_table)

    # F) end connection
    reg_db.close()

    # clear cache concerning this scholar
    # TODO class User method !!
    if luid in UCACHE: UCACHE.pop(luid)

    return clean_records


def read_record(incoming_data):
    """
    Runs sanitization + string normalization as needed
      - custom made for regcomex/templates/base_form
      - uses SOURCE_FIELDS
    """
    # init var
    clean_records = {}

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
            # any other fields that don't need sanitization (ex: menu options)
            else:
                clean_records[field] = incoming_data[field]


    # special treatment for "other" subquestions
    if 'org_type' in clean_records:
        if clean_records['org_type'] == 'other' and 'other_org_type' in clean_records:
            clean_records['org_type'] = clean_records['other_org_type']

    # splits for kw_array and ht_array
    for tok_field in ['keywords', 'hashtags']:
        if tok_field in clean_records:
            mlog("DEBUG", "in clean_records, found a field to tokenize: %s" % tok_field)
            temp_array = []
            for tok in clean_records[tok_field].split(','):
                tok = sanitize(tok)
                if tok != '':
                    temp_array.append(tok)
            # replace str by array
            clean_records[tok_field] = temp_array

    return clean_records


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


def is_safe_url(target, host_url):
    """
    Checks if url is ok for redirects
    cf. http://flask.pocoo.org/snippets/62/
    """
    ref_url = urlparse(host_url)
    test_url = urlparse(urljoin(host_url, target))
    return test_url.scheme in ('http', 'https') and ref_url.netloc == test_url.netloc


########### MAIN ###########
# this only uses the dev server (in prod we're run by unicorn and not as main)
if __name__ == "__main__":
    # our app should be bound to an ip (cf stackoverflow.com/a/30329547/2489184)
    app.run(host=config['COMEX_HOST'], port=int(config['COMEX_PORT']))
