To remember the setup

#### Dir permissions
```
cd /path/to/comex2

# dirs must have u+x to be readable in unix
find . -type d -exec chmod 755 {} +

# files don't need +x, except php
find . -type f -exec chmod 644 {} +
chmod 755 *.php
chmod 755 services/*.py

# data must be writeable
chmod 774 data
chmod 774 data/shared_mysql_data/  # <=> u+rwx, g+rwx, o+r

# and all this belongs to www-data group
chown -R :www-data .
```
