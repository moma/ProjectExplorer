#!/usr/bin/env python3
"""
Package: Registration page for comex app

simple script to test the cgi user (apache?)
=> to know what db permissions to set

(inspired by stackoverflow.com/a/25574419)
"""
__author__    = "CNRS"
__copyright__ = "Copyright 2016 ISCPIF-CNRS"
__version__   = "1"
__email__     = "romain.loth@iscpif.fr"
__status__    = "Test"

from os          import getegid
from getpass     import getuser
from sys         import stdout

# debug
import cgitb
cgitb.enable()


def print_to_buffer(stringy):
    """
    print() with utf-8 in a cgi doesn't work well because print is
    connected to sys.stdout which has hardcoded encoding ASCII...
    (but in reality html can of course have utf-8 bytes in cgi)
    so to avoid print function we write to sys.stdout.buffer
    (inspired by http://stackoverflow.com/questions/14860034)
    """
    stdout.buffer.write((stringy).encode('utf-8')+b'\n')


########### MAIN ###########
if __name__ == "__main__":
    # any response must have this
    print_to_buffer("Content-type: text/html")
    print_to_buffer('')  # blank line <=> end of headers

    print_to_buffer( "Env user id: %s <br/>" % getegid() )
    print_to_buffer( "Real user: %s <br/>" % getuser() )
