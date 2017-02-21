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

# 2) any pre-existing well-formed data can be imported if added inside into /var/lib/mysql-files
#   exemple:
#      ADD new_scholars_htids_mapping.tsv /var/lib/mysql-files/
#   then in SQL something like:
#      LOAD DATA INFILE '/var/lib/mysql-files/new_scholars_htids_mapping.tsv'
#      INTO TABLE sch_ht IGNORE 1 LINES (uid,htid)
