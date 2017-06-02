'use strict';

//  ======= [ main TW properties initialization ] ======== //

TW.Nodes = [];
TW.Edges = [];
TW.Relations = {}       // edges sorted by source/target type
TW.Clusters = [];       // "by value" facet index built in parseCustom

TW.partialGraph = null  // will contain the sigma visible graph instance

TW.labels=[];           // fulltext search list
TW.gexfPaths={};        // for file selectors iff servermenu

TW.categories = [];     // possible node types and their inverted map
TW.catDict = {};

// SystemState is a summary of current situation
TW.SystemState = {}
TW.SystemState.level = true;
TW.SystemState.activetypes = [] // will be filled from TW.categories
TW.SystemState.selections = [];
TW.SystemState.opposites = [];
TW.SystemState.LouvainFait = false;

// states[] is an array of SystemStates for future CTRL+Z or usage track
TW.states = []
TW.states[0] = false;
TW.states[1] = TW.SystemState


// £TODO should become TW.* or TW.SystemState.*
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


//  ======== [   what to do at start ] ========= //
console.log("Starting TWJS")

// NB this method-holding instance could be initialized just once or even removed?
var sigma_utils = new SigmaUtils();

// POSS: ideally this should take a TW.conf as parameter
TW.instance = new TinaWebJS('#sigma-contnr');

// add once our tw rendering and index customizations into sigma module
TW.instance.init()

// init the button, sliders and search handlers, also only once
TW.instance.initGUIListeners();
TW.instance.initSearchListeners();

// show the custom name of the app
writeBrand(TW.conf.branding)


// choosing the input
// -------------------
// if page is being run locally ==> only possible source shall be via file input
if (window.location.protocol == 'file:'
    || (!isUndef(getUrlParam.sourcemode) && getUrlParam.sourcemode == 'localfile')) {

  let inputDiv = document.getElementById('localInput')
  inputDiv.style.display = 'block'

  if (window.location.protocol == 'file:') {
    var remark = document.createElement("p")
    remark.innerHTML = `You're running project explorer as a local html file (no syncing).`
    remark.classList.add('comment')
    remark.classList.add('centered')
    inputDiv.appendChild(remark)
  }

  // user can open a gexf or json from his fs
  var graphFileInput = createFilechooserEl()
  inputDiv.appendChild(graphFileInput)
}
// traditional cases: remote read from API or prepared server-side file
else {
  // NB it will use global urlParams and TW.settings to choose the source
  var [inFormat, inData, mapLabel] = syncRemoteGraphData()
  mainStartGraph(inFormat, inData, TW.instance)
  writeLabel(mapLabel)
}

//  === [ / what to do at start ] === //




