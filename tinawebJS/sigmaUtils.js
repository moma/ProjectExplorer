'use strict';

SigmaUtils = function () {
    this.nbCats = 0;

    // input = GEXFstring
    this.FillGraph = function( initialActivetypes , catDict  , nodes, edges , graph ) {

        console.log("Filling the graaaaph:")
        console.log("FillGraph catDict",catDict)
        // console.log("FillGraph nodes",nodes)
        // console.log("FillGraph edges",edges)
        for(var i in nodes) {
            var n = nodes[i];
            // console.debug('tr >>> fgr node', n)

            if(initialActivetypes[catDict[n.type]] || TW.debugFlags.initialShowAll) {
                // var node = {
                //     id : n.id,
                //     label : n.label,
                //     size : n.size,
                //     color : n.color,
                //     x : n.x,
                //     y : n.y,
                //     type : n.type,
                //     customAttrs : n.customAttrs,
                // }
                // if(n.shape) node.shape = n.shape;
                // // console.log("FillGraph, created new node:", node)
                //
                // graph.nodes.push( node);

                // no attributes to remove: I use n directly
                graph.nodes.push(n);

                if(i==2) console.log("node 2 ("+n.id+")", n)

                // fill the "labels" global variable
                updateSearchLabels( n.id , n.label , n.type);
            }
        }


        // the typestring of the activetypes is the key to stored Relations (<=> edges)
        var activetypesKey = initialActivetypes.map(Number).join("|")

        for(var i in TW.Relations[activetypesKey]) {
            let s = i;
            for(var j in TW.Relations[activetypesKey][i]) {
                let t = TW.Relations[activetypesKey][i][j]
                let e = TW.Edges[s+";"+t]
                if(e) {
                    if(e.source != e.target) {
                        graph.edges.push( e);
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
    this.twRender = {canvas: {nodes: {}, edges: {}, labels: {}, hovers: {}}}

    this.twRender.canvas.labels.largeractive = function(node, context, settings) {

      var fontSize,
          prefix = settings('prefix') || '',
          size = node[prefix + 'size'],
          activeFlag = node['active'] || node.customAttrs['forceLabel'],
          neighborFlag = node.customAttrs['highlight'],
          labelColor = (settings('labelColor') === 'node') ?
            (node.color || settings('defaultNodeColor')) :
            settings('defaultLabelColor') ;
          // NB active is used in all TW selections
          //    forceLabel is used in cluster highlighting
          //    highlight is used for selection's neighbors or cluster highlighting

      let X = node[prefix + 'x']
      let Y = node[prefix + 'y']

      if (!activeFlag && size < settings('labelThreshold'))
        return;

      if (!node.label || typeof node.label !== 'string')
        return;

      fontSize = (settings('labelSize') === 'fixed') ?
        settings('defaultLabelSize') :
        settings('labelSizeRatio') * size;

      // our customization: active nodes like zoom x2 post-its
      if (activeFlag)  {
        fontSize *= 2


        // Label background (aligned on hover equivalent):
        var x,y,w,h,e,
        fontStyle = settings('hoverFontStyle') || settings('fontStyle') // for label background

        context.font = (fontStyle ? fontStyle + ' ' : '') +
          fontSize + 'px ' + (settings('hoverFont') || settings('font'));

        context.beginPath();

        if (TW.selectedColor == "node")
          context.fillStyle = TW.handpickedcolor? node.customAttrs.alt_color : node.color; // node's
        else
          context.fillStyle = "#F7E521"; // yellow

        if (node.label && settings('labelHoverShadow')) {
          context.shadowOffsetX = 0;
          context.shadowOffsetY = 0;
          context.shadowBlur = 8;
          context.shadowColor = settings('labelHoverShadowColor');
        }

        if (node.label && typeof node.label === 'string') {
          x = Math.round(X - fontSize / 2 - 2);
          y = Math.round(Y - fontSize / 2 - 2);
          w = Math.round(
            context.measureText(node.label).width + fontSize / 2 + size + 12
          );
          h = Math.round(fontSize + 4);
          e = Math.round(fontSize / 2 + 2);

          context.moveTo(x, y + e);
          context.arcTo(x, y, x + e, y, e);
          context.lineTo(x + w, y);
          context.lineTo(x + w, y + h);
          context.lineTo(x + e, y + h);
          context.arcTo(x, y + h, x, y + h - e, e);
          context.lineTo(x, y + e);

          context.closePath();
          context.fill();

          context.shadowOffsetX = 0;
          context.shadowOffsetY = 0;
          context.shadowBlur = 0;
        }

        // Node fill:
        if (settings('borderSize') > 0) {
          context.beginPath();
          context.fillStyle = "#222";  // metro ticket
          context.arc(
            X,Y,
            size + settings('borderSize'),
            0,
            Math.PI * 2,
            true
          );
          context.closePath();
          context.fill();
        }
      }
      else if (neighborFlag) {
        // larger neighbors or highlight
        fontSize *= 1.4
      }

      context.font = (settings('fontStyle') ? settings('fontStyle') + ' ' : '') +
        fontSize + 'px ' + settings('font');
      context.fillStyle = labelColor;

      context.fillText(
        node.label,
        Math.round(X + size + 3),
        Math.round(Y + fontSize / 3)
      );
    };

    // source: github.com/jacomyal/sigma.js/commit/25e2153
    // + boosting edges with property edge.customAttrs.activeEdge
    this.twRender.canvas.edges.curve = function(edge, source, target, context, settings) {
      var color, size,
        prefix = settings('prefix') || ''


      //debug
      // console.warn("rendering edge", edge)

      var defSize = edge[prefix + 'size'] || settings("minEdgeSize") || 1 ;

      // precomputed color with no opacity
      // cf. sigmaTools.edgeRGB
      var baseRGB = TW.handpickedcolor ? edge.customAttrs.alt_rgb : edge.customAttrs.rgb

      if (edge.customAttrs.activeEdge) {
        size = (defSize * 2) + 1

        // active edges look well with no opacity
        color = `rgb(${baseRGB})`

        // console.debug(`t=${tstamp()} curve render activeedge: ${edgeInfos(edge)})`)
      }
      else if (edge.customAttrs.grey) {
        color = TW.edgeGreyColor
        size = 1
      }
      else {
        color = "rgba( "+baseRGB+" , "+TW.edgeDefaultOpacity+")";
        size = defSize
      }

      context.strokeStyle = color;
      context.lineWidth = size ;


      context.beginPath();
      context.moveTo(
        source[prefix + 'x'],
        source[prefix + 'y']
      );

      // NB a little too slow
      var sx = source[prefix + 'x']
      var sy = source[prefix + 'y']
      var tx = target[prefix + 'x']
      var ty = target[prefix + 'y']
      context.quadraticCurveTo(
        (sx + tx) / 2 +
          (ty - sy) / 4,
        (sy + ty) / 2 +
          (sx - tx) / 4,
        tx,
        ty
      );
      context.stroke();
    };


    this.twRender.canvas.edges.line = function(edge, source, target, context, settings) {
      var color, size,
        prefix = settings('prefix') || ''


      //debug
      // console.warn("rendering edge", edge)

      var rgb = edge.customAttrs.rgb
      var defSize = edge[prefix + 'size'] || 1
      if (edge.customAttrs.activeEdge) {
        size = defSize * 1.5
        // color with less opacity
        // cf. sigmaTools.edgeColor
        color = 'rgba('+rgb.join()+',.7)'
      }
      else if (edge.customAttrs.grey) {
        color = TW.edgeGreyColor
        size = 1
      }
      else {
        // color = "rgba( "+rgb.join()+" , "+TW.edgeDefaultOpacity+")";
        color = edge.customAttrs.true_color
        size = defSize
      }

      context.strokeStyle = color;
      context.lineWidth = size ;


      context.beginPath();
      context.moveTo(
        source[prefix + 'x'],
        source[prefix + 'y']
      );
      context.lineTo(
        target[prefix + 'x'],
        target[prefix + 'y']
      );
      context.stroke();
    };

    // node rendering with borders and sensitive to current selection mode
    this.twRender.canvas.nodes.withBorders = function(node, context, settings) {
        var prefix = settings('prefix') || '';
        let X = node[prefix + 'x']
        let Y = node[prefix + 'y']

        var borderSize = node[prefix + 'size'] + settings('twNodeRendBorderSize')
        var borderColor = settings('twNodeRendBorderColor') || "#000"
        var nodeSize = node[prefix + 'size']
        var nodeColor = node.color || settings('defaultNodeColor')

        // mode variants
        if (TW.selectionActive) {
          // passive nodes should blend in the grey of TW.edgeGreyColor
          // cf settings_explorerjs, defgrey_color and greyEverything()
          if (node.customAttrs.grey) {
            if (! TW.handpickedcolor) {
              nodeColor = node.customAttrs.defgrey_color
            }
            else {
              // #C01O3 += alpha 55
              //                     => #C01O355

              if (!node.customAttrs.altgrey_color) {
                node.customAttrs.altgrey_color = "rgba("+(hex2rgba(node.customAttrs.alt_color).slice(0,3).join(','))+",0.4)"
              }
              nodeColor = node.customAttrs.altgrey_color
            }
            // nice looking uniform grey
            borderColor = TW.nodesGreyBorderColor
          }
          // neighbor nodes <=> (highlight flag AND selectionActive)
          else if(node.customAttrs.highlight) {
            nodeSize *= 1.4
            borderSize *= 1.4
            if (TW.handpickedcolor) {
              nodeColor = node.customAttrs.alt_color
            }
          }
          else if(node.active) {
            borderColor = null
            // the selected nodes: fill not important because label+background overlay
          }
        }
        // highlight AND (NOT selectionActive) => highlight just this one time
        else if (node.customAttrs.highlight) {
          nodeSize *= 1.4
          borderSize *= 1.4
          node.customAttrs.highlight = false
        }

        // actual drawing
        if (settings('twNodeRendBorderSize') > 0) {
          context.fillStyle = borderColor
          context.beginPath();
          context.arc(
            X,Y,
            borderSize,
            0,
            Math.PI * 2,
            true
          );
          context.closePath();
          context.fill();
        }

        context.fillStyle = nodeColor;
        context.beginPath();
        context.arc(
          X,Y,
          nodeSize,
          0,
          Math.PI * 2,
          true
        );
        context.closePath();
        context.fill();
    };


    // hover rendering with size boost,
    // except when active because normally then active label has been rendered
    this.twRender.canvas.hovers.largerall = function(node, context, settings) {
        var x,
            y,
            w,
            h,
            e,
            fontStyle = settings('hoverFontStyle') || settings('fontStyle'),
            prefix = settings('prefix') || '',
            size = node[prefix + 'size'],
            fontSize = (settings('labelSize') === 'fixed') ?
              settings('defaultLabelSize') :
              settings('labelSizeRatio') * size;

        // largerall: our customized size boosts
        if (!node.active) {
          fontSize *= 1.4

          let X = node[prefix + 'x']
          let Y = node[prefix + 'y']

          // Label background:
          context.font = (fontStyle ? fontStyle + ' ' : '') +
            fontSize + 'px ' + (settings('hoverFont') || settings('font'));

          context.beginPath();
          context.fillStyle = settings('labelHoverBGColor') === 'node' ?
            (node.color || settings('defaultNodeColor')) :
            settings('defaultHoverLabelBGColor');

          if (node.label && settings('labelHoverShadow')) {
            context.shadowOffsetX = 0;
            context.shadowOffsetY = 0;
            context.shadowBlur = 8;
            context.shadowColor = settings('labelHoverShadowColor');
          }

          if (node.label && typeof node.label === 'string') {
            x = Math.round(node[prefix + 'x'] - fontSize / 2 - 2);
            y = Math.round(node[prefix + 'y'] - fontSize / 2 - 2);
            w = Math.round(
              context.measureText(node.label).width + fontSize / 2 + size + 7
            );
            h = Math.round(fontSize + 4);
            e = Math.round(fontSize / 2 + 2);

            context.moveTo(x, y + e);
            context.arcTo(x, y, x + e, y, e);
            context.lineTo(x + w, y);
            context.lineTo(x + w, y + h);
            context.lineTo(x + e, y + h);
            context.arcTo(x, y + h, x, y + h - e, e);
            context.lineTo(x, y + e);

            context.closePath();
            context.fill();

            context.shadowOffsetX = 0;
            context.shadowOffsetY = 0;
            context.shadowBlur = 0;
          }

          // Node border:
          if (settings('borderSize') > 0) {
            context.beginPath();
            context.fillStyle = settings('nodeBorderColor') === 'node' ?
              (node.color || settings('defaultNodeColor')) :
              settings('defaultNodeBorderColor');
            context.arc(
              node[prefix + 'x'],
              node[prefix + 'y'],
              size + settings('borderSize'),
              0,
              Math.PI * 2,
              true
            );
            context.closePath();
            context.fill();
          }

          // Node:
          var nodeRenderer = sigma.canvas.nodes[node.type] || sigma.canvas.nodes.def;
          nodeRenderer(node, context, settings);

          // Display the label:
          if (node.label && typeof node.label === 'string') {

            context.fillStyle = (settings('labelHoverColor') === 'node') ?
              (node.color || settings('defaultNodeColor')) :
              settings('defaultLabelHoverColor');

            context.fillText(
              node.label,
              Math.round(node[prefix + 'x'] + size + 3),
              Math.round(node[prefix + 'y'] + fontSize / 3)
            );
          }
        }
      };

      // ================ /alternative rendering =====================


      this.toggleEdges = function(optionalTargetFlag) {
        var targetFlag
        if (typeof optionalTargetFlag == "undefined") {
          targetFlag = ! TW.partialGraph.settings('drawEdges')
          // console.log('unprovided targetFlag:', targetFlag)
        }
        else {
          targetFlag = optionalTargetFlag
          // console.log('provided targetFlag:', targetFlag)
        }
        TW.partialGraph.settings('drawEdges', targetFlag)
        TW.partialGraph.render()
      }



      this.ourStopFA2 = function() {
        TW.partialGraph.stopForceAtlas2();

        try {
          document.getElementById('layoutwait').remove()
        }
        catch(e) {}

        // restore edges if needed
        if (document.getElementById('edges-switch').checked) {
          this.toggleEdges(true)
        }
      }

      // factorized: forceAtlas2 supervisor call with:
      //  - togglability (ie. turns FA2 off if called again)
      //  - custom expiration duration
      //  - conditions on graph size (£TODO use these to slowDown small graphs)
      //  - edges management (turns them off and restores them after finished)
      this.smartForceAtlas = function (fa2duration) {

        if (!fa2duration) {
          fa2duration = parseInt(TW.fa2milliseconds) || 4000
        }

        // togglability case
        if(TW.partialGraph.isForceAtlas2Running()) {
            this.ourStopFA2()
            return;
        }
        // normal case
        else {
            if ( TW.fa2enabled && TW.partialGraph.graph.nNodes() >= TW.minNodesForAutoFA2) {
              // hide edges during work for smaller cpu load
              if (TW.partialGraph.settings('drawEdges')) {
                this.toggleEdges(false)
              }

              TW.partialGraph.startForceAtlas2();

              var icon = createWaitIcon('layoutwait')
              var btn = document.querySelector('#layoutButton')
              btn.insertBefore(icon, btn.children[0])

              setTimeout(function(){
                // NB in here scope: 'this' is the window
                if (TW.partialGraph.isForceAtlas2Running())
                  sigma_utils.ourStopFA2()
              },
              fa2duration)

              return;
            }

        }
      }

} // /SigmaUtils object


function createWaitIcon(idname, width) {
  let icon = document.createElement('img')

  icon.src = TW.libspath + '/img2/loader.gif'

  icon.style.position = 'absolute'
  icon.style.left = '0'
  icon.style.width = width || '100%'

  if (idname) {
    icon.id = idname
  }

  return icon
}
//
// //for socialgraph
// function showMeSomeLabels(N){
//   // NB why is this not using methods.manualForceLabel ?!
//
//         /*======= Show some labels at the beginning =======*/
//         var minIn=50,
//             maxIn=0,
//             minOut=50,
//             maxOut=0;
//
//         // new sigma.js accessor
//         var allNodes = TW.partialGraph.graph.nodes()
//         for( j=0 ; j < allNodes.length ; j++ ) {
//             n = allNodes[j]
//             if(n.hidden==false){
//                 if(parseInt(n.inDegree) < minIn) minIn= n.inDegree;
//                 if(parseInt(n.inDegree) > maxIn) maxIn= n.inDegree;
//                 if(parseInt(n.outDegree) < minOut) minOut= n.outDegree;
//                 if(parseInt(n.outDegree) > maxOut) maxOut= n.outDegree;
//             }
//         }
//         counter=0;
//         n = getVisibleNodes();
//         for(i=0;i<n.length;i++) {
//             if(n[i].hidden==false){
//                 if(n[i].inDegree==minIn && n[i].customAttrs.forceLabel==false) {
//                     n[i].customAttrs.forceLabel=true;
//                     counter++;
//                 }
//                 if(n[i].inDegree==maxIn && n[i].customAttrs.forceLabel==false) {
//                     n[i].customAttrs.forceLabel=true;
//                     counter++;
//                 }
//                 if(n[i].outDegree==minOut && n[i].customAttrs.forceLabel==false) {
//                     n[i].customAttrs.forceLabel=true;
//                     counter++;
//                 }
//                 if(n[i].outDegree==maxOut && n[i].customAttrs.forceLabel==false) {
//                     n[i].customAttrs.forceLabel=true;
//                     counter++;
//                 }
//                 if(counter==N) break;
//             }
//         }
//         // new sigma.js
//         TW.partialGraph.render();
//         /*======= Show some labels at the beginning =======*/
// }


// ===============================
// GLOBAL-SCOPE (window) variables

// (TODO REFA make them inside TW.- ns)

// getnodes => preferably use TW.partialGraph.graph.nodes(some_node_id) as accessor
// (not often necessary + costly in mem because is a clone)
function getnodes(){
    // new sigma.js
    return TW.partialGraph.graph.nodes();
}

// idem
function getedges(){
    return TW.partialGraph.graph.edges();
}

// used for saving to gexf
function getVisibleEdges() {
  // new sigma js POSS custom index to avoid loop
  return TW.partialGraph.graph.edges().filter(function(e) {
                return !e['hidden'];
  });
}

// idem
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
    if (typeof lquery == 'string' && lquery.length > 0) {
        for(var i in TW.nodeIds){
            n=TW.partialGraph.graph.nodes(TW.nodeIds[i]);
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

        console.debug(i, elems[i])

        var id=(!isUndef(elems[i].id))?elems[i].id:i
        labelss.push(TW.Nodes[id].label)
    }
    return labelss
}

function getNodeIDs(elems){
    return Object.keys(elems)
}


function getSelections(){
        let params=[];
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

// for logs
function edgeInfos(anEdge) {
    return `${anEdge.id} (${TW.Nodes[anEdge.source].label} -> ${TW.Nodes[anEdge.target].label})` ;
}


function clustersBy(daclass) {

    cancelSelection(false);

    TW.handpickedcolor = true

    var min_pow = 0;
    for(var j in TW.nodeIds) {
        var the_node = TW.Nodes[ TW.nodeIds[j] ]
        var attval = the_node.attributes[daclass];
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
    // console.log('themult', themult)

    for(var j in TW.nodeIds) {
        var the_node = TW.Nodes[ TW.nodeIds[j] ]
        var attval = the_node.attributes[daclass];
        var attnumber = Number(attval);
        var round_number = Math.round(  attnumber*themult ) ;

        NodeID_Val[TW.nodeIds[j]] = { "round":round_number , "real":attnumber };

        if (round_number<real_min) real_min = round_number;
        if (round_number>real_max) real_max = round_number;
    }

    // console.log("NodeID_Val", NodeID_Val)

    // console.log(" - - - - - - - - -- - - ")
    // console.log(real_min)
    // console.log(real_max)
    // console.log("10^"+min_pow)
    // console.log("the mult: "+themult)
    // console.log(" - - - - - - - - -- - - ")


    //    [ Scaling node colours(0-255) and sizes(2-7) ]
    var Min_color = 0;
    var Max_color = 255;
    var Min_size = 1;
    var Max_size= 8;
    for(var nid in NodeID_Val) {
        var newval_color = Math.round( ( Min_color+(NodeID_Val[nid]["round"]-real_min)*((Max_color-Min_color)/(real_max-real_min)) ) );
        var hex_color = rgbToHex(255, (255-newval_color) , 0)
        TW.partialGraph.graph.nodes(nid).color = hex_color
        TW.partialGraph.graph.nodes(nid).customAttrs.alt_color = hex_color

        // FIXME not used ?
        TW.partialGraph.graph.nodes(nid).customAttrs.altgrey_color = false

        var newval_size = Math.round( ( Min_size+(NodeID_Val[nid]["round"]-real_min)*((Max_size-Min_size)/(real_max-real_min)) ) );
        TW.partialGraph.graph.nodes(nid).size = newval_size;
        // console.log("real:"+ NodeID_Val[i]["real"] + " | newvalue: "+newval_size)

        TW.partialGraph.graph.nodes(nid).label = "("+NodeID_Val[nid]["real"].toFixed(min_pow)+") "+TW.Nodes[nid].label
    }
    //    [ / Scaling node colours(0-255) and sizes(2-7) ]

    // Edge precompute alt_rgb by new source-target nodes-colours combination
    repaintEdges()

    // NB legend will group different possible values using
    //    precomputed ticks from TW.Clusters.terms[daclass]
    set_ClustersLegend ( daclass)

    TW.partialGraph.render();
}



// Edge-colour: precompute alt_rgb by source-target node.alt_color combination
function repaintEdges() {

  for (var i in TW.edgeIds) {
    let eid = TW.edgeIds[i]

    if (eid) {
      let idPair = eid.split(';')
      if (idPair.length != 2) {
        console.warn('skipping invalid edgeId', eid)
      }
      else {
        let e = TW.partialGraph.graph.edges(eid)
        let src = TW.partialGraph.graph.nodes(idPair[0])
        let tgt = TW.partialGraph.graph.nodes(idPair[1])

        let src_color = src.customAttrs.alt_color || '#555'
        let tgt_color = tgt.customAttrs.alt_color || '#555'
        e.customAttrs.alt_rgb = sigmaTools.edgeRGB(src_color,tgt_color)
        // we don't set e.color because opacity may vary if selected or not
      }
    }
  }
}

// rewrite of clustersBy with binning and for attributes that can have negative float values

// NB - binning is done at parseCustom
//    - number of bins can be specified by attribute name in TW.customLegendsBins
function colorsRelByBins(daclass) {
  var binColors
  var doModifyLabel = false
  var ty = getActivetypesName()

  // our binning
  var tickThresholds = TW.Clusters[ty][daclass]

  // for debug of colorsRelByBins
  var totalsPerBinMin = {}

  // let's go
  cancelSelection(false);

  // global flag
  TW.handpickedcolor = true

  if (daclass == 'age') {
    // 9 colors
    binColors = [
        "#F9F588",//epsilon
        "#f9f008", //yel
        "#f9da08",
        "#fab207",
        "#fa9607",
        "#fa6e07",
        "#fa4607",
        "#ff0000" // red     binMin 125
    ];
    }
    else if (daclass == 'growth_rate') {

      doModifyLabel = true

      // 12 colors
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

    // verification
    if (tickThresholds.length != binColors.length) {
      console.warn (`colorsRelByBins setup mismatch: TW.Clusters ticks ${tickThresholds} should == nColors ${binColors.length}`)
    }


    // use our valueclass => ids mapping
    for (var k in tickThresholds) {

      // console.debug('tick infos', tickThresholds[k])
      // ex: {labl: "terms||growth_rate||[0 ; 0.583]", nids: Array(99), range: [0 ; 0.583210]}

      totalsPerBinMin[tickThresholds[k].range[0]] = tickThresholds[k].nids.length

      // color the referred nodes
      for (var j in tickThresholds[k].nids) {
        let n = TW.partialGraph.graph.nodes(tickThresholds[k].nids[j])

        n.color = binColors[k]
        n.customAttrs.alt_color = binColors[k]
        n.customAttrs.altgrey_color = false

        var originalLabel = TW.Nodes[n.id].label
        if (doModifyLabel) {
          var valSt = n.attributes[daclass]
          n.label = `(${valSt}) ${originalLabel}`
        }
        else {
          n.label = originalLabel
        }

      }
    }

    // console.debug(valArray)

    console.info('coloring distribution per tick thresholds' , totalsPerBinMin)

    // Edge precompute alt_rgb by new source-target nodes-colours combination
    repaintEdges()

    set_ClustersLegend ( daclass )

    TW.partialGraph.render();
}



// KEPT FOR REFERENCE, BINNING NOW PRECOMPUTED in parseCustom
// rewrite of clustersBy with binning and for attributes that can have negative float values
// /!\ age and growth_rate attributes referred to by name
function colorsRelByBins_old(daclass) {
  cancelSelection(false);

  var binColors
  var doModifyLabel = false

  TW.handpickedcolor = true

  // for debug of colorsRelByBins
  var totalsPerBinMin = {}


  // should be = binColors.length
  var nTicksParam = (daclass == 'age') ? 8 : 12
  // do first loop entirely to get percentiles => bins, then modify alt_color

  // estimating ticks
  let tickThresholds = []
  let valArray = []
  for (var j=0 ; j < TW.nNodes ; j++) {
    let n = TW.partialGraph.graph.nodes(TW.nodeIds[j])

    if (
        !n.hidden
        && n.attributes
        && n.attributes.category == 'terms'
        && n.attributes[daclass] != undefined
      ) {
          valArray.push(Number(n.attributes[daclass]))
    }
  }

  var len = valArray.length

  valArray.sort(function(a, b) {return a - b;}) // important :)

  for (var l=0 ; l < nTicksParam ; l++) {
    let nthVal = Math.floor(len * l / nTicksParam)

    tickThresholds.push(valArray[nthVal])
  }

  // also always add the max+1 as last tick (excluded upper bound of last bin)
  tickThresholds.push((valArray[len-1])+1)

  console.info(`[|===|=== ${nTicksParam} color ticks ===|===|]\n`, tickThresholds)


  cancelSelection(false);

  if (daclass == 'age') {
    // 9 colors
    binColors = [
        "#F9F588",//epsilon
        "#f9f008", //yel
        "#f9da08",
        "#fab207",
        "#fa9607",
        "#fa6e07",
        "#fa4607",
        "#ff0000" // red     binMin 125
    ];
    }
    else if (daclass == 'growth_rate') {

      doModifyLabel = true

      // 12 colors
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

    // verification
    if (nTicksParam != binColors.length) {
      console.warn (`colorsRelByBins setup mismatch: nTicksParam ${nTicksParam} should == nColors ${binColors.length}`)
    }


    // get the nodes
    for (var j=0 ; j < TW.nNodes ; j++) {
      let n = TW.partialGraph.graph.nodes(TW.nodeIds[j])
      if (! n.hidden
        && n.attributes
        && n.attributes.category == 'terms'
        && ! isUndef(n.attributes[daclass])
      ) {

        var valSt = n.attributes[daclass]

        var originalLabel = TW.Nodes[n.id].label
        if (doModifyLabel) {
          n.label = `(${valSt}) ${originalLabel}`
        }
        else {
          n.label = originalLabel
        }

        var theVal = parseFloat(valSt)
        var foundBin = false
        // console.log('theVal:',theVal)

        if( !isNaN(theVal) ) { //is float
          // iterate over bins
          for(var k=0 ; k < tickThresholds.length-1; k++) {
            var binMin = tickThresholds[k]
            var binMax = tickThresholds[(k+1)]
            if((theVal >= binMin) && (theVal < binMax)) {
                // TW.partialGraph._core.graph.nodesIndex[n.id].binMin = binMin
                // TW.partialGraph._core.graph.nodesIndex[n.id].color = binColors[j]

                n.binMin = binMin
                n.color = binColors[k]
                n.customAttrs.alt_color = binColors[k]
                n.customAttrs.altgrey_color = false
                foundBin = true
                // console.log(`theVal ${theVal} => found its bin ${binMin} ... ${binColors[k]}`)

                if (!totalsPerBinMin[binMin]) {
                  totalsPerBinMin[binMin] = 1
                }
                else {
                  totalsPerBinMin[binMin]++
                }
                break
            }
          }

          // case no bin after loop (perhaps more ticks than colors-1 ??)
          if (!foundBin) {
            console.warn('no bin for theVal', theVal, n.id)
            n.binMin = null
            n.color = '#000'
            n.customAttrs.alt_color = '#000'
          }
        }
        else {
          // case no val
          // console.log('no val for', n.id)
          n.binMin = null
          n.color = '#555'
          n.customAttrs.alt_color = '#555'
        }

      }
    }

    // console.debug(valArray)

    console.info('coloring distribution per tick thresholds' , totalsPerBinMin)

    // Edge precompute alt_rgb by new source-target nodes-colours combination
    repaintEdges()

    // set_ClustersLegend ( daclass )

    TW.partialGraph.render();
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
        for(var j in TW.nodeIds) {
          var original_node_color = TW.Nodes[ TW.nodeIds[j] ].color
          TW.partialGraph.graph.nodes(TW.nodeIds[j]).color = original_node_color

          // reset the alt_color valflag
          TW.partialGraph.graph.nodes(TW.nodeIds[j]).customAttrs.alt_color = null
        }

        // reset the global state
        TW.handpickedcolor = false
    }
    else {
      // shuffle on entire array is better than random sorting function on each element
      var randomColorList = shuffle(colorList)

      for(var j in TW.nodeIds) {
          var the_node = TW.Nodes[ TW.nodeIds[j] ]
          var attval = ( isUndef(the_node.attributes) || isUndef(the_node.attributes[daclass]) )? TW.partialGraph.graph.nodes(TW.nodeIds[j])[daclass]: the_node.attributes[daclass];
          TW.partialGraph.graph.nodes(TW.nodeIds[j]).color = randomColorList[ attval ]
          TW.partialGraph.graph.nodes(TW.nodeIds[j]).customAttrs.alt_color = randomColorList[ attval ]
          TW.partialGraph.graph.nodes(TW.nodeIds[j]).customAttrs.altgrey_color = false
      }
      // set the global state
      TW.handpickedcolor = true
    }

    // Edge precompute alt_rgb by new source-target nodes-colours combination
    repaintEdges()

    set_ClustersLegend ( daclass )
    TW.partialGraph.render();
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
