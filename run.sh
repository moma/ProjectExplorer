#! /bin/bash
#
# simple web server running server_comex_registration:app

gunicorn -b 0.0.0.0:9090 server_comex_registration:app
