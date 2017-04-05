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
    TYPE = (!TYPE)?"GET":"POST"
    if(DT && (DT=="jsonp" || DT=="json")) CT="application/json";
    // console.log(TYPE, URL, DATA, CT , DT)
    $.ajax({
            type: TYPE,
            url: URL,
            data: DATA,
            contentType: CT,
            dataType: DT,
            async: false,
            success : function(data, textStatus, jqXHR) {
                header = jqXHR.getResponseHeader("Content-Type")
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
    gexfLegend = gexfBasename+".gexf"
    if(getGexfPath[gexfLegend])
        window.location=window.location.origin+window.location.pathname+"?file="+encodeURIComponent(getGexfPath(gexfLegend))+db_json;
    else
        window.location=window.location.origin+window.location.pathname+"?file="+encodeURIComponent( gexfLegend )+db_json;
}


var file =""
if(!isUndef(getUrlParam.mode)) { // if {db|api}.json
    file = getUrlParam.mode
} else {
    if( !isUndef(getUrlParam.file) )
        TW.mainfile.unshift( getUrlParam.file );

    var unique_mainfile = TW.mainfile.filter(function(item, pos) {
        return TW.mainfile.indexOf(item) == pos;
    });
    file = (Array.isArray(TW.mainfile))?TW.mainfile[0]:TW.mainfile;
}

// RES == { OK: true, format: "json", data: Object }
var RES = AjaxSync({ URL: file });

if(RES["OK"]) {

    var fileparam;// = { db|api.json , somefile.json|gexf }
    var the_data = RES["data"];

    console.log('RES', RES)


    var the_file = "";
    if ( !isUndef(getUrlParam.mode) && getUrlParam.mode=="db.json") {

        var first_file = "" , first_path = ""
        for( var path in the_data ) {
            first_file = the_data[path]["first"]
            first_path = path
            break;
        }

        if( isUndef(getUrlParam.file) ) {
            the_file = first_path+"/"+first_file
        } else {
            the_file = first_path+"/"+getUrlParam.file
        }

        fileparam = the_file;

        var files_selector = '<select onchange="jsActionOnGexfSelector(this.value , true);">'

        for( var path in the_data ) {
            console.log("\t"+path+" has:")
            console.log(the_data[path])
            var the_gexfs = the_data[path]["gexfs"]
            console.log("\t\tThese are the available  Gexfs:")
            for(var gexf in the_gexfs) {
                var gexfBasename = gexf.replace(/\.gexf$/, "") // more human-readable in the menu
                console.log("\t\t\t"+gexf+ "   -> table:" +the_gexfs[gexf]["semantic"]["table"] )
                TW.field[path+"/"+gexf] = the_gexfs[gexf]["semantic"]["table"]
                TW.gexfDict[path+"/"+gexf] = gexf

                var selected = (the_file==(path+"/"+gexf))?"selected":""
                files_selector += '<option '+selected+'>'+gexfBasename+'</option>'
            }
            console.log( files_selector )
            break;
        }
        files_selector += "</select>"
        $("#network").html(files_selector)



        console.log("\n============================\n")
        console.log(TW.field)
        console.log(TW.gexfDict)
        var sub_RES = AjaxSync({ URL: fileparam });
        the_data = sub_RES["data"]
        fileparam = sub_RES["format"]
        console.log(the_data.length)
        console.log(fileparam)

        getUrlParam.file=the_file;
        console.log(" .  .. . -. - .- . - -.")
        console.log(getUrlParam.file)
        console.log("\n============================\n")

    }

    if (file=="api.json") {
        fileparam = file;
    }

    // Reading just a JSON|GEXF
    if ( file!="db.json" && file!="api.json" )
        fileparam = RES["format"];

    console.log("parsing the data")
    start = new ParseCustom(  fileparam , the_data );
    categories = start.scanFile(); //user should choose the order of categories
    console.log("Categories: ")
    console.log(categories)

    var possibleStates = makeSystemStates( categories )
    var initialState = buildInitialState( categories ) //[true,false]//

    var dicts = start.makeDicts(categories);
    TW.Nodes = dicts.nodes;
    TW.Edges = dicts.edges;
    if (the_data.clusters) TW.Clusters = the_data.clusters

    TW.nodes1 = dicts.n1;//not used
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
    // NB new sigma.js: autoResize (no need for AdjustSigmaCanvas + sigmaLimits)

    console.log("categories: "+categories)
    console.log("initial state: "+initialState)

    // [ Poblating the Sigma-Graph ]
    var sigma_utils = new SigmaUtils();


    // preparing the data and settings
    TW.graphData = {nodes: [], edges: []}
    TW.graphData = sigma_utils.FillGraph(  initialState , catDict  , dicts.nodes , dicts.edges , TW.graphData );


    var customSettings = Object.assign(
        {
            drawEdges: true,
            drawNodes: true,
            drawLabels: true,
            // nodesPowRatio: 1,
            labelSize: "proportional",
            font: "Ubuntu Condensed",
            // labelColor: "node",
            fontStyle: "bold",
            batchEdgesDrawing: false,

            autoResize: true,
            mouseEnabled: true,
            touchEnabled: false
        },
        sigmaJsDrawingProperties,
        sigmaJsGraphProperties,
        sigmaJsMouseProperties
    )

    console.log("customSettings", customSettings)


    // custom nodes rendering
    if (customSettings['twNodeRendBorder']) {
      // overriding the def is simplest
      // (could also do it by type)
      sigma.canvas.nodes.def = sigma_utils.twRender.canvas.nodes.withBorders
    }

    // custom edges rendering registered under 'curve'
    sigma.canvas.edges.curve = sigma_utils.twRender.canvas.edges.curve

    // custom labels rendering
    //  - based on the normal one sigma.canvas.labels.def
    //  - additionnaly supports 'forcelabel' node property
    sigma.canvas.labels.def = sigma_utils.twRender.canvas.labels.def

    // ==================================================================
    // sigma js library invocation (https://github.com/jacomyal/sigma.js)
    // ==================================================================
    TW.partialGraph = new sigma({
        graph: TW.graphData,
        container: 'sigma-contnr',
        renderer: {
            container: document.getElementById('sigma-contnr'),
            type: sigma.renderers.canvas
        },
        settings: customSettings
    });

    // shortcuts to the renderer and camera
    TW.cam  = TW.partialGraph.camera
    TW.rend = TW.partialGraph.renderers[0]

    // NB : camera positions are fix if the node is fixed => they only depend on layout
    //      renderer position depend on viewpoint/zoom (like ~ html absolute positions of the node in the div)

    // useful
    TW.partialGraph.nNodes = TW.partialGraph.graph.nodes().length
    TW.partialGraph.nEdges = TW.partialGraph.graph.edges().length



    TW.partialGraph.states = []
    TW.partialGraph.states[0] = false;
    TW.partialGraph.states[1] = TW.SystemStates;
    TW.partialGraph.states[1].categories = categories
    TW.partialGraph.states[1].categoriesDict = catDict;
    TW.partialGraph.states[1].type = initialState;
    TW.partialGraph.states[1].LouvainFait = false;
    // [ / Poblating the Sigma-Graph ]

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
        // console.log("type: "+thetype.map(Number));
        console.log("bistate: "+bistate)
        console.log("level: "+level);
        console.log("selections: ");
        console.log(sels)
        console.log("selections2: ");
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

        console.log("printing the typestring:")
        console.log(typestring)

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
        } else {

        //finished
        $("#slidercat1nodessize").freshslider({
            step:1,
            min:-20,
            max:20,
            value:0,
            bgcolor:"#FFA500",
            onchange:function(value){
                setTimeout(function (){
                       // POSS: custom index by n.type
                       var nds = TW.partialGraph.graph.nodes()
                       for (var j in nds) {
                         var n = nds[j]
                         if(TW.Nodes[n.id].type==TW.catSem) {
                           var newval = parseFloat(TW.Nodes[n.id].size) + parseFloat((value-1))*0.3
                           n.size = (newval<1.0)?1:newval;
                           sizeMult[TW.catSem] = parseFloat(value-1)*0.3;
                         }
                       }
                       TW.partialGraph.refresh({skipIndexation:true});
                },
                100);
            }
        });

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
    }).index();


    // REFA new sigma.js
    TW.partialGraph.camera.goTo({x:0, y:0, ratio:.8, angle: 0})

    // fa2enabled=true; TW.partialGraph.zoomTo(TW.partialGraph._core.width / 2, TW.partialGraph._core.height / 2, 0.8).draw();
    // $.doTimeout(1,function(){
    //     fa2enabled=true; TW.partialGraph.startForceAtlas2();
    //     $.doTimeout(10,function(){
    //         TW.partialGraph.stopForceAtlas2();
    //     });
    // });

    twjs_.initListeners( categories , TW.partialGraph);

    if( categories.length==1 ) {
        $("#changetype").hide();
        $("#taboppos").remove();

        if (TW.catSem && TW.catSoc) {
          setTimeout(function () {
              document.querySelector('.etabs a[href="#tabs2"]').click()
          }, 500);
        }
    }

    ChangeGraphAppearanceByAtt(true)

    set_ClustersLegend ( "clust_default" )

} else alert("error: "+RES["data"])


// load optional modules
ProcessDivsFlags() ;

// show any already existing panel
document.getElementById("graph-panels").style.display = "block"

// grey message in the search bar from settings
$("#searchinput").attr('placeholder', TW.strSearchBar) ;

console.log("finish")
