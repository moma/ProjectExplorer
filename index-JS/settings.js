var iterationsFA2=50;
var fa2enabled=true;

var inactiveColor = '#666';
var startingNodeId = "1";
var minLengthAutoComplete = 1;
var maxSearchResults = 10;
var strSearchBar = "Search";


var gexf;
//var zoom=0;
var cursor_size= 20.00;

var checkBox=false;
var overNodes=false;

var swclickActual="";
var swclickPrev="";

var socsemFlag=false;
var constantNGramFilter;

var desirableTagCloudFont_MIN=12;
var desirableTagCloudFont_MAX=20;
var desirableNodeSizeMIN=2;
var desirableNodeSizeMAX=9;
var desirableScholarSize=6; //Remember that all scholars have the same size!

var overviewWidth = 200;
var overviewHeight = 175;
var overviewScale = 0.25;
var overviewHover=false;
var moveDelay = 80, zoomDelay = 2;
//var Vecindad;
var partialGraph; 
var Nodes = []; 
var Edges = [];

var nodeslength=0;

var labels = [];   

var numberOfDocs=0;
var numberOfNGrams=0;
var semanticConverged=0;
var socialConverged=0;

var selections = [];
var opossites = {};
var opos=[];
var oposMAX;

var matches = [];

var nodes1 = [];
var nodes2 = [];
var bipartiteD2N = [];
var bipartiteN2D = [];

var flag=0;
var firstime=0;
var leftright=true;
var edgesTF=false;
var mapDrag=false;

//This variables will be updated in sigma.parseCustom.js
var minNodeSize=5.00;
var maxNodeSize=5.00;
var minEdgeWeight=5.0;
var maxEdgeWeight=0.0;
//---------------------------------------------------

var sigmaJsDrawingProperties = {
    defaultLabelColor: 'black',
    defaultLabelSize: 12,//in fact I'm using it as minLabelSize'
    defaultLabelBGColor: '#fff',
    defaultLabelHoverColor: '#000',
    labelThreshold: 6,
    defaultEdgeType: 'curve',
    
    borderSize: 2.5,//Something other than 0
    nodeBorderColor: "default",//exactly like this
    defaultNodeBorderColor: "black"//,//Any color of your choice
    //defaultBorderView: "always"
};
var sigmaJsGraphProperties = {
    minEdgeSize: 2,
    maxEdgeSize: 2
};
var sigmaJsMouseProperties = {
    minRatio:0.1,
    maxRatio: 100
};

var bridge={};
external="";
//external="http://tina.iscpif.fr/explorerjs/";//Just if you want to use the server-apps from tina.server
bridge["forFilteredQuery"] = external+"php/bridgeClientServer_filter.php";
bridge["forNormalQuery"] = external+"php/bridgeClientServer.php";

var opts = {
  lines: 13, // The number of lines to draw
  length: 20, // The length of each line
  width: 10, // The line thickness
  radius: 30, // The radius of the inner circle
  corners: 1, // Corner roundness (0..1)
  rotate: 0, // The rotation offset
  direction: 1, // 1: clockwise, -1: counterclockwise
  color: '#000', // #rgb or #rrggbb or array of colors
  speed: 1, // Rounds per second
  trail: 60, // Afterglow percentage
  shadow: false, // Whether to render a shadow
  hwaccel: false, // Whether to use hardware acceleration
  className: 'spinner', // The CSS class to assign to the spinner
  zIndex: 2e9, // The z-index (defaults to 2000000000)
  top: 'auto', // Top position relative to parent in px
  left: 'auto' // Left position relative to parent in px
};
