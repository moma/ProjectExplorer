#! /bin/bash

# if we're inside a docker (we're used as entrypoint)...
if grep --quiet docker /proc/1/cgroup
  then
    # ... then we're also in charge of the inner nginx
    #     (to package the php with the services below)
    export REAL_DOCKER_HOST=$(hostname -i)
    echo "starting nginx on $REAL_DOCKER_HOST"
    service nginx start

    echo "starting php 7 with clear_env = no"
    /etc/init.d/php7.0-fpm start
    # NB if we started it with the "service" command
    #    all our env vars would be intercepted by it
    #    even though we set "clear_env=no" in www.conf
fi

# anyway we always need a simple web server to run the services
export COMEX_NWORKERS=$(grep -oP '(?<=COMEX_NWORKERS=).*' config/parametres_comex.ini)

echo "binding gunicorn to unix:/tmp/comex.sock"
gunicorn -b unix:/tmp/comex.sock services.main:app --workers $COMEX_NWORKERS


# export COMEX_HOST=$(grep -oP '(?<=COMEX_HOST=).*' config/parametres_comex.ini)
# export COMEX_PORT=$(grep -oP '(?<=COMEX_PORT=).*' config/parametres_comex.ini)
# echo "binding gunicorn to $COMEX_HOST:$COMEX_PORT"
# gunicorn -b $COMEX_HOST:$COMEX_PORT services.main:app --workers $COMEX_NWORKERS
