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
from flask        import Flask, render_template, request, \
                         redirect, url_for, session
from flask_login  import fresh_login_required, login_required, \
                         current_user, login_user, logout_user

if __package__ == 'services':
    # when we're run via import
    print("*** comex services ***")
    from services.user  import User, login_manager, doors_login, UCACHE
    from services.text  import keywords
    from services.tools import restparse, mlog, re_hash, REALCONFIG, format_err, pic_blob_to_filename
    from services.db    import connect_db, get_or_create_tokitems, save_pairs_sch_tok, delete_pairs_sch_tok, get_or_create_affiliation, save_scholar, get_field_aggs, doors_uid_to_luid, rm_scholar, save_doors_temp_user, rm_doors_temp_user
    from services.db_to_tina_api.extractDataCustom import MyExtractor as MySQL
else:
    # when this script is run directly
    print("*** comex services (dev server mode) ***")
    from user           import User, login_manager, doors_login, UCACHE
    from text           import keywords
    from tools          import restparse, mlog, re_hash, REALCONFIG, format_err, pic_blob_to_filename
    from db             import connect_db, get_or_create_tokitems, save_pairs_sch_tok, delete_pairs_sch_tok, get_or_create_affiliation, save_scholar, get_field_aggs, doors_uid_to_luid, rm_scholar, save_doors_temp_user, rm_doors_temp_user
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
         ("pic_file",              False  ),   # will be saved separately
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

# ============= context =============
@app.context_processor
def inject_doors_params():
    """
    Keys will be available in *all* templates

       -> 'doors_connect'
          (base_layout-rendered templates need it for login popup)
    """
    return dict(
        doors_connect= config['DOORS_HOST']+':'+config['DOORS_PORT']
        )


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



# ============= views =============

# -----------------------------------------------------------------------
# /!\ Routes are not prefixed by nginx in prod so we do it ourselves /!\
# -----------------------------------------------------------------------
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
            # (getting details for selected scholars into graph object)
            # TODO do it along with previous step getScholarsList
            # (less modular but a lot faster)
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
            "login.html"
        )
    elif request.method == 'POST':
        mlog("DEBUG", "login form received from "+request.path+", with keys:", [k for k in request.values])

        # we used this custom header to mark ajax calls => called_as_api True
        x_req_with = request.headers.get('X-Requested-With', type=str)
        called_as_api = (x_req_with in ['XMLHttpRequest', 'MyFetchRequest'])

        # testing the captcha answer
        captcha_userinput = request.form['my-captcha']
        captcha_userhash = re_hash(captcha_userinput)
        captcha_verifhash = int(request.form['my-captchaHash'])

        # dbg
        # mlog("DEBUG", "login captcha verif", str(captcha_verifhash))
        # mlog("DEBUG", "login captcha user", str(captcha_userhash))

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
            try:
                doors_uid = doors_login(email, pwd, config)
            except Exception as err:
                mlog("ERROR", "error in doors_login request")
                raise (err)

            mlog("DEBUG", "doors_login returned id '%s'" % doors_uid)

            luid = doors_uid_to_luid(doors_uid)

            if luid:
                # normal user
                user = User(luid)
            else:
                # user exists in doors but has no comex profile nor luid yet
                save_doors_temp_user(doors_uid, email)  # preserve the email
                user = User(None, doors_uid=doors_uid)  # get a user.empty

            # =========================
            login_ok = login_user(user)
            # =========================

            mlog('INFO', 'login of %s (%s) was %s' % (str(luid), doors_uid, str(login_ok)))

            # TODO check cookie
            # login_ok = login_user(User(luid), remember=True)
            #                                   -------------
            #                            creates REMEMBER_COOKIE_NAME
            #                        which is itself bound to session cookie

            if login_ok:
                if called_as_api:
                    # menubar login will do the redirect
                    return('', 204)

                elif user.empty:
                    mlog('DEBUG',"empty user redirected to profile")
                    # we go straight to profile for the him to create infos
                    return(redirect(url_for('profile', _external=True)))

                # normal call, normal user
                else:
                    mlog('DEBUG', "normal user login redirect")
                    next_url = request.args.get('next', None)

                    if not next_url:
                        return(redirect(url_for('profile', _external=True)))
                    else:
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
                # failed to login_user()
                render_template(
                    "message.html",
                    message = "There was an unknown problem with the login."
                )


# /services/user/logout/
@app.route(config['PREFIX'] + config['USR_ROUTE'] + '/logout/')
def logout():
    logout_user()
    mlog('INFO', 'logged out previous user')
    return redirect(url_for('rootstub', _external=True))

