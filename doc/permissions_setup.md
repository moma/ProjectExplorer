To remember the setup

#### Dir permissions
```
# in comex2 dir
chown -R rloth:www-data .

# writeable data
chmod 774 data
chmod 774 data/shared_mysql_data/  # <=> u+rwx, g+rwx, o+r
```
