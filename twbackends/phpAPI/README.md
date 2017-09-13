
## Related Documents PHP backend

##### Provides an API for "topPapers" search queries in ProjectExplorer

These php files provide access to a CSV or sqlite database as an ajax endpoint for a "related documents" search in ProjectExplorer client.

It means that the selection of a node (or a set of nodes) in the ProjectExplorer interface can trigger a simple search-engine query for documents containing the names of these nodes in the said CSV or sqlite DBs.

Main use case is support for one-doc-by-row CSV files showing, for instance, scientific articles, that will be displayed as "topPapers" for selected nodes in the interface.


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
  - both should reside in `data/yoursubdir` where "yoursubdir" is the name of your project
  - the appropriate source database information needs to appear in a file named `project_conf.json` in the same directory `data/yoursubdir`, in order to associate the nodes from the graph source file (eg gexf) with this related docs API:

For instance for a cortextDB associated with a graph with two types of nodes:
```json
{
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
        }
    }
}
```

Or for a csv example and a graph with one type of nodes:
```json
{
  "another.graph.gexf": {
      "node0": {
          "name": "terms",
          "reldbtype": "csv",
          "reldbfile": "yourCsvFile.csv",
          "reldbqcols": ["title", "text", "keywords"]
      }
  }
}

```

See more exemples and explanations in [project_config.md](https://github.com/moma/ProjectExplorer/blob/master/00.DOCUMENTATION/A-Introduction/project_config.md).
