#! /bin/bash
#
# simple web server running server_comex_registration:app

if [ -z "$HOST" ]
  then export HOST="0.0.0.0"
fi

gunicorn -b $HOST:9090 server_comex_registration:app
