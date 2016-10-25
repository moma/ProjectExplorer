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

from cgi import FieldStorage

# debug
import cgitb
cgitb.enable()


if __name__ == "__main__":
    # reception: the cgi library gets vars from html form within received http POST
    this_data = FieldStorage()

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

    # debug log
    # log = open('../cgi_my_output.log', 'w')
    # print('first_name:',first_name, file=log)
    # print('midle_name:',midle_name, file=log)
    # print('last_name:',last_name, file=log)
    # print('initials:',initials, file=log)
    # print('email:',email, file=log)
    # print('country:',country, file=log)
    # print('jobtitle:',jobtitle, file=log)
    # print('keywordsss:',keywordsss, file=log)
    # print('instituton:',institution, file=log)
    # log.close()

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
