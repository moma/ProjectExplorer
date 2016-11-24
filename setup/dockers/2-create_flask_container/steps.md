
```bash
docker build flask_ispcif_light/ -t flask_ispcif_light:latest

docker run -p 9090 --name comex_flask_test  flask_ispcif_light
#docker run -it -p 9090 --name comex_flask_test  flask_ispcif_light

# check ports redirection
docker inspect comex_flask_test | jq '.[0].NetworkSettings'
```
