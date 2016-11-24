#! /bin/bash
#
# simple web server running server_comex_registration:app

gunicorn -b 127.0.0.1:9090 \
         --log-level debug \
         --access-logfile test_gu_access.log \
         --error-logfile test_gu_error.log \
         server_comex_registration:app
