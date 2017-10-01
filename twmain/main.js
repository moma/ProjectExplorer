'use strict';

//  ======= [ main TW properties initialization ] ======== //

TW.APIQuery               // remember the source query

TW.File = ""              // or remember the currently opened file
TW.Project = ""           //      and the project of currently opened file

// a system state is the summary of tina situation
TW.initialSystemState = {
  activetypes: [],          // <== filled from TW.categories
  activereltypes: [],       // <== same for edges
  level:      true,
  selectionNids: [],        // <== current selection !!
  selectionRels: [],        // <== current highlighted neighbors
  LouvainFait: false,
  id: 0                     // simple incremental stateid
}

// states[] is an array of system states for future CTRL+Z or usage track
TW.states = [TW.initialSystemState]

// SystemState() returns the current situation
TW.SystemState = function() { return TW.states.slice(-1)[0] }

// options for facetting the data attributes
// (project conf values will override these global conf defaults)
TW.facetOptions = TW.conf.defaultFacetOptions

// gracefully degrade our most costly settings if the user agent is mobile
if (/mobile/i.test(navigator.userAgent))   mobileAdaptConf()


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

TW.currentRelDocsDBs = []  // to make available dbconf to topPapers

// show the custom name + home link of the app
writeBrand(TW.conf.branding, TW.conf.brandingLink)

// choosing the input
// -------------------
// type of input
TW.sourcemode = isUndef(getUrlParam.sourcemode) ? TW.conf.sourcemode : getUrlParam.sourcemode

// if page is being run locally ==> only possible source shall be via file input
if (window.location.protocol == 'file:' || TW.sourcemode == 'localfile') {

  let inputDiv = document.getElementById('localInput')
  inputDiv.style.display = 'block'

  // user can open a gexf or json from his fs
  var graphFileInput = createFilechooserEl()
  inputDiv.appendChild(graphFileInput)

  if (window.location.protocol == 'file:') {
    var remark = document.createElement("p")
    remark.innerHTML = `<h5>/!\\ Running project explorer as a local html file /!\\<br>(<a id="localfile-warning" data-toggle="popover" data-content="<p>In localfile mode, it is impossible to load some interface elements: <ul><li>modules (histograms, suggestions)</li><li>related docs search engine</li><li>any custom project conf</li></ul></p><p><b>You can still explore your graph and its data attributes with our default settings</b>.</p><p>For more information, check out the <a href=https://github.com/moma/ProjectExplorer/blob/master/README.md#usage-on-a-web-server target=_blank>documentation</a>.</p>">no syncing</a>)</h5>`
    remark.classList.add('comment')
    remark.classList.add('centered')
    inputDiv.appendChild(remark)
    inputDiv.style.height = "auto";
    inputDiv.style.padding = "10px";

    new Popover(
      document.getElementById('localfile-warning'),
      {"placement": 'left', "delay": 1000}
    )
  }
}
// traditional cases: remote read from API or prepared server-side file
else {
  // NB it will
  //     - use global urlParams, TW.conf and possibly server_menu.json
  //     - choose the source and format
  var [inFormat, inData, mapLabel] = syncRemoteGraphData()
  mainStartGraph(inFormat, inData, TW.instance)
  writeLabel(mapLabel)
}

//  === [ / what to do at start ] === //




