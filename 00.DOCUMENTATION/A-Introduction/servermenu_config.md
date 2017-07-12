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

To enable it, you need to add to your node entry the `reldbs` key with minimally a db type :

```json
  "node0": {
    "name": "$$blabla",
    "reldbs": {
      "$$myType" : {}
    }
  }
```

The presence of this property "reldbs" makes the API usable in db.json.

##### More relatedDocs settings
In addition, for full configuration, the following entries can be set under node0 or node1.

###### => for a CSV doc-by-doc table
Expected type is `"csv"` and you should fill the columns to search in and the template to use to render hits
```json
"reldbs": {
  "csv" : {
    "file": "$$relpath/to/some.csv",
    "qcols": ["list", "of", "cols", "to", "search", "in", "for", "node0"],
    "template": "bib_details"
  }
}
```

###### => for a cortext sql base
Expected type is `"CortextDB"` and you should fill the tables to search in.
```json
"reldbs": {
  "CortextDB": {
    "file": "$$relpath/to/some.db",
    "qtable": "$$tableNameToSearchIn",
    "template": "cortext_with_link"
  }
}
```

###### => for twitter queries
Expected type is `"twitter"` and no additional conf is needed (POSS for the future: add twitter query context, ex: "Présidentielles 2017 AND (query)").
```json
"reldbs": {
  "twitter": {}
}
```

###### Real life examples
```json
"data/gargistex": {
  "graphs":{
    "model_calibration.gexf": {
      "node0": {
        "name": "terms",
        "reldbs": {
          "csv": {
            "file": "model_calibration.csv",
            "qcols": ["title"],
            "template": "bib_details"
          },
          "twitter": {}
        }
      }
    }
  }
},
"data/test": {
  "first" : "mini_for_csv.gexf",
  "graphs": {
    "mini_for_csv.gexf": {
      "node0": {
        "name": "terms",
        "reldbs": {
          "csv": {
            "file": "mini_for_csv.csv",
            "qcols": ["title","keywords","text"],
            "template": "bib_details"
          },
          "twitter": {}
        }
      },
      "node1": {
        "name": "authors",
        "reldbs": {
          "csv": {
            "file": "mini_for_csv.csv",
            "qcols": ["author"],
            "template": "bib_details"
          }
        }
      }
    }
  }
}
```

In the last exemple, we have two nodetypes:
  - node0 allows both CSV and twitter relatedDocs tabs.
  - node1 allows only the CSV relatedDocs tab.
