** Docker commands for advanced testing **
```
# check ports redirection
docker inspect comex_test | jq '.[0].NetworkSettings'
docker exec -it comex_test bash
```
