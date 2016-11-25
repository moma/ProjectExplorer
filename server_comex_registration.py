"""
Flask server used for the registration page for comex app
Context:
    - templates-based input form validated fields and checked if all were present
      (base_form.html + static/js/comex_reg_form_controllers.js)

    - Doors recorded the email + password combination
        - POSSIBLE Doors validated the email was new ??

    - exposed as "server_comex_registration.app" for the outside
        - can be served in dev by python3 server_comex_registration.py
        - better to serve it via gunicorn (cf run.sh)
"""
__author__    = "CNRS"
__copyright__ = "Copyright 2016 ISCPIF-CNRS"
__version__   = "1"
__email__     = "romain.loth@iscpif.fr"
__status__    = "Dev"

from flask       import Flask, render_template, request
from ctypes      import c_int32
from MySQLdb     import connect, ProgrammingError
from re          import sub
from os          import environ
from traceback   import format_tb

# ============= read environ =============
MY_HOST = environ.get('HOST', '0.0.0.0')
MY_DEBUG_FLAG = environ.get('DEBUG_FLAG') == 'true'
MY_SQL_HOST = environ.get('SQL_HOST', '172.17.0.2')
MY_DOORS_HOST = environ.get('DOORS_HOST', '0.0.0.0')
# TODO add doors port if != 8989

# ============= app creation =============
app = Flask(__name__)

app.config['DEBUG'] = MY_DEBUG_FLAG


########### PARAMS ###########

# all columns as they are declared in form & DB as tuple:
#             NAME,               NOT NULL,  N or MAXCHARS (if applicable)
COLS = [ ("doors_uid",              True,        36),
         ("last_modified_date",     True,        24),   # ex 2016-11-16T17:47:07.308Z
         ("email",                  True,       255),
         ("initials",               True,         7),
         ("country",                True,        60),
         ("first_name",             True,        30),
         ("middle_name",           False,        30),
         ("last_name",              True,        50),
         ("jobtitle",               True,        30),
         ("keywords",               True,       350),
         ("institution",            True,       120),
         ("institution_type",       True,        50),
         ("team_lab",              False,        50),
         ("institution_city",      False,        50),
         ("interests_text",        False,      1200),
         ("community_hashtags",    False,       350),
         ("gender",                False,         1),   # M|F
         ("pic_file",              False,      None)]


# ============= views =============

# -----------------------------------------------------------------------
# /!\ Routes are not prefixed by nginx in prod so we do it ourselves /!\
# -----------------------------------------------------------------------

# prefix must match what nginx conf expects
ROUTE_PREFIX = "/regcomex"

@app.route(ROUTE_PREFIX+"", methods=['GET','POST'])
def one_big_form():
    if request.method == 'GET':
        return render_template("base_form.html", doors_host=MY_DOORS_HOST)
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
            print("captcha rejected")
            form_accepted = False

        # normal case
        else:
            # print("OK accepted")
            form_accepted = True

            clean_records = {}
            pic_blob = None

            # 1) handles all the text/options inputs
            (duuid, rdate, clean_records) = read_records(request.form)

            # 2) handles the pic_file if present
            if hasattr(request, "files") and 'pic_file' in request.files:
                # it's a werkzeug.datastructures.FileStorage
                pic = request.files['pic_file']
                print("INFO: Storing a picture (%s)" % pic.filename)
                pic_blob = pic.stream.read()

            # 3) pass it on
            # try:
            # save to DB
            save_to_db([duuid, rdate] + [clean_records.get(k[0], None) for k in COLS[2:-1]] + [pic_blob])

            # except Exception as perr:
            #     return render_template("thank_you.html",
            #                             records = clean_records,
            #                             form_accepted = False,
            #                             backend_error = True,
            #                             message = ("ERROR ("+str(perr.__class__)+"):<br/>"
            #                                         + ("<br/>".join(format_tb(perr.__traceback__)))
            #                                         )
            #                            )

        # TODO use MY_DEBUG_FLAG here
        return render_template("thank_you.html",
                                records = clean_records,
                                form_accepted = True,
                                message = "")




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

def save_to_db(safe_recs_arr):
    """
    see COLS and table_specifications.md
    see http://mysql-python.sourceforge.net/MySQLdb.html#some-examples
    """

    # TODO double-check if email exists first
    #   yes =>propose login via doors + overwrite ?)
    #   no => proceed

    db_tgtcols = []
    # db_pyvals = []
    db_qstrvals = []
    actual_len_dbg = 0

    # REMARK:
    # => In theory should be possible to execute(statment, values) to insert all
    #    (or reg_db.literal(db_pyvals) to convert all)

    # => But currently bug in MySQLdb for binary values)
    #    (see also MySQLdb.converters)

    # => So for now we buid the values string ourselves in db_qstrvals instead
    #                           -------------              -----------
    #    and then we execute(full_statmt)         :-)


    # + we also filter ourselves
    # ---------------------------
    for i in range(len(COLS)):
        col = COLS[i]
        colname = col[0]
        # NB: each val already contains no quotes because of sanitize()
        val = safe_recs_arr[i]

        if val != None:
            actual_len_dbg += 1
            quotedstrval = ""
            if colname != 'pic_file':
                quotedstrval = "'"+str(val)+"'"
            else:
                # str(val) for a bin is already quoted but has the 'b' prefix
                quotedstrval = '_binary'+str(val)[1:]
                # print("DEBUG: added pic blob: " + quotedstrval[:15] + '...' + quotedstrval[-5:])

            # anyways
            db_tgtcols.append(colname)
            db_qstrvals.append(quotedstrval)
            # db_pyvals.append(val)

    # expected colnames "(doors_uid, last_modified_date, email, ...)"
    db_tgtcols_str = ','.join(db_tgtcols)

    # fields converted to sql syntax
    db_vals_str = ','.join(db_qstrvals)

    # DB is actually in a docker and forwarded to localhost:3306
    reg_db = connect( host=MY_SQL_HOST,
                      user="root",   # TODO change db ownership to a comexreg user
                      passwd="very-safe-pass",
                      db="comex_shared"
                      )

    reg_db_c = reg_db.cursor()

    # full_statement with formated values
    full_statmt = 'INSERT INTO comex_registrations (%s) VALUES (%s)' % (
                        db_tgtcols_str,
                        db_vals_str
                   )

    reg_db_c.execute(full_statmt)
    reg_db.commit()
    reg_db.close()


def read_records(incoming_data):
    """
    runs sanitization as needed
    """

    # init var
    clean_records = {}
    # read in + sanitize values
    # =========================
    # NB password values have already been sent by ajax to Doors

    duuid = None
    rdate = None

    # we should have all the mandatory fields (checked in client-side js)
    for field_info in COLS:
        field = field_info[0]
        if field in incoming_data:

            if field not in ["doors_uid", "last_modified_date"]:
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


    return (duuid, rdate, clean_records)



########### MAIN ###########
if __name__ == "__main__":
    # our app should be bound to an ip (cf. http://stackoverflow.com/a/30329547/2489184)
    app.run(host=MY_HOST)
