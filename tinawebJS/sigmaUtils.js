


SigmaUtils = function () {
    this.nbCats = 0;

    // input = GEXFstring
    this.FillGraph = function( initialState , catDict  , nodes, edges , graph ) {

        console.log("Filling the graaaaph:")
        console.log(catDict)
        for(var i in nodes) {
            var n = nodes[i];

            if(initialState[catDict[n.type]]) {
                var node = {
                    id : n.id,
                    label : n.label,
                    // 3 decimals is way more tractable
                    // and quite enough in precision !!
                    size : Math.round(n.size*1000)/1000,
                    color : n.color,
                    x : n.x,
                    y : n.y,
                    type : n.type,
                    // new setup (TODO rm the old at TinaWebJS nodes_2_colour)
                    customAttrs : {
                      grey: 0,
                      true_color : n.color
                    }
                }
                if(n.shape) node.shape = n.shape;
                // console.log("FillGraph, created new node:", node)

                if(Number(n.id)==287) console.log("node 287:", n, node)

                // REFA new way => no separate id
                graph.nodes.push( node);

                // fill the "labels" global variable
                updateSearchLabels( n.id , n.label , n.type);
            }
        }

        var typeNow = initialState.map(Number).join("|")

        for(var i in TW.Relations[typeNow]) {
            s = i;
            for(var j in TW.Relations[typeNow][i]) {
                t = TW.Relations[typeNow][i][j]
                e = TW.Edges[s+";"+t]
                if(e) {
                    if(e.source != e.target) {
                        var edge = {

                            // sigma mandatory properties
                            id : e.id,
                            // REFA was: sourceID, targetID
                            source : e.source,
                            target : e.target,
                            weight : e.weight,
                            // size : e.weight,   // REFA s/weight/size/ ?

                            color : sigmaTools.edgeColor(e.source, e.target, nodes),

                            hidden : false,
                            // twjs additional properties
                            type : e.type,
                            customAttrs : {
                              grey: 0,
                              true_color : n.color
                            }
                        }

                        // console.log("edge.color", edge.color)

                        // REFA new way
                        graph.edges.push( edge);
                    }
                }
            }
        }
        return graph;
    }// output = sigma graph




    // ================= alternative rendering =====================
    // alternative subrenderers for canvas rendering of sigma instances

    // cf. http://yomguithereal.github.io/articles/node-border-renderer/

    // same hierarchy as in sigma.canvas
    this.twRender = {canvas: {nodes: {}, edges: {}, labels: {}}}

    this.twRender.canvas.labels.def = function(node, context, settings) {
      var fontSize,
          prefix = settings('prefix') || '',
          size = node[prefix + 'size'];
          activeFlag = node['active'] || node['forceLabel']
          // NB active is used in all TW selections
          //    forceLabel is seldom used

      if (!activeFlag && size < settings('labelThreshold'))
        return;

      if (!node.label || typeof node.label !== 'string')
        return;

      fontSize = (settings('labelSize') === 'fixed') ?
        settings('defaultLabelSize') :
        settings('labelSizeRatio') * size;

      // we also boost size of active nodes
      if (activeFlag)  fontSize *= 3


      context.font = (settings('fontStyle') ? settings('fontStyle') + ' ' : '') +
        fontSize + 'px ' + settings('font');
      context.fillStyle = (settings('labelColor') === 'node') ?
        (node.color || settings('defaultNodeColor')) :
        settings('defaultLabelColor');

      context.fillText(
        node.label,
        Math.round(node[prefix + 'x'] + size + 3),
        Math.round(node[prefix + 'y'] + fontSize / 3)
      );
    };

    // source: github.com/jacomyal/sigma.js/commit/25e2153
    // POSS: modify to incorporate mix colors
    this.twRender.canvas.edges.curve = function(edge, source, target, context, settings) {
      var color = edge.color,
        prefix = settings('prefix') || '',
        edgeColor = settings('edgeColor'),
        defaultNodeColor = settings('defaultNodeColor'),
        defaultEdgeColor = settings('defaultEdgeColor');

      if (!color)
        switch (edgeColor) {
          case 'source':
            color = source.color || defaultNodeColor;
            break;
          case 'target':
            color = target.color || defaultNodeColor;
            break;
          default:
            color = defaultEdgeColor;
            break;
        }

      context.strokeStyle = color;
      context.lineWidth = edge[prefix + 'size'] || 1;
      context.beginPath();
      context.moveTo(
        source[prefix + 'x'],
        source[prefix + 'y']
      );
      context.quadraticCurveTo(
        (source[prefix + 'x'] + target[prefix + 'x']) / 2 +
          (target[prefix + 'y'] - source[prefix + 'y']) / 4,
        (source[prefix + 'y'] + target[prefix + 'y']) / 2 +
          (source[prefix + 'x'] - target[prefix + 'x']) / 4,
        target[prefix + 'x'],
        target[prefix + 'y']
      );
      context.stroke();
    };

    // node rendering with borders
    this.twRender.canvas.nodes.withBorders = function(node, context, settings) {
        var prefix = settings('prefix') || '';

        if (settings('twNodeRendBorderSize') > 0) {
          context.beginPath();
          context.fillStyle = settings('twNodeRendBorderColor') || "#000"
          context.arc(
            node[prefix + 'x'],
            node[prefix + 'y'],
            node[prefix + 'size'] + settings('twNodeRendBorderSize'),
            0,
            Math.PI * 2,
            true
          );
          context.closePath();
          context.fill();
        }

        context.fillStyle = node.color || settings('defaultNodeColor');
        context.beginPath();
        context.arc(
          node[prefix + 'x'],
          node[prefix + 'y'],
          node[prefix + 'size'],
          0,
          Math.PI * 2,
          true
        );
        context.closePath();
        context.fill();
      };


      this.toggleEdges = function() {
        var now_flag = TW.partialGraph.settings('drawEdges')
        TW.partialGraph.settings('drawEdges', !now_flag)
        TW.partialGraph.refresh({skipIndexation:true})
      }




    // ================ /alternative rendering =====================

}

