## Project Configuration

The directories under `data/` are called project directories and should contain:
  - a graph file (ending in `.gexf` or `.json`)
  - a `project_conf.json` to declare nodetypes and optionally link DBs to each graph file.
  - optionally the said associated database of documents

See for example `data/test/project_conf.json` in the project dir `test`.

------------------------------------------------------
#### Minimal Config

One minimal entry contains for each graph file of the project dir : a list of expected node types starting by 'node0' (**the nodetypes**)

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



------------------------------------------------------
#### Configuring facets (node attributes) rendering

Your graph nodes may contain attributes (aka **data facets**) and project_conf can allow you to specify how to use them.

For instance let's assume a node in your gexf input file may contain something like this:
```xml
<node id="99262" label="entreprises">
  <attvalues>
    <attvalue for="modularity_class" value="3"/>
    <attvalue for="age" value="2012"/>
  </attvalues>
  <viz:size value="100.0"/>
  <viz:color r="0" g="173" b="38"/>
</node>
```
The input data here has two attributes: "age" and "modularity_class"

These attributes (attvalues) can be processed at input time to:
  - color the nodes in the interface
  - create a legend with close values grouped into [statistical bins](https://en.wikipedia.org/wiki/Data_binning) by defining intervals
  - replace the attribute name by a human-readable label in the legend and menus
  - find a title for each subgroups or class

This processing is default and will take place any way if the value `scanAttributes` is true in the global conf (`settings_explorerjs.js`).

But the project conf `project_conf.json` allows us to fine-tune this, by specifying `facets` properties in the node entry for a source in your project :

###### Exemple 1: gradient coloring and 4 bins
```
"facets": {
  "age" : {
    "legend": "Date d'entrée dans le corpus"  <== label used for legends
    "col": "gradient",                        <== coloring function
    "binmode": "samerange",                   <== binning mode
    "n": 4,                                   <== optional: number of bins
  }
}
```

Here, `age` is the name of the attribute in the original data.

For the `col` key, the available coloring functions are:
  - `cluster`: for attributes describing *classes* (class names or class numbers, contrasted colors)
  - `gradient`: for continuous variables (uniform map from light yellow to dark red)
  - `heatmap`: for continuous variables (from blue-green to red-brown, centered on a white "neutral" color)

Binning can build the intervals with 3 strategies (`binmode` key):
  - `samerange`: constant intervals between each bin (dividing the range into `n` equal intervals)
  - `samepop`: constant cardinality inside each class (~ quantiles: dividing the range into `n` intervals with equal population)
  - `off`: no binning (each value gets a different color)

###### Exemple 2: `cluster` coloring
```
"facets": {
  "Modularity Class" : {
    "legend": "Modules dans le graphe",
    "col": "cluster",
    "binmode": "off"                  <== no binning: values are kept intact
  }
}
```
Remarks:
  - Heatmap coloring maximum amount of bins is 24.
  - `legend` is optional
  - `n` is not needed if `binmode` is off.
  - Cluster coloring works best with no binning: each distinct value corresponds to a class and becomes a different color.

###### Real life example 1
```json
{
  "ProgrammeDesCandidats.gexf": {
    "node0": {
      "name": "term",
      "reldbs": {...},
      "facets": {
        "age" : {
          "legend": "Date d'entrée dans le corpus",
          "col": "gradient",
          "binmode": "samerange",
          "n": 4
        },
        "growth_rate" : {
          "legend": "Tendances et oubliés de la semaine",
          "col": "heatmap",
          "binmode": "samepop",
          "n": 11
        },
        "modularity_class" : {
          "legend": "Modules dans le graphe",
          "col": "cluster",
          "binmode": "off"
        }
      }
    }
  }
}
```

###### Real life example 2
```json
{
  "Maps_S_800.gexf": {
    "node0": {
      "name": "termsWhitelist",
      "reldbs": {...},
      "facets":{
        "level": {"col": "heatmap" ,                  "binmode": "off"        },
        "weight": {"col": "heatmap" ,        "n": 5,  "binmode": "samerange"  },
        "period": {"col": "cluster" ,                 "binmode": "off"        },
        "in-degree":  {"col": "heatmap" ,    "n": 3,  "binmode": "samepop"    },
        "out-degree": {"col": "heatmap" ,    "n": 3,  "binmode": "samepop"    },
        "betweeness": {"col": "gradient",    "n": 4,  "binmode": "samepop"    },
        "cluster_label": {"col": "cluster" ,          "binmode": "off"        },
        "community_orphan":{"col": "cluster" ,        "binmode": "off"  },
        "cluster_universal_index": {"col": "cluster" ,"binmode": "off"  },
      }
    }
  }
}
```

NB: If an attribute is **not** described in `facets` and `TW.conf.scanAttributes` is true, the attribute will get `"gradient"` coloration by default and the distinct attributes values will be counted:
  - if there is few of them (less than 15), they won't be binned
  - if there is many distinct values, they will be binned into 7 intervals

The corresponding global conf keys to this default behavior are `TWConf.legendBins` and `TWConf.maxDiscreteValues` in `settings_explorerjs.js`

For more information, see the [developer's manual](https://github.com/moma/ProjectExplorer/blob/master/00.DOCUMENTATION/C-advanced/developer_manual.md#exposed-facets-indices)
