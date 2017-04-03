/*
 * Customize as you want ;)
 */


function newPopup(url) {
	popupWindow = window.open(url,'popUpWindow','height=700,width=800,left=10,top=10,resizable=yes,scrollbars=yes,toolbar=no,menubar=no,location=no,directories=no,status=no')
}


// Execution:    ChangeGraphAppearanceByAtt( true )
// It scans the existing node-attributes and t keeps only those which are Numeric.
//  then, add the button in the html with the sigmaUtils.clustersBy(x) listener.
// [TODO: fonction un peu lourde dans le profilage]
function ChangeGraphAppearanceByAtt( manualflag ) {

    if ( !isUndef(manualflag) && !TW.colorByAtt ) TW.colorByAtt = manualflag;
    if(!TW.colorByAtt) return;

    // Seeing all the possible attributes!
    var AttsDict = {}
    var Atts_2_Exclude = {}
    var v_nodes = getVisibleNodes();
    for (var i in v_nodes) {
        if(!v_nodes[i].hidden) {

            var id = v_nodes[i].id;

            for(var a in TW.Nodes[id].attributes) {
                var someatt = TW.Nodes[id].attributes[a]

                // Identifying the attribute datatype: exclude strings and objects
                if ( ( typeof(someatt)=="string" && isNaN(Number(someatt)) ) || typeof(someatt)=="object" ) {
                    if (!Atts_2_Exclude[a]) Atts_2_Exclude[a]=0;
                    Atts_2_Exclude[a]++;
                }
            }

            var possible_atts = [];
            if (!isUndef(TW.Nodes[id].attributes))
                possible_atts = Object.keys(TW.Nodes[id].attributes)

            if(!isUndef(v_nodes[i].degree))
                possible_atts.push("degree")
            possible_atts.push("clust_louvain")

            for(var a in possible_atts){
                if ( !AttsDict[ possible_atts[a] ] )
                    AttsDict[ possible_atts[a] ] = 0
                AttsDict[ possible_atts[a] ] ++;
            }

        }
    }

    for(var i in Atts_2_Exclude)
        delete AttsDict[i];

    var AttsDict_sorted = ArraySortByValue(AttsDict, function(a,b){
        return b-a
    });

    // console.log( "I AM IN ChangeGraphAppearanceByAtt( true )" )
    // console.log( AttsDict_sorted )


    var color_menu_info = "";

    if( $( "#colorgraph-menu" ).length>0 ){
      for (var i in AttsDict_sorted) {
          var att_s = AttsDict_sorted[i].key;
          var att_c = AttsDict_sorted[i].value;
          var the_method = "clustersBy"

          // variants
          if(att_s.indexOf("clust")>-1) the_method = "colorsBy"
          if(att_s == "growth_rate") the_method = "colorsRelByBins"
          if(att_s == "age") the_method = "colorsRelByBins"

          color_menu_info += '<li><a href="#" onclick=\''+the_method+'("'+att_s+'")\'>By '+att_s+'('+att_c+')'+'</a></li>'
          // console.log('<li><a href="#" onclick=\''+the_method+'("'+att_s+'")\'>By '+att_s+'('+att_c+')'+'</a></li>')
      }
      $("#colorgraph-menu").html(color_menu_info)
    }
}


function RunLouvain() {

  var node_realdata = []
  var nodesV = getVisibleNodes()
  for(var n in nodesV)
    node_realdata.push( nodesV[n].id )

  var edge_realdata = []
  var edgesV = getVisibleEdges()
  for(var e in edgesV) {
    var st = edgesV[e].id.split(";")
    var info = {
        "source":st[0],
        "target":st[1],
        "weight":edgesV[e].weight
    }
    edge_realdata.push(info)
  }
    var community = jLouvain().nodes(node_realdata).edges(edge_realdata);
    var results = community();
    for(var i in results)
        TW.Nodes[i].attributes["clust_louvain"]=results[i]
}