//for socialgraph
function showMeSomeLabels(N){
        /*======= Show some labels at the beginning =======*/
        minIn=50,
        maxIn=0,
        minOut=50,
        maxOut=0;

        // new sigma.js accessor
        allNodes = TW.partialGraph.graph.nodes()
        for( j=0 ; j < allNodes.length ; j++ ) {
            n = allNodes[j]
            if(n.hidden==false){
                if(parseInt(n.inDegree) < minIn) minIn= n.inDegree;
                if(parseInt(n.inDegree) > maxIn) maxIn= n.inDegree;
                if(parseInt(n.outDegree) < minOut) minOut= n.outDegree;
                if(parseInt(n.outDegree) > maxOut) maxOut= n.outDegree;
            }
        }
        counter=0;
        n = getVisibleNodes();
        for(i=0;i<n.length;i++) {
            if(n[i].hidden==false){
                if(n[i].inDegree==minIn && n[i].forceLabel==false) {
                    n[i].forceLabel=true;
                    counter++;
                }
                if(n[i].inDegree==maxIn && n[i].forceLabel==false) {
                    n[i].forceLabel=true;
                    counter++;
                }
                if(n[i].outDegree==minOut && n[i].forceLabel==false) {
                    n[i].forceLabel=true;
                    counter++;
                }
                if(n[i].outDegree==maxOut && n[i].forceLabel==false) {
                    n[i].forceLabel=true;
                    counter++;
                }
                if(counter==N) break;
            }
        }
        // new sigma.js
        TW.partialGraph.refresh({ skipIndexation: true });
        /*======= Show some labels at the beginning =======*/
}


// new sigma.js accessors
function getnodes(){
    return TW.partialGraph.graph.nodes();
}

// new sigma.js : use graph.nodes(node_id) and graph.edges(edge_id)
// function getnodesIndex()
// function getedgesIndex()
// function getn(id)
//
// function gete(id){
//     return TW.partialGraph._core.graph.edgesIndex[id];
// }


function getedges(){
    return TW.partialGraph.graph.edges();
}

function getVisibleEdges() {
  // new sigma js POSS custom index to avoid loop
  return TW.partialGraph.graph.edges().filter(function(e) {
                return !e['hidden'];
  });
}

