'use strict;'

var TW = {}

TW.conf = (function(TW){

  let TWConf = {}

  TWConf.branding = 'ProjectExplorer'   // <--- the name displayed in upper left


  // ==========================
  // TINA POSSIBLE DATA SOURCES
  // ==========================

  // Graph data source
  // -----------------
  // the graph input depends on TWConf.sourcemode (or manual url arg 'sourcemode')
  TWConf.sourcemode = "api"   // accepted: "api" | "serverfile" | "servermenu" | "localfile"

  // server-side .gexf|.json default source
  TWConf.sourceFile = "data/politoscope/ProgrammeDesCandidats.enrichi.gexf"

  // ...or server-side gexf default source list
  TWConf.sourceMenu = "db.json"

  // ...or remote bridge to default source api ajax queries
  TWConf.sourceAPI={};
  TWConf.sourceAPI["forNormalQuery"] = "services/api/graph";
  TWConf.sourceAPI["forFilteredQuery"] = "services/api/graph";


  // Related documents (topPapers) data source
  // -----------------------------------------

  TWConf.getRelatedDocs = true
  TWConf.relatedDocsAPI = "http://127.0.0.1:5000/twitter_search"


  // £TODO : allow to choose between twitter or elasticsearch topPapers (choic of post-process function in extras_explorer)
  // TWConf.relatedDocsType


  // =======================
  // DATA FACETS AND LEGENDS
  // =======================
  // to process node attributes values from data
  //    => colors   (continuous numeric attributes)
  //    => clusters (discrete numeric or str attributes),

  // create facets ?
  TWConf.scanClusters = true

  // for continuous attrvalues/colors (cf. clustersBy), how many levels in legend?
  TWConf.legendsBins = 7 ;

  // max discrete levels in facet legend (if attribute has more distinct values then binning)
  TWConf.maxDiscreteValues = 40

  // £TODO transform for new specifications
  // some specific attributes may have other number of levels
  TWConf.customLegendsBins = {
    'age': 8,
    'growth_rate': 12
  }

  // default clustering attribute (<---> used for initial node colors)
  TWConf.nodeClusAtt = "modularity_class"


  // =============
  // TINA BEHAVIOR
  // =============

  // Node typology (searched in nodes data, overridden if data has other types)

  // (FIXME cf. comment in sortNodeTypes and swActual functions
  //            about the limits of how these 2 values and
  //            TW.categories are used in older functions)
  TWConf.catSoc = "Document";
  TWConf.catSem = "NGram";

  // Active modules
  // --------------
  TWConf.ModulesFlags = {} ;
  // flag name is div class to be removed if false
  //        *and* subdirectory to import if true
  // see also activateModules()
  TWConf.ModulesFlags["histogramModule"] = false ;
  TWConf.ModulesFlags["histogramDailyVariantModule"] = false ;
  // TODO more generic module integrating the variants cf. experiments/histogramModule_STUB_GENERIQUE
  TWConf.ModulesFlags["crowdsourcingModule"] = true ;


  // Other optional functionalities
  // -----------------------------
  TWConf.filterSliders = true     // show sliders for nodes/edges subsets

  TWConf.colorsByAtt = false;     // show "Set colors" menu

  TWConf.deselectOnclickStage = true   // click on background remove selection ?
                                       // (except when dragging)

  TWConf.histogramStartThreshold = 10 ;   // for daily histo module
                                          // (from how many docs are significant)


  // £TODO these exist only in git branches
  //       (geomap: ademe, timeline: tweetoscope)
  //       ==> ask if need to be restored
  // TW.geomap = false;
  // TW.twittertimeline = false;

  // Layout options
  // --------------
  TWConf.fa2Available=true;        // show/hide fa2Button
  TWConf.disperseAvailable=true;   // show/hide disperseButton

  // if fa2Available, the auto-run config:

    TWConf.fa2Enabled= true;        // fa2 auto-run at start and after graph modified ?
    TWConf.fa2Milliseconds=5000;    // duration of auto-run
    TWConf.minNodesForAutoFA2 = 5   // graph size threshold to auto-run


  // Full-text search
  // ----------------
  TWConf.maxSearchResults = 10;           // how many "top papers" to display
  TWConf.minLengthAutoComplete = 1;       // how many chars to type for autocomp
  TWConf.strSearchBar = "Select topics";


  // ===================
  // RENDERING SETTINGS
  // ===================
  TWConf.twRendering = true ;     // false: use sigma "stock" rendering
                                  // true:  use our rendering customizations
                                  //        (nodes with borders,
                                  //         edges with curves,
                                  //         better labels, etc)

  TWConf.overSampling = true      // hi-def rendering (true => pixelRatio x 2)

  // sigma rendering settings
  // ------------------------
  TWConf.sigmaJsDrawingProperties = {
      // nodes
      defaultNodeColor: "#333",
      twNodeRendBorderSize: 1,           // node borders (only iff ourRendering)
      twNodeRendBorderColor: "#eee",

      // edges
      minEdgeSize: 2,                    // in fact used in tina as edge size
      defaultEdgeType: 'curve',          // 'curve' or 'line' (curve only iff ourRendering)
      twEdgeDefaultOpacity: 0.4,         // initial opacity added to src/tgt colors

      // labels
      font: "Droid Sans",                // font params
      fontStyle: "bold",
      defaultLabelColor: '#000',         // labels text color
      labelSizeRatio: 1,                 // initial label size (on the slider)
      labelThreshold: 5,                 // min node cam size to start showing label
                                         // (old tina: showLabelsIfZoom)

      // hovered nodes
      defaultHoverLabelBGColor: '#fff',
      defaultHoverLabelColor: '#000',
      borderSize: 2.5,                   // for ex, bigger border when hover
      nodeBorderColor: "node",           // choices: 'default' color vs. node color
      defaultNodeBorderColor: "black",   // <- if nodeBorderColor = 'default'


      // selected nodes <=> special label
      twSelectedColor: "node",     // "node" for a label bg like the node color,
                                   // "default" for note-like yellow

      // not selected <=> grey
      twNodesGreyOpacity: .35,                       // smaller value: more grey
      twBorderGreyColor: "rgba(100, 100, 100, 0.5)",
      twEdgeGreyColor: "rgba(150, 150, 150, 0.5)",
  };
  // NB: sigmaJsDrawingProperties are available as 'settings' in all renderers
  // cf. https://github.com/jacomyal/sigma.js/wiki/Settings#renderers-settings


  // tina environment rendering settings
  // -----------------------------------
  // mouse captor zoom limits
  TWConf.zoomMin = .015625         // for zoom IN   (ex: 1/64 to allow zoom x64)
  TWConf.zoomMax = 2               // for zoom OUT

  // circle selection cursor
  TWConf.circleSizeMin = 0;
  TWConf.circleSizeMax = 100;

  // size range for neighbor nodes "tagcloud"
  TWConf.tagcloudFontsizeMin = 12;
  TWConf.tagcloudFontsizeMax = 24;

  TWConf.tagcloudSameLimit = 50     // max displayed neighbors of the same type
  TWConf.tagcloudOpposLimit = 10    // max displayed neighbors of the opposite type

  // relative sizes (iff ChangeType == both nodetypes)
  TWConf.sizeMult = [];
  TWConf.sizeMult[0] = 1.5;    // ie for node type 0
  TWConf.sizeMult[1] = 1.0;    // ie for node type 1



  // ===========
  // DEBUG FLAGS
  // ===========
  TWConf.debug = {
    initialShowAll: false,           // show all nodes on bipartite case init (docs + terms in one view)

    // show verbose console logs...
    logFetchers: false,              // ...about ajax/fetching of graph data
    logParsers: false,               // ...about parsing said data
    logFacets: true,                // ...about parsing node attribute:value facets
    logSettings: false,              // ...about settings at Tina and Sigma init time
    logSelections: true
  }


  // £TODO: fix these 2 settings with a better dir structure
  //        + but avoid path injection
  //        + find a place for modules *INSIDE* tinawebJS dir for easier deployment
  TWConf.ModulesPath = ''
  TWConf.libspath = 'libs'


  return TWConf
})()



