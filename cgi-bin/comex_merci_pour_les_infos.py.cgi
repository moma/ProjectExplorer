#!/usr/local/bin/python3
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
from traceback   import format_tb

# debug
import cgitb
cgitb.enable()


if __name__ == "__main__":
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

        # todo
        # institution = this_data[].value

        # optional
        # picture = form["user_picture"]
        # if picture.file & picture.filename:
        #     picture_bytes = picture.value

        # response
        print("Content-type: text/html")
        print()  # blank line <=> end of headers

        print("<TITLE>CGI script output</TITLE>")
        print([k for k in this_data])
        #
        print('<br>first_name:',first_name)
        print('<br>midle_name:',middle_name)
        print('<br>last_name:',last_name)
        print('<br>initials:',initials)
        print('<br>email:',email)
        print('<br>country:',country)
        print('<br>jobtitle:',jobtitle)
        print('<br>keywords:',keywordsss)
        # print('instituton:',institution)

    except KeyError as kerrr:
        print("Content-type: text/html")
        print()  # blank line <=> end of headers
        print("<h3>Your form was empty</h3")
        print("<p style='font-family:monospace; font-size:80%'")
        print("<br/>".join(format_tb(kerrr.__traceback__)))
        print("</p>")

    except Exception as errr:
        print("Content-type: text/html")
        print()  # blank line <=> end of headers
        print("<h3>There was an error:</h3")
        print("<p style='font-family:monospace; font-size:80%'")
        print("<br/>".join(format_tb(errr.__traceback__)))
        print("</p>")
