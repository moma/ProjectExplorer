** Docker commands for advanced testing **
```
# check ports redirection
docker inspect comex_test | jq '.[0].NetworkSettings'
docker exec -it comex_test bash


# start services without docker-compose
docker run --detach --name doors_test -p 8989:8989 -v /home/romain/comex/shared_minidoors_data:/root/.doors minidoors

docker run --detach --name comex_db -v /home/romain/comex/regcomex/data/shared_mysql_data:/var/lib/mysql            --env="MYSQL_ROOT_PASSWORD=very-safe-pass" mysql
```