function SomeEffect( ClusterCode ) {
    console.log( ClusterCode )

    var raw = ClusterCode.split("||")
    var Type=raw[0], Cluster=raw[1], clstID=Number(raw[2]);

    var present = TW.partialGraph.states.slice(-1)[0]; // Last
    var type_t0 = present.type;
    var str_type_t0 = type_t0.map(Number).join("|")
    console.log( "\t"+str_type_t0)


    greyEverything();

    var nodes_2_colour = {};
    var edges_2_colour = {};

    var nodesV = getVisibleNodes()
    for(var i in nodesV) {
        var n = nodesV[i]
        n.forceLabel = false;
        var node = TW.Nodes[n.id]
        if ( node.type==Type && !isUndef(node.attributes[Cluster]) && node.attributes[Cluster]==clstID ) {
            // console.log( n.id + " | " + Cluster + " : " + node.attributes[Cluster] )
            nodes_2_colour[n.id] = n.degree;
        }
    }


    for(var s in nodes_2_colour) {
        if(TW.Relations[str_type_t0] && TW.Relations[str_type_t0][s] ) {
            neigh = TW.Relations[str_type_t0][s]
            if(neigh) {
                for(var j in neigh) {
                    t = neigh[j]
                    if( !isUndef(nodes_2_colour[t]) ) {
                        edges_2_colour[s+";"+t]=true;
                        edges_2_colour[t+";"+s]=true;
                    }
                }
            }
        }
    }


    for(var i in nodes_2_colour) {
        n = TW.partialGraph._core.graph.nodesIndex[i]
        if(n) {
            n.color = n.customAttrs['true_color'];
            n.customAttrs['grey'] = 0;
        }
    }


    for(var i in edges_2_colour) {
        an_edge = TW.partialGraph._core.graph.edgesIndex[i]
        if(!isUndef(an_edge) && !an_edge.hidden){
            // console.log(an_edge)
            an_edge.color = an_edge.customAttrs['true_color'];
            an_edge.customAttrs['grey'] = 0;
        }
    }





    var nodes_2_label = ArraySortByValue(nodes_2_colour, function(a,b){
        return b-a
    });

    for(var n in nodes_2_label) {
        if(n==4)
            break
        var ID = nodes_2_label[n].key
        TW.partialGraph._core.graph.nodesIndex[ID].forceLabel = true;
    }



    overNodes=true;
    TW.partialGraph.draw()
}


function set_ClustersLegend ( daclass ) {
    //TW.partialGraph.states.slice(-1)[0].LouvainFait = true

    $("#legend_for_clusters").removeClass( "my-legend" )
    $("#legend_for_clusters").html("")
    if(daclass==null) return;

    var ClustNB_CurrentColor = {}
    var nodesV = getVisibleNodes()
    for(var i in nodesV) {
        n = nodesV[i]
        color = n.color
        type = TW.Nodes[n.id].type
        clstNB = TW.Nodes[n.id].attributes[daclass]
        ClustNB_CurrentColor[type+"||"+daclass+"||"+clstNB] = color
    }

    LegendDiv = ""
    LegendDiv += '    <div class="legend-title">Map Legend</div>'
    LegendDiv += '    <div class="legend-scale">'
    LegendDiv += '      <ul class="legend-labels">'

    if (daclass=="clust_louvain")
        daclass = "louvain"
    OrderedClustDicts = Object.keys(ClustNB_CurrentColor).sort()
    if( daclass.indexOf("clust")>-1 ) {
        for(var i in OrderedClustDicts) {
            var IDx = OrderedClustDicts[i]
            var raw = IDx.split("||")
            var Type = raw[0]
            var ClustType = raw[1]
            var ClustID = raw[2]
            var Color = ClustNB_CurrentColor[IDx]
            pr ( Color+" : "+ TW.Clusters[Type][ClustType][ClustID] )
            var ColorDiv = '<span style="background:'+Color+';"></span>'
            LegendDiv += '<li onclick=\'SomeEffect("'+IDx+'")\'>'+ColorDiv+ TW.Clusters[Type][ClustType][ClustID]+"</li>"+"\n"
        }
    } else {
        for(var i in OrderedClustDicts) {
            var IDx = OrderedClustDicts[i]
            var Color = ClustNB_CurrentColor[IDx]
            // pr ( Color+" : "+ TW.Clusters[Type][ClustType][ClustID] )
            var ColorDiv = '<span style="background:'+Color+';"></span>'
            LegendDiv += '<li onclick=\'SomeEffect("'+IDx+'")\'>'+ColorDiv+ IDx+"</li>"+"\n"
        }

    }
    LegendDiv += '      </ul>'
    LegendDiv += '    </div>'


    $("#legend_for_clusters").addClass( "my-legend" );
    $("#legend_for_clusters").html( LegendDiv )
}


