This is a stub for a future documentation for developers.


## Graph input choices

Tina allows 3 main ways of input :
  - a local file from the client machine  
      activated by `sourcemode=localfile` or by opening the entry point explorerjs.html via file protocol (<=> locally)  
  - a static file from the remote server  
    `sourcemode=serverfile`
  - a dataset from a remote server API  
    `sourcemode=api`

The `sourcemode` value is by default the one in settings_explorerjs.js (`TW.conf.sourcemode`), unless an url argument of the same name is present.

The `serverfile` option has an extended version called `servermenu`. It opens a list of files called `db.json` on the server, providing a menu to choose from it.

The detailed implementation of these choices can be found in the function `syncRemoteGraphData()` in main.js.

## Graph initialization

This will still evolve but the main steps for any graph initialization messily use functions across several modules, so it can be useful to list them here together:

 1. [`main.js`] initializes the TinaWebJS object and runs its init which registers our rendering function to sigma module
 2. [`main.js`] makes the initial choice of data source from URL protocol (local or remote) and URL params (when remote)
     - then read a source via fileinput (when local) or ajax GET (when remote)
 3. [`sigma.parseCustom.js`] prepares the data
     - *"scan"*: loop once to list present node categories
     - *"dictify"*: loop again to copy all nodes/edges information
     - prepares TW.Relations: edges sorted by type (term-term, term-doc...)
     - prepares TW.Clusters: bins and facet index (node attr vals => nodes)
 4. [`main.js`] mainStartGraph() function runs all the rest
    1. precomputes display properties (grey color, etc.)
    2. calls [`sigmaUtils`] where the function `FillGraph()` was a central point for filtering and preparing properties but now with 2 and 3 it just copies the nodes and edges to a new structure that groups them together
    3. back in [`main.js`], finally all sigma settings (user + defaults) are merged and we initialize the sigma instance (`new sigma` etc.)
    4. finally a call to [`TinawebJS`] initializes the action listeners and this phase should crucially initialize items that need the sigma instance (because they may depend the displayed categories, the number of displayed nodes, etc)


#### About source data
 - doc/sem typing: follows the node property "`type`" or if absent, "`category`"
   - if the category name is "document"  => catSoc (type 0)
   - if the category name contains the str "term"  => catSem (type 1)

 - `somenode.attributes`: the `attributes` property is always an object
   - any attribute listed in the sourcenode.attributes will be indexed if the TW.scanClusters flag is true
   - the mapping from attribute values to matching nodes is in TW.Clusters.aType.anAttr.aValue.map
   - coloration:     "`age`" "`growth_rate`" + any attribute of type float or int
   - clustering:     "`cluster_index`" ou nom figurant dans `TW.conf.nodeClusAtt`
   - vocabulary: (en cours) any attribute of type string and where the amount of distinct values is < TW.somesettings


## User interaction mecanisms

#### Bindings
  - selection is bound to sigma click events (cf. [Sigma JS Events API](https://github.com/jacomyal/sigma.js/wiki/Events-API))
  - most event listeners are created in Tinaweb.initListeners(), called by main.js


#### Selection mecanisms
Rich selection possibilities is one of the main features added by TinaWebJS to the basic sigma capabilities.

They are handled in Tinaweb.MultipleSelection2.

###### module flags and events
  - for a new selection:
    - `TW.selectionActive` is set to `true` when there is a selection
    - `tw:gotNodeSet` event is sent
  - when deselecting
    - `tw:eraseNodeSet` event is sent
    - the function `cancelSelection()` is called

###### node flags
For any node `n` the relevant flags at selection are:
  - `n.active` iff node is selected
  - `n.customAttrs.highlight` if  node is a neighbor of a selected node


## Variae

#### Facets: node attributes as colors/clusters

At parsing time, every node attributes are indexed by values.

This indexes are stored in TW.Clusters and provide an access to sets of nodes that have a given value or range of values.
  - if discrete attrvalues with <= 30 classes (colorsBy, clustersBy), the storage structure is: `TW.Clusters[nodeType][clusterType].classes.[possibleValue]`
     (the content is a list of ids with the value `possibleValue`)
  - if continuous or many possible values (>30) (clustersBy, colorsRelByBins), the storage uses ordered ranges ("bins"):
     `TW.Clusters[nodeType][clusterType].ranges.[interval]`
