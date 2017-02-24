Community Explorer v.2 beta
===========================

## Setting up the server

### Running it directly [for development]
See `doc/dev_setup.md`

### Running it wrapped in docker [for production]
Prerequisites:
  - `docker`
  - `docker-compose` (>= v. 1.7.0)  

##### 1) Get the app
```
git clone https://github.com/moma/comex2.git
```

##### 2) Set up the doors connection
```
nano config/parametres_comex.ini
```
The environment variable `DOORS_HOST` must simply be set to your doors server's hostname or IP, and `DOORS_PORT` to the doors server's exposed port, or none if it's ports 80/443.


##### 3) Run the docker
```
# prepare the data directory (or copy one if you already have data)
mkdir data/shared_mysql_data

# build the components
cd setup/dockers
sudo docker-compose build

# run them and link them
sudo docker-compose up
# at this point your comex app is available on http://localhost:8080
```

#### Nginx
We ask nginx to reverse-proxy our app

This is a minimal conf:

```
# nginx exemple
server {
    listen 80;

    location / {
        proxy_pass http://0.0.0.0:8080;
    }
}
```
See the [detailed doc](https://github.com/moma/comex2/blob/master/doc/nginx_conf.md) and a [typical production conf file](https://github.com/moma/comex2/blob/master/setup/comex2_deployed_outer.nginx.conf)) for a real-life configuration example.

```
# the app is then accessible directly on localhost
# here is the operational schema

          your-server:80 or :443
                   ___
                    |
           |------------------|
           |    your nginx    |
           |------------------|
                    |                         |-------------------|
             your-server:8080  <------------> |  Doors external   |
                    |                         |    auth server    |
                    |                         |-------------------|
        D O C K E R   C O N T A I N E R
                    |
          |---------------------|
          |     inner  nginx    |
          |---------------------|
               /            \
              /              \
      (reverse proxy)        $host/
      $host/services/           \
            |                    \
 |----------------------------------------------|       |-----------------|
 |     (serveur python3     +     site php)     | <---> |  mysql docker   |
 |- - - - - - - - - - - - - - - +---------------|       |      with       |
 |                              |                       |  "comex_shared" |
 | services/api | services/user | <-------------------> |-----------------|
 |------------------------------|
```


## About the data

All user data and keywords list and occurrences are in a MySQL database in the app's directory **`data/shared_mysql_data`**,

Uploaded images are in `data/shared_user_img`.

### DB structure

##### Overview
  - the DB name is *`comex_shared`*  
  - `scholars` is the main table:
     - a local user id (aka **luid**) is the primary key
     - a unique external doors_uid (the user id for the entire lab)
     - a unique email
  - we have four related tables
    - `affiliations` for labs and institutions
      - (directly pointed by an **affiliation_id** in scholars table)
    - `keywords`
      - and `sch_kw` for scholars <=> keywords mapping
    - `hashtags`
      - and `sch_ht` for scholars <=> hashtags mapping
    - `linked_ids` for other ids of the researcher (eg: [ORCID](http://orcid.org/), not used yet)

##### More info
Full table structure is described in [this documentation file](https://github.com/moma/comex2/blob/master/doc/table_specifications.md).

##### Exemple queries
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
  - the registration credentials are transmitted to an authentication portal: Doors prototype  
  - the answers are POSTed back to server that writes new users in a local DB  

More info in `doc/` directory

### TODOLIST
  - once we have SSL certificates for communityexplorer, add them to inner nginx
      ```
      # ssl_certificate /etc/ssl/cert/ssl-future-comex.pem;
      # ssl_certificate_key /etc/ssl/private/ssl-future-comex.key;
      ```

  - transform `affiliations` table into 2 tables (differentiate labs and orgs)

### Project History Overview
This project was developed over several years with 3 main development phases.

Scholars statistics and directory structure originally developed by D. Chavalarias (scholars data exploration in the `php_library` folder).
Graph extraction logic originally developed by [S. Castillo](https://github.com/PkSM3/) (SubsetExtractor in the `dbdatapi` module)
Ports to python3+MySQL, user registration and merge of the various layers into one deployable docker by [R. Loth](https://github.com/rloth/)

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