# /test_base
@app.route('/test_base')
def test_base():
    return render_template(
        "base_layout.html"
    )


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
            "profile.html"
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


        else:
            # input fields data ~> normalized {cols:values}
            our_records = read_record_from_request(request)

            # special action CREATE for a new user already known to doors
            if current_user.empty:
                mlog("DEBUG", "create profile from new doors user", current_user.doors_uid)
                # remove the empty luid
                our_records.pop('luid')

                # add the doors_uid and doors_email to the form (same keynames!)
                our_records = { **our_records, **current_user.doors_info }

                try:
                    # *create* this user in our DB
                    luid = save_form(our_records, update_flag = False)

                except Exception as perr:
                    return render_template("thank_you.html",
                                form_accepted = False,
                                backend_error = True,
                                debug_message = format_err(perr)
                            )

                # if all went well we can remove the temporary doors user data
                rm_doors_temp_user(current_user.doors_uid)
                logout_user()
                # .. and login the user in his new mode
                login_user(User(luid))
                return render_template(
                    "thank_you.html",
                    debug_records = (our_records if app.config['DEBUG'] else {}),
                    form_accepted = True,
                    backend_error = False
                )

            # normal action UPDATE
            else:
                mlog("MOREDEBUG", "UPDATE")
                try:
                    luid = save_form(our_records, update_flag = True)

                except Exception as perr:
                    return render_template("thank_you.html",
                                            form_accepted = False,
                                            backend_error = True,
                                            debug_message = format_err(perr)
                                           )

                return render_template("thank_you.html",
                                        debug_records = (our_records if app.config['DEBUG'] else {}),
                                        form_accepted = True,
                                        backend_error = False)


# /services/user/register/
@app.route(config['PREFIX'] + config['USR_ROUTE'] + '/register/', methods=['GET','POST'])
def register():

    # debug
    # mlog("DEBUG", "register route: ", config['PREFIX'] + config['USR_ROUTE'] + '/register')

    if request.method == 'GET':
        return render_template(
            "registration_short_form.html"
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
            clean_records = {}

            # 1) handles all the inputs from form
            #    (using SOURCE_FIELDS recreates USER_COLS)
            clean_records = read_record_from_request(request)

            try:
                # 2) saves the records to db
                luid = save_form(clean_records)

            except Exception as perr:
                return render_template("thank_you.html",
                                        form_accepted = False,
                                        backend_error = True,
                                        debug_message = format_err(perr)
                                       )

            # all went well: we can login the user
            login_user(User(luid))

        return render_template("thank_you.html",
                                debug_records = (clean_records if app.config['DEBUG'] else {}),
                                form_accepted = True,
                                backend_error = False,
                                message = """
                                  You can now visit elements of the members section:
                                  <ul style="list-style-type: none;">
                                      <li>
                                          <span class="glyphicon glyphicon glyphicon-education"></span>&nbsp;&nbsp;
                                          <a href="/services/user/profile"> Your Profile </a>
                                      </li>
                                      <li>
                                          <span class="glyphicon glyphicon-eye-open"></span>&nbsp;&nbsp;
                                          <a href='/explorerjs.html?type="uid"&nodeidparam=%(luid)i'> Your Map </a>
                                      </li>
                                      <li>
                                          <span class="glyphicon glyphicon glyphicon-stats"></span>&nbsp;&nbsp;
                                          <a href='/print_scholar_directory.php?query=%(luid)i'> Your Neighboor Stats </a>
                                      </li>
                                  </ul>
                                """ % {'luid': luid })


########### SUBS ###########
def save_form(clean_records, update_flag=False):
    """
    wrapper function for save profile/register (all DB-related form actions)
    """

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

    return luid


def read_record_from_request(request):
    """
    Runs all request-related form actions

    Arg:
        a flask request
        werkzeug.pocoo.org/docs/0.11/wrappers/#werkzeug.wrappers.Request

    Process:
        input SOURCE_FIELDS data ~> normalized {COLS:values}

        Custom made for comex registration forms
            - sanitization + string normalization as needed
            - pic_file field ~~> save to fs + pic_fname col
    """
    # init var
    clean_records = {}

    # sources: request.form and request.files

    # we should have all the mandatory fields (checked in client-side js)
    # POSS recheck b/c if post comes from elsewhere
    for field_info in SOURCE_FIELDS:
        field = field_info[0]
        do_sanitize = field_info[1]
        if field in request.form:
            if do_sanitize:
                val = sanitize(request.form[field])
                if val != '':
                    clean_records[field] = val
                else:
                    # mysql will want None instead of ''
                    val = None
            # this one is done separately at the end
            elif field == "pic_file":
                continue
            # any other fields that don't need sanitization (ex: menu options)
            else:
                clean_records[field] = request.form[field]

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

    # special treatment for pic_file
    if hasattr(request, "files") and 'pic_file' in request.files:
        new_fname = pic_blob_to_filename(request.files['pic_file'])
        clean_records['pic_fname'] = new_fname
        mlog("DEBUG", "new_fname", new_fname)

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
