#### To make a docker with the mysql instead of using your local mysql server
*source:* hub.docker.com/r/mysql/mysql-server/

```
mkdir ../shared_mysql_data
docker create mysql
docker run --detach --name comex_db \
           --env="MYSQL_ROOT_PASSWORD=very-safe-pass"\
           mysql

# get the ip
export SQL_HOST=$(docker inspect comex_db | jq -r '.[0].NetworkSettings.IPAddress')
```

#### To use any other mysql server
```
export SQL_HOST=localhost         # or any other hostname/IP
```

### Set up the tables

```
# connect to your sql host or container
mysql -uroot -pvery-safe-pass -h $SQL_HOST -P 3306

# --- after connection to mysql
CREATE DATABASE comex_shared ;
USE comex_shared ;
CREATE TABLE comex_registrations (
    doors_uid            char(36) not null unique,
    last_modified_date   char(24) not null,
    email                varchar(255) not null unique primary key,
    initials             varchar(7) not null,
    country              varchar(60) not null,
    first_name           varchar(30) not null,
    middle_name          varchar(30),
    last_name            varchar(50) not null,
    jobtitle             varchar(30) not null,
    keywords             varchar(350) not null,
    institution          varchar(120) not null,
    institution_type     varchar(50) not null,
    team_lab             varchar(50),
    institution_city     varchar(50),
    interests_text       varchar(1200),
    community_hashtags   varchar(350),
    gender               char(1),
    pic_file             mediumblob
) ;
```
