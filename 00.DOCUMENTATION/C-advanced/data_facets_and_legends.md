#### Configuring legends and facets (node attributes rendering)

Your graph nodes may contain attributes (aka **data facets**). By default, they will be colored using a gradient from light yellow to dark red.

**You can specify additional preprocessing, legends and coloring in your project directory by creating a `legends.json` configuration file under your project directory.**

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

But you can also create an additional conf file under `/data/yourproject/legends.json` to fine-tune the coloring and legends.

###### Exemple 1: gradient coloring and 4 bins
```
"age" : {
  "legend": "Date d'entrée dans le corpus",  <== label used for legends
  "col": "gradient",                         <== coloring function
  "binmode": "samerange",                    <== binning mode
  "n": 4                                     <== optional: number of bins
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
"modularity_class" : {
  "legend": "Modules dans le graphe",
  "col": "cluster",
  "binmode": "off"                  <== no binning: values are kept intact
}
```
Remarks:
  - `legend` and `n` are optional
  - `n` is not needed if `binmode` is off
  -  if `binmode` is not off, the default value for `n` is 7
  - `cluster` coloring works best with no binning: each distinct value corresponds to a class and becomes a different color.
  - `heatmap` coloring maximum amount of bins is 24.
  - `gradient` coloring supports an additional attribute `setsize` (boolean) to decide if the attribute value should modify the node size (it is considered false if absent)
  - to return to normal colors and size, choose "By Default" in the interface's "Set Color" menu)


-----------------------------------------------------

###### Real life example 1
```json
{
  "age" : {
    "legend": "Date d'entrée dans le corpus",
    "col": "gradient",
    "binmode": "samerange",
    "n": 4,
    "setsize": true
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
```

###### Real life example 2
```json
{
  "level": {"col": "heatmap" ,                  "binmode": "off"        },
  "weight": {"col": "heatmap" ,        "n": 5,  "binmode": "samerange"  },
  "period": {"col": "cluster" ,                 "binmode": "off"        },
  "in-degree":  {"col": "heatmap" ,    "n": 11, "binmode": "samepop"    },
  "out-degree": {"col": "heatmap" ,    "n": 11, "binmode": "samepop"    },
  "betweeness": {"col": "gradient",    "n": 4,  "binmode": "samepop"    },
  "cluster_label": {"col": "cluster" ,          "binmode": "off"        },
  "community_orphan":{"col": "cluster" ,        "binmode": "off"        },
  "cluster_universal_index": {"col": "cluster" ,"binmode": "off"        }
}
```

NB: If an attribute is **not** described in `legends.json` and `TW.conf.scanAttributes` is true, the attribute will get `"gradient"` coloration by default and the distinct attributes values will be counted:
  - if there is few of them (less than 15), they won't be binned
  - if there is many distinct values, they will be binned into 7 intervals

The corresponding global conf keys to this default behavior are `TWConf.legendBins` and `TWConf.maxDiscreteValues` in `settings_explorerjs.js`

For more information, see the [developer's manual](https://github.com/moma/ProjectExplorer/blob/master/00.DOCUMENTATION/C-advanced/developer_manual.md#exposed-facets-indices)
