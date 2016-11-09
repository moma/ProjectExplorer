Memo for chown
--------------

To ensure correct access rights to the DB,
the entire folder data/ should should be owned
by www-data or a user member of www-data group.

Exemple:

```
sudo chown -R romain:www-data data/
```
