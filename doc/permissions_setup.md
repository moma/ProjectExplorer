To remember the setup

#### Dir permissions
```
# in regcomex dir
chown -R rloth:www-data .

# cgi executables
chmod 754 cgi-bin/*               # <=> u+rwx, g+rx, o+r

# writeable data
chmod 774 data
chmod 774 data/registered.db      # <=> u+rwx, g+rwx, o+r
```
