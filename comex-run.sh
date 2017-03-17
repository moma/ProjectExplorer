#! /bin/bash


usage() { echo -e "Usage: $0 [-d|-p]\n    -d  dev mode (app bind point is 0.0.0.0:9090)\n    -p prod mode (app bind point is /tmp/comex.sock)" 1>&2; exit 1; }

unset COMEX_BIND_POINT
while getopts dph run_mode; do
    case $run_mode in
    d)
        # debug mode: run on TCP socket 0.0.0.0:9090
        export COMEX_BIND_POINT=0.0.0.0:9090
        echo "binding gunicorn to tcp socket: $COMEX_BIND_POINT"
        ;;
    p)
        # production mode: run on fs socket
        export COMEX_BIND_POINT='unix:/tmp/comex.sock'
        echo "binding gunicorn to fs socket: $COMEX_BIND_POINT"

        # POSS in-memory socket ?
        # export COMEX_BIND_POINT='unix:/run/shm/comex.sock'
        ;;
    *)
        usage
    esac
done

# production mode is the default
if [ -z "$COMEX_BIND_POINT" ]
then
    echo "(no mode was specified: using production mode)"
    export COMEX_BIND_POINT='unix:/tmp/comex.sock'
    echo "binding gunicorn to fs socket: $COMEX_BIND_POINT"
fi

# if we're inside a docker (we're used as entrypoint)...
if grep --quiet docker /proc/1/cgroup
  then
    # ... then we're also in charge of the inner nginx
    #     (to package the php with the services below)
    export COMEX_DOCKER_HOST_IP=$(hostname -i)
    echo "starting nginx on docker (available at http://$COMEX_DOCKER_HOST_IP)"
    service nginx start

    echo "starting php 7 with clear_env = no"
    /etc/init.d/php7.0-fpm start
    # NB if we started php-fpm with the "service" command
    #    then all our env vars would be intercepted by it
    #    even though we set "clear_env=no" in www.conf !
fi

# anyway we always need a simple web server to run the services
export COMEX_NWORKERS=$(grep -oP '(?<=COMEX_NWORKERS=).*' config/parametres_comex.ini)

gunicorn -b $COMEX_BIND_POINT services.main:app --workers $COMEX_NWORKERS --worker-class gevent
