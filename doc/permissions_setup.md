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

#### Required apache mod
```
sudo a2enmod cgi        # <= needed for cgi
```

#### Expected apache conf
```
    Alias /comex-reg "/home/rloth/comex/regcomex"

    # for main directory
    <Directory "/home/rloth/comex/regcomex">

        # no dir listing, but allow symlinks
        Options -Indexes +FollowSymLinks

        # no htaccess
        AllowOverride None

        # directive's conflict resolution (last one prevails)
        Order allow,deny

        # which IPs can access
        Allow from all             # old but necessary on tina 2016-11
        Require all granted        # new but insufficient  --- // ---
    </Directory>


    # for cgi directory
    ScriptAlias /cgi-bin/ "/home/rloth/comex/regcomex/cgi-bin/"
    <Directory "/home/rloth/comex/regcomex/cgi-bin">
      Options +ExecCGI -MultiViews +SymLinksIfOwnerMatch
      AddHandler cgi-script .cgi .pl .py
      AllowOverride None
      Require all granted
    </Directory>
```