//For CNRS
function getTopPapers(type){
    if(TW.getAdditionalInfo){
        jsonparams=JSON.stringify(getSelections());
        bi=(Object.keys(categories).length==2)?1:0;
        //jsonparams = jsonparams.replaceAll("&","__and__");
        jsonparams = jsonparams.split('&').join('__and__');
        //dbsPaths.push(getGlobalDBs());
        thisgexf=JSON.stringify(decodeURIComponent(getUrlParam.file));
        image='<img style="display:block; margin: 0px auto;" src="'+TW.APINAME+'img/ajax-loader.gif"></img>';
        $("#tab-container-top").show();
        $("#topPapers").show();
        $("#topPapers").html(image);
        $.ajax({
            type: 'GET',
            url: TW.APINAME+'info_div.php',
            data: "type="+type+"&bi="+bi+"&query="+jsonparams+"&gexf="+thisgexf+"&index="+TW.field[getUrlParam.file],
            //contentType: "application/json",
            //dataType: 'json',
            success : function(data){
                console.log(TW.APINAME+'info_div.php?'+"type="+type+"&bi="+bi+"&query="+jsonparams+"&gexf="+thisgexf+"&index="+TW.field[getUrlParam.file]);
                $("#topPapers").html(data);
            },
            error: function(){
                console.log('Page Not found: getTopPapers');
            }
        });
    }
}


//FOR UNI-PARTITE
function selectionUni(currentNode){
    console.log("\tin selectionUni:"+currentNode.id);
    if(checkBox==false && cursor_size==0) {
        highlightSelectedNodes(false);
        opossites = [];
        selections = [];
        TW.partialGraph.refresh();
    }

    if((typeof selections[currentNode.id])=="undefined"){
        selections[currentNode.id] = 1;
        currentNode.active=true;
    }
    else {
        delete selections[currentNode.id];
        currentNode.active=false;
    }
    //highlightOpossites(nodes1[currentNode.id].neighbours);
    //        currentNode.color = currentNode.customAttrs['true_color'];
    //        currentNode.customAttrs['grey'] = 0;
    //
    //


    TW.partialGraph.zoomTo(TW.partialGraph._core.width / 2, TW.partialGraph._core.height / 2, 0.8);
    TW.partialGraph.refresh();
}

//JUST ADEME
function camaraButton(){
    $("#PhotoGraph").click(function (){

        //canvas=TW.partialGraph._core.domElements.nodes;



        var nodesCtx = TW.partialGraph._core.domElements.nodes;
        /*
        var edgesCtx = document.getElementById("sigma_edges_1").getContext('2d');

        var edgesImg = edgesCtx.getImageData(0, 0, document.getElementById("sigma_edges_1").width, document.getElementById("sigma_edges_1").height)

        nodesCtx.putImageData(edgesImg,0,0);




        //ctx.drawImage(TW.partialGraph._core.domElements.edges,0,0)
        //var oCanvas = ctx;
  */
        //div = document.getElementById("sigma_nodes_1").getContext('2d');
        //ctx = div.getContext("2d");
        //oCanvas.drawImage(TW.partialGraph._core.domElements.edges,0,0);
        Canvas2Image.saveAsPNG(nodesCtx);

        /*
        Canvas2Image.saveAsJPEG(oCanvas); // will prompt the user to save the image as JPEG.
        // Only supported by Firefox.

        Canvas2Image.saveAsBMP(oCanvas);  // will prompt the user to save the image as BMP.


        // returns an <img> element containing the converted PNG image
        var oImgPNG = Canvas2Image.saveAsPNG(oCanvas, true);

        // returns an <img> element containing the converted JPEG image (Only supported by Firefox)
        var oImgJPEG = Canvas2Image.saveAsJPEG(oCanvas, true);

        // returns an <img> element containing the converted BMP image
        var oImgBMP = Canvas2Image.saveAsBMP(oCanvas, true);


        // all the functions also takes width and height arguments.
        // These can be used to scale the resulting image:

        // saves a PNG image scaled to 100x100
        Canvas2Image.saveAsPNG(oCanvas, false, 100, 100);
        */
    });
}

function getTips(){
    param='';

    text =
        "<br>"+
        "Basic Interactions:"+
        "<ul>"+
        "<li>Click on a node to select/unselect and get its information. In case of multiple selection, the button unselect clears all selections,</li>"+
        "<li> Use your mouse scroll to zoom in and out in the graph.</li>"+
        "</ul>"+
        "<br>"+
        "Graph manipulation:"+
        "<ul>"+
        "<li>Node size is proportional to the number of documents with the associated term,</li>"+
        "<li>Use the node filter to create a subgraph with nodes of a given size range (e.g. display only generic terms),</li>"+
        "<li>Link strength is proportional to the strenght of terms association,</li>"+
        "<li>Use the edge filter so create a subgraph with links in a given range (e.g. keep the strongest association).</li>"+
        "</ul>"+
        "<br>"+
        "Global/local view:"+
        "<ul>"+
        "<li>The 'change level' button allows to change between global view and node centered view,</li>"+
        "<li>To explore the neighborhood of a selection click on the 'change level' button.</li>"+
        "</ul>";

    $("#tab-container").hide();
    $("#tab-container-top").hide();
    return text;
}



