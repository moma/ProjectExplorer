'use strict;'

var TW = {}

TW.conf = (function(TW){

  let TWConf = {}

  TWConf.branding = 'test bipart'        // <----- the name displayed in upper left


  // ==========================
  // TINA POSSIBLE DATA SOURCES
  // ==========================

  // the graph input depends on TWConf.sourcemode (or manual url arg 'sourcemode')
  TWConf.sourcemode = "api"   // accepted: "api" | "serverfile" | "servermenu" | "localfile"

  // server-side gexf default source
  TWConf.sourceFile = "data/politoscope/ProgrammeDesCandidats.enrichi.gexf"

  // or remote bridge to default source api ajax queries
  TWConf.sourceAPI={};
  TWConf.sourceAPI["forNormalQuery"] = "services/api/graph";
  TWConf.sourceAPI["forFilteredQuery"] = "services/api/graph";


  // ===========
  // DATA FACETS
  // ===========

  // to handle node attributes from data
  //    => clusters (discrete numeric or str vars),
  //    => colors   (continuous numeric vars)

  // for continuous attrvalues/colors (cf. clustersBy), how many levels in legend?
  TWConf.legendsBins = 7 ;

  // some specific attributes may have other number of levels
  TWConf.customLegendsBins = {
    'age': 8,
    'growth_rate': 12
  }


  // ===================
  // TINA ACTIVE MODULES
  // ===================
  TWConf.DivsFlags = {} ;
  // flag name is div class to be removed if false
  //        *and* subdirectory to import if true
  // see also ProcessDivsFlags()
  TWConf.DivsFlags["histogramModule"] = false ;
  TWConf.DivsFlags["histogramDailyVariantModule"] = false ;
  // TODO more generic module integrating the variants cf. experiments/histogramModule_STUB_GENERIQUE
  TWConf.DivsFlags["crowdsourcingModule"] = false ;

  TWConf.libspath = 'libs'    // FIXME path vars should not be used after page load !

  // =============
  // TINA BEHAVIOR
  // =============

  // Node typology
  TWConf.catSoc = "Document";
  TWConf.catSem = "NGram";

  // Events handling
  TWConf.deselectOnclickStage = true // will a click on the background remove selection ? (except when dragging)


  // debug flags & log levels
  TWConf.debug = {
    initialShowAll: false,           // show all nodes on bipartite case init (docs + terms in one view)

    // show verbose console logs...
    logFetchers: false,              // ...about ajax/fetching of graph data
    logParsers: false,               // ...about parsing said data
    logFacets: false,                // ...about parsing node attribute:value facets
    logSettings: false,              // ...about settings at Tina and Sigma init time
    logSelections: false
  }


  // Layouts
  // -------
  TWConf.fa2Available=true;        // show/hide fa2Button
  TWConf.disperseAvailable=true;   // show/hide disperseButton

  // if fa2Available, the auto-run config:

    TWConf.fa2Enabled= true;       // fa2 auto-run at start and after graph modified ?
    TWConf.fa2Milliseconds=5000;   // duration of auto-run
    TWConf.minNodesForAutoFA2 = 5  // graph size threshold to auto-run


  // Full-text search
  // ----------------
  TWConf.minLengthAutoComplete = 1;
  TWConf.maxSearchResults = 10;


  // SIGMA BEHAVIOR SETTINGS

  // SIGMA RENDERING SETTINGS
  // triggers overriding sigma.canvas renderers: nodes.def, labels.def, edges.def
  TWConf.ourRendering = true ;


  TWConf.sigmaJsDrawingProperties = {
      defaultLabelColor: 'black',
      defaultLabelSize: 30, // in fact usually overridden by node data...
      labelSizeRatio: 1,   // ...but this ratio allows truly adjusting the sizes

      labelThreshold: 5,   // <- replaces deprecated showLabelsIfZoom

      defaultEdgeType: 'curve',  // 'curve' or 'line'

      defaultBorderView: "always",

      // new sigma.js only for hover + new settingnames
      defaultHoverLabelBGColor: '#fff',
      defaultHoverLabelColor: '#000',
      borderSize: 2.5, // (only for hovered nodes)
      defaultNodeBorderColor: "black",
      nodeBorderColor: "default",  // vs. node

      // for custom TW node renderer with borders
      twNodeRendBorderSize: 1,   // (for all normal nodes, iff TWConf.nodeRendBorder)
      twNodeRendBorderColor: "#222",
      // twNodeRendBorderColor: "#eee",

      font: "Droid Sans",
      // font: "Crete Round",
      // font: "Ubuntu Condensed",
      fontStyle: "bold",
  };

  TWConf.sigmaJsGraphProperties = {
      minEdgeSize: 3,
      // maxEdgeSize: 10
  };

  TWConf.sigmaJsMouseProperties = {
      minRatio: .03125,  // 1/32  pour permettre zoom x32
      maxRatio: 2
  };


  // =======================
  // TINA RENDERING SETTINGS
  // =======================
  TWConf.overSampling = false    // costly hi-def rendering (true => pixelRatio x 2)

  TWConf.sizeMult = [];

  TWConf.sizeMult[0] = 1.0;    // ie for node type 0
  TWConf.sizeMult[1] = 1.0;    // ie for node type 1

  TWConf.circleSizeMin= 0;
  TWConf.circleSizeMax= 100;


  // ========
  // A RANGER £TODO
  // ========

  TWConf.nodeClusAtt = "modularity_class"


  TWConf.filterSliders = true

  TWConf.histogramStartThreshold = 10 ;

  TWConf.defaultNodeColor = "rgb(40,40,40)"
  TWConf.edgeDefaultOpacity = 0.4  // opacity when true_color
  TWConf.edgeGreyColor = "rgba(150, 150, 150, 0.5)";
  TWConf.nodesGreyBorderColor = "rgba(100, 100, 100, 0.5)";
  TWConf.selectedColor = "default"  // "node" for a background like the node's color,
                             // "default" for note-like yellow

  console.warn("current conf:", TWConf)

  return TWConf
})()



// INITIALIZED VARS (£TODO move to main or Tina)
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


TW.nodeslength = 0  // <=== £TODO harmonize use with TW.partialGraph.graph.nNodes()

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

var desirableTagCloudFont_MIN=12;
var desirableTagCloudFont_MAX=20;
var desirableNodeSizeMIN=1;
var desirableNodeSizeMAX=12;


// These variables will be updated in sigma.parseCustom.js
var minNodeSize
var maxNodeSize
