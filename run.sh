#! /bin/bash
#
# simple web server running server_comex_registration:app

gunicorn -b 127.0.0.1:9090 server_comex_registration:app
