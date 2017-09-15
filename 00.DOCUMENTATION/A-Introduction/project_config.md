## Project Configuration

The directories under `data/` on the app's server are called *project directories* and should contain:
  - a graph file (ending in `.gexf` or `.json`)
  - a `project_conf.json` to declare
    - types of nodes in the input graph
    - optionally linked DBs of documents for each graph file
  - optionally the associated DBs of documents themselves

See for example `data/test/project_conf.json` in the project dir `test`.

Remarks:
  - The `localfile` input mode can **not** open project directories nor project-specific configurations (but the user can open a graph file and visualize it with default configuration)
  - ProjectExplorer also allows another conf file in the project directory for data attributes preprocessing settings. The file is called `legends.json` and has a  separate documentation under [data facets and legends](https://github.com/moma/ProjectExplorer/blob/master/00.DOCUMENTATION/C-advanced/data_facets_and_legends.md)).


------------------------------------------------------
#### Minimal Config

One minimal exemple of `project_conf.json` contains for each graph file of the project dir : a list of expected node types starting by 'node0' (**the nodetypes**)

```json
{
  "$$graph_source.gexf":{
    "node0": {"name": "$$a_typename_of_nodes"}
  },
  "$$another_graph_source.json":{
    "node0": {"name": "$$a_typename_of_nodes"}
  }
}
```
The value **typename_of_nodes** should match the `type` or `category` attribute value of your nodes in the source gexf or json. It acts as a filter specifying the nodes that will be displayed in the ProjectExplorer GUI.

##### For a bipartite graph
If the source file has 2 types of nodes, a minimal config should look like this:
```json
{
  "$$graph_source.ext":{
    "node0": {"name": "$$typename_of_term_nodes"},
    "node1": {"name": "$$typename_of_context_nodes"}
  }
}
```

NB: giving an empty string value to `node1.name` property will group all other found types in an "other" category.

Having a node0.name entry and optionally a node1.name is enough to display the graph.

###### Real life example
```json
{
  "graph_example.json": {
    "node0": { "name": "NGram" },
    "node1": { "name": "Document" }
  }
}
```

------------------------------------------------------
#### Activating relatedDocs LocalDB queries

The `project_conf.json` file also allows configuration of associated queries for selected node(s): **relatedDocs**

To enable it, you need to add to your node entry the `reldbs` key with minimally a db type :

```json
  "node0": {
    "name": "$$blabla",
    "reldbs": {
      "$$myType" : {}
    }
  }
```

The presence of this property "reldbs" makes the API usable in the interface.

##### More relatedDocs settings
In addition, for full configuration, the following entries can be set under node0 or node1.

###### => for a CSV doc-by-doc table
Expected type is `"csv"` and you should fill the columns to search in and the template to use to render hits
```json
"reldbs": {
  "csv" : {
    "file": "$$relpath/to/some.csv",
    "qcols": ["list", "of", "cols", "to", "search", "in", "for", "node0"],
    "delim": ";",
    "template": "bib_details"
  }
}
```
NB: the delim parameter is optional (tab is used by default)

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
{
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
```

In the exemple above, the results from the csv file `model_calibration.csv` will be styled in the interface **according to the `bib_details` template**.

The corresponding template must be called `bib_details.html` and placed under `data/your_project_dir/hit_templates`.

*Exemple template `bib_details.html`:*
```html
<li class="searchhit">
  <p>
    <b>$${tit}</b>
    by
   <span class="author">$${au}</span>
   ,
   <i>$${src}</i>
   [$${date}]
  </p>

  <p>
    <span class="hit-keywords">
     $${kws}
    </span>
    <span class="hit-text">
     $${txt}
    </span>
  </p>
</li>
```

Such a template is a custom html file representing an element `<li class="searchhit">`, and can use the columns as template variables like so: `$${colname}`.

An additional variable `${{score}}` is always available in the templating context.

--------------------------------------------------------------------------------

```json
{
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
```

In this last exemple, we have two nodetypes:
  - node0 allows both CSV and twitter relatedDocs tabs.
  - node1 allows only the CSV relatedDocs tab.
