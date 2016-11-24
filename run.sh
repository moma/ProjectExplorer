#! /bin/bash
#
# simple web server running server_comex_registration:app

if [ -z "$HOST" ]
  then export HOST="0.0.0.0"
fi


if [ "$DEBUG_FLAG" != true ]
then
    gunicorn -b $HOST:9090 server_comex_registration:app
else
    gunicorn -b $HOST:9090 \
             --log-level debug \
             server_comex_registration:app
            #  --access-logfile test_gu_access.log
            #  --error-logfile test_gu_error.log
fi
