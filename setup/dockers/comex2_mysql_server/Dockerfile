#  mysql server for comex 2
# --------------------------

FROM mysql

# our conf for mysqld
ADD config-file.cnf /etc/mysql/conf.d/

# init script for our db comex_shared
# (mysql container will run it iff data volume is empty)
ADD init_comex_shared.sql /docker-entrypoint-initdb.d/

# if Adding data
# 1) a pre-existing database can be added via the volume in /data/shared_mysql_data
# 2) any pre-existing table-formed data can be imported if added inside into /var/lib/mysql-files
