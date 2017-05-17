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
    let start = new ParseCustom(  inFormat , inData );
    let catsInfos = start.scanFile(); //user should choose the order of categories

    TW.categories = catsInfos.categories
    console.log("Categories: ")
    console.log(TW.categories)

    // reverse lookup: category name => category indice
    TW.catDict = catsInfos.lookup_dict

    if (! TW.categories) {
      console.warn ('ParseCustom scanFile found no categories!!')
      TW.categories = []
      TW.catDict = {}
    }
    var possibleStates = makeSystemStates( TW.categories )
    var initialState = buildInitialState( TW.categories ) //[true,false]//

    // XML parsing from ParseCustom
    var dicts = start.makeDicts(TW.categories); // > parse json or gexf, dictfy
    console.warn("parsing result:", dicts)

    TW.Nodes = dicts.nodes;
    TW.Edges = dicts.edges;

    //£TODO not complete for edgeIds in bipartite case !!
    TW.nodeIds = Object.keys(dicts.nodes)  // useful for loops
    TW.edgeIds = Object.keys(dicts.edges)

    // in-place: pre-compute all color/grey/size properties
    prepareNodesRenderingProperties(TW.Nodes)
    prepareEdgesRenderingProperties(TW.Edges, TW.Nodes)

    TW.selectionActive = false  // changes rendering mode

    if (inData.clusters) TW.Clusters = inData.clusters

    // relations already copied in TW.Relations at this point
    // £TODO also test with comex2 for bipart case
    // TW.nodes1 = dicts.n1;//not used

    // a posteriori categories diagnostic
    // ----------------------------------
    // by default TW.categories now match user-suggested catSoc/Sem if present
    // so we just need to handle mismatches here (when user-suggested cats were absent)
    if (TW.categories.length == 2) {
      console.log("== 'bipartite' case ==")
      if (TW.catSoc != TW.categories[0]) {
        console.warn(`Observed social category "${TW.categories[0]}" overwrites user-suggested TW.catSoc ("${TW.catSoc}")`)
        TW.catSoc = TW.categories[0]
      }
      if (TW.catSem != TW.categories[1]) {
        console.warn(`Observed semantic category "${TW.categories[1]}" overwrites user-suggested TW.catSem "(${TW.catSem})"`)
        TW.catSem = TW.categories[1]
      }
    }
    else if (TW.categories.length == 1) {
      console.log("== monopartite case ==")
      // FIXME it would be more coherent with all tina usecases (like gargantext or tweetoscope) for the default category to by catSem instead of Soc
      if (TW.catSoc != TW.categories[0]) {
        console.warn(`Observed unique category "${TW.categories[0]}" overwrites user-suggested TW.catSoc ("${TW.catSoc}")`)
        TW.catSoc = TW.categories[0]
      }
    }
    else {
      console.error("== currently unhandled categorization of node types ==", TW.categories)
    }

    // [ Initiating Sigma-Canvas ]

    // POSS: ideally this should take a TW.settings as parameter
    var twjs_ = new TinaWebJS('#sigma-contnr');

    // add our tw rendering and index customizations into sigma module
    twjs_.init()

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
    TW.graphData = sigma_utils.FillGraph(  initialState , TW.catDict  , TW.Nodes , TW.Edges , TW.graphData );


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

    // NB the list of nodes and edges from TW.graphData will be changed
    //    by changeLevel, changeType or subset sliders

    // shortcuts to the renderer and camera
    TW.cam  = TW.partialGraph.camera
    TW.rend = TW.partialGraph.renderers[0]

    // NB : camera positions are fix if the node is fixed => they only depend on layout
    //      renderer position depend on viewpoint/zoom (like ~ html absolute positions of the node in the div)


    // POSS make it TW.states
    TW.partialGraph.states = []
    TW.partialGraph.states[0] = false;
    TW.partialGraph.states[1] = TW.SystemStates;

    // can be COMMENTED OUT: in specifications categories never change so states shouldn't need them
    // TW.partialGraph.states[1].categories = TW.categories
    // TW.partialGraph.states[1].categoriesDict = TW.catDict;

    // here 'type' means: the categorie(s) that is (are) currently displayed
    TW.partialGraph.states[1].type = initialState;
    TW.partialGraph.states[1].LouvainFait = false;

    // by default category0 is the initial type
    $(".category1").hide();
    
    // [ / Poblating the Sigma-Graph ]


    // ex called for new selections with args like:
    //          (undefined, undefined, [268], undefined)
    //             ^^^^
    //          why type not used (monopart? deprecated?)

    TW.partialGraph.states[1].setState = (function( type , level , sels , oppos ) {
        var bistate=false, typestring=false;
        console.log("IN THE SET STATE METHOD:", this)
        if(!isUndef(type)) {
            this.type = type;
            bistate= type.map(Number).reduce(function(a, b){return a+b;})
            typestring = type.map(Number).join("|")
        }
        if(!isUndef(level)) this.level = level;
        if(!isUndef(sels)) this.selections = sels;
        if(!isUndef(oppos)) this.opposites = oppos;
        this.LouvainFait = false;
        // console.log("")
        // console.log(" % % % % % % % % % % ")
        // console.log("setState type: ", type);
        // console.log("bistate: "+bistate)
        // console.log("level: "+level);
        // console.log("selections: ");
        // console.log(sels)
        // console.log("selections len: ");
        // console.log(sels.length)
        // console.log("opposites: ");
        // console.log(oppos)

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

          // recreate sliders after perimeter changes
          // £TODO fix conditions (was if #slider.html == '' or if level changed)
          //       atm on any state change

          // terms
          if(typestring=="0|1") {
              $(".category0").hide();
              $(".category1").show();


              NodeWeightFilter( "#slidercat1nodesweight" ,  TW.categories[1], "size");
              EdgeWeightFilter("#slidercat1edgesweight", typestring, "weight");
          }

          // docs
          if(typestring=="1|0") {
              $(".category0").show();
              $(".category1").hide();

              NodeWeightFilter( "#slidercat0nodesweight" ,  TW.categories[0], "size");
              EdgeWeightFilter("#slidercat0edgesweight", typestring, "weight");
          }

          // terms and docs
          if(typestring=="1|1") {
              $(".category0").show();
              $(".category1").show();
              NodeWeightFilter( "#slidercat0nodesweight" ,  TW.categories[0], "size");
              NodeWeightFilter( "#slidercat1nodesweight" ,  TW.categories[1], "size");
              EdgeWeightFilter("#slidercat0edgesweight", "1|0", "weight");
              EdgeWeightFilter("#slidercat1edgesweight", "0|1", "weight");
          }
        }

    }).index();


    if (!TW.filterSliders) {

      var filterEls = document.getElementsByClassName('weight-selectors')

      for (var k in filterEls) {
        if (filterEls[k] && filterEls[k].style) filterEls[k].style.display="none"
      }
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


    // init noverlap for any future calls
    TW.partialGraph.configNoverlap({
      nodeMargin: .3,
      scaleNodes: 1.2,
      gridSize: 400,
      speed: 5,
      maxIterations: 10,
      easing: 'quadraticOut', // animation transition function
      duration: 1500   // animation duration
                       // NB animation happens *after* processing
    });

    // REFA new sigma.js
    TW.partialGraph.camera.goTo({x:0, y:0, ratio:0.5, angle: 0})

    twjs_.initListeners(TW.categories , TW.partialGraph);

    // run fa2 if settings_explorerjs.fa2enabled == true
    if (fa2enabled) {
      TW.partialGraph.startForceAtlas2();
      setTimeout(function(){
          TW.partialGraph.stopForceAtlas2();
      },
      parseInt(fa2milliseconds) || 5000
      );
    }


    // adapt the enviroment to monopartite vs. bipartite cases
    if( TW.categories.length==1 ) {
        $("#changetype").hide();
        $("#taboppos").remove();

        // if (TW.catSem && TW.catSoc) {
          setTimeout(function () {
              // tabneigh: show "Related" tab
              document.querySelector('.etabs a[href="#tabs2"]').click()
          }, 500);
        // }
    }
    // for elements hidden by default (cf. css) but useful in bipartite case
    else {
      $("#taboppos").css('display', 'inline-block');
    }


    // should prepare the colors/clusters menu once and for all
    // (previously, needed to be called after changeType/changeLevel)
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
