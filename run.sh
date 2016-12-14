#! /bin/bash
#
# simple web server running services/comex_main_backend:app

export COMEX_HOST=$(grep COMEX_HOST config/parametres_comex.ini | perl -pe 's/^[^=]+=\s*//')

echo "using \$COMEX_HOST $COMEX_HOST"

gunicorn -b $COMEX_HOST:9090 services.comex_main_backend:app
