## Sql config tips
If you have an sql running, just fill your sql hostname in `$SQL_HOST` and skip to [Set up the tables](https://github.com/moma/comex2/blob/master/doc/table_specifications.md).

#### Prerequisites
We'll use docker and jq here
```
# install prerequisites
sudo apt install docker jq
```

#### To build and run a `comex_db` container with the mysql
*source:* hub.docker.com/r/mysql/mysql-server/

```
# create the **comex_db** container
mkdir $INSTALL_DIR/data/shared_mysql_data
docker create mysql
docker run --detach \
           --name comex_db \
           --env="MYSQL_ROOT_PASSWORD=very-safe-pass"\
           mysql

# get the ip into SQL_HOST
export SQL_HOST=$(docker inspect comex_db | jq -r '.[0].NetworkSettings.IPAddress')

# variant if run by docker-compose
export SQL_HOST=$(sudo docker inspect dockers_comex_db_test_1 | jq -r '.[0].NetworkSettings.Networks.dockers_default.IPAddress')
```
