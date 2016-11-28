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

### Running in dev

#### Minimal config
```
sudo apt install python3
sudo pip3 install -r setup/requirements.txt
cd $INSTALL_DIR
source setup/regcomex_config.ini
```

Then to run the regcomex app in the simplest way just do:
```
python3 server_comex_registration.py
```
The form server is then accessible locally on `127.0.0.1:5000/regcomex`  

-------

#### Real-world config
  1. external mysql database  
  2. external doors (or simulated by docker)  
  3. gunicorn webserver (linked to 1 & 2 via `$SQL_HOST` and `$DOORS_HOST`)  

##### 1) Set up your mysql database

###### If you have your own local mysql
```
export SQL_HOST=localhost      # or any other hostname/IP
```
Then just create the table following [the table specifications](https://github.com/moma/regcomex/blob/master/doc/table_specifications.md)

###### If you want a dedicated mysql in docker

  - Follow the detailed steps in [mysql_prerequisites](https://github.com/moma/regcomex/blob/master/setup/dockers/mysql_prerequisites.md): it will explain how to create the docker and connect to it.

  - Then create the table following [the table specifications](https://github.com/moma/regcomex/blob/master/doc/table_specifications.md)
  - Now run it as follows:

```
# run the database docker
docker start comex_db

# get its IP into the env
export SQL_HOST=$(docker inspect comex_db | jq -r '.[0].NetworkSettings.IPAddress')
```

##### 2) Set up a doors connection
Again, the environment variable `DOORS_HOST` must simply be set to the doors server's hostname or IP, and `DOORS_PORT` to the doors server's exposed port.

###### If you have a doors server
```
export DOORS_HOST=yourdoorsserver
export DOORS_PORT=8989
```

###### If you have no doors server

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

##### 3) Run the regomex app with gunicorn
```
gunicorn -b 0.0.0.0:9090 server_comex_registration:app
```

The form server is then accessible locally on `0.0.0.0:9090/regcomex`  

**Remark:** the default ROUTE_PREFIX is /regcomex, but TODO can be changed in config file  

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

#### Connecting the data to *communityexplorer.org*
Currently the data is collected in `data/shared_mysql_data`
  - the DB name is `comex_shared`  
  - the table is `comex_registrations`  

The communityexplorer.org app is using a separate DB from legacy wiki csv
(cf [detailed doc](https://github.com/moma/regcomex/blob/master/doc/nginx_conf.md) for real-life conf)

**TODO:** connect the two

-------

**contact** romain.loth@iscpif.fr  
(c) 2016 ISCPIF-CNRS  
