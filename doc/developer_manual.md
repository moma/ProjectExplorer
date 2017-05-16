This is a stub for a future documentation for developers.


## Graph initialization

The main steps for any graph initialization messily use functions across several modules, so it can be useful to list them here together:

 1. [`main.js`] initial choice of data source from URL params or settings
 2. [`sigma.parseCustom.js`] prepares the data
     - read a source via ajax GET
     - *"scan"*: loop once to list present node categories
     - *"dictify"*: loop again to copy all nodes/edges information
     - prepares TW.Relations: edges sorted by type (term-term, term-doc...)
     - prepares TW.Clusters: bins and facet index (node attr vals => nodes)
 3. [`main.js`] precomputes display properties (grey color, etc.)
 4. [`sigmaUtils`] the function `FillGraph()` was a central point for filtering and preparing properties but now with 2 and 3 it just copies the nodes and edges to a new structure that groups them together
 5. [`main.js`] Finally all sigma settings (user + defaults) are merged and we initialize the sigma instance (`new sigma` etc.)


#### About source data
 - doc/sem typing: follows the node property "`category`"
   - if the category name is "document"  => catSoc (type 0)
   - if the category name contains the str "term"  => catSem (type 1)
 - coloration:     "`age`" "`growth_rate`" + any attribute of type float or int
 - clustering:     "`cluster_index`" ou nom figurant dans `TW.nodeClusAtt`

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
