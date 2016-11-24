# to run docker client without sudo
sudo usermod -aG docker
# then full reboot


# to make a docker with the data
# src: hub.docker.com/r/mysql/mysql-server/

mkdir ../shared_mysql_data
docker create mysql

docker run --detach --name comex_db \
           -v /home/romain/comex/regcomex/data/shared_mysql_data:/var/lib/mysql \
           --env="MYSQL_ROOT_PASSWORD=very-safe-pass" mysql


# get the ip
export SQLDOCKERIP=$(docker inspect comex_db | jq -r '.[0].NetworkSettings.IPAddress')

# connect --------------------------------------------
mysql -uroot -pvery-safe-pass -h $SQLDOCKERIP -P 3306
# -----------------------------------------------------

# stop it when you're done
docker stop comex_db


# NB
# also now mysqld --initilize created the following files
~/comex/shared_mysql_data > ll
total 185M
-rw-r----- 1 999   56 2016-11-23 17:49 auto.cnf
-rw-r----- 1 999 1,3K 2016-11-23 17:49 ib_buffer_pool
-rw-r----- 1 999  76M 2016-11-23 17:49 ibdata1
-rw-r----- 1 999  48M 2016-11-23 17:49 ib_logfile0
-rw-r----- 1 999  48M 2016-11-23 17:49 ib_logfile1
-rw-r----- 1 999  12M 2016-11-23 17:49 ibtmp1
drwxr-x--- 2 999 4,0K 2016-11-23 17:49 mysql/
drwxr-x--- 2 999 4,0K 2016-11-23 17:49 performance_schema/
drwxr-x--- 2 999  12K 2016-11-23 17:49 sys/


# --- after connection to mysql
CREATE DATABASE comex_shared ;
USE comex_shared ;
create table comex_registrations (
    doors_uid            char(36) not null unique,
    -- ISO stamp like 2016-11-16T17:47:07.308Z
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
    pic_file             blob
) ;
