This is a stub for a future documentation for developers.

#### About settings
  - system-wide settings are in `settings_explorerjs.js`
  - source-by-source settings (nodetypes, relatedDocs APIs) are in each project dir under `data/${projectname}/project_conf.json`

## Graph input choices

Tina allows 3 main ways of input :
  - a local file from the client machine  
      activated by `sourcemode=localfile` or by opening the entry point explorerjs.html via file protocol (<=> locally)  
  - a static file from the remote server  
    `sourcemode=serverfile`
  - a dataset from a remote server API  
    `sourcemode=api`

The `sourcemode` value is by default the one in settings_explorerjs.js (`TW.conf.sourcemode`), unless an url argument of the same name is present.

The `serverfile` option has an extended version called `servermenu`. It opens the list of files from `server_menu.json` on the server, providing a menu to choose from it.

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
     - prepares TW.Facets: bins and facet index (node attr vals => nodes)
 4. [`main.js`] mainStartGraph() function runs all the rest
    1. precomputes display properties (grey color, etc.)
    2. calls [`sigmaUtils`] where the function `FillGraph()` was a central point for filtering and preparing properties but now with 2 and 3 it just creates a filtered copy of the nodes and edges of the current active types to a new structure that groups them together (POSSIBLE remove this extra step)
    3. back in [`main.js`], finally all sigma settings (user + defaults) are merged and we initialize the sigma instance (`new sigma` etc.)  
       at this point, any additional conf located in db.json is used for nodeTypes and relatedDocsTypes
    4. finally a call to [`TinawebJS`] initializes the action listeners and this phase should crucially initialize items that need the sigma instance (because they may depend the displayed categories, the number of displayed nodes, etc)


#### About source data
 - doc/sem typing: follows the node property "`type`" or if absent, "`category`"
   - if the category name contains the str "term"  => catSem (type 0)
   - if the category name is "document"  => catSoc (type 1)

 - `somenode.attributes`: the `attributes` property is always an object
   - any attribute listed in the sourcenode.attributes will be indexed if the TW.scanAttributes flag is true
   - data type and style of processing (for heatmap, or for classes, etc.) should be stipulated in settings (cf. **data facets** below)


## User interaction mecanisms

#### Bindings
  - selection is bound to sigma click events (cf. [Sigma JS Events API](https://github.com/jacomyal/sigma.js/wiki/Events-API))
  - most event listeners are created in Tinaweb.initListeners(), called by main.js


#### Selection mecanisms
Rich selection possibilities is one of the main features added by TinaWebJS to the basic sigma capabilities.

They are handled in Tinaweb.MultipleSelection2.

###### module flags and events
  - for a new selection:
    - `TW.gui.selectionActive` is set to `true` when there is a selection
    - `tw:gotNodeSet` event is sent
  - when deselecting
    - `tw:eraseNodeSet` event is sent
    - the function `cancelSelection()` is called

###### node flags
For any node `n` the relevant flags at selection are:
  - `n.active` iff node is selected
  - `n.customAttrs.highlight` if  node is a neighbor of a selected node

###### system states
At any given time, we keep the current state accesible via `TW.SystemState()`
  - it uses a `TW.states` array to remember the last k steps
  - the value of k can be set in `TW.conf.maxPastStates` variable
  - each state contains info about:
    - the current selection in state`.selectionNids`
    - the current neighborhood in state`.selectionRels`
    - the current node types displayed in state`.activetypes`
    - the current display level (aka macro/micro) in state`.level`

## Variae

#### Facets: node attributes as colors/clusters

At parsing time, every node attributes are indexed by values (allows to highlight them from legend, other uses are possible).

The values can be binned or not and can be linked to different color schemes:
 - we can associate 3 types of coloration
   - `"gradient"` coloration
     - available for any attribute that looks like a continuous metric
   - `"heatmap"` coloration
     - colors from cold to hot centered on a white "neutral" color
     - applied for attributes stipulated in settings: eg "`growth_rate`"
   - `"cluster"` coloration for str or num classes like modularity_class, affiliation, etc.
     - we use contrasted values from colorList
     - automatically applied for "`cluster_index`" or any name in `TW.conf.nodeClusAtt`

 - and also 3 possible binning modes:
   - 'samerange':  constant intervals between each bin
   - 'samepop':    constant cardinality inside each class (~ quantiles)
   - 'off'  :       no binning (each distinct value will be a legend item)

These choices can be specified in each project_conf.json under the `facets` entry.

If an attribute is **not** described in `project_conf.json`, it will get `"gradient"` coloration and will be binned iff it has more disctinct values than `maxDiscreteValues`, into `legendBins` intervals.

The allowed coloring functions are declared in TW.gui.colorFuns in `environment.js`.

#### Exposed facets indices
A faceted index is an index "value of an attribute" => nodes having this value.

These indexes are stored in the exposed `TW.Facets` variable by parseCustom time and provide an access to sets of nodes that have a given value or range of values
  - the mapping from attribute values to matching nodes is always in `TW.Facets.aType.anAttr.invIdx.aClass.nids`
    (where aClass is the chosen interval or distinct value)
  - the datatype of the observed values is in `TW.Facets.aType.anAttr.meta`
    - the source datatype is always string in gexf, but real type ("vtype") can be numeric
    - (ie numeric cast doesn't give NaN or it do so very rarely over the values)

NB: the use cases for stats go beyond numeric vs string ! we could easily autodiagnose in facetsBinning between :
    - vnum with many distinct values => assumed continuous metric (useful for gradient or titling)
    - vnum with few  distinct values => assumed classes var
    - vstr with few  distinct values => assumed classes var
    - vstr with many distinct values => assumed classes with zipf freq => create an "others" for the tail


#### Custom indices
Tina initialization registers one custom index of nodes by type and size (`nodesByTypeNSize`). It's a "live index" as it is updated at each add/remove.
  NB: it will thus contain only the nodes currently in the sigma instance.
Access usage exemples:
  - `TW.partialGraph.graph.getNodesByType(0)`: all nodes among nodes0 set
  - `TW.partialGraph.graph.getNodesBySize(0, 1)`:  all nodes0 of size 1
  - `TW.partialGraph.graph.getNodesBySize(0, [1,2])`: all nodes0 of size comprised between 1 and 2

(cf. [`addIndex` in sigma documentation](https://github.com/jacomyal/sigma.js/wiki/Graph-API#static-methods))
