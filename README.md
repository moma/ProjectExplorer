Community explorer registration form
=====================================


### Overview
This folder contains nov 2016 registration form server

  - the form is served by [flask](http://flask.pocoo.org/) and uses [javascript functions](https://github.com/moma/regcomex/blob/master/static/js/comex_reg_form_controllers.js) for validation etc  
  - the registration credentials are transmitted to a doors prototype  
  - the answers are POSTed back to server that writes new users in a local DB  

More info in `doc/` directory

-------

### Setting up the servers

#### Running it all via docker
Prerequisites:
  - `docker`
  - `docker-compose` (>= v. 1.7.0)  

Steps to run:
```
cd setup/dockers

# build the components
docker build -t flask_iscpif_regcomex:latest flask_iscpif_regcomex/
docker build -t minidoors:latest minidoors/
docker create mysql
mkdir ../shared_mysql_data

# run them and link them
docker-compose up
```

-------

#### Running in dev
Minimal config:
```
sudo apt install python3
sudo pip3 install -r setup/requirements.txt
source setup/regcomex_config.ini
```

Then to run the regcomex app in the simplest way just do:
```
python3 server_comex_registration.py
```
The form server is then accessible locally on `127.0.0.1:5000/regcomex`  

-------

Or, to run the app with a real-world config:
  - gunicorn webserver
  - external mysql database
  - external doors (simulated by docker)

```
# install more prerequisites
sudo apt install docker jq

cd $INSTALL_DIR
source setup/regcomex_config.ini

# external mysql setup
mkdir ../shared_mysql_data

# run the database docker
docker run --detach --name comex_db \
           -v $INSTALL_DIR/data/shared_mysql_data:/var/lib/mysql \
           --env="MYSQL_ROOT_PASSWORD=very-safe-pass" mysql

# get its IP into the env
export SQL_HOST=$(docker inspect comex_db | jq -r '.[0].NetworkSettings.IPAddress')

# here also set up the doors connection

# run the app
gunicorn -b 127.0.0.1:9090 server_comex_registration:app
```

The form server is then accessible locally on `127.0.0.1:9090/regcomex`  

**Remarks:**
  - the default ROUTE_PREFIX is /regcomex, but TODO can be changed in config file  
  - the mysql DB needs to be [built first](https://github.com/moma/regcomex/blob/master/setup/dockers/1-create_sql_container.md), but TODO automatize  

-------


#### Running in prod
TODO => we ask nginx to reverse-proxy our app

This is a minimal conf (cf [detailed doc](https://github.com/moma/regcomex/blob/master/doc/nginx_conf.md) for real-life conf)

```
# nginx exemple
server {
    listen 80;

    location /$ROUTE_PREFIX {
        proxy_pass http://127.0.0.1:9090;
    }
}
```
-------

### Setting up a doors connection
The environment variable `DOORS_HOST` must simply be set to the doors server's hostname or IP, and `DOORS_PORT` to the doors server's exposed port.

For tests you can use a `minidoors` container
```
# build the docker image (once)
cd setup/dockers
docker build -t minidoors:latest minidoors/

# run the container (each time)
docker run -it -p 32789:8989 --name doors_test minidoors

# pass the info to the env before running regcomex
export DOORS_HOST=localhost
export DOORS_PORT=8989
```

-------

### Connecting the data to *communityexplorer.org*
Currently the data is collected in `data/shared_mysql_data`
  - the DB name is `comex_shared`  
  - the table is `comex_registrations`  

The communityexplorer.org app is using a separate DB from legacy wiki csv
(cf [detailed doc](https://github.com/moma/regcomex/blob/master/doc/nginx_conf.md) for real-life conf)

**TODO:** connect the two

-------

**contact** romain.loth@iscpif.fr  
(c) 2016 ISCPIF-CNRS  
