#!/usr/bin/env python3
"""
Package: Registration page for comex app

File: CGI script for collecting form

Context:
    - static input form validated fields and checked if all were present
      (base_form.html + static/js/comex_reg_form_controllers.js)

    - Doors recorded the email + password combination

    - POSSIBLE Doors validated the email was new ??
"""
__author__    = "CNRS"
__copyright__ = "Copyright 2016 ISCPIF-CNRS"
__version__   = "1"
__email__     = "romain.loth@iscpif.fr"
__status__    = "Test"

from cgi         import FieldStorage
from traceback   import format_exc, format_tb
from ctypes      import c_int32
from re          import sub
from jinja2      import Template, Environment, FileSystemLoader
from sys         import stdout   # for direct buffer write of utf-8 bytes
from sqlite3     import connect

# debug   # £TODO comment before prod  -------------------8<--------------------
import cgitb
cgitb.enable()
from glob import glob
# --------------------------------------------------------8<--------------------


# templating setup
templating_env = Environment(loader = FileSystemLoader('../templates'),
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
    # print_to_buffer("<br/><br/><br/><br/><br/><br/>evaluated value:"+value)

    for i, char in enumerate(value):
        hashk = c_int32(hashk << 5).value + hashk + ord(char)

        # debug iterations
        # print_to_buffer(str(i) + ": " + str(hashk) + '<br/>')

    return hashk


def get_template(filename):
    """
    Retrieve a jinja2 template from ../templates
    """
    return templating_env.get_template(filename)

def print_to_buffer(stringy):
    """
    print() with utf-8 in a cgi doesn't work well because print is
    connected to sys.stdout which has hardcoded encoding ASCII...
    (but in reality html can of course have utf-8 bytes in cgi)
    so to avoid print function we write to sys.stdout.buffer
    (inspired by http://stackoverflow.com/questions/14860034)
    """
    stdout.buffer.write((stringy+'\n').encode('utf-8'))

def sanitize(value):
    """
    simple and radical: leaves only alphanum and '.' '-' ':'

    TODO allow more of the safe chars
    """
    vtype = type(value)
    str_val = str(value)
    clean_val = sub(r'^\s+', '', str_val)
    clean_val = sub(r'\s+$', '', clean_val)
    san_val = sub(r'[^\w@\.-:]', '', clean_val)

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

    reg_db = connect('../data/registered.db')
    reg_db_c = reg_db.cursor()
    reg_db_c.execute('INSERT INTO comex_registrations VALUES' + db_mask , safe_recs_arr)
    reg_db.commit()
    reg_db.close()


########### MAIN ###########
if __name__ == "__main__":

    # any response must have headers (not managed by the templating)
    # ==============================
    print_to_buffer("Content-type: text/html")
    print_to_buffer('')  # blank line <=> end of headers

    # reception: the cgi library gets vars from html form within received http POST
    # ==========
    incoming_data = FieldStorage()

    # init vars
    clean_records = {}
    missing_fields = []
    template_thanks = get_template("thank_you.html")
    captcha_accepted = False

    # for captcha validation -----------------------------------------------
    if 'my-captcha' in incoming_data:
        captcha_userinput = incoming_data['my-captcha'].value
        captcha_verifhash = int(incoming_data['my-captchaHash'].value)

        # dbg
        # print_to_buffer(str(captcha_verifhash))

        captcha_userhash = re_hash(captcha_userinput)
        captcha_accepted = (captcha_userhash == captcha_verifhash)
    # ----------------------------------------------------------------------

    # debug data keys
    # print_to_buffer("<br/><br/><br/><br/><br/><br/><br/>")
    # print_to_buffer(str([k for k in incoming_data]))
    # print_to_buffer(str(incoming_data))

    if captcha_accepted:
        # read in + sanitize values
        # =========================
        # NB password values have already been sent by ajax to Doors

        # we should have all the mandatory fields (checked in client-side js)
        for field_info in COLS:
            field = field_info[0]
            if field in incoming_data:
                if field not in ["doors_uid", "last_modified_date", "pic_file"]:
                    clean_records[field] = sanitize(incoming_data[field].value)

                # these 3 fields were already validated actually :)
                else:
                    clean_records[field] = incoming_data[field].value

        # debug cleaned data keys
        print_to_buffer("<br/><br/><br/><br/><br/><br/><br/>")
        print_to_buffer(str(clean_records))

        # save to DB
        # ===========
        save_to_db([clean_records.get(k[0], None) for k in COLS])


    # show received values in template
    # ================================
    print_to_buffer(
        template_thanks.render(
            form_accepted = captcha_accepted,

            # for debug
            records = clean_records,
            message = ""
        )
    )

    # except Exception as errr:
    #     print_to_buffer("<h3>There was an error:</h3")
    #     print_to_buffer("<p style='font-family:monospace; font-size:80%'")
    #     print_to_buffer(sub(r'\n', "<br/>", format_exc()))
    #     print_to_buffer("</p>")
