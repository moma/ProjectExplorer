
### 1) Install nginx
```
sudo service apache2 stop

sudo apt install nginx-full    # contains uwsgi http module

# check the status
systemctl status nginx.service  # or sudo service nginx status
```



### 2) Add regcomex to nginx conf


Create the conf files for regcomex
```
cd /etc/nginx/sites-available
sudo nano regcomex.conf
```

Exemple content to add in `/etc/nginx/sites-available/regcomex.conf`
```
server {
    # your normal server conf here
    #listen 80;
    #listen [::]:80;
    #root /var/www ;

    location /regcomex {
        proxy_pass http://127.0.0.1:9090; # gunicorn will be serving here

        proxy_redirect     off;

        # useful to keep track of original IP before reverse-proxy
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Host $server_name;

        # get the logs in a custom place
        access_log /home/romain/comex/regcomex/logs/nginx/access.log;
        error_log /home/romain/comex/regcomex/logs/nginx/error.log;
    }

    # faster static serving
    location /static {
        alias  /home/romain/comex/regcomex/static/;
        autoindex on;
    }

}

```

Finally enable the conf
```
cd /etc/nginx/sites-enabled
sudo ln -s ../sites-available/regcomex.conf
```
