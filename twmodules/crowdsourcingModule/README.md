The user inputs (term/topic suggestions) are saved in an sqlite3 db in dir db/, under table terms.

For a new installation one should create the db with the following commands:

```
> cd db
> sqlite3 crowdsourcing.db
sqlite> CREATE TABLE terms (source CHAR(250),suggestion CHAR(250),time CHAR(30)) ;
sqlite> .exit
> chmod -v 775 crowdsourcing.db
```

