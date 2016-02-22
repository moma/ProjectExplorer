
// Function.prototype.index
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

function jsActionOnGexfSelector(gexfLegend , db_json){
    db_json = (db_json)?"&mode=db.json":""
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
var RES = AjaxSync({ URL: file });

if(RES["OK"]) {

    var fileparam;// = { db|api.json , somefile.json|gexf }
    var the_data = RES["data"];
    

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

        TW.getAdditionalInfo = true;

        fileparam = the_file;

        var files_selector = '<select onchange="jsActionOnGexfSelector(this.value , true);">'

        for( var path in the_data ) {
            pr("\t"+path+" has:")
            pr(the_data[path])
            var the_gexfs = the_data[path]["gexfs"]
            pr("\t\tThese are the available  Gexfs:")
            for(var gexf in the_gexfs) {
                pr("\t\t\t"+gexf+ "   -> table:" +the_gexfs[gexf]["semantic"]["table"] )
                TW.field[path+"/"+gexf] = the_gexfs[gexf]["semantic"]["table"]
                TW.gexfDict[path+"/"+gexf] = gexf

                var selected = (the_file==(path+"/"+gexf))?"selected":""
                files_selector += '<option '+selected+'>'+gexf+'</option>'
            }
            console.log( files_selector )
            break;
        }
        files_selector += "</select>"
        $("#network").html(files_selector)



        pr("\n============================\n")
        pr(TW.field)
        pr(TW.gexfDict)
        var sub_RES = AjaxSync({ URL: fileparam });
        the_data = sub_RES["data"]
        fileparam = sub_RES["format"]
        pr(the_data.length)
        pr(fileparam)
        
        getUrlParam.file=the_file;
        console.log(" .  .. . -. - .- . - -.")
        console.log(getUrlParam.file)
        pr("\n============================\n")





    }

    if (file=="api.json") {
        fileparam = file;
    }

    // Reading just a JSON|GEXF
    if ( file!="db.json" && file!="api.json" )
        fileparam = RES["format"];

    
    start = new ParseCustom(  fileparam , the_data );
    categories = start.scanFile(); //user should choose the order of categories
    pr("Categories: ")
    pr(categories)

    var possibleStates = makeSystemStates( categories )
    var initialState = buildInitialState( categories ) //[true,false]//

    var dicts = start.makeDicts(categories);
    TW.Nodes = dicts.nodes;
    TW.Edges = dicts.edges;
    if (the_data.clusters) TW.Clusters = the_data.clusters

    TW.nodes1 = dicts.n1;//not used
    var catDict = dicts.catDict
    pr("CategoriesDict: ")
    pr(catDict)

    TW.categoriesIndex = categories;//to_remove
    TW.catSoc = categories[0];//to_remove
    TW.catSem = (categories[1])?categories[1]:false;//to_remove

    for(var i in categories) {
        TW.Filters[i] = {}
        TW.Filters[i]["#slidercat"+i+"edgesweight"] = true;        
    } 
    
    // [ Initiating Sigma-Canvas ]
    var twjs_ = new TinaWebJS('#sigma-example'); 
    console.log( twjs_.AdjustSigmaCanvas() );
    $( window ).resize(function() { console.log(twjs_.AdjustSigmaCanvas()) });
    // [ / Initiating Sigma-Canvas ]

    console.log("categories: "+categories)
    console.log("initial state: "+initialState)

    // [ Poblating the Sigma-Graph ]
    var sigma_utils = new SigmaUtils();
    TW.partialGraph = sigma.init(document.getElementById('sigma-example'))
        .drawingProperties(sigmaJsDrawingProperties)
        .graphProperties(sigmaJsGraphProperties)
        .mouseProperties(sigmaJsMouseProperties);
    TW.partialGraph = sigma_utils.FillGraph(  initialState , catDict  , dicts.nodes , dicts.edges , TW.partialGraph );
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
                $.doTimeout(100,function (){
                       TW.partialGraph.iterNodes(function (n) {
                           if(TW.Nodes[n.id].type==TW.catSem) {
                               var newval = parseFloat(TW.Nodes[n.id].size) + parseFloat((value-1))*0.3
                               n.size = (newval<1.0)?1:newval;
                               sizeMult[TW.catSem] = parseFloat(value-1)*0.3;
                           }
                       });
                       TW.partialGraph.draw();
                });
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

    TW.partialGraph.zoomTo(TW.partialGraph._core.width / 2, TW.partialGraph._core.height / 2, 0.8).draw();

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
        $.doTimeout(500,function () {
            $('.etabs a[href="#tabs2"]').trigger('click');
        });
    }

    ChangeGraphAppearanceByAtt(true)

    set_ClustersLegend ( "clust_default" )

} else alert("error: "+RES["data"])


// load optional modules
ProcessDivsFlags() ;

// grey message in the search bar from settings
$("#searchinput").attr('placeholder', TW.strSearchBar) ;

console.log("finish")



