#  mysql server for comex 2
# --------------------------

FROM mysql

# init script for our db comex_shared (mysql container will run it iff data volume is empty)
ADD init_comex_shared.sql /docker-entrypoint-initdb.d/
