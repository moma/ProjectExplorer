#!/usr/bin/env python3
"""
Package: Registration page for comex app

File: CGI script for collecting form
"""
__author__    = "CNRS"
__copyright__ = "Copyright 2016 ISCPIF-CNRS"
__version__   = "1"
__email__     = "romain.loth@iscpif.fr"
__status__    = "Test"

from cgi         import FieldStorage
from traceback   import format_exc, format_tb
from ctypes      import c_int
from re          import sub
from jinja2      import Template, Environment, FileSystemLoader
from sys         import stdout   # for direct buffer write of utf-8 bytes
from sqlite3     import connect

# debug
import cgitb
cgitb.enable()

from glob import glob

# templating setup
templating_env = Environment(loader = FileSystemLoader('../templates'),
                             autoescape = False)

########### SUBS ###########
def re_hash(userinput, salt=""):
    """
    Build the captcha's verification hash server side
    (my rewrite of keith-wood.name/realPerson.html python's version)
    """
    hashk = 5381

    value = userinput.upper() + salt
    for i, char in enumerate(value):

        hashk = c_int( ((hashk << 5) + hashk + ord(char)) & 0xFFFFFFFF ).value
        # bitwise masks 0xFFFFFFFF to go back to int32 each time
        # c_int( previous ).value to go from unsigned ints to c signed ints each time

        # debug iterations
        # print(i, hashk, '<br/>')

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
    san_val = sub(r'[^\w@\.-:]', '', str_val)

    if vtype not in [int, str]:
        raise ValueError("Value has an incorrect type %s" % str(vtype))
    else:
        # cast back to orginal type
        san_typed_val = vtype(san_val)
        return san_typed_val

def save_to_db(safe_records):
    """
    Expected columns:
      FOR TESTS
      - email
      - initials

      TODO
      - first_name
      - middle_name
      - last_name
      - jobtitle
      - keywords
      - institution
      - institution city
      - team/lab if applicable
      - organization type
    """
    reg_db = connect('../data/registered.db')
    reg_db_c = reg_db.cursor()
    reg_db_c.execute('INSERT INTO test_table VALUES (?,?)', safe_records)
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
        captcha_userhash = re_hash(captcha_userinput)
        captcha_accepted = (captcha_userhash == captcha_verifhash)
    # ----------------------------------------------------------------------


    # for debug
    captcha_accepted = True

    if captcha_accepted:
        expected = ['email', 'hon_title', 'first_name', 'middle_name',
                    'last_name', 'initials', 'keywords', 'country',
                    'organization']


        # read in + sanitize values
        # =========================
        # NB password values have already been sent by ajax to Doors

        for field in expected:
            if field in incoming_data:
                clean_records[field] = sanitize(incoming_data[field].value)
            else:
                missing_fields.append(field)

        # keywordsss  = incoming_data['keywords'].value   # single string but ','-separated
        # keywordzzz = incoming_data.getlist(keywords)    # array

        #  --------- todo ------>8--------------
        # optional
        # picture = form["user_picture"]
        # if picture.file & picture.filename:
        #     picture_bytes = picture.value
        # --------------------->8---------------

        # debug data keys
        # print([k for k in incoming_data])

        # sanitize & save to DB
        # =====================
        save_to_db([
                clean_records['email'],
                clean_records['initials']
            ])

    # show received values in template
    # ================================
    print_to_buffer(
        template_thanks.render(
            form_accepted = captcha_accepted,
            # for debug
            records = clean_records,
            globp = glob('../data/*')
        )
    )

    # except Exception as errr:
    #     print_to_buffer("<h3>There was an error:</h3")
    #     print_to_buffer("<p style='font-family:monospace; font-size:80%'")
    #     print_to_buffer(sub(r'\n', "<br/>", format_exc()))
    #     print_to_buffer("</p>")
