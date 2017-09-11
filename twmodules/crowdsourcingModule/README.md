## Crowdsourcing Module

A module to allow saving user-suggestions from the search box in the map.

------------------------------------------------------
#### Initial Config
The user inputs (term/topic suggestions) are saved in an sqlite3 db in dir db/, under table terms.

  - For a new installation one should create the db with the following commands:

    ```
    cd twmodules/crowdsourcingModule
    sqlite3 db/crowdsourcing.db
    sqlite> CREATE TABLE terms (source CHAR(250),suggestion CHAR(250),time CHAR(30)) ;
    sqlite> .exit
    chmod -v 664 db/crowdsourcing.db
    chown :www-data db
    chown :www-data db/crowdsourcing.db
    ```

  - data saving is done by an XHR POST to a PHP script under `db/s.php` so you need a working php engine associated to your web server

    For instance on an ubuntu 16 with an nginx server, I'd install php 7 fpm:
    ```
    sudo apt install php7.0-fpm
    ```

    And then add this kind of configuration entry in `nginx.conf`:
    ```
    location ~ \.php$ {
      include snippets/fastcgi-php.conf;
      fastcgi_pass unix:/run/php/php7.0-fpm.sock;

     fastcgi_param SCRIPT_FILENAME
       /your/path/to/ProjectExplorer/$fastcgi_script_name;
     # ------------------------------
    }
    ```

    For more information about the nginx configuration, you can find information in [nginx_suggestions.md](https://github.com/moma/ProjectExplorer/blob/master/00.DOCUMENTATION/C-advanced/nginx_suggestions.md).

------------------------------------------------------
#### Retrieving the suggestions

To export the table to csv, you can use this command.
```
cd twmodules/crowdsourcingModule/db
echo 'SELECT * FROM terms;' | sqlite3 -header -csv crowdsourcing.db
```
