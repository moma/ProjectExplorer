## Serving ProjectExplorer's PHP elements with nginx

Because ProjectExplorer is mostly static files + javascript, you actually **don't** need a webserver for most of the functionalities.

However, some elements rely on a PHP server and won't work without it:
  - the topPapers backend under `twbackends/phpAPI` that can be used for relatedDocs queries in CSV or CortextDB databases
  - the crowdsourcingModule under `twmodules/crowdsourcingModule` that can be used to save user suggestions

If you need to configure that kind of a server, we provide two examples, supposing:

  - you cloned the ProjectExplorer distribution in /absolute/path/to/ProjectExplorer
  - you installed php fpm (`sudo apt install php7.0-fpm`)


#### Exemple 1
In case of an nginx normal "`location`" configuration, something like this is the working minimal conf at time of writing:
```
server {
  listen 80 default_server;
  listen [::]:80 default_server;

  #    ---------------------------------
  root /absolute/path/to/ProjectExplorer;
  #    ---------------------------------

  server_name _;

  location / {
    try_files $uri $uri/ =404;
  }

  # pass the PHP scripts to FastCGI server listening on php7.0-fpm.sock
  #
  location ~ \.php$ {
    include snippets/fastcgi-php.conf;
    fastcgi_pass unix:/run/php/php7.0-fpm.sock;
  }
}
```

#### Exemple 2
And in case of an nginx "`alias`" configuration, the path must be reconstructed by matching the entire path in a regexp without the alias part to get the correct relative path to the script. Something like this works:
```
server {
   listen 80;
   listen [::]:80 default_server;
   root /somewhere_else_like_a_previous_website ;
   location /myalias {
           #     ---------------------------------
           alias /absolute/path/to/ProjectExplorer ;
           #     ---------------------------------

           # (we use a regexp to capture the appropriate path into $1)
           location ~ ^/myalias/(.+\.php)$ {
              include snippets/fastcgi-php.conf;
              fastcgi_pass unix:/run/php/php7.0-fpm.sock;
              fastcgi_param SCRIPT_FILENAME $DOCUMENT_ROOT/$1;
          }
   }
}
```

Refer to the [NGINX official documentation about PHP](https://www.nginx.com/resources/wiki/start/topics/examples/phpfcgi/) for more information.

#### Path coherence
For API queries, the route prefix is set in ProjectExplorer's settings found under the entry `TWConf.relatedDocsAPIS`. **The rule to follow is to make sure that `$DOCUMENT_ROOT + '/' + TWConf.relatedDocsAPIS[yourdbtype]` forms a valid route to the PHP files in your project dirs.**
