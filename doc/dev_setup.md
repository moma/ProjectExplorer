## dev overview

comex app contains:
  - several php files specialized in retrieving custom lists of scholars, labs, jobs for directory showing
    - `whoswho.js` is used to GUIise the queries
    - legacy jquery and highcharts are used to GUIise the directories
  - a python server for the app's services
    - the services views are in `services/main.py`
    - the main templates are `base_layout.html` and `rootindex.html`
    - main and `services/user.py` handle DB add/modify/remove scholars
    - `services/db_to_tina_api` contains a custom python extraction function for tinawebJS
  - a copy of tinawebJS in `static/tinawebJS` to explore the data in graph view
    - the twjs is in a legacy version, downloadable [via this subtree](https://github.com/moma/tinawebJS/tree/comex_wip)

-------

### Running in dev

In development, it is more natural to run the app *without* the docker wrapper.
This way one can see the effects of changes without the bother of committing them, pulling them in the image and rebuilding the image.

Another difference is that without the docker wrapper, the app will be available on COMEX_HOST:9090 instead of 8080.

#### Minimal config

```
# get the code
git clone https://github.com/moma/comex2

# get prerequisites
sudo apt install php7.0-fpm php7.0-mysql python3 libmysqlclient-dev
cd $INSTALL_DIR
sudo pip3 install -r setup/requirements.txt
```

Then to run the comex2 server just do:
```
bash comex-run.sh
```

Check the parameters in `config/parametres_comex.ini`

Finally, simply configure the serving of your php|www documentroot in nginx (cf [detailed doc](https://github.com/moma/comex2/blob/master/doc/nginx_conf.md) for real-life conf).


-------

#### Full dev config
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

For tests you can use a self-deployed doors container, available on [this repository](https://github.com/ISCPIF/doors-docker)


##### 3) Run the regomex app with gunicorn
```
bash comex-run.sh
```

The form server is then accessible locally on `0.0.0.0:9090/services/user/register`

**Remark:** the prefix `/services` and the user route `/user` can both be changed in the config file

-------
