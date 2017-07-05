## Servermenu Configuration


#### minimal config
```json
  "$$data/yourprojectdir": {
    "graphs": {
      "$$something.gexf":{
        "node0": {"name": "$$blabla"}
      }
    }
  }
```



#### to activate relatedDocs LocalDB queries

For a relatedDocs query, you need to add to your node entry the `reldbfile` key:


```json
  "node0": {
    "name": "$$blabla",
    "reldbfile": "$$relpath/to/csv/or/sqlite"
  }
```
