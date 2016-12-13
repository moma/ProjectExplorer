Community Explorer v.2 beta
===========================

## comex app with refactoring in progress

It contains:  
  - an html index based on old bootstrap
  - several php files specialized in retrieving custom lists of scholars, labs, jobs for directory showing
    - `whoswho.js` is used to GUIise the queries
    - legacy jquery and highcharts are used to GUIise the directories
  - a linked couple python server + tinawebJS to explore the data in graph view
    - the twjs is in a legacy version, downloadable [via this subtree](https://github.com/moma/tinawebJS/tree/comex_wip)
    - the server can be run with `nohup bash run.sh`


#### TODOES
  - remove the legacy links to csregistry.org
  - do the profile pages beyond register

------
### DB structure

###### Overview
  - the DB name is *`comex_shared`*  
  - `scholars` is the main table, with a **doors_uid** as primary key
     - email is also unique in this table
  - we have three related tables
    - `affiliations` (directly pointed by an **affiliation_id** in scholars table), for labs and institutions (TODO ~~> 2 tables)
    - `keywords`
      - and `sch_kw` for scholars <=> keywords mapping
    - `linked_ids` for other ids of the researcher (eg: [ORCID](http://orcid.org/), not used yet)

###### More info
Full table structure is described in [this documentation file](https://github.com/moma/comex2/blob/master/doc/table_specifications.md).

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
The comex app was refactored and merged in dec 2016 with a new registration form server

  - the form is served by [flask](http://flask.pocoo.org/) and uses [javascript functions](https://github.com/moma/comex2/blob/master/static/js/comex_reg_form_controllers.js) for validation etc  
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
# prepare the data directory (or copy one if you already have data)
mkdir data/shared_mysql_data

# build the components
cd setup/dockers
docker create mysql
docker build -t comex2_services:latest comex2_services/
docker build -t minidoors:latest minidoors/

# run them and link them
docker-compose up

             |---------------------|
             |        nginx        |
             |---------------------|
                   /            \
                  /              \
          (reverse proxy)        $host/
          $host/services/           \
                |                    \
     |----------------------------------------------|
     |     (serveur python3     +     site php)     |
     |- - - - - - - - - - - - - - - +---------------|
     | services/api | services/user |      |
     |------------------------------|      |
                       / \                 |
                      /   \                |
   |-------------------|   \               |
   | minidoors docker  |    \              |
   | émule futur doors |     \             |
   |-------------------|      \            |
                               \           |
                             |-----------------|
                             |  mysql docker   |
                             |  "comex_shared" |
                             |-----------------|
```

-------

### Running in dev

#### Minimal config

NB: The communityexplorer.org app was using a separate DB from legacy wiki csv (cf. master branch of the `moma/legacy_php_comex` repository)



```
# get the site
git clone https://github.com/moma/comex2

# get prerequisites
sudo apt install php7.0-fpm php7.0-mysql python3 libmysqlclient-dev
cd $INSTALL_DIR
sudo pip3 install -r setup/requirements.txt
```

Then to run the comex2 services in the simplest way just do:
```
cd services
python3 comex_main_backend.py
```
The form server is then accessible locally on `0.0.0.0:5000/services/user`  
The tina api server is on `0.0.0.0:5000/services/api`  

Finally, simply configure the serving of your php|www documentroot in nginx (cf [detailed doc](https://github.com/moma/comex2/blob/master/doc/nginx_conf.md) for real-life conf).


-------

#### Real-world dev config
  1. external mysql database  
  2. external doors (or simulated by docker)  
  3. gunicorn webserver (linked to 1 & 2 via `$SQL_HOST` and `$DOORS_HOST`)  

##### 1) Set up your mysql database

###### If you have your own local mysql
```
# edit ini file to put the correct SQL_HOST (or IP)
nano config/parametres_comex.ini
```
Then just create the table following [the table specifications](https://github.com/moma/comex2/blob/master/doc/table_specifications.md)

###### If you want a dedicated mysql in docker

  - Follow the detailed steps in [mysql_prerequisites](https://github.com/moma/comex2/blob/master/setup/dockers/mysql_prerequisites.md): it will explain how to create the docker and connect to it.

  - Then create the table following [the table specifications](https://github.com/moma/comex2/blob/master/doc/table_specifications.md)
  - Now run it as follows:

```
# run the database docker
docker start comex_db

# read its IP
docker inspect comex_db | jq -r '.[0].NetworkSettings.IPAddress'

# edit ini file to put it as SQL_HOST
nano config/parametres_comex.ini
```

##### 2) Set up a doors connection
Again, the environment variable `DOORS_HOST` must simply be set to the doors server's hostname or IP, and `DOORS_PORT` to the doors server's exposed port.

###### If you have a doors server
```
# edit ini file to put it as DOORS_HOST and DOORS_PORT
nano config/parametres_comex.ini
```

###### If you have no doors server

For tests you can use a `minidoors` container
```
# build the docker image (once)
cd setup/dockers
docker build -t minidoors:latest minidoors/

# run the container (each time)
docker run -it -p 32789:8989 --name doors_test minidoors
```

##### 3) Run the regomex app with gunicorn
```
bash run.sh
```

The form server is then accessible locally on `0.0.0.0:9090/services/user/register`  

**Remark:** the prefix `/services` and the user route `/user` can both be changed in the config file

-------

### Running in prod

#### Nginx
We ask nginx to reverse-proxy our app

This is a minimal conf (cf [detailed doc](https://github.com/moma/comex2/blob/master/doc/nginx_conf.md) for real-life conf)

```
# nginx exemple
server {
    listen 80;

    location /$PREFIX {
        proxy_pass http://0.0.0.0:9090;
    }
}
```

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
