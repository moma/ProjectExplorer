#! /bin/bash
#
# simple web server running server_comex_registration:app

if [ -z "$HOST" ]
  then export HOST="0.0.0.0"
fi

gunicorn -b $HOST:9090 \
         --log-level debug \
         --access-logfile test_gu_access.log \
         --error-logfile test_gu_error.log \
         server_comex_registration:app
