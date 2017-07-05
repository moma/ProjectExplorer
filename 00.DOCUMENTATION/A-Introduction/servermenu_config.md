## Servermenu Configuration

The servermenu file associates some metadata to each graph file.

It is used if `sourcemode="servermenu"` is found in the url params or the settings file.

By default, the file is called `./db.json` (this can be modified in settings under `TW.conf.paths.sourceMenu`)

The `db.json` file of this distribution contains many examples.

------------------------------------------------------
#### Minimal Config

One minimal servermenu entry contains:
  - a data dir path (**the project**)
  - for each project: a list of graph files subpaths (**the graph source**)
  - for each graph file: a list of expected node types starting by 'node0' (**the nodetypes**)

```json
  "$$data/yourprojectdir": {
    "graphs": {
      "$$graph_source.gexf":{
        "node0": {"name": "$$a_typename_of_nodes"}
      },
      "$$another_graph_source.json":{
        "node0": {"name": "$$a_typename_of_nodes"}
      }
    }
  }
```
The value **typename_of_nodes** should match the `type` or `category` attribute value of your nodes in the source gexf or json. It acts as a filter specifying the nodes that will be displayed in the ProjectExplorer GUI.

##### For a bipartite graph
If the source file has 2 types of nodes, the config should look like this:
```json
  "$$data/yourprojectdir": {
    "graphs": {
      "$$source_file.ext":{
        "node0": {"name": "$$typename_of_term_nodes"},
        "node1": {"name": "$$typename_of_context_nodes"}
      }
    }
  }
```

NB: giving an empty string value to `node1.name` property will group all other found types in an "other" category.

Having a node0.name entry and optionally a node1.name is enough to display the graph.

###### Real life example
```json
"data/comexjsons": {
  "graphs": {
    "graph_example.json": {
      "node0": { "name": "NGram" },
      "node1": { "name": "Document" }
    }
  }
}
```

------------------------------------------------------
#### Activating relatedDocs LocalDB queries

The servermenu file also allows configuration of associated queries for selected node(s): **relatedDocs**

To enable it, you need to add to your node entry the `reldbfile` key:

```json
  "node0": {
    "name": "$$blabla",
    "reldbfile": "$$relpath/to/csv/or/sqlite"
  }
```

The presence of this property `reldbfile` makes the API usable in db.json.

##### More relatedDocs settings
In addition, for full configuration, the following entries can be set under node0 or node1.

###### => for a CSV doc-by-doc table
Expected type is `"csv"` and you should fill the columns to search in.
```json
"reldbtype": "csv",
"reldbqcols": ["list", "of", "columns", "to", "search", "in", "for", "node0"]
```

###### Real life example
```json
"data/gargistex": {
    "first": "shale_and_ice.gexf",
    "graphs": {
      "shale_and_ice.gexf": {
        "node0": {
          "name": "terms",
          "reldbtype": "csv",
          "reldbfile": "shale_and_ice.csv",
          "reldbqcols": ["title", "abstract"]
        }
      },
      "model_calibration.gexf": {
        "node0": {
          "name": "terms",
          "reldbtype": "csv",
          "reldbfile": "model_calibration.csv",
          "reldbqcols": ["title", "abstract"]
        }
      }
    }
}
```

###### => for CortextDB SQL tables
Expected type is `"CortextDB"` and you should fill the table to search in.
```json
"reldbtype": "CortextDB",
"reldbqtable": []
```
