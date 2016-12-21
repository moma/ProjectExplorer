## Outer Nginx configuration

The comex app is in 2 parts that are unified inside docker via an [inner nginx](https://github.com/moma/comex2/blob/master/setup/dockers/comex2_services/comex2_php_and_services.nginx.conf). However on the deployment machine (host machine that runs the dockers), we may want to have a webserver to redirect everything inside. This is the **outer** nginx exemple.


### 1) Install nginx
If you don't already have nginx on the deployment machine, follow these steps first:
```
sudo service apache2 stop

sudo apt install nginx-full

# check the status
sudo service nginx status
```


### 2) Replace nginx conf by our comex2 configuration

Create the conf files for comex
```
cd /etc/nginx/sites-available
sudo nano comex2_outer.conf
```

This below is a full config exemple you can paste in nano:
  - it serves the comex app (legacy php), in `/`
  - it also serves registration app, in `/services/user/register`  


```nginxconf
# Full server config: php comex as root and api + reg as services subpath
# ========================================================================
server {
    listen 80 ;
    listen [::]:80 ;

    # server_name communityexplorer.org;
    server_name _ ;

    # get the logs in a custom place
    # (adapt paths)
    access_log /home/romain/comex/outer_nginx_access.log ;
    error_log /home/romain/comex/outer_nginx_error.log ;

    # independant app with its own nginx serving:
    #     the php root on '/'
    #     the python server on 'services/'
    location / {
        # pointing to the local bridge to the dockerized nginx serving all comex2 parts
        proxy_pass http://0.0.0.0:8080;
        proxy_redirect     off;

        # useful to keep track of original IP before reverse-proxy
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Host $server_name;
    }

}
```

Finally, to enable the conf:

```
cd /etc/nginx/sites-enabled
sudo ln -s ../sites-available/comex2_outer.conf
```

**NB:**   
If you use this configuration without changing anything else than the paths, then *remove* all other confs from `sites-enabled` (because this one is written to be standalone)