function getVisibleNodes() {
  // new sigma js POSS custom index to avoid loop
  return TW.partialGraph.graph.nodes().filter(function(n) {
              return !n['hidden'];
  });
}


function getNodesByAtt(att) {
    return TW.partialGraph.graph.nodes().filter(function(n) {
                return n['type']==att;
    });
}

// new sigma.js
function find(lquery){
    var results=[];
    if (typeof lquery == 'string' && lquery.length > 0) {
        lquery=lquery.toLowerCase() ;
        var nds = getnodes()
        // console.log("FIND: looking among nodes", nds)
        for(var i in nds){
            var n=nds[i];
            if(! n.hidden){
                var possiblematch=n.label.toLowerCase()
                // string.indexOf(substring) faster than search/match
                if (possiblematch.indexOf(lquery)!==-1) {
                    results.push(n);
                }
            }
        }
    }
    return results;
}

function exactfind(label) {
    nds=getnodes();
    if (typeof lquery == 'string' && lquery.length > 0) {
        for(var i in nds){
            n=nds[i];
            if(!n.hidden){
                if (n.label==label) {
                    return n;
                }
            }
        }
    }
    return null;
}


function getNodeLabels(elems){
    var labelss=[]
    for(var i in elems){
        var id=(!isUndef(elems[i].key))?elems[i].key:i
        labelss.push(TW.Nodes[id].label)
    }
    return labelss
}

function getNodeIDs(elems){
    return Object.keys(elems)
}


function getSelections(){
        params=[];
        for(var i in selections){
            params.push(TW.Nodes[i].label);
        }
        return params;
}


//This receives an array not a dict!
//  i added an excpt... why
function getNeighs(sels,arr) {
    neighDict={};
    for(var i in sels) {
        id = sels[i]
        if(!isUndef(arr[id])) {
            A=arr[id].neighbours;
            for(var j in A){
                neighDict[A[j]]=1
            }
            neighDict[id]=1;
        }
    }
    return Object.keys(neighDict);
}//It returns an array not a dict!

//Using bipartiteN2D or bipartiteD2N
//This receives an array not a dict!
function getNeighs2(sels,arr){
    neighDict={};
    for(var i in sels) {
        id = sels[i]
        if(!isUndef(arr[id])) {
            A=arr[id].neighbours;
            for(var j in A){
                neighDict[A[j]]=1
            }
            // neighDict[id]=1;
        }
    }
    return Object.keys(neighDict);
}//It returns an array not a dict!

//to general utils
function getArrSubkeys(arr,id) {
    var result = []
    for(var i in arr) {
        result.push(arr[i][id])
    }
    return result;
}

function clustersBy(daclass) {

    cancelSelection(false);
    var v_nodes = getVisibleNodes();
    var min_pow = 0;
    for(var i in v_nodes) {
        var the_node = TW.Nodes[ v_nodes[i].id ]
        var attval = ( isUndef(the_node.attributes) || isUndef(the_node.attributes[daclass]) )? v_nodes[i][daclass]: the_node.attributes[daclass];
        if( !isNaN(parseFloat(attval)) ) { //is float
            while(true) {
                var themult = Math.pow(10,min_pow);
                if(parseFloat(attval)==0.0) break;
                if ( (parseFloat(attval)*themult)<1.0 ) {
                    min_pow++;
                } else break;
            }
        }
    }

    var NodeID_Val = {}
    var real_min = 1000000;
    var real_max = -1;
    var themult = Math.pow(10,min_pow);
    for(var i in v_nodes) {
        var the_node = TW.Nodes[ v_nodes[i].id ]
        var attval = ( isUndef(the_node.attributes) || isUndef(the_node.attributes[daclass]) )? v_nodes[i][daclass]: the_node.attributes[daclass];
        var attnumber = Number(attval);
        var round_number = Math.round(  attnumber*themult ) ;

        NodeID_Val[v_nodes[i].id] = { "round":round_number , "real":attnumber };

        if (round_number<real_min) real_min = round_number;
        if (round_number>real_max) real_max = round_number;
    }



    console.log(" - - - - - - - - -- - - ")
    console.log(real_min)
    console.log(real_max)
    console.log("10^"+min_pow)
    console.log("the mult: "+themult)
    console.log(" - - - - - - - - -- - - ")


    //    [ Scaling node colours(0-255) and sizes(3-5) ]
    var Min_color = 0;
    var Max_color = 255;
    var Min_size = 2;
    var Max_size= 6;
    for(var i in NodeID_Val) {

        var newval_color = Math.round( ( Min_color+(NodeID_Val[i]["round"]-real_min)*((Max_color-Min_color)/(real_max-real_min)) ) );
        var hex_color = rgbToHex(255, (255-newval_color) , 0)
        TW.partialGraph.graph.nodes(i).color = hex_color

        var newval_size = Math.round( ( Min_size+(NodeID_Val[i]["round"]-real_min)*((Max_size-Min_size)/(real_max-real_min)) ) );
        TW.partialGraph.graph.nodes(i).size = newval_size;
        // console.log("real:"+ NodeID_Val[i]["real"] + " | newvalue: "+newval_size)

        TW.partialGraph.graph.nodes(i).label = "("+NodeID_Val[i]["real"].toFixed(min_pow)+") "+TW.Nodes[i].label
    }
    //    [ / Scaling node colours(0-255) and sizes(3-5) ]




    //    [ Edge-colour by source-target nodes-colours combination ]
    repaintEdges()
    //    [ / Edge-colour by source-target nodes-colours combination ]

    set_ClustersLegend ( null )

    TW.partialGraph.refresh({skipIndexation: true});
}


