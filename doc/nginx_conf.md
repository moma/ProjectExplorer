## Outer Nginx configuration

The comex app is in 2 parts that are unified inside docker via an [inner nginx](https://github.com/moma/comex2/blob/master/setup/dockers/comex2_services/comex2_php_and_services.nginx.conf). However on the deployment machine (host machine that runs the dockers), we usually want to have a webserver to redirect everything inside. This is this **outer** nginx exemple.


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
  - it serves the comex php, in `/*.php`
  - it also serves services (user, api), in `/services/.*` via python  


```nginxconf
# Full server config: docker comex (php + python server) on 8080
# ==============================================================
# rewrite http to https
server {
    listen 80 ;
    listen [::]:80 ;
    # change to communityexplorer.org in *finaldeployment*
    server_name dev.communityexplorer.org ;
    # server_name communityexplorer.org;
    return         301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    # SSL certificates
        # self-signed certificates for the moment
        include snippets/snakeoil.conf;

        # uncomment future certificates for https://communityexplorer.org
        # ssl_certificate /etc/ssl/cert/ssl-future-comex.pem;
        # ssl_certificate_key /etc/ssl/private/ssl-future-comex.key;

    # change to communityexplorer.org in *finaldeployment*
    server_name dev.communityexplorer.org ;
    # server_name communityexplorer.org;

    # get the logs in a custom place (adapt paths)
    access_log /home/ubuntu/active_webapps/outer_nginx_access.log ;
    error_log /home/ubuntu/active_webapps/outer_nginx_error.log ;

    # proxy => local bridge => docker serving comex2
    location / {
        proxy_pass http://0.0.0.0:8080;
        proxy_redirect     off;

        # useful to keep track of original IP before reverse-proxy
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Host $server_name;
    }

    # faster shortcut to static files w/o docker
    location /static {
        alias  /home/ubuntu/active_webapps/comex2/static;
    }
}
```

Finally, to enable the conf:

```
cd /etc/nginx/sites-enabled
sudo ln -s ../sites-available/comex2_outer.conf
```

**NB:**   
If you use this configuration without changing anything else than the paths, then *remove* all other confs from `sites-enabled` (because this one is written to be standalone).
If you have several apps already then add the server entries (especially the proxy to 8080) beside your previous `server{}` sections.
