'use strict';

// Function.prototype.index
// ---
// 'decorator'
// (used here and in Tinaweb.js for MultipleSelection2)
// ---
// transforms calls like foobar({arg1:a, arg2:b})
//      into  calls like foobar(a, b)

(function(reComments, reParams, reNames) {
  Function.prototype.index = function(arrParamNames) {
    var fnMe = this;
    arrParamNames = arrParamNames
      || (((fnMe + '').replace(reComments, '')
           .match(reParams)[1] || '')
          .match(reNames) || []);
    return function(namedArgs) {
      var args = [], i = arrParamNames.length;
      args[i] = namedArgs;
      while(i--) {
        args[i] = namedArgs[arrParamNames[i]];
      }
      return fnMe.apply(this, args);
    };
  };
})(
  /\/\*[\s\S]*?\*\/|\/\/.*?[\r\n]/g,
  /\(([\s\S]*?)\)/,
  /[$\w]+/g
);

var AjaxSync = (function(TYPE, URL, DATA, CT , DT) {
    var Result = []
    TYPE = (!TYPE)?"GET":TYPE
    if(DT && (DT=="jsonp" || DT=="json")) CT="application/json";
    console.log("---AjaxSync---\n", TYPE, URL, DATA, CT , DT, "\n--------------")
    $.ajax({
            type: TYPE,
            url: URL,
            data: DATA,
            contentType: CT,
            dataType: DT,
            async: false,
            success : function(data, textStatus, jqXHR) {
                var header = jqXHR.getResponseHeader("Content-Type")
                // console.log("AjaxSync("+URL+"):header="+header);
                var format ;
                if (!header || header == "application/octet-stream") {
                  // default choice if undetailed header
                  format = "gexf" ;
                }
                else {
                  format = "json" ;
                }
                Result = { "OK":true , "format":format , "data":data };
            },
            error: function(exception) {
                console.log('now error', exception)
                Result = { "OK":false , "format":false , "data":exception.status };
            }
        });
    return Result;
}).index();

function getGexfPath(v){
    var gexfpath=(TW.gexfDictReverse[v])?TW.gexfDictReverse[v]:v;
    return gexfpath;
}

function jsActionOnGexfSelector(gexfBasename , db_json){
    db_json = (db_json)?"&mode=db.json":""
    let gexfLegend = gexfBasename+".gexf"
    if(getGexfPath[gexfLegend])
        window.location=window.location.origin+window.location.pathname+"?file="+encodeURIComponent(getGexfPath(gexfLegend))+db_json;
    else
        window.location=window.location.origin+window.location.pathname+"?file="+encodeURIComponent( gexfLegend )+db_json;
}


// show the custom name of the app
writeBrand(TW.branding)


//  === [   what to do at start ] === //
// --------------------- choosing the input ------------------------------------
// various starting points (WIP: currently refactoring for simpler handling)

var inFormat;            // = { db|api.json , somefile.json|gexf }
var inData;              // = {nodes: [....], edges: [....], cats:...}


