"""
Flask server used for the registration page for comex app
Context:
    - templates-based input form validated fields and checked if all were present
      (base_form.html + static/js/comex_reg_form_controllers.js)

    - Doors recorded the email + password combination

    - POSSIBLE Doors validated the email was new ??


"""
__author__    = "CNRS"
__copyright__ = "Copyright 2016 ISCPIF-CNRS"
__version__   = "1"
__email__     = "romain.loth@iscpif.fr"
__status__    = "Dev"

from flask       import Flask, render_template, request
from ctypes      import c_int32
# from time     import sleep
from jinja2      import Template, Environment, FileSystemLoader
from sqlite3     import connect
from re          import sub

# ============= app creation =============
app = Flask(__name__)

app.config['DEBUG'] = True



# templating setup
templating_env = Environment(loader = FileSystemLoader('templates'),
                             autoescape = False)

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

# ------------------------------------------------------------------
# /!\ All routes will be prefixed by comexsomething/reg in prod /!\
# ------------------------------------------------------------------


@app.route("/", methods=['GET','POST'])
def one_big_form():
    if request.method == 'GET':
        return render_template("base_form.html")
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

            clean_records = read_records(request.form)

            # save to DB
            save_to_db([clean_records.get(k[0], None) for k in COLS])

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


def get_template(filename):
    """
    Retrieve a jinja2 template from templates

    £TODO: check if necessary in server context ?
    """
    return templating_env.get_template(filename)

def sanitize(value):
    """
    simple and radical: leaves only alphanum and '.' '-' ':' ',' '(', ')', ' '

    TODO better
    """
    vtype = type(value)
    str_val = str(value)
    clean_val = sub(r'^\s+', '', str_val)
    clean_val = sub(r'\s+$', '', clean_val)
    san_val = sub(r'[^\w@\.-:,() ]', '_', clean_val)

    if vtype not in [int, str]:
        raise ValueError("Value has an incorrect type %s" % str(vtype))
    else:
        # cast back to orginal type
        san_typed_val = vtype(san_val)
        return san_typed_val

def save_to_db(safe_recs_arr):
    """
    see COLS and table_specifications.md
    """

    # expected number of vals (for instance 3 vals ===> "(?,?,?)" )
    db_mask = '('+ ','.join(['?' for i in range(len(COLS))]) + ')'

    # £TODO check if email exists first
    #   yes =>propose login via doors + overwrite ?)
    #   no => proceed

    reg_db = connect('data/registered.db')
    reg_db_c = reg_db.cursor()
    reg_db_c.execute('INSERT INTO comex_registrations VALUES' + db_mask , safe_recs_arr)
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

    # we should have all the mandatory fields (checked in client-side js)
    for field_info in COLS:
        field = field_info[0]
        if field in incoming_data:
            if field not in ["doors_uid", "last_modified_date", "pic_file"]:
                clean_records[field] = sanitize(incoming_data[field])
            # these 3 fields were already validated actually :)
            else:
                clean_records[field] = incoming_data[field]

    # debug cleaned data keys
    # print(clean_records)

    return clean_records



########### MAIN ###########
if __name__ == "__main__":
    app.run()