function draw1Circle(ctx , x , y , color) {
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.5;

    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}


// show Selector circle
// --------------------
// new sigma.js: could be replaced by default _moveHandler with bindings ?
//   => atm rewrote entire function with new values
function trackMouse(e) {
    if(!shift_key) {
        // $.doTimeout(300,function (){
            // new sigma.js 2D mouse context
            var ctx = TW.partialGraph.renderers[0].contexts.mouse;
            ctx.globalCompositeOperation = "source-over";

            // clear zone each time to prevent repeated frame artifacts
            ctx.clearRect(0, 0,
                          TW.partialGraph.renderers[0].container.offsetWidth,
                          TW.partialGraph.renderers[0].container.offsetHeight);

            // testing with overNodes event
            // cf. https://github.com/jacomyal/sigma.js/wiki/Events-API
            if (e.type == "overNodes") {
              x = e.data.captor.clientX
              y = e.data.captor.clientY
            }
            // classic mousemove event or other similar events
            else {
              x = sigma.utils.getX(e);
              y = sigma.utils.getY(e);
            }

            // console.log("trackMouse mod: x", x, "y", y)

            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            ctx.fillStyle = "#71C3FF";
            ctx.globalAlpha = 0.5;
            ctx.beginPath();

            // labels appear
            // var nds = TW.partialGraph.graph.nodes()

            // TODO replace by a hover binding (and POSS use quadtree zone)
            //
            // if(TW.partialGraph.camera.ratio>showLabelsIfZoom){
            //     for(var i in nds){
            //             n=nds[i];
            //             if(n.hidden==false){
            //                 distance = Math.sqrt(
            //                     Math.pow((x-parseInt(n.displayX)),2) +
            //                     Math.pow((y-parseInt(n.displayY)),2)
            //                     );
            //                 if(parseInt(distance)<=cursor_size) {
            //                     n.forceLabel=true;
            //                 } else {
            //                     if(typeof(n.neighbour)!=="undefined") {
            //                         if(!n.neighbour) n.forceLabel=false;
            //                     } else n.forceLabel=false;
            //                 }
            //             }
            //     }
            //     if(TW.partialGraph.forceatlas2 && TW.partialGraph.forceatlas2.count<=1) {
            //         TW.partialGraph.refresh({skipIndexation:true})
            //     }
            // } else {
            //     for(var i in nds){
            //         n=nds[i];
            //         if(!n.hidden){
            //             n.forceLabel=false;
            //             if(typeof(n.neighbour)!=="undefined") {
            //                 if(!n.neighbour) n.forceLabel=false;
            //                 else n.forceLabel=true;
            //             } else n.forceLabel=false;
            //         }
            //     }
            //     if(TW.partialGraph.forceatlas2 && TW.partialGraph.forceatlas2.count<=1) {
            //         TW.partialGraph.refresh({skipIndexation:true})
            //     }
            // }
            ctx.arc(x, y, cursor_size, 0, Math.PI * 2, true);
            //ctx.arc(TW.partialGraph._core.width/2, TW.partialGraph._core.height/2, 4, 0, 2 * Math.PI, true);/*todel*/
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        // });
    }
}

// BASIC MODULARITY
// =================
// ProcessDivsFlags is for adding/removing features from TinawebJS
// each flag is simultaneously 3 things:
//   - the key of a bool config value in DivsFlags (settings_explorerjs)
//   - the dirname of the submodule's files (with a mandatory init.js)
//   - the css class of all html elements added by the submodule
function ProcessDivsFlags() {
    for(var key in TW.DivsFlags) {
        if(TW.DivsFlags[key]===false) {
            $("."+key).remove() ; // hide elements of module's class
        }
        else {
            // console.log("extras:ProcessDivsFlags: key is true: "+key)
            // load JS+CSS items corresponding to the flagname
            my_src_dir = key
            loadJS(my_src_dir+"/init.js") ;
            // ex: for the flag = crowdsourcingTerms
            //     will load ==> JS    crowdsourcingTerms/init.js
            //               ==> other elements listed in init.js
            //                ├── "crowdsourcingTerms"+"/crowdTerms.css"
            //                └── "crowdsourcingTerms"+"/suggest.js"
        }
    }
}


//both obsolete
function closeDialog () {
    $('#windowTitleDialog').modal('hide');
}
function okClicked () {
    //document.title = document.getElementById ("xlInput").value;
    closeDialog ();
}