// case (1) read from DB => one ajax to api eg /services/api/graph?q=filters...
// this one is the API case
// if (getUrlParam.mode && getUrlParam.mode == "api") {
if (getUrlParam.type) {
  console.warn("input case: @type [future: @mode=api], using TW.bridge")

  // the only API format, cf. inData
  inFormat = 'json'

  // TODO-rename: s/nodeidparam/srcparams
  var sourceinfo = getUrlParam.nodeidparam
  var qtype = getUrlParam.type
  if(isUndef(sourceinfo) || isUndef(qtype)) {
      console.warn("missing nodes filter/id param");
  }
  else {
      console.log("Received query of type:", qtype)
      if(qtype == "filter" || qtype == "uid"){
        var theurl,thedata,thename;

        console.warn("===> PASSING ON QUERY (type "+qtype+") TO BRIDGE <===")
        if(qtype=="uid") {
            // pr("bring the noise, case: unique_id");
            // pr(getClientTime()+" : DataExt Ini");
            // < === DATA EXTRACTION === >
            theurl = TW.bridge["forNormalQuery"]

            // NB before also passed it for Fa2 iterations (useless?)
            thedata = "qtype=uid&unique_id="+sourceinfo;
            thename = "unique scholar";
        }

        if (qtype=="filter") {
            // pr("bring the noise, case: multipleQuery");
            // pr(getClientTime()+" : DataExt Ini");
            theurl = TW.bridge["forFilteredQuery"];

            // json is twice URI encoded by whoswho to avoid both '"' and '%22'
            var json_constraints = decodeURIComponent(sourceinfo)

            console.log("multipleQuery RECEIVED", json_constraints)

            // safe parsing of the URL's untrusted JSON
            var filteringKeyArrayPairs = JSON.parse( json_constraints)

            // INPUT json: <= { keywords: ['complex systems', 'something'],
            //                  countries: ['France', 'USA'], laboratories: []}

            // we build 2 OUTPUT strings:

            // => thedata (for comexAPI):
            //   keywords[]="complex systems"&keywords[]="something"&countries="France"&countries[]="USA"

            // => thename (for user display):
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
                thename = nameElts.join(" and ")
            }
            else {
                thedata = "qtype=filters&query=*"
                thename = "(ENTIRE NETWORK)"
            }
        }

        // Assigning name for the network
        if (! thename) {
            elements = []
            queryarray = JSON.parse(ourGetUrlParam.nodeidparam)
            for(var i in queryarray) {
                item = queryarray[i]
                if(Array.isArray(item) && item.length>0) {
                    for(var j in item) elements.push(item[j])
                }
            }
            thename = '"'+elements.join('" , "')+'"';
        }

        console.warn (thename, ":name not used anymore since refacto 10/05 could put on same level as inData as inMapname or smth")
        console.log( "url", theurl , "data", thedata , "name", thename );
        var bridgeRes = AjaxSync({ URL: theurl, DATA:thedata, TYPE:'GET', DT:'json' })

        // should be a js object with 'nodes' and 'edges' properties
        inData = bridgeRes.data
      }
      else {
          console.warn ("=> unsupported query type !")
      }
  }
}
// case (2) gexf => in params or in preRes db.json, then 2nd ajax for a gexf file => covered here
else {
  console.warn("input case: @mode=db.json or @file=... [future: @mode=local], using local gexf(s)")
  // subcases:
  // -> gexf file path is already specified in TW.mainfile
  // -> gexf file path is in the urlparam @file
  // -> @mode is db.json, files are listed in db.json file
  //                  --> if @file also in url, choose the db.json one matching
  //                  --> otherwise, choose the "first_file" from db.json list

  // ===================
  var the_file = "";
  // ===================

  // direct urlparam file case
  if( !isUndef(getUrlParam.file)  && (isUndef(getUrlParam.mode) || getUrlParam.mode != "db.json") ) {
    the_file = getUrlParam.file
  }
  // indirect case
  else if ( !isUndef(getUrlParam.mode) && getUrlParam.mode=="db.json") {

      console.log("===>legacy db.json<===")

      // we'll first retrieve the menu of available files in db.json, then get the real data in a second ajax
      var infofile = getUrlParam.mode

      var preRES = AjaxSync({ URL: infofile });

      if (preRES['OK'] && preRES.data) {
        console.log('initial AjaxSync result preRES', preRES)
      }


      var first_file = "" , first_path = ""
      for( var path in preRES.data ) {
          console.log("db.json path", path)
          first_file = preRES.data[path]["first"]
          first_path = path
          console.log("db.json first_file", first_path, first_file)
          break;
      }

      // the first or a specified one (ie both mode and file params are present)
      if( isUndef(getUrlParam.file) ) {
          the_file = first_path+"/"+first_file
      } else {
          the_file = first_path+"/"+getUrlParam.file
      }

      var files_selector = '<select onchange="jsActionOnGexfSelector(this.value , true);">'

      for( var path in preRES.data ) {
          var the_gexfs = preRES.data[path]["gexfs"]
          console.log("\t\tThese are the available  Gexfs:")
          console.log(the_gexfs)
          for(var aGexf in the_gexfs) {
              var gexfBasename = aGexf.replace(/\.gexf$/, "") // more human-readable in the menu
              console.log("\t\t\t"+gexfBasename+ "   -> table:" +the_gexfs[aGexf]["semantic"]["table"] )

              TW.field[path+"/"+aGexf] = the_gexfs[aGexf]["semantic"]["table"]
              // ex : data/AXA/RiskV2PageRank5000.gexf:"ISItermsAxa_2015"

              TW.gexfDict[path+"/"+aGexf] = aGexf
              // ex : data/AXA/RiskV2PageRank1000.gexf:"RiskV2PageRank1000.gexf"

              var selected = (the_file==(path+"/"+aGexf))?"selected":""
              files_selector += '<option '+selected+'>'+gexfBasename+'</option>'
          }
          // console.log( files_selector )
          break;
      }
      files_selector += "</select>"
      $("#network").html(files_selector)

      // console.log("\n============================\n")
      // console.log(TW.field)
      // console.log(TW.gexfDict)
      var finalRes = AjaxSync({ URL: the_file });
      inData = finalRes["data"]
      inFormat = finalRes["format"]
      console.log(inData.length)
      console.log(inFormat)

      console.warn('@the_file', finalRes["OK"], the_file)
  }
  // recreated fallback case: specified file in settings_explorer
  else if (TW.mainfile) {
    var unique_mainfile = TW.mainfile.filter(function(item, pos) {
      return TW.mainfile.indexOf(item) == pos;
    });
    the_file = (Array.isArray(TW.mainfile))?TW.mainfile[0]:TW.mainfile;
  }
}

