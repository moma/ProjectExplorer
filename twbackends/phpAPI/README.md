
## Related Documents PHP backend

##### Provides an API for "topPapers" search queries in tinawebJS

These php files provide access to a CSV or sqlite database as an ajax endpoint for a "related documents" search in tinawebJS client.

Main use case is support for one-doc-by-row CSV files.


#### Prerequisites

You need any kind of php server support with php > 5.0.

For instance on an ubuntu 16 with an nginx server, I would:
  - install php 7 fpm:
    ```
    sudo apt install php7.0-fpm
    ```

  - follow **[nginx_suggestions.md](https://github.com/moma/ProjectExplorer/blob/master/00.DOCUMENTATION/C-advanced/nginx_suggestions.md)** to correctly configure the web server routes relative to my filesystem paths and `settings_explorerjs` configuration.

###### CSV

The prerequisites above are enough to run any kind of [gargantext](http://gargantext.org)-style {gexf + CSV} sets.

###### Cortext

For legacy cortext-style databases, you'll also need sqlite:
```
sudo apt install sqlite3 php7.0-sqlite3
```

#### Optional cache-ing
Optionally, especially in production, you should add memcached support for faster CSV search (it allows caching the CSV postings base).

```
sudo apt install php-memcached
sudo service php7.0-fpm restart
```

#### Usage

###### Configuration

To use the API for the "topPapers" embedded search in ProjectExplorer, the corresponding settings should be picked either:
  - via the interface (side panel menu)
  - or directly in settings_explorerjs.js:
    ```
    TWConf.relatedDocsType = "csv"

    or

    TWConf.relatedDocsType = "CortextDB"
    ```

Finally, to match the correct DB with the correct graph file:
  - both should reside in `data/yoursubdir`
  - the appropriate source database information needs to appear in `db.json` in order to associate the graph source file (eg gexf) with this related docs API:


```json
"data/yoursubdir": {
      "graphs": {
          "your.graph.gexf": {
              "node0": {
                        "name": "terms",
                        "reldbtype": "CortextDB",
                        "reldbfile": "yourDB.db",
                        "reldbqtable": "yourTableWithTerms"
                      },
              "node1": {
                        "name": "people",
                        "reldbtype": "CortextDB",
                        "reldbfile": "yourDB.db",
                        "reldbqtable": "yourTableWithSocialNodes"
                      },
          }
      }
},

"data/anothersubdir": {
      "graphs": {
          "another.graph.gexf": {
              "node0": {
                        "name": "terms",
                        "reldbtype": "csv",
                        "reldbfile": "aCsvByDocs.csv",
                        "reldbqcols": ["title", "text", "keywords"]
                      },
              "node1": {
                        "name": "people",
                        "reldbtype": "csv",
                        "reldbfile": "aCsvByDocs.csv",
                        "reldbqcols": ["authors", "editors"]
                      },
          }
      }
}

```

See more exemples and explanations in [servermenu_config.md](https://github.com/moma/ProjectExplorer/blob/master/00.DOCUMENTATION/A-Introduction/servermenu_config.md).
