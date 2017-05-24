This is a stub for a future documentation for developers.


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
   - clustering:     "`cluster_index`" ou nom figurant dans `TW.nodeClusAtt`
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
