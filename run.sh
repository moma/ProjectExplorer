#! /bin/bash
#
# simple web server running services/comex_main_backend:app

if [ -z "$HOST" ]
  then export HOST="0.0.0.0"
fi


if [ "$DEBUG_FLAG" != true ]
then
    gunicorn -b $HOST:9090 services.comex_main_backend:app
else
    gunicorn -b $HOST:9090 \
             --log-level debug \
             services.comex_main_backend:app
            #  --access-logfile test_gu_access.log
            #  --error-logfile test_gu_error.log
fi
