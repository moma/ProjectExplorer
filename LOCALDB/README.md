
## Related Documents PHP backend

##### Provides an API for "topPapers" search queries in tinawebJS

Main use case is support for one-doc-by-row CSV files.

#### Prerequisites

You need any kind of php server support with php > 5.0.

For instance on an ubuntu 16 with an nginx server, I'd install php 7 fpm:
```
sudo apt install php7.0-fpm
```

And then add this kind of configuration entry in `nginx.conf`:
```
location ~ \.php$ {
  include snippets/fastcgi-php.conf;
  fastcgi_pass unix:/run/php/php7.0-fpm.sock;

 fastcgi_param SCRIPT_FILENAME /your/path/to/LOCALDB/$fastcgi_script_name;
 #                             ---------------------
}
```

It's enough to run any kind of gargantext-style gexf + CSV sets.

Optionally, especially in production, you should add memcached support for faster CSV search (it allows caching the CSV postings base).

```
sudo apt install php-memcached
sudo service php7.0-fpm restart
```

For legacy cortext-style databases, you'll also need sqlite:
```
sudo apt install sqlite3
```


#### Usage
For a given graph source and database, you will need to **fill in the right settings in `db.json`**  in order to associate the graph source file (eg gexf) with this related docs API.

£TODO explain after new specifications implemented