// for debug of colorsRelByBins
var totalsPerBinMin = {
    '-1000000':0, '-75':0, '-50':0, '-25':0, '-10':0, '10':0, '25':0, '50':0, '75':0, '100':0, '125':0, '150':0
  }

// Edge-colour by source-target nodes-colours combination
function repaintEdges() {
  var v_edges = getVisibleEdges();
  for(var e in v_edges) {
      var e_id = v_edges[e].id;
      var a = TW.partialGraph.graph.nodes(v_edges[e].source).color;
      var b = TW.partialGraph.graph.nodes(v_edges[e].target).color;
      a = hex2rga(a);
      b = hex2rga(b);
      var r = (a[0] + b[0]) >> 1;
      var g = (a[1] + b[1]) >> 1;
      var b = (a[2] + b[2]) >> 1;
      TW.partialGraph.graph.edges(e_id).color = "rgba("+[r,g,b].join(",")+",0.5)";
  }
}

// rewrite of clustersBy with binning and for attributes that can have negative float values
function colorsRelByBins(daclass) {

    cancelSelection(false);
    // 12 colors
    var binColors = [
        "#005197",  //blue    binMin -∞
        "#3c76fb",        //  binMin -75
        "#5c8af2",        //  binMin -50
        "#64c5f2",        //  binMin -25
        "#bae64f",//epsilon   binMin -10  binMin 10
        "#f9f008",        //  binMin 10
        "#f9da08",        //  binMin 25
        "#fab207",        //  binMin 50
        "#fa9607",        //  binMin 75
        "#fa6e07",        //  binMin 100
        "#fa4607", // red     binMin 125
        "#991B1E"         //  binMin 150
    ];

    // spare color 13 "#64e0f2",

    var tickThresholds = [-1000000,-75,-50,-25,-15,15,25,50,75,100,125,150, 1000000]

    // £TODO put colors and thresholds as params or calculate thresholds like eg d3.histogram
    if (daclass == 'age') {
        tickThresholds = [-1000000,1992,1994,1996,1998,2000,2002,2004,2006,2008,2010,2012,2014,2016]
        // and add a grey color for the first timeperiod
        binColors.unshift("#F9F7ED")
    }
    else if (daclass == 'growth_rate') {
      binColors[4] = ""
      binColors = [
          "#005197",  //blue    binMin -∞
          "#3c76fb",        //  binMin -75
          "#5c8af2",        //  binMin -50
          "#64c5f2",        //  binMin -25
          "#F9F7ED",//epsilon   binMin -15
          "#bae64f",        //  binMin 15
          "#f9f008",        //  binMin 25
          "#fab207",        //  binMin 50
          "#fa9607",        //  binMin 75
          "#fa6e07",        //  binMin 100
          "#fa4607", // red     binMin 125
          "#991B1E"         //  binMin 150
      ];

    }

    // get the nodes
    var v_nodes = getVisibleNodes();
    for(var i in v_nodes) {
        var theId = v_nodes[i].id
        var theNode = TW.Nodes[ theId ]
        var attval = ( isUndef(theNode.attributes) || isUndef(theNode.attributes[daclass]) )? v_nodes[i][daclass]: theNode.attributes[daclass];
        var theVal = parseFloat(attval)
        if( !isNaN(theVal) ) { //is float
            // iterate over bins
            for(var j=0 ; j < tickThresholds.length-1; j++) {
                var binMin = tickThresholds[j]
                var binMax = tickThresholds[(j+1)]
                if((theVal >= binMin) && (theVal < binMax)) {
                    TW.partialGraph._core.graph.nodesIndex[theId].binMin = binMin
                    TW.partialGraph._core.graph.nodesIndex[theId].color = binColors[j]

                    totalsPerBinMin[binMin]++
                    break
                }
            }
        }
    }


    //    [ Edge-colour by source-target nodes-colours combination ]
    repaintEdges()
    //    [ / Edge-colour by source-target nodes-colours combination ]

    set_ClustersLegend ( null )

    TW.partialGraph.refresh({skipIndexation: true});
}