function syncRemoteGraphData () {
  var inFormat;            // = { db|api.json , somefile.json|gexf }
  var inData;              // = {nodes: [....], edges: [....], cats:...}

  var mapLabel;            // user displayed label for this input dataset

  // type of input
  let sourcemode = isUndef(getUrlParam.sourcemode)?TW.sourcemode:getUrlParam.sourcemode

  // case (1) read from remote DB via API bridge fetching
  // ex: /services/api/graph?q=filters...
  if (sourcemode == "api") {
    console.log("input case: api, using TW.conf.sourceAPI")

    // the only API format, cf. inData
    inFormat = 'json'

    // TODO-rename: s/nodeidparam/srcparams
    var sourceinfo = getUrlParam.nodeidparam
    var qtype = getUrlParam.type
    if(isUndef(sourceinfo) || isUndef(qtype)) {
        console.warn("missing nodes filter/id param to transmit to source api");
    }
    else {
        console.log("Received query of type:", qtype)
        if(qtype == "filter" || qtype == "uid"){
          var theurl,thedata

          // console.warn("===> PASSING ON QUERY (type "+qtype+") TO BRIDGE <===")
          if (qtype=="uid") {
              // pr("bring the noise, case: unique_id");
              // pr(getClientTime()+" : DataExt Ini");
              // < === DATA EXTRACTION === >
              theurl = TW.conf.sourceAPI["forNormalQuery"]

              // NB before also passed it for Fa2 iterations (useless?)
              thedata = "qtype=uid&unique_id="+sourceinfo;
              mapLabel = "unique scholar";
          }

          if (qtype=="filter") {
              // pr("bring the noise, case: multipleQuery");
              // pr(getClientTime()+" : DataExt Ini");
              theurl = TW.conf.sourceAPI["forFilteredQuery"];

              // json is twice URI encoded by whoswho to avoid both '"' and '%22'
              var json_constraints = decodeURIComponent(sourceinfo)

              // console.log("multipleQuery RECEIVED", json_constraints)

              // safe parsing of the URL's untrusted JSON
              var filteringKeyArrayPairs = JSON.parse( json_constraints)

              // INPUT json: <= { keywords: ['complex systems', 'something'],
              //                  countries: ['France', 'USA'], laboratories: []}

              // we build 2 OUTPUT strings:

              // => thedata (for comexAPI):
              //   keywords[]="complex systems"&keywords[]="something"&countries="France"&countries[]="USA"

              // => mapLabel (for user display):
              //   ("complex systems" or "something") and ("France" or "USA")

              // console.log("decoded filtering query", filteringKeyArrayPairs)

              var restParams = []
              var nameElts = []
              // build REST parameters from filtering arrays
              // and name from each filter value
              for (var fieldName in filteringKeyArrayPairs) {
                  var nameSubElts = []
                  for (var value of filteringKeyArrayPairs[fieldName]) {
                      // exemple: "countries[]=France"
                      restParams.push(fieldName+'[]='+encodeURIComponent(value))
                      nameSubElts.push ('"'+value+'"')
                  }
                  nameElts.push("("+nameSubElts.join(" or ")+")")
              }

              if (restParams.length) {
                  thedata = "qtype=filters&" + restParams.join("&")
                  mapLabel = nameElts.join(" and ")
              }
              else {
                  thedata = "qtype=filters&query=*"
                  mapLabel = "(ENTIRE NETWORK)"
              }
          }

          // Assigning name for the network
          if (! mapLabel) {
              elements = []
              queryarray = JSON.parse(ourGetUrlParam.nodeidparam)
              for(var i in queryarray) {
                  item = queryarray[i]
                  if(Array.isArray(item) && item.length>0) {
                      for(var j in item) elements.push(item[j])
                  }
              }
              mapLabel = '"'+elements.join('" , "')+'"';
          }

          var bridgeRes = AjaxSync({ url: theurl, data:thedata, type:'GET', datatype:'json' })

          // should be a js object with 'nodes' and 'edges' properties
          inData = bridgeRes.data

          if (TW.conf.debug.logFetchers)   console.info("JSON input data", inData)
        }
        else {
            console.warn ("=> unsupported query type !")
        }
    }
  }


  // cases            (2)       and     (3) : we'll read a file from server
  // sourcemode == "serverfile" or "servermenu" (several files with <select>)
  else {
    console.log("input case: server-side file, using TW.conf.sourceMenu or getUrlParam.file or TW.conf.sourceFile")

    // -> @mode is servermenu, files are listed in db.json file (preRes ajax)
    //      --> if @file also in url, choose the db.json one matching
    //      --> otherwise, choose the "first_file" from db.json list

    // -> @mode is serverfile
    //      -> gexf file path is in the urlparam @file
    //      -> gexf file path is already specified in TW.conf.sourceFile

    // ===================
    var the_file = "";
    // ===================

    // menufile case : a list of source files in ./db.json
    if (sourcemode == 'servermenu') {
        console.log("reading from FILEMENU TW.conf.sourceMenu")
        // we'll first retrieve the menu of available files in db.json, then get the real data in a second ajax
        var infofile = TW.conf.sourceMenu

        if (TW.conf.debug.logFetchers)  console.info(`attempting to load filemenu ${infofile}`)
        var preRES = AjaxSync({ url: infofile, datatype:"json" });

        if (preRES['OK'] && preRES.data) {
          if (TW.conf.debug.logFetchers) console.log('initial AjaxSync result preRES', preRES)
        }

        var first_file = "" , first_path = ""
        for( var path in preRES.data ) {

            if (TW.conf.debug.logFetchers) console.log("db.json path", path)

            first_file = preRES.data[path]["first"]
            first_path = path
            break;
        }

        // the first or a specified one (ie both mode and file params are present)
        if( isUndef(getUrlParam.file) ) {
            the_file = first_path+"/"+first_file
            mapLabel = first_file
        } else {
            // £POSS; match on the full paths from db.json
            the_file = first_path+"/"+getUrlParam.file
            mapLabel = getUrlParam.file
        }

        var files_selector = '<select onchange="jsActionOnGexfSelector(this.value);">'

        for( var path in preRES.data ) {
            var theGexfs = preRES.data[path]["gexfs"]
            for(var aGexf in theGexfs) {
                var gexfBasename = aGexf.replace(/\.gexf$/, "") // more human-readable in the menu
                TW.gexfPaths[gexfBasename] = path+"/"+aGexf
                // ex : "RiskV2PageRank1000.gexf":data/AXA/RiskV2PageRank1000.gexf
                // (we assume there's no duplicate basenames)


                if (TW.conf.debug.logFetchers)
                  console.log("\t\t\t"+gexfBasename+ "   -> table:" +theGexfs[aGexf]["semantic"]["table"] )

                // -------------------------->8------------------------------------------
                // £TODO this part is underspecified
                // if used in some usecases, port it to nodetypes
                // otherwise remove
                // TW.field[path+"/"+aGexf] = theGexfs[aGexf]["semantic"]["table"]
                // ex : data/AXA/RiskV2PageRank5000.gexf:"ISItermsAxa_2015"
                // -------------------------->8------------------------------------------


                let cssFileSelected = (the_file==(path+"/"+aGexf))?"selected":""
                files_selector += '<option '+cssFileSelected+'>'+gexfBasename+'</option>'
            }
            // console.log( files_selector )
        }
        files_selector += "</select>"
        $("#network").html(files_selector)
    }

    // direct urlparam file case
    else if( !isUndef(getUrlParam.file)  ) {
      the_file = getUrlParam.file
    }
    // direct file fallback case: specified file in settings_explorer
    else if (TW.conf.sourceFile && linkCheck(TW.conf.sourceFile)) {
      console.log("no @file arg: trying TW.conf.sourceFile from settings")
      the_file = TW.conf.sourceFile;
    }
    else {
      console.error(`No specified input and neither db.json nor TW.conf.sourceFile ${TW.conf.sourceFile} are present`)
    }

    var finalRes = AjaxSync({ url: the_file });
    inData = finalRes["data"]
    inFormat = finalRes["format"]

    if (TW.conf.debug.logFetchers) {
      console.warn('@the_file', finalRes["OK"], the_file)
      console.log('  fetch result: format', inFormat)
      console.log('  fetch result: typeof data', typeof inData)
      console.log("\n============================\n")
    }
  }

  return [inFormat, inData, mapLabel]

}