//  === [ / what to do at start ] === //


// RES == { OK: true, format: "json", data: Object }


if (! inFormat || ! inData) {
  alert("error on initial data load")
}
else {
    console.log("parsing the data")
    var start = new ParseCustom(  inFormat , inData );
    var categories = start.scanFile(); //user should choose the order of categories

    console.log("Categories: ")
    console.log(categories)

    if (! categories) {
      console.warn ('ParseCustom scanFile found no categories!!')
      categories = []
    }
    var possibleStates = makeSystemStates( categories )
    var initialState = buildInitialState( categories ) //[true,false]//

    // XML parsing from ParseCustom
    var dicts = start.makeDicts(categories); // > parseGexf, dictfyGexf

    console.warn("parsing result:", dicts)

    TW.Nodes = dicts.nodes;
    TW.Edges = dicts.edges;
    TW.nodeIds = Object.keys(dicts.nodes)  // useful for loops
    TW.edgeIds = Object.keys(dicts.edges)

    // in-place: pre-compute all color/grey/size properties
    prepareNodesRenderingProperties(TW.Nodes)
    prepareEdgesRenderingProperties(TW.Edges, TW.Nodes)

    TW.selectionActive = false  // changes rendering mode

    if (inData.clusters) TW.Clusters = inData.clusters

    // relations already copied in TW.Relations at this point
    // TW.nodes1 = dicts.n1;//not used

    var catDict = dicts.catDict
    console.log("CategoriesDict: ")
    console.log(catDict)

    TW.categoriesIndex = categories;//to_remove
    TW.catSoc = categories[0];//to_remove
    TW.catSem = (categories[1])?categories[1]:false;//to_remove

    for(var i in categories) {
        TW.Filters[i] = {}
        TW.Filters[i]["#slidercat"+i+"edgesweight"] = true;
    }

    // [ Initiating Sigma-Canvas ]
    var twjs_ = new TinaWebJS('#sigma-contnr');

    // overriding pixelRatio is possible if we need very high definition
    if (TW.overSampling) {
      var realRatio = sigma.utils.getPixelRatio
      sigma.utils.getPixelRatio = function() {
        return 2 * realRatio()
      }
    }

    // NB new sigma.js: autoResize (no need for AdjustSigmaCanvas + sigmaLimits)

    // console.log("categories: "+categories)
    // console.log("initial state: "+initialState)

    // [ Poblating the Sigma-Graph ]
    var sigma_utils = new SigmaUtils();


    // preparing the data and settings
    TW.graphData = {nodes: [], edges: []}
    TW.graphData = sigma_utils.FillGraph(  initialState , catDict  , TW.Nodes , TW.Edges , TW.graphData );



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

    // cf github.com/jacomyal/sigma.js/wiki/Settings
    var customSettings = Object.assign(
        {
            drawEdges: true,
            drawNodes: true,
            drawLabels: true,

            labelSize: "proportional",
            // font: "Ubuntu Condensed",   // overridden by settings_explorer.js
            // labelColor: "node",

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
            mouseZoomDuration:250
        },
        sigmaJsDrawingProperties,
        sigmaJsGraphProperties,
        sigmaJsMouseProperties
    )

    console.info("sigma settings", customSettings)

    // custom nodes rendering
    if (customSettings['twNodeRendBorder']) {
      // overriding the def is simplest
      // (could also do it by type)
      sigma.canvas.nodes.def = sigma_utils.twRender.canvas.nodes.withBorders
    }

    // custom edges rendering registered under 'curve'
    sigma.canvas.edges.curve = sigma_utils.twRender.canvas.edges.curve
    sigma.canvas.edges.line = sigma_utils.twRender.canvas.edges.line

    // custom labels rendering
    //  - based on the normal one sigma.canvas.labels.def
    //  - additionnaly supports 'active/forcelabel' node property (magnify x 3)
    sigma.canvas.labels.def = sigma_utils.twRender.canvas.labels.largeractive

    // custom hovers rendering
    //  - based on the normal one sigma.canvas.hovers.def
    //  - additionnaly magnifies all labels x 2
    //  - additionnaly supports 'active/forcelabel' node property (magnify x 3)
    sigma.canvas.hovers.def = sigma_utils.twRender.canvas.hovers.largerall


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
        settings: customSettings
    });
    // ==================================================================

    // shortcuts to the renderer and camera
    TW.cam  = TW.partialGraph.camera
    TW.rend = TW.partialGraph.renderers[0]

    // NB : camera positions are fix if the node is fixed => they only depend on layout
    //      renderer position depend on viewpoint/zoom (like ~ html absolute positions of the node in the div)

    // use for loops
    TW.nNodes = TW.partialGraph.graph.nodes().length
    TW.nEdges = TW.partialGraph.graph.edges().length


    // POSS make it TW.states
    TW.partialGraph.states = []
    TW.partialGraph.states[0] = false;
    TW.partialGraph.states[1] = TW.SystemStates;
    TW.partialGraph.states[1].categories = categories
    TW.partialGraph.states[1].categoriesDict = catDict;
    console.log("!? initialState => states[1].type")
    TW.partialGraph.states[1].type = initialState;
    TW.partialGraph.states[1].LouvainFait = false;
    // [ / Poblating the Sigma-Graph ]


    // ex called for new selections with args like:
    //          (undefined, undefined, [268], undefined)
    //             ^^^^
    //          why type not used (monopart? deprecated?)

    TW.partialGraph.states[1].setState = (function( type , level , sels , oppos ) {
        var bistate=false, typestring=false;
        console.log("IN THE SET STATE METHOD:")
        if(!isUndef(type)) {
            this.type = type;
            bistate= type.map(Number).reduce(function(a, b){return a+b;})
            typestring = type.map(Number).join("|")
        }
        if(!isUndef(level)) this.level = level;
        if(!isUndef(sels)) this.selections = sels;
        if(!isUndef(oppos)) this.opposites = oppos;
        this.LouvainFait = false;
        console.log("")
        console.log(" % % % % % % % % % % ")
        console.log("setState type: ", type);
        console.log("bistate: "+bistate)
        console.log("level: "+level);
        console.log("selections: ");
        console.log(sels)
        console.log("selections len: ");
        console.log(sels.length)
        console.log("opposites: ");
        console.log(oppos)

        var present = TW.partialGraph.states.slice(-1)[0]; // Last
        var past = TW.partialGraph.states.slice(-2)[0] // avant Last
        console.log("previous level: "+past.level)
        console.log("new level: "+present.level)

        console.log(" % % % % % % % % % % ")
        console.log("")

        var bistate= this.type.map(Number).reduce(function(a, b){return a+b;})
        LevelButtonDisable(false);
        if(level && sels && sels.length==0)
            LevelButtonDisable(true);

        if(this.level==false && bistate>1)
            LevelButtonDisable(true)

        // console.log("printing the first state:")
        // first_state = TW.partialGraph.states.slice(-1)[0].type;
        // for(var i in first_state) {
        //     if(first_state[i]) {
        //         for(var j in Filters[i])
        //             console.log(j)
        //     }
        // }


        console.log("printing the typestring:", typestring)


        if (TW.filterSliders) {
          if(typestring=="0|1") {
              $("#category0").hide();
              $("#category1").show();

              if($("#slidercat1nodesweight").html()=="")
                  NodeWeightFilter( this.categories , "#slidercat1nodesweight" ,  this.categories[1],  "type" ,"size");

              if($("#slidercat1edgesweight").html()=="")
                  EdgeWeightFilter("#slidercat1edgesweight", "label" , "nodes2", "weight");


              if(present.level!=past.level) {
                  NodeWeightFilter( this.categories , "#slidercat1nodesweight" ,  this.categories[1],  "type" ,"size");
                  EdgeWeightFilter("#slidercat1edgesweight", "label" , "nodes2", "weight");
              }
              set_ClustersLegend ( "clust_default" )
          }

          if(typestring=="1|0") {
              $("#category0").show();
              $("#category1").hide();

              if($("#slidercat0nodesweight").html()=="")
                  NodeWeightFilter( this.categories , "#slidercat0nodesweight" ,  this.categories[0],  "type" ,"size");

              if($("#slidercat0edgesweight").html()=="")
                  EdgeWeightFilter("#slidercat0edgesweight", "label" , "nodes1", "weight");

              if(present.level!=past.level) {
                  NodeWeightFilter( this.categories , "#slidercat0nodesweight" ,  this.categories[0],  "type" ,"size");
                  EdgeWeightFilter("#slidercat0edgesweight", "label" , "nodes1", "weight");
              }
              set_ClustersLegend ( "clust_default" )
          }

          if(typestring=="1|1") {
              $("#category0").show();
              $("#category1").show();
              // if(present.level!=past.level) {
              NodeWeightFilter ( this.categories , "#slidercat0nodesweight" ,  this.categories[0],  "type" ,"size");
              EdgeWeightFilter("#slidercat0edgesweight", "label" , "nodes1", "weight");
              NodeWeightFilter( this.categories , "#slidercat1nodesweight" ,  this.categories[1],  "type" ,"size");
              EdgeWeightFilter("#slidercat1edgesweight", "label" , "nodes2", "weight");
              // }
          }
        }

    }).index();


    if (!TW.filterSliders) {

      var filterEls = document.getElementsByClassName('weight-selectors')

      for (var k in filterEls) {
        if (filterEls[k] && filterEls[k].style) filterEls[k].style.display="none"
      }
      // document.getElementById('slidercat0nodesweight').style.display="none"
      // document.getElementById('slidercat0edgesweight').style.display="none"
      // document.getElementById('slidercat1nodesweight').style.display="none"
      // document.getElementById('slidercat1edgesweight').style.display="none"
    }

    TW.FA2Params = {
      // adapting speed -------------
      slowDown: 1.5,
      startingIterations: 5,
      iterationsPerRender: 3,
      barnesHutOptimize: false,
      // barnesHutTheta: .5,

      // global behavior -----------
      linLogMode: true,
      edgeWeightInfluence: .5,
      gravity: 1,
      strongGravityMode: false,
      scalingRatio: 1,

      adjustSizes: false,     // ~ messy but sort of in favor of overlap prevention

      // favors global centrality
      // (but rather not needed when data already shows topic-centered
      //  node groups and/nor when preferential attachment type of data)
      outboundAttractionDistribution: false
    }

    // init FA2 for any future forceAtlas2 calls
    TW.partialGraph.configForceAtlas2(TW.FA2Params)

    // REFA new sigma.js
    TW.partialGraph.camera.goTo({x:0, y:0, ratio:0.5, angle: 0})

    twjs_.initListeners( categories , TW.partialGraph);

    // run fa2 if settings_explorerjs.fa2enabled == true
    if (fa2enabled) {
      TW.partialGraph.startForceAtlas2();
      $.doTimeout(parseInt(fa2milliseconds) || 5000, function(){
          TW.partialGraph.stopForceAtlas2();
      });
    }

    if( categories.length==1 ) {
        $("#changetype").hide();
        $("#taboppos").remove();

        // if (TW.catSem && TW.catSoc) {
          setTimeout(function () {
              document.querySelector('.etabs a[href="#tabs2"]').click()
          }, 500);
        // }
    }


    // TEST new strategy: TW.Clusters were prepared in parseCustom
    changeGraphAppearanceByFacets(true)

    // set the default legend
    set_ClustersLegend ( "clust_default" )

}

// load optional modules
ProcessDivsFlags() ;

// show any already existing panel
document.getElementById("graph-panels").style.display = "block"

// grey message in the search bar from settings
$("#searchinput").attr('placeholder', TW.strSearchBar) ;


setTimeout( function() {
  theHtml.classList.remove('waiting')
}, 20)

console.log("finish")
