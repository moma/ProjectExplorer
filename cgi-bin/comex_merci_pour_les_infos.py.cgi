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
# from jinja2      import Template, Environment, FileSystemLoader

# debug
import cgitb
cgitb.enable()

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

########### MAIN ###########
if __name__ == "__main__":

    # any response must have this
    print("Content-type: text/html")
    print()  # blank line <=> end of headers

    #  --------- todo use templates --------------------------->8--------------
    # template1 = Template('Hello {{ name }}!')
    # print(template1.render(name='Jogn'))
    #
    # template2 = Environment(loader=FileSystemLoader('../templates')).get_template('thank_you.html')
    #
    # print(template2.render(form_accepted=True).encode("utf-8"))
    # -------------------------------------------------------->8-----------------

    # reception: the cgi library gets vars from html form within received http POST
    this_data = FieldStorage()

    # fyi actual form fields were
    # ['email', 'password', 'password2',
    #  'hon_title', 'first_name', 'middle_name', 'last_name', 'initials',
    #  'keywords', 'country', 'my-captcha', 'my-captchaHash']


    try:
        # read into local str vars
        first_name  = this_data['first_name'].value
        middle_name = this_data['middle_name'].value
        last_name   = this_data['last_name'].value
        initials    = this_data['initials'].value
        email       = this_data['email'].value
        country     = this_data['country'].value
        jobtitle    = this_data['hon_title'].value
        keywordsss  = this_data['keywords'].value   # single string but ','-separated
        # keywordzzz = this_data.getlist(keywords)   # array

        #  --------- todo ------>8--------------
        # institution = this_data[].value

        # optional
        # picture = form["user_picture"]
        # if picture.file & picture.filename:
        #     picture_bytes = picture.value
        # --------------------->8---------------

        # for captcha validation -----------------------------------------------
        form_accepted = False
        captcha_userinput = this_data['my-captcha'].value
        captcha_verifhash = int(this_data['my-captchaHash'].value)
        captcha_userhash = re_hash(captcha_userinput)
        form_accepted = (captcha_userhash == captcha_verifhash)
        # ----------------------------------------------------------------------


        # debug data keys
        # print([k for k in this_data])

        # show received values
        print("<TITLE>CGI script output</TITLE>")

        print("<p style='font-family:Calibri, sans-serif; font-size:80%'")
        print('<br>first_name:',first_name)
        print('<br>midle_name:',middle_name)
        print('<br>last_name:',last_name)
        print('<br>initials:',initials)
        print('<br>email:',email)
        print('<br>country:',country)
        print('<br>jobtitle:',jobtitle)
        print('<br>keywords:',keywordsss)
        print('<br>captcha is correct ?:',form_accepted)
        # print('instituton:',institution)

    except KeyError as kerrr:
        print("<h3>Your form was empty</h3")
        print("<p style='font-family:monospace; font-size:80%'")
        print(sub(r'\n', "<br/>", format_exc()))
        print("</p>")

    except Exception as errr:
        print("<h3>There was an error:</h3")
        print("<p style='font-family:monospace; font-size:80%'")
        print(sub(r'\n', "<br/>", format_exc()))
        print("</p>")
