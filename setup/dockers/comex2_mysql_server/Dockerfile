#  mysql server for comex 2
# --------------------------

FROM mysql

# our conf for mysqld
ADD config-file.cnf /etc/mysql/conf.d/

# init script for our db comex_shared
# (mysql container will run it iff data volume is empty)
ADD init_comex_shared.sql /docker-entrypoint-initdb.d/