function syncRemoteGraphData () {
  var inFormat;      // = { db|api.json , somefile.json|gexf }
  var inData;        // = {nodes: [....], edges: [....], cats:...}

  var mapLabel;      // user displayed label for this input dataset

  // case (1) read from remote DB via API bridge fetching
  // ex: /services/api/graph?q=filters...
  if (TW.sourcemode == "api") {
    console.log("input case: api, using TW.conf.sourceAPI")

    // the only API format, cf. inData
    inFormat = 'json'

    var sourceinfo = getUrlParam.srcparams
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

              TW.APIQuery = sourceinfo

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


              // safe parsing of the URL's untrusted JSON
              TW.APIQuery = JSON.parse( json_constraints)

              // INPUT json: <= { keywords: ['complex systems', 'something'],
              //                  countries: ['France', 'USA'], laboratories: []}

              // we build 2 OUTPUT strings:

              // => thedata (for comexAPI):
              //   keywords[]="complex systems"&keywords[]="something"&countries="France"&countries[]="USA"

              // => mapLabel (for user display):
              //   ("complex systems" or "something") and ("France" or "USA")

              // console.log("decoded filtering query", TW.APIQuery)

              var restParams = []
              var nameElts = []
              // build REST parameters from filtering arrays
              // and name from each filter value
              for (var fieldName in TW.APIQuery) {
                  // a nodetype
                  if (/^_node[0-1]$/.test(fieldName)) {
                    let itype = fieldName.charAt(fieldName.length-1)
                    let typeName = TW.APIQuery[fieldName]
                    restParams.push("type"+itype+"="+typeName)
                  }
                  // an array of filters
                  else {
                    var nameSubElts = []
                    for (var value of TW.APIQuery[fieldName]) {
                        // exemple: "countries[]=France"
                        restParams.push(fieldName+'[]='+encodeURIComponent(value))
                        nameSubElts.push ('"'+value+'"')
                    }
                    nameElts.push("("+nameSubElts.join(" or ")+")")
                  }

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

          var bridgeRes = AjaxSync({ url: theurl, data:thedata, type:'GET' })

          // should be a js object with 'nodes' and 'edges' properties
          inData = bridgeRes.data

          if (TW.conf.debug.logFetchers)   console.info("JSON input str", inData)
        }
        else {
            console.warn ("=> unsupported query type !")
        }
    }
  }


  // TW.sourcemode == "serverfile" or "servermenu"
  // cases            (2)       and     (3) : read a file from server
  else {
    console.log("input case: server-side file, using TW.conf.paths.sourceMenu and/or TW.File")


    // both modes (2) and (3) need a direct file

    // a) file path is in the urlparam @file (overrides any defaults)
    if( !isUndef(getUrlParam.file)  ) {
      TW.File = getUrlParam.file
    }
    // b) default case: specified file path in settings_explorer
    else if (TW.conf.paths.sourceFile) {
      console.log("no @file arg: trying TW.conf.sourceFile from settings")
      TW.File = TW.conf.paths.sourceFile;
    }


    // 2) @mode is servermenu, files are listed in db.json file (preRes ajax)
    //      --> if @file also in url, choose the db.json one matching
    //      --> otherwise, choose the "first_file" from db.json list
    // menufile case : a list of source files in ./db.json
    if (TW.sourcemode == 'servermenu') {
        console.log("== servermenu mode ==")
        if (! linkCheck(TW.conf.paths.sourceMenu)) {
          console.error(`servermenu mode: Couldn't read ${TW.conf.paths.sourceMenu}, referenced by TWConf.paths under sourceMenu... file is not accessible, trying to start with settings_explorer defaults.`)
        }
        else {
          // we'll first retrieve the menu of available sources in server_menu.json,
          // then get the real data in a second ajax via API or server file
          let [gmenu, firstProject] = readMenu(TW.conf.paths.sourceMenu)

          // if TW.File was not set we keep the first one from readMenu
          if (!TW.File) {
            TW.File = firstProject + "/" + gmenu[firstProject][0]
          }

          // chooser menu
          var files_selector = '<select onchange="openGraph(this.options[this.selectedIndex].dataset.fullpath)">'
          for (var projectPath in gmenu) {
            for (var i in gmenu[projectPath]) {
              let filePath = gmenu[projectPath][i]
              let fullPath = projectPath+'/'+filePath
              let shortname = graphPathToLabel(fullPath)
              let preSelected = (fullPath == TW.File)
              files_selector += `<option ${preSelected ? "selected":""} data-fullpath="${fullPath}">`+shortname+'</option>'
            }
          }
          files_selector += "</select>"
          $("#network").html(files_selector)
        }
    }

    // 3) @mode is serverfile a or b (default)
    else if (TW.File) {
      if (! linkCheck(TW.File)) {
        console.error(`Specified file ${TW.File} is absent.`)
      }
    }
    else {
      console.error(`No specified input and no servermenu.`)
    }

    // finally: read the chosen file
    var finalRes = AjaxSync({ url: TW.File });
    inData = finalRes["data"]
    inFormat = finalRes["format"]
    mapLabel = graphPathToLabel(TW.File)

    if (TW.conf.debug.logFetchers) {
      console.warn('@TW.File', finalRes["OK"], TW.File)
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
// 0 - read optional additional conf
// 1 - parses the graph data
// 2 - starts the sigma instance in TW.partialGraph
// 3 - starts the tinaweb instance
// 4 - finishes setting up the environment
// (NB inspired by Samuel's legacy bringTheNoise() function)
//
//  args:
//     inFormat: 'json' or 'gexf'
//     inData: source data as str
//     twInstance: a tinaweb object (gui, methods) to bind the graph to
//
// NB: function also uses TW.File to get the associated project dir and conf
//                    and TW.conf for all global settings
function mainStartGraph(inFormat, inData, twInstance) {

  // Graph-related vars
  // ------------------
  // POSS: "new TWGraph()..."
  TW.Nodes = [];
  TW.Edges = [];
  TW.ByType = {}          // node ids sorted by nodetype id   (0, 1)
  TW.Relations = {}       // edges sorted by source/target type id ("00", "11")
  TW.Facets = [];         // "by value" facet index built in parseCustom

  TW.Project = null
  TW.currentRelDocsDBs = {}

  TW.partialGraph = null  // will contain the sigma visible graph instance

  TW.labels=[];           // fulltext search list

  TW.categories = [];     // possible node types and their inverted map
  TW.catDict = {};
  TW.lastRelDocQueries = {}  // avoids resending ajax if same query twice in a row

  if (! inFormat || ! inData) {
    alert("error on data load")
  }
  else {
      let optNodeTypes = null
      let optRelDBs = null
      let optProjectFacets = null

      if (TW.sourcemode == "api") {
        optNodeTypes = TW.conf.sourceAPI.nodetypes
      }
      else {
        // we assume the filePath is of the form projectPath/sourceFile
        // (NB these are server-side path so we got linux-style slashes)
        let pathsplit = TW.File.match("^(.*)/([^/]+)$")
        if (! pathsplit) {
          console.warn (`couldn't make out project path from ${TW.File}:
                         won't read project conf and will try using defaults`)
        }
        else {
          let srcDirname = pathsplit[1] ;
          let srcBasename = pathsplit[2] ;

          // try and retrieve associated project_conf.json
          [optNodeTypes, optRelDBs] = readProjectConf(srcDirname, srcBasename)

          // export to globals for getTopPapers and makeRendererFromTemplate
          if (optRelDBs) {
            TW.currentRelDocsDBs = optRelDBs
            TW.Project = srcDirname
          }

          // try and retrieve associated legends.json
          optProjectFacets = readProjectFacetsConf(srcDirname, srcBasename)

          // export to globals for facet options (merge with previous defaults)
          if (optProjectFacets) {
            TW.facetOptions = Object.assign(TW.facetOptions, optProjectFacets)
          }
        }
      }

      if (TW.conf.debug.logSettings) {
        console.log("READ project_conf.json nodetypes", optNodeTypes)
        console.log("READ project_conf.json relatedDBs", optRelDBs)
      }

      // override default categories with project_conf.json if present
      // parse the data
      if (TW.conf.debug.logParsers)   console.log("parsing the data")
      let start = new ParseCustom(  inFormat , inData, optNodeTypes);
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
      var initialActivetypes = twInstance.initialActivetypes( TW.categories )
      var initialActivereltypes = twInstance.inferActivereltypes( initialActivetypes )

      // XML parsing from ParseCustom into dicts of nodes by type or rels by etype
      var dicts = start.makeDicts(TW.categories); // > parse json or gexf, dictfy

      if (TW.conf.debug.logParsers)   console.info("parsing result:", dicts)

      TW.Nodes = dicts.nodes;
      TW.Edges = dicts.edges;

      TW.ByType = dicts.byType  // useful for loops

      // init the rendering flags (after we got types, before we first render)
      TW.gui.handpickedcolorsReset(TW.categories)

      // in-place: pre-compute all color/unselected color/size properties
      prepareNodesRenderingProperties(TW.Nodes)
      prepareEdgesRenderingProperties(TW.Edges, TW.Nodes)

      if (inData.clusters) TW.Facets = inData.clusters

      // main console info
      // ===================
      console.info(`== new graph ${Object.keys(TW.Nodes).length} nodes (${TW.categories.length > 1 ? 'bipartite': 'monopartite'}), ${Object.keys(TW.Edges).length} edges ==`)

      // a posteriori categories diagnostic
      // ----------------------------------
      // by default TW.categories now match user-suggested catSoc/Sem if present
      // so we just need to handle mismatches here (when user-suggested cats were absent)
      if (TW.conf.catSem != TW.categories[0]) {
        console.warn(`Observed semantic category "${TW.categories[0]}" overwrites user-suggested TW.conf.catSem "(${TW.conf.catSem})"`)
        TW.conf.catSem = TW.categories[0]
      }
      if (TW.categories.length > 1 && TW.conf.catSoc != TW.categories[1]) {
        console.warn(`Observed social category "${TW.categories[1]}" overwrites user-suggested TW.conf.catSoc ("${TW.conf.catSoc}")`)
        TW.conf.catSoc = TW.categories[1]
      }

      // [ Poblating the Sigma-Graph ]

      // preparing the data (TW.Nodes and TW.Edges filtered by initial type)
      // POSS: avoid this step and use the filters at rendering time!
      TW.graphData = {nodes: [], edges: []}
      TW.graphData = sigma_utils.FillGraph( initialActivetypes , initialActivereltypes, TW.catDict  , TW.Nodes , TW.Edges , TW.graphData );

      if (TW.graphData.edges.length == 0) console.warn("no edges in graph")
      if (TW.graphData.nodes.length == 0) {
        console.error("empty graph")
        alert("This query returned no nodes. The graph is empty")
        return false
      }

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
              touchEnabled: true,

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

      // a new GUI state (updates sliders and menus)
      TW.pushGUIState({
        'activetypes': initialActivetypes,
        'activereltypes': initialActivereltypes
      })

      // NB the list of nodes and edges from TW.graphData will be changed
      //    by changeLevel, changeType or subset sliders => no need to keep it
      delete TW.graphData

      // shortcuts to the renderer and camera
      TW.cam  = TW.partialGraph.camera
      TW.rend = TW.partialGraph.renderers[0]

      // NB : camera positions are fix if the node is fixed => they only depend on layout
      //      renderer position depend on viewpoint/zoom (like ~ html absolute positions of the node in the div)

      // prepare the colors/clusters menu until next changeType/changeLevel
      // (and update TW.Facets)
      updateDynamicFacets()
      changeGraphAppearanceByFacets()

      // now that we have a sigma instance and TW.Facets
      // let's adapt the environment and bind our click handlers to it
      twInstance.initSigmaListeners(
        TW.partialGraph,
        initialActivetypes,      // to init node sliders and .class gui elements
        initialActivereltypes,   // to init edge sliders
        optRelDBs                // optional conf to init relatedDocs
      )

      // set the initial color
      TW.gui.elContainer.style.backgroundColor =  TW.conf.normalBackground

      // [ / Poblating the Sigma-Graph ]

      if (!TW.conf.filterSliders) {

        var filterEls = document.getElementsByClassName('tworow-selectors')

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
        edgeWeightInfluence: .4,
        gravity: .3,
        strongGravityMode: false,
        scalingRatio: 1,
        skipHidden: false,      // if true fa2 initial filter nodes

        adjustSizes: false,     // ~ messy but sort of in favor of overlap prevention

        // favors global centrality
        // (rather not needed for large preferential attachment type of data ?)
        outboundAttractionDistribution: false
      }

      if (TW.conf.debug.logSettings) console.info("FA2 settings", TW.FA2Params)

      // init FA2 for any future forceAtlas2 calls
      TW.partialGraph.configForceAtlas2(TW.FA2Params)

      // NB: noverlap conf depends on sizeRatios so updated before each run

      // REFA new sigma.js
      TW.partialGraph.camera.goTo({x:0, y:0, ratio:0.9, angle: 0})

      // mostly json data are extracts provided by DB apis => no positions
      // if (inFormat == "json")  TW.conf.fa2Enabled = true

      // will run fa2 if enough nodes and TW.conf.fa2Enabled == true
      sigma_utils.smartForceAtlas()
  }

}

setTimeout( function() {
  TW.gui.elHtml.classList.remove('waiting')
}, 20)

console.log("finish")
