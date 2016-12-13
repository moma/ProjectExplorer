Community Explorer v.2 beta
===========================

## comex app with refactoring in progress

It contains:  
  - an html index based on old bootstrap
  - several php files specialized in retrieving custom lists of scholars, labs, jobs for directory showing
    - `whoswho.js` is used to GUIise the queries
    - legacy jquery and highcharts are used to GUIise the directories
  - a linked couple python server + tinawebJS to explore the same data in graph view
    - the python server is in `services/db_to_tina_api` dir
    - run it with `python3 main.py` and reverse-proxy its host:port to `/comexAPI` location
    - the twjs is in a legacy version, downloadable [via this subtree](https://github.com/moma/tinawebJS/tree/comex_wip)


#### TODOES for future refactoring
  - remove the legacy links to csregistry.org
  - merge the static files


------
### DB structure

###### Overview
  - `scholars` is the main table, with a **doors_uid** as primary key
     - email is also unique in this table
  - we have three related tables
    - `affiliations` (directly pointed by an **affiliation_id** in scholars table)
    - `keywords` (pointed by an intermediate user id <=> keyword id table `sch_kw`)
    - `linked_ids` (not used yet, to join the uid with external ids like ORCID)

###### More info
Full table structure is described in [this documentation file](https://github.com/moma/regcomex/blob/c5badbc/doc/table_specifications.md).

###### Exemple queries
```SQL

-- ==========================
-- FOR SCHOLAR + AFFILIATIONS
-- ==========================
SELECT
    scholars.*,
    affiliations.*,
FROM scholars
LEFT JOIN affiliations
    ON affiliation_id = affid


-- ==================================
-- FOR SCHOLAR + KEYWORDS IN ONE LINE
-- ==================================
SELECT
    scholars.*,
    COUNT(keywords.kwid) AS keywords_nb,
    GROUP_CONCAT(kwstr) AS keywords_list
FROM scholars
JOIN sch_kw
    ON doors_uid = uid
JOIN keywords
    ON sch_kw.kwid = keywords.kwid
GROUP BY uid ;
```


### User and registration service
This was merged in dec 2016 with the registration form server

  - the form is served by [flask](http://flask.pocoo.org/) and uses [javascript functions](https://github.com/moma/regcomex/blob/master/static/js/comex_reg_form_controllers.js) for validation etc  
  - the registration credentials are transmitted to a doors prototype  
  - the answers are POSTed back to server that writes new users in a local DB  

More info in `doc/` directory

-------

## Setting up the servers

### Running it all via docker
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


#             |---------------------|
#             |        nginx        |
#             |---------------------|
#                   /            \
#                  /              \
#          (reverse proxy)        $host/
#          $host/regcomex/           \
#                |                    \
#     |--------------------|     |-------------------------|
#     |    services/user   |     | services/db_to_tina_api |
#     |  (serveur python)  |     |    +  site php          |
#     |--------------------|     |-------------------------|
#         |             \                 |
#         |              \                |
# |-------------------|   \               |
# | minidoors docker  |    \              |
# | émule futur doors |     \             |
# |-------------------|      \            |
#                             \           |
#                             |-----------------|
#                             |  mysql docker   |
#                             |  "comex_shared" |
#                             |-----------------|

```

-------

### Running in dev

#### Minimal config
```
sudo apt install python3 libmysqlclient-dev
cd $INSTALL_DIR
sudo pip3 install -r setup/requirements.txt
source setup/regcomex_config.ini
```

Then to run the regcomex app in the simplest way just do:
```
cd services
python3 comex_main_backend.py
```
The form server is then accessible locally on `0.0.0.0:5000/regcomex`  

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
bash run.sh
```

The form server is then accessible locally on `0.0.0.0:9090/regcomex`  

**Remark:** the default ROUTE_PREFIX is /regcomex, but TODO can be changed in config file  

-------

### Running in prod

#### Nginx
We ask nginx to reverse-proxy our app

This is a minimal conf (cf [detailed doc](https://github.com/moma/regcomex/blob/master/doc/nginx_conf.md) for real-life conf)

```
# nginx exemple
server {
    listen 80;

    location /$ROUTE_PREFIX {
        proxy_pass http://0.0.0.0:9090;
    }
}
```

#### Connecting the data to *communityexplorer.org*
Currently the data is collected in `data/shared_mysql_data`
  - the DB name is *`comex_shared`*  
  - the main table is `scholars`
  - additional tables:
    - `affiliations` for labs and institutions (TODO ~~> 2 tables)
    - `linked_ids` for other ids of the researcher (eg: [ORCID](http://orcid.org/))
    - `keywords`
      - and `sch_kw` for scholars <=> keywords mapping

Prerequisites for the comex php legacy app
```
# php support for nginx
sudo apt install php7.0-fpm

# for legacy sqlite base
sudo apt install php7.0-sqlite3

# for new mysql base
sudo apt install php7.0-mysql

# for the helper app
sudo apt install libmysqlclient-dev
sudo pip3 install mysqlclient
```

Then installing the site itself is from repository:
```
# go to your nginx documentroot
# for instance cd /var/www

# get the legacy site into the current folder
git clone https://github.com/moma/legacy_php_comex ./

# checkout the branch that uses our new SQL
git checkout mysql_refacto_prototype

# correct permissions
sudo chown -R $USER:www-data .

# edit ini file to put the correct SQL_HOST
nano parametres_comex.ini

# start helper service
cd comex_install/
nohup python3 main.py &
```

NB: The communityexplorer.org app was using a separate DB from legacy wiki csv (cf. master branch of the `moma/legacy_php_comex` repository)

Finally, simply configure the serving of your php|www documentroot in nginx (cf [detailed doc](https://github.com/moma/regcomex/blob/master/doc/nginx_conf.md) for real-life conf).

##### Copyright
###### Authors
  - Researchers and engineers of the ISC-PIF
     - David Chavalarias
     - Samuel Castillo
     - Romain Loth

###### Acknowledgments
  - Former Tina developers (java-based software from which tinawebJS is adapted)
     - Elias Showk
     - Julian Bilcke