function colorsBy(daclass) {

    console.log("")
    console.log(" = = = = = = = = = = = = = = = = = ")
    console.log(" = = = = = = = = = = = = = = = = = ")
    console.log("colorsBy (    "+daclass+"    )")
    console.log(" = = = = = = = = = = = = = = = = = ")
    console.log(" = = = = = = = = = = = = = = = = = ")
    console.log("")

    if(daclass=="clust_louvain") {
        if(!TW.partialGraph.states.slice(-1)[0].LouvainFait) {
            RunLouvain()
            TW.partialGraph.states.slice(-1)[0].LouvainFait = true
        }
    }

    var v_nodes = getVisibleNodes();


    if (daclass=="clust_default") {
        for(var i in v_nodes) {
          var original_node_color = TW.Nodes[ v_nodes[i].id ].color
          TW.partialGraph.graph.nodes(v_nodes[i].id).color = original_node_color
        }
    }
    else {
      // shuffle on entire array is better than random sorting function on each element
      var randomColorList = shuffle(colorList)

      for(var i in v_nodes) {
          var the_node = TW.Nodes[ v_nodes[i].id ]
          var attval = ( isUndef(the_node.attributes) || isUndef(the_node.attributes[daclass]) )? v_nodes[i][daclass]: the_node.attributes[daclass];
          TW.partialGraph.graph.nodes(v_nodes[i].id).color = randomColorList[ attval ]
      }
    }

    //    [ Edge-colour by source-target nodes-colours combination ]
    var v_edges = getVisibleEdges();
    for(var e in v_edges) {
        var e_id = v_edges[e].id;
        var a = v_edges[e].source.color;
        var b = v_edges[e].target.color;
        if (a && b) {
            a = hex2rga(a);
            b = hex2rga(b);
            var r = (a[0] + b[0]) >> 1;
            var g = (a[1] + b[1]) >> 1;
            var b = (a[2] + b[2]) >> 1;
            TW.partialGraph.graph.edges(e_id).color = "rgba("+[r,g,b].join(",")+",0.5)";
        }
    }
    //    [ / Edge-colour by source-target nodes-colours combination ]
    set_ClustersLegend ( daclass )
    TW.partialGraph.refresh({skipIndexation: true});
}

//just for fun
function makeEdgeWeightUndef() {
    for(var e in TW.partialGraph._core.graph.edges) {
        TW.partialGraph._core.graph.edges[e].weight=1;
    }
}


// shuffle algo from stackoverflow.com/a/6274398/2489184
function shuffle(array) {
    var counter = array.length;

    // While there are elements in the array
    while (counter > 0) {
        // Pick a random index
        let index = Math.floor(Math.random() * counter);

        // Decrease counter by 1
        counter--;

        // And swap the last element with it
        let temp = array[counter];
        array[counter] = array[index];
        array[index] = temp;
    }

    return array;
}
