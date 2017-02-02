To remember the setup

#### Dir permissions
```
cd /path/to/comex2

# dirs must have u+x to be readable in unix
find . -type d -exec chmod 755 {} +

# files don't need +x, except php
find . -type f -exec chmod 644 {} +
chmod 755 *.php

# and all this belongs to www-data group
chown -R :www-data .
```

For the `data` directory:
  - we need root ownership for the mysql part (accessed by the mysql docker)
  - and www-data for the pictures

```
# data must be writeable
chmod 774 data

# mysql data more restrictive
find data/shared_mysql_data/ -type d -exec chmod 750 {} +
find data/shared_mysql_data/ -type f -exec chmod 640 {} +

# and accessible by docker user
sudo chown -R 999:999 data/shared_mysql_data
```