//  mainStartGraph
// ===============
//  main function  (once we have some gexf or json data)
// ===============
// 1 - parses the graph data
// 2 - starts the sigma instance in TW.partialGraph
// 3 - starts the tinaweb instance
// 4 - finishes setting up the environment
// (NB inspired by Samuel's legacy bringTheNoise() function)
function mainStartGraph(inFormat, inData, twInstance) {

  if (! inFormat || ! inData) {
    alert("error on data load")
  }
  else {

      if (TW.conf.debug.logParsers)   console.log("parsing the data")

      let start = new ParseCustom(  inFormat , inData );
      let catsInfos = start.scanFile();

      TW.categories = catsInfos.categories
      if (TW.conf.debug.logParsers){
        console.log(`Source scan found ${TW.categories.length} node categories: ${TW.categories}`)
      }

      // reverse lookup: category name => category indice
      TW.catDict = catsInfos.lookup_dict

      if (! TW.categories) {
        console.warn ('ParseCustom scanFile found no categories!!')
      }

      // activetypes: the node categorie(s) that is (are) currently displayed
      // ex: [true,false] = [nodes of type 0 shown  ; nodes of type 1 not drawn]
      var initialActivetypes = TW.instance.initialActivetypes( TW.categories )
      var possibleActivetypes = TW.instance.allPossibleActivetypes( TW.categories )

      // remember it
      TW.states[1].activetypes = initialActivetypes ;

      // XML parsing from ParseCustom
      var dicts = start.makeDicts(TW.categories); // > parse json or gexf, dictfy

      if (TW.conf.debug.logParsers)   console.info("parsing result:", dicts)

      TW.Nodes = dicts.nodes;
      TW.Edges = dicts.edges;

      TW.nodeIds = Object.keys(dicts.nodes)  // useful for loops
      TW.edgeIds = Object.keys(dicts.edges)

      // in-place: pre-compute all color/grey/size properties
      prepareNodesRenderingProperties(TW.Nodes)
      prepareEdgesRenderingProperties(TW.Edges, TW.Nodes)

      if (inData.clusters) TW.Clusters = inData.clusters

      // £TODO remove from parseCustom or start using
      // TW.nodes1 = dicts.n1;//not used

      // main console info
      // ===================
      console.info(`== new graph ${TW.nodeIds.length} nodes, ${TW.edgeIds.length} edges ==`)

      // a posteriori categories diagnostic
      // ----------------------------------
      // by default TW.categories now match user-suggested catSoc/Sem if present
      // so we just need to handle mismatches here (when user-suggested cats were absent)
      if (TW.categories.length == 2) {
        console.info("== 'bipartite' case ==")
        if (TW.conf.catSoc != TW.categories[0]) {
          console.warn(`Observed social category "${TW.categories[0]}" overwrites user-suggested TW.conf.catSoc ("${TW.conf.catSoc}")`)
          TW.conf.catSoc = TW.categories[0]
        }
        if (TW.conf.catSem != TW.categories[1]) {
          console.warn(`Observed semantic category "${TW.categories[1]}" overwrites user-suggested TW.conf.catSem "(${TW.conf.catSem})"`)
          TW.conf.catSem = TW.categories[1]
        }
      }
      else if (TW.categories.length == 1) {
        console.info("== monopartite case ==")
        // FIXME it would be more coherent with all tina usecases (like gargantext or tweetoscope) for the default category to be catSem instead of Soc
        if (TW.conf.catSoc != TW.categories[0]) {
          console.warn(`Observed unique category "${TW.categories[0]}" overwrites user-suggested TW.conf.catSoc ("${TW.conf.catSoc}")`)
          TW.conf.catSoc = TW.categories[0]
        }
      }
      else {
        console.error("== currently unhandled categorization of node types ==", TW.categories)
      }

      // [ Poblating the Sigma-Graph ]

      // preparing the data (TW.Nodes and TW.Edges filtered by initial type)
      // POSS: avoid this step and use the filters at rendering time!
      TW.graphData = {nodes: [], edges: []}
      TW.graphData = sigma_utils.FillGraph( initialActivetypes , TW.catDict  , TW.Nodes , TW.Edges , TW.graphData );


          // // ----------- TEST stock parse gexf and use nodes to replace TW's ---------
          // var gexfData = gexf.fetch('data/politoscope/ProgrammeDesCandidats.gexf')
          //
          // TW.graphData = sigmaTools.myGexfParserReplacement(
          //     gexfData.nodes,
          //     gexfData.edges
          // )
          // console.log ('ex in TW.graphData.nodes[0]', TW.graphData.nodes[0])
          //
          // // our holey id-indexed arrays
          // TW.Nodes = {}
          // TW.Edges = {}
          // TW.nodeIds = []
          // TW.edgeIds = []
          // for (var j in TW.graphData.nodes) {
          //   var nid = TW.graphData.nodes[j].id
          //   TW.Nodes[nid] = TW.graphData.nodes[j]
          //   TW.nodeIds.push(nid)
          // }
          // for (var i in TW.graphData.edges) {
          //   var eid = TW.graphData.edges[i].id
          //   TW.Edges[eid] = TW.graphData.edges[i]
          //   TW.edgeIds.push(eid)
          // }
          //
          //
          // // -------------------------------------------------------------------------

        if (TW.graphData.nodes.length == 0) console.error("empty graph")
        if (TW.graphData.edges.length == 0) console.error("no edges in graph")


      // our final sigma params (cf github.com/jacomyal/sigma.js/wiki/Settings)
      TW.customSettings = Object.assign(

          // 1) optimal low-level values (was: "developer settings")
          {
              drawEdges: true,
              drawNodes: true,
              drawLabels: true,

              labelSize: "proportional",

              // nodesPowRatio: .3,
              batchEdgesDrawing: false,
              hideEdgesOnMove: true,

              enableHovering: true,
              singleHover: true,
              enableEdgeHovering: false,

              autoResize: true,
              rescaleIgnoreSize: true,

              mouseEnabled: true,
              touchEnabled: false,

              animationsTime:150,
              mouseZoomDuration:250,

              zoomMin: TW.conf.zoomMin,
              zoomMax: TW.conf.zoomMax
          },

          // 2) user-configurable values (cf. settings_explorer)
          TW.conf.sigmaJsDrawingProperties,
      )


      if (TW.conf.debug.logSettings) console.info("sigma settings", TW.customSettings)


      // ==================================================================
      // sigma js library invocation (https://github.com/jacomyal/sigma.js)
      // ==================================================================
      TW.partialGraph = new sigma({
          graph: TW.graphData,
          container: 'sigma-contnr',
          renderer: {
              container: document.getElementById('sigma-contnr'),
              type: sigma.renderers.canvas
              // type: sigma.renderers.webgl // POSS if write custom renderers
          },
          settings: TW.customSettings
      });
      // ==================================================================

      // NB the list of nodes and edges from TW.graphData will be changed
      //    by changeLevel, changeType or subset sliders

      // shortcuts to the renderer and camera
      TW.cam  = TW.partialGraph.camera
      TW.rend = TW.partialGraph.renderers[0]

      // NB : camera positions are fix if the node is fixed => they only depend on layout
      //      renderer position depend on viewpoint/zoom (like ~ html absolute positions of the node in the div)

      // now that we have a sigma instance, let's bind our click handlers to it
      TW.instance.initSigmaListeners(TW.partialGraph, initialActivetypes)

      // [ / Poblating the Sigma-Graph ]

      if (!TW.conf.filterSliders) {

        var filterEls = document.getElementsByClassName('weight-selectors')

        for (var k in filterEls) {
          if (filterEls[k] && filterEls[k].style) filterEls[k].style.display="none"
        }
      }

      TW.FA2Params = {
        // adapting speed -------------
        slowDown: 1.5,
        startingIterations: 2,             // keep it an even number to reduce visible oscillations at rendering
        iterationsPerRender: 4,            // idem
        barnesHutOptimize: false,
        // barnesHutTheta: .5,

        // global behavior -----------
        linLogMode: true,
        edgeWeightInfluence: .3,
        gravity: .8,
        strongGravityMode: false,
        scalingRatio: 1,

        adjustSizes: false,     // ~ messy but sort of in favor of overlap prevention

        // favors global centrality
        // (but rather not needed when data already shows topic-centered
        //  node groups and/nor when preferential attachment type of data)
        outboundAttractionDistribution: false
      }

      if (TW.conf.debug.logSettings) console.info("FA2 settings", TW.FA2Params)

      // init FA2 for any future forceAtlas2 calls
      TW.partialGraph.configForceAtlas2(TW.FA2Params)


      // init noverlap for any future calls
      TW.partialGraph.configNoverlap({
        nodeMargin: .4,
        scaleNodes: 1.5,
        gridSize: 400,
        speed: 5,
        maxIterations: 10,
        easing: 'quadraticOut', // animation transition function
        duration: 1500   // animation duration
                         // NB animation happens *after* processing
      });

      // REFA new sigma.js
      TW.partialGraph.camera.goTo({x:0, y:0, ratio:0.9, angle: 0})

      // mostly json data are extracts provided by DB apis => no positions
      // if (inFormat == "json")  TW.conf.fa2Enabled = true

      // will run fa2 if enough nodes and TW.conf.fa2Enabled == true
      sigma_utils.smartForceAtlas()


      // adapt the enviroment to monopartite vs. bipartite cases
      if( TW.categories.length==1 ) {
          $("#changetype").hide();
          $("#taboppos").hide();

          // if (TW.conf.catSem && TW.conf.catSoc) {
            setTimeout(function () {
                // tabneigh: show "Related" tab
                document.querySelector('.etabs a[href="#tabs2"]').click()
            }, 500);
          // }
      }
      // for elements hidden by default (cf. css) but useful in bipartite case
      else {
        $("#changetype").show();
        $("#taboppos").show();
        $("#taboppos").css('display', 'inline-block');
      }


      // should prepare the colors/clusters menu once and for all
      // (previously, needed to be called after changeType/changeLevel)
      changeGraphAppearanceByFacets(true)

      // set the default legend
      set_ClustersLegend ( "clust_default" )
  }

}


// load optional modules
activateModules() ;

// show any already existing panel
document.getElementById("graph-panels").style.display = "block"

// grey message in the search bar from settings
$("#searchinput").attr('placeholder', TW.conf.strSearchBar) ;


setTimeout( function() {
  theHtml.classList.remove('waiting')
}, 20)

console.log("finish")
