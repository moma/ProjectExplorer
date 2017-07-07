'use strict;'

var TW = {}

TW.conf = (function(TW){

  let TWConf = {}

  TWConf.branding = 'ProjectExplorer'  // <--- name displayed in upper left
  TWConf.brandingLink = 'https://github.com/moma/ProjectExplorer'   // <--- link to "home"


  // ==========================
  // TINA POSSIBLE DATA SOURCES
  // ==========================

  // Graph data source
  // -----------------
  // the graph input depends on TWConf.sourcemode (or manual url arg 'sourcemode')
  TWConf.sourcemode = "servermenu"   // accepted: "api" | "serverfile" | "servermenu" | "localfile"

  // ...or remote bridge to default source api ajax queries
  TWConf.sourceAPI={};
  TWConf.sourceAPI["forNormalQuery"] = "services/api/graph";
  TWConf.sourceAPI["forFilteredQuery"] = "services/api/graph";


  // Related documents (topPapers) data source
  // -----------------------------------------

  TWConf.getRelatedDocs = true
  TWConf.relatedDocsMax = 10

  TWConf.relatedDocsType = "LocalDB"      // accepted: "twitter" | "LocalDB"
                                          // POSSible: "elastic"

  TWConf.relatedDocsAPIS = {
    // routes by corresponding type
    "LocalDB": "twbackends/phpAPI",
    "twitter": "http://127.0.0.1:5000/twitter_search"
  }

  // fallback topPapers API if none found by type
  TWConf.relatedDocsAPI = "twbackends/phpAPI"

  // =======================
  // DATA FACETS AND LEGENDS
  // =======================
  // to process node attributes values from data
  //    => colors   (continuous numeric attributes)
  //    => clusters (discrete numeric or str attributes),

  // create facets ?
  TWConf.scanClusters = true

  // facetOptions: choose here the visual result of your node attributes
  // -------------------------------------------------------------------
  // 3 possible coloring functions
  //   - cluster   (contrasted colors for attributes describing *classes*)
  //   - gradient  (uniform map from a numeric attribute to red/yellow gradient)
  //   - heatmap   (from blue to red, centered on a white "neutral" color)
  // 3 possible binning modes
  //   - 'samerange':  constant intervals between each bin
  //   - 'samepop':    constant cardinality inside each class (~ quantiles)
  //   - 'off'  :       no binning (each distinct value will be a legend item)
  TWConf.facetOptions = {

    // attr title
    'age'             : {
                         'col': "gradient",       // coloring function
                         'binmode': 'samerange',  // binning mode
                         'n': 4,                  // custom number of bins
                         'menutransl': "Date initiale d'apparition du terme dans le corpus"
                      },
    'growth_rate'     : {
                        'col': "heatmap",
                        'binmode': 'samepop',
                        'n': 5,
                        'menutransl': 'Tendances et oubliés de la semaine'
                      },
    'PageRank'        : {
                         'col': "gradient",
                         'binmode': 'samerange',
                         'n': 6,
                         'menutransl': 'Importance dans le réseau, méthode Google',
                       },
   'Modularity Class' : { // <== exemple with no binning
                         'col': "cluster",
                         'binmode': 'off',
                         'menutransl': 'Groupes de voisins, méthode des classes de modularité'
                       },
   'Eigenvector Centrality':{
                         'col':"heatmap" ,
                         'binmode': 'samepop',
                         'n': 9,
                         'menutransl': 'Centralité par vecteurs propres'
                       },

    'numuniform'      : {'col': "heatmap",  'n': 7,  'binmode': 'samepop'  },
    'numpareto'       : {'col': "gradient", 'n': 5,  'binmode': 'samerange'},
    'intfewvalues'    : {'col': "cluster" , 'n': 4,  'binmode': 'samerange'},
    'period'          : {'col': "cluster" ,          'binmode': 'off'},
    'in-degree'       : {'col': "heatmap" , 'n': 3,  'binmode': 'samepop'  },
    'cluster_index'   : {'col': "cluster" ,          'binmode': 'off'},
    'cluster_label'   : {'col': "cluster" ,          'binmode': 'off'},
    'betweeness'      : {'col': "gradient", 'n': 4,  'binmode': 'samepop'  },
    'level'           : {'col': "heatmap" ,          'binmode': 'off'  },
    'weight'          : {'col': "heatmap" , 'n': 5,  'binmode': 'samerange'  },
    'Weighted Degree' : {'col': "heatmap", 'n': 8,  'binmode': 'samerange'  },
    'out-degree'      : {'col': "heatmap" , 'n': 3,  'binmode': 'samepop'  },
    'country'         : {'col': "cluster" ,          'binmode': 'off'},
    'ACR'             : {'col': "cluster" ,          'binmode': 'off'},
'cluster_universal_index': {'col': "cluster" ,         'binmode': 'off'      },
       'community_orphan' : {'col': "cluster" ,        'binmode': 'off'      }

  }

  // NB  other cases with no binning:
  //     - if data type is not numeric
  //     - if there is less than distinct values that facetOptions[attr][n]


  // NB for heatmapColoring:
  //     - you should prefer odd number of bins
  //     - if the number of bins is even, the 2 classes in the middle get white
  //     - the maximum number of bins is 24

  // other POSS option: display attribute value in label or not ?


  // when coloring method is "cluster", should the colors change each time ?
  TWConf.randomizeClusterColors = true

  // default clustering attribute (<---> used for initial node colors)
  TWConf.nodeClusAtt = "modularity_class"


  // for binning decision and nbins (fallbacks <=> if the attr is not in facetOptions)
  TWConf.maxDiscreteValues = 15
  TWConf.legendsBins = 7

  // to normalize node sizes (larger range does increase visual size difference)
  TWConf.desirableNodeSizeMin=1;
  TWConf.desirableNodeSizeMax=10;


  // =============
  // TINA BEHAVIOR
  // =============

  // Node typology: categories (resp. 0 and 1) will get these default labels
  TWConf.catSem = "NGram";
  TWConf.catSoc = "Document";
  // NB: these labels may be superseded by:
  //   - the input data's node types values cf. sortNodeTypes()
  //   - in servermenu mode, by the node0 & node1 properties

  // Modules path
  // ------------
  TWConf.paths = {
    'ourlibs': 'twlibs',
    'templates': "twlibs/hit_templates",
    'modules': 'twmodules',

    'sourceFile': "",           // server-side .gexf|.json default source
    'sourceMenu': "db.json"     // ...or server-side gexf default source list
  }
  Object.freeze(TWConf.paths)  // /!\ to prevent path modification before load

  // Active modules
  // --------------
  TWConf.ModulesFlags = {} ;
  // flag name is div class to be removed if false
  //        *and* subdirectory of modules path to import if true
  // see also activateModules()
  TWConf.ModulesFlags["histogramModule"] = false ;
  TWConf.ModulesFlags["histogramDailyVariantModule"] = false ;
  // TODO more generic module integrating the variants cf. experiments/histogramModule_STUB_GENERIQUE
  TWConf.ModulesFlags["crowdsourcingModule"] = true ;


  // Other GUI options
  // ------------------
  TWConf.sidePanelSize = "400px"       // width of the side panel (def: 400px)

  TWConf.filterSliders = true          // show sliders for nodes/edges subsets

  TWConf.colorByAtt = true;            // show "Set colors" menu

  TWConf.dragNodesAvailable = true;    // allow dragging nodes with CTRL+click

  TWConf.deselectOnclickStage = true   // click on background remove selection ?
                                       // (except when dragging)

  TWConf.histogramStartThreshold = 10 ;   // for daily histo module
                                          // (from how many docs are significant)


  // £TODO these exist only in git branches
  //       (geomap: ademe, timeline: tweetoscope)
  //       ==> ask if need to be restored
  // TW.geomap = false;
  // TW.twittertimeline = false;

  TWConf.maxPastStates = 5 ;      // number of TW.states to remember (~CTRL-Z)


  // Layout options
  // --------------
  TWConf.fa2Available=true;        // show/hide fa2Button
  TWConf.disperseAvailable=true;   // show/hide disperseButton

  // if fa2Available, the auto-run config:

    TWConf.fa2Enabled= true;        // fa2 auto-run at start and after graph modified ?
    TWConf.fa2Milliseconds=2000;    // duration of auto-run
    TWConf.minNodesForAutoFA2 = 5   // graph size threshold to auto-run


  // Full-text search
  // ----------------
  TWConf.maxSearchResults = 10            // how many "top papers" to display
  TWConf.minLengthAutoComplete = 1        // how many chars to type for autocomp
  TWConf.maxSuggestionsAutoComplete = 10  // how many suggestions by autocomp
  TWConf.strSearchBar = "Select topics"


  // ===================
  // RENDERING SETTINGS
  // ===================
  TWConf.twRendering = true ;     // false: use sigma "stock" rendering
                                  // true:  use our rendering customizations
                                  //        (nodes with borders,
                                  //         edges with curves,
                                  //         better labels, etc)

  TWConf.overSampling = true      // hi-def rendering (true => pixelRatio x 2)
                                  // (/!\ costly)

  // sigma rendering settings
  // ------------------------
  TWConf.sigmaJsDrawingProperties = {
      // nodes
      defaultNodeColor: "#ddd",
      twNodeRendBorderSize: 1,           // node borders (only iff ourRendering)
      twNodeRendBorderColor: "#222",

      // edges
      minEdgeSize: 2,                    // in fact used in tina as edge size
      defaultEdgeType: 'curve',          // 'curve' or 'line' (curve only iff ourRendering)
      twEdgeDefaultOpacity: 0.4,         // initial opacity added to src/tgt colors

      // labels
      font: "Droid Sans",                // font params
      fontStyle: "bold",
      defaultLabelColor: '#000',         // labels text color
      labelSizeRatio: 1,                 // label size in ratio of node size
      labelThreshold: 4,                 // min node cam size to start showing label
                                         // (old tina: showLabelsIfZoom)

      // hovered nodes
      defaultHoverLabelBGColor: '#fff',
      defaultHoverLabelColor: '#000',
      borderSize: 2.5,                   // for ex, bigger border when hover
      nodeBorderColor: "node",           // choices: 'default' color vs. node color
      defaultNodeBorderColor: "black",   // <- if nodeBorderColor = 'default'


      // selected nodes <=> special label
      twSelectedColor: "default",     // "node" for a label bg like the node color,
                                   // "default" for note-like yellow

      // not selected <=> (1-greyness)
      twNodesGreyOpacity: .7,                       // smaller value: more grey
      twBorderGreyColor: "rgba(100, 100, 100, 0.5)",
      twEdgeGreyColor: "rgba(100, 100, 100, 0.3)",
  };
  // NB: sigmaJsDrawingProperties are available as 'settings' in all renderers
  // cf. https://github.com/jacomyal/sigma.js/wiki/Settings#renderers-settings


  // tina environment rendering settings
  // -----------------------------------
  // mouse captor zoom limits
  TWConf.zoomMin = .015625         // for zoom IN   (ex: 1/64 to allow zoom x64)
  TWConf.zoomMax = 8               // for zoom OUT

  // circle selection cursor
  TWConf.circleSizeMin = 0;
  TWConf.circleSizeMax = 100;
  TWConf.moreLabelsUnderArea = true; // show 3x more labels under area (/!\ costly)

  // em size range for neighbor nodes "tagcloud"  (1 = "normal size")
  TWConf.tagcloudFontsizeMin = .8  ;
  TWConf.tagcloudFontsizeMax = 1.5 ;

  TWConf.tagcloudSameLimit = 50     // max displayed neighbors of the same type
  TWConf.tagcloudOpposLimit = 10    // max displayed neighbors of the opposite type

  // relative sizes (iff ChangeType == both nodetypes)
  TWConf.sizeMult = [];
  TWConf.sizeMult[0] = 1.0;      // ie for node type 0 (<=> sem)
  TWConf.sizeMult[1] = 10.0;     // ie for node type 1 (<=> soc)


  // ===========
  // DEBUG FLAGS
  // ===========
  TWConf.debug = {
    initialShowAll: false,           // show all nodes on bipartite case init (docs + terms in one view)

    // show verbose console logs...
    logFetchers: false,               // ...about ajax/fetching of graph data
    logParsers: false,               // ...about parsing said data
    logFacets: false,                // ...about parsing node attribute:value facets
    logSettings: false,              // ...about settings at Tina and Sigma init time
    logStates: false,                // ...about TW.states array
    logSelections: false
  }


  return TWConf
})()
