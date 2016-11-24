Community explorer registration form
=====================================


### Overview
This folder contains nov 2016 registration form server

  - the form is served by [flask](http://flask.pocoo.org/) and uses [javascript functions](https://github.com/moma/regcomex/blob/master/static/js/comex_reg_form_controllers.js) for validation etc  
  - the registration credentials are transmitted to a doors prototype  
  - the answers are POSTed back to server that writes new users in a local DB  

More info in `doc/` directory

-------

### Setting up the server on an nginx server

#### Running in dev
First we need to run the app
```
# install prerequisites
> sudo apt install python3 docker jq

cd $INSTALL_DIR

# run the database docker
docker run --detach --name comex_db \
           -v $INSTALL_DIR/data/shared_mysql_data:/var/lib/mysql \
           --env="MYSQL_ROOT_PASSWORD=very-safe-pass" mysql

# get its IP into the env
export SQLDOCKERIP=$(docker inspect comex_db | jq -r '.[0].NetworkSettings.IPAddress')

# run the app --------------------------------------------
gunicorn -b 127.0.0.1:9090 server_comex_registration:app
# -------------------------------------------------------
```
The form server is now accessible locally on `127.0.0.1:9090/regcomex`  

**Remarks:**
  - the default ROUTE_PREFIX is /regcomex, but TODO can be changed in config file  
  - the mysql DB needs to be [built first](https://github.com/moma/regcomex/blob/master/setup/dockers/1-create_sql_container.md), but TODO automatize  

-------

#### Running it all via docker
Prerequisites:
  - `docker`
  - `docker-compose` (>= v. 1.7.0)

```
cd setup/dockers

docker build flask_ispcif_light/ -t flask_ispcif_light:latest

docker run -p 9090 --name comex_flask_test  flask_ispcif_light

docker-compose up
```

-------

#### Running in prod
TODO
Secondly we ask nginx to reverse-proxy our app

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

### Setting up the doors connection

TODO config file for the doors api routes

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
