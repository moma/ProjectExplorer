#! /bin/bash
#
# simple web server running services/main:app

export COMEX_HOST=$(grep -oP '(?<=COMEX_HOST=).*' config/parametres_comex.ini)

echo "using \$COMEX_HOST $COMEX_HOST"

gunicorn -b $COMEX_HOST:9090 services.main:app