// INITIALIZED VARS
// ================
TW.Nodes = [];
TW.Edges = [];
TW.Relations = {}
TW.Clusters = [];  // A "by value" index, built in parseCustom, (aka facets)

TW.gexfPaths={};
TW.labels=[];

// FIXME should become TW.*
var selections = [];
var deselections={};
var opossites = {};
var opos=[];
var oposMAX;

var matches = [];

var nodes1 = {};
var nodes2 = {};
var bipartiteD2N = {};
var bipartiteN2D = {};

// possible node types and their inverted map
TW.categories = [];
TW.catDict = {};

var gexfFile;
//var zoom=0;
TW.checkBox=false;
TW.shiftKey=false;
TW.manuallyChecked = false;

TW.SystemState = {}
TW.SystemState.level = true;
TW.SystemState.type = [ true, false ] // usually overridden by initialActivetypes
TW.SystemState.selections = [];
TW.SystemState.opposites = [];


TW.colorList = ["#000000", "#FFFF00", "#1CE6FF", "#FF34FF", "#FF4A46", "#008941", "#006FA6", "#A30059", "#FFDBE5", "#7A4900", "#0000A6", "#63FFAC", "#B79762", "#004D43", "#8FB0FF", "#997D87", "#5A0007", "#809693", "#FEFFE6", "#1B4400", "#4FC601", "#3B5DFF", "#4A3B53", "#FF2F80", "#61615A", "#BA0900", "#6B7900", "#00C2A0", "#FFAA92", "#FF90C9", "#B903AA", "#D16100", "#DDEFFF", "#000035", "#7B4F4B", "#A1C299", "#300018", "#0AA6D8", "#013349", "#00846F", "#372101", "#FFB500", "#C2FFED", "#A079BF", "#CC0744", "#C0B9B2", "#C2FF99", "#001E09", "#00489C", "#6F0062", "#0CBD66", "#EEC3FF", "#456D75", "#B77B68", "#7A87A1", "#788D66", "#885578", "#FAD09F", "#FF8A9A", "#D157A0", "#BEC459", "#456648", "#0086ED", "#886F4C","#34362D", "#B4A8BD", "#00A6AA", "#452C2C", "#636375", "#A3C8C9", "#FF913F", "#938A81", "#575329", "#00FECF", "#B05B6F", "#8CD0FF", "#3B9700", "#04F757", "#C8A1A1", "#1E6E00", "#7900D7", "#A77500", "#6367A9", "#A05837", "#6B002C", "#772600", "#D790FF", "#9B9700", "#549E79", "#FFF69F", "#201625", "#72418F", "#BC23FF", "#99ADC0", "#3A2465", "#922329", "#5B4534", "#FDE8DC", "#404E55", "#0089A3", "#CB7E98", "#A4E804", "#324E72", "#6A3A4C", "#83AB58", "#001C1E", "#D1F7CE", "#004B28", "#C8D0F6", "#A3A489", "#806C66", "#222800", "#BF5650", "#E83000", "#66796D", "#DA007C", "#FF1A59", "#8ADBB4", "#1E0200", "#5B4E51", "#C895C5", "#320033", "#FF6832", "#66E1D3", "#CFCDAC", "#D0AC94", "#7ED379", "#012C58"];



var ParseCustom = function () {};
var SigmaUtils = function () {};
var TinaWebJS = function () {};



// £TODO à ranger
TW.circleSize= 0;
var lastFilter = []
    lastFilter["#slidercat0nodesweight"] = {"orig":"-" , "last":"-"}
    lastFilter["#slidercat1nodesweight"] =  {"orig":"-" , "last":"-"}
    lastFilter["#slidercat0edgesweight"] =  {"orig":"-" , "last":"-"}
    lastFilter["#slidercat1edgesweight"] =  {"orig":"-" , "last":"-"}

var desirableNodeSizeMIN=1;
var desirableNodeSizeMAX=12;


// These variables will be updated in sigma.parseCustom.js
var minNodeSize
var maxNodeSize
