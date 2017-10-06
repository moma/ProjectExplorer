'use strict';

var SigmaUtils = function () {

    // input = GEXFstring
    this.FillGraph = function( initialActivetypes , initialActivereltypes, catDict  , nodes, edges , graph ) {

        console.log("Filling the graaaaph:")
        console.log("FillGraph catDict",catDict)
        // console.log("FillGraph nodes",nodes)
        // console.log("FillGraph edges",edges)

        let i = 0
        for(var nid in nodes) {
            var n = nodes[nid];
            // console.debug('tr >>> fgr node', n)

            if(initialActivetypes[catDict[n.type]]) {
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

                i++
            }
        }

        // the typestrings in activereltypes are the key to stored Relations (<=> edges)
        for (var k in initialActivereltypes) {
          let reltype = initialActivereltypes[k]
          for(let srcnid in TW.Relations[reltype]) {
              for(var j in TW.Relations[reltype][srcnid]) {
                  let tgtnid = TW.Relations[reltype][srcnid][j]
                  let e = TW.Edges[srcnid+";"+tgtnid]
                  if(e) {
                      if(e.source != e.target) {
                          graph.edges.push( e);
                      }
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
          activeFlag = node.customAttrs['active'] || node.customAttrs['forceLabel'],
          neighborFlag = node.customAttrs['highlight'],
          labelColor = (settings('labelColor') === 'node') ?
            (node.color || settings('defaultNodeColor')) :
            settings('defaultLabelColor') ;
          // NB active is used in all TW selections
          //    forceLabel is used in manualForceLabel (fake hover)
          //    highlight is used for selection's neighbors or cluster highlighting

      let X = node[prefix + 'x']
      let Y = node[prefix + 'y']

      if (!node.label || typeof node.label !== 'string')
        return;

      fontSize = (settings('labelSize') === 'fixed') ?
        settings('defaultLabelSize') :
        settings('labelSizeRatio') * size;

      // apply type-specific size slider ratios
      var typeId = TW.catDict[node.type] || 0
      fontSize *= TW.gui.sizeRatios[typeId]

      if (!activeFlag && fontSize < settings('labelThreshold') * settings('labelSizeRatio'))
        return;

      // our customization: active nodes like zoom x2 post-its
      if (activeFlag)  {
        fontSize *= 2


        // Label background (aligned on hover equivalent):
        var x,y,w,h,e,
        fontStyle = settings('hoverFontStyle') || settings('fontStyle') // for label background

        context.font = (fontStyle ? fontStyle + ' ' : '') +
          fontSize + 'px ' + (settings('hoverFont') || settings('font'));

        context.beginPath();

        if (settings('twSelectedColor') == "node")
          context.fillStyle = TW.gui.handpickedcolors[node.type].alton ? node.customAttrs.alt_color : node.color; // node's
        else
          context.fillStyle = "#fff"; // default

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
          e = Math.round(fontSize / 2 + 4);

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

        // active node fill (subcall):
        var nodeRenderer = sigma.canvas.nodes.def;
        nodeRenderer(node, context, settings);
      }
      else if (neighborFlag) {
        // larger neighbors or highlight
        fontSize *= 1.3
      }

      context.font = (settings('fontStyle') ? settings('fontStyle') + ' ' : '') +
        fontSize + 'px ' + settings('font');
      context.fillStyle = labelColor;

      context.fillText(
        node.label,
        Math.round(X + size + 5),
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
      var baseRGB = edge.customAttrs.useAltColor ? edge.customAttrs.alt_rgb : edge.customAttrs.rgb

      if (edge.customAttrs.activeEdge) {
        size = (defSize * 1.5) + .5

        // active edges look well with no opacity
        color = `rgb(${baseRGB})`

        // console.debug(`t=${tstamp()} curve render activeedge: ${edgeInfos(edge)})`)
      }
      else {
        color = settings('twEdgeGreyColor')
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
      else {
        color = settings('twEdgeGreyColor')
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

        // our shapes are dependant on flags, type AND categories
        // so we need the bool and conditions


        // type-specific actions
        // ----------------------
        // other POSS: we rename n.type at parsing
        // and each action (recoloring/selection)
        // to use sigma's "def vs someType" syntax
        var typeId = TW.catDict[node.type] || 0


        // mode variants 1: if a coloringFunction is active
        if (! TW.gui.handpickedcolors[node.type].alton) {
          nodeColor = node.color
        }
        else {
          nodeColor = node.customAttrs.alt_color
        }

        // mode variants 2: if node is selected, highlighted or unselected
        if (TW.gui.selectionActive) {

          // the selected node(s)
          if (node.customAttrs.active) {
            // called by label+background overlay cf. "subcall"
            nodeSize *= 1.1
            borderSize *= 1.1
            nodeColor = "#222" // metro ticket
          }
          // the neighbor node(s)
          else if (node.customAttrs.highlight) {
            nodeSize *= 1.3
            borderSize *= 1.3
          }
          // passive nodes should blend in the grey of twEdgeGreyColor
          // cf settings_explorerjs, defgrey_color and deselectNodes()
          else {
            if (! TW.gui.handpickedcolors[node.type].alton) {
              nodeColor = node.customAttrs.defgrey_color
            }
            else {
              nodeColor = node.customAttrs.altgrey_color
            }
            // nice looking uniform grey
            borderColor = TW.conf.sigmaJsDrawingProperties.twBorderGreyColor
          }
        }
        // highlight AND (NOT selectionActive) => highlight just this one time
        else if (node.customAttrs.highlight) {
          nodeSize *= 1.3
          borderSize *= 1.3
          node.customAttrs.highlight = false
        }

        // actual drawing
        if (settings('twNodeRendBorderSize') > 0) {
          context.fillStyle = borderColor
          context.beginPath();

          if (typeId == 1) {
            // (Square shape)
            // thinner borderSize for squares looks better
            // otherwise hb = (nodeSize + borderSize) / 2
            let hb = (nodeSize + borderSize/3) / 2
            context.moveTo(X + hb, Y + hb);
            context.lineTo(X + hb, Y - hb);
            context.lineTo(X - hb, Y - hb);
            context.lineTo(X - hb, Y + hb);
            context.lineTo(X + hb, Y + hb);
          }
          else {
            // (Circle shape)
            context.arc(
              X,Y,
              borderSize,
              0,
              Math.PI * 2,
              true
            );
          }
          context.closePath();
          context.fill();
        }

        context.fillStyle = nodeColor;
        context.beginPath();


        if (typeId == 1) {
          // (Square shape)
          let hn = nodeSize / 2
          context.moveTo(X + hn, Y + hn);
          context.lineTo(X + hn, Y - hn);
          context.lineTo(X - hn, Y - hn);
          context.lineTo(X - hn, Y + hn);
          context.lineTo(X + hn, Y + hn);
        }
        else {
          // (Circle shape)
          context.arc(
            X,Y,
            nodeSize,
            0,
            Math.PI * 2,
            true
          );
        }

        context.closePath();
        context.fill();
    };


    // hover rendering with size boost,
    // except when active because normally then active label has been rendered
    // POSSible: we could also change the node color on hover to make it more visible
    //           (=> just before calling nodeRenderer)
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

        // apply type-specific size slider ratios
        var typeId = TW.catDict[node.type] || 0
        fontSize *= TW.gui.sizeRatios[typeId]

        if (!node.customAttrs.active) {
          fontSize *= 1.3

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
              context.measureText(node.label).width + fontSize / 2 + size + 12
            );
            h = Math.round(fontSize + 4);
            e = Math.round(fontSize / 2 + 4);

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
          // var nodeRenderer = sigma.canvas.nodes[node.type] || sigma.canvas.nodes.def;  // <-- would become useful if we used types as *rendering types* to leverage sigma's "def vs someType" syntax

          var nodeRenderer = sigma.canvas.nodes.def;
          nodeRenderer(node, context, settings);

          // Display the label:
          if (node.label && typeof node.label === 'string') {

            context.fillStyle = (settings('labelHoverColor') === 'node') ?
              (node.color || settings('defaultNodeColor')) :
              settings('defaultLabelHoverColor');

            context.fillText(
              node.label,
              Math.round(node[prefix + 'x'] + size + 5),
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
        try {
          TW.partialGraph.stopForceAtlas2();
        }
        catch(e) {console.log(e)}

        // remove wait icon overlay on button
        if(document.getElementById('layoutwait')) {
          document.getElementById('layoutwait').remove()
        }

        // restore edges if needed
        if (document.getElementById('edges-switch').checked) {
          this.toggleEdges(true)
        }
      }

      // factorized: forceAtlas2 supervisor call with:
      //  - togglability (ie. turns FA2 off if called again)
      //  - custom expiration duration
      //  - edges management (turns them off and restores them after finished)
      this.smartForceAtlas = function (args) {
        if (TW.conf.fa2Available) {
          if (!args)             args = {}
          if (!args.manual)      args.manual = false
          if (!args.duration)    args.duration = parseInt(TW.conf.fa2Milliseconds) || 4000
          if (!args.propDuration) args.propDuration = TW.conf.fa2AdaptDuration

          // togglability case
          if(TW.partialGraph.isForceAtlas2Running()) {
              this.ourStopFA2()
              return;
          }
          // normal case
          else {
              if (TW.conf.fa2Enabled) {

                if (! args.manual) {
                  if (TW.partialGraph.graph.nNodes() < TW.conf.minNodesForAutoFA2)
                    return
                  else {
                    if (!args.propDuration) {
                      setTimeout(function(){sigma_utils.ourStopFA2()},args.duration)
                    }
                    else {
                      let nEds = getVisibleEdges().length
                      let newDur = parseInt(args.duration * Math.log(nEds) / 3)
                      setTimeout(function(){sigma_utils.ourStopFA2()},newDur)
                      console.debug("fa2 adapted duration", newDur)
                    }
                  }
                }

                // hide edges during work for smaller cpu load
                if (TW.partialGraph.settings('drawEdges')) {
                  this.toggleEdges(false)
                }

                try {
                  TW.partialGraph.startForceAtlas2();
                } catch(e) {return}

                var icon = createWaitIcon('layoutwait')
                var btn = document.querySelector('#layoutButton')
                btn.insertBefore(icon, btn.children[0])

                return;
              }

          }
        }

      }

} // /SigmaUtils object


// ===============================
// GLOBAL-SCOPE (window) variables

// (TODO REFA make them inside TW.- ns)

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

// fulltext search handler for #searchinput
function find(lquery){
    var results=[];
    if (typeof lquery == 'string' && lquery.length > 0) {
        lquery=lquery.toLowerCase() ;
        // console.log("FIND: looking among TW.labels", TW.labels)
        for(var i in TW.labels){
            var labObj = TW.labels[i]
            if(labObj && labObj.label){
                var possiblematch = labObj.label.toLowerCase()
                // ------------------
                //  substring search
                // ------------------
                if (possiblematch.indexOf(lquery)!==-1) {
                    results.push(labObj.id);
                }
            }
        }
    }
    return results;
}

function getNodeLabels(elems){
    var labels=[]
    for(let i in elems){
        labels.push(TW.Nodes[elems[i]].label)
    }
    return labels
}

function getSelections(){
        let selLabels=[];
        let sels = TW.SystemState().selectionNids
        for(let i in sels ){
            let nid = sels[i]
            selLabels.push(TW.Nodes[nid].label);
        }
        return selLabels;
}

// for logs
function edgeInfos(anEdge) {
    return `${anEdge.id} (${TW.Nodes[anEdge.source].label} -> ${TW.Nodes[anEdge.target].label})` ;
}


// FIXME this function could be optimized
function gradientColoring(daclass, forTypes) {

    graphResetLabelsAndSizes()    // full loop

    if (typeof forTypes == 'undefined' || ! forTypes.length) {
      // default strategy on multiple types: color all types that have the attr
      forTypes = getActivetypesNames().filter(function(ty){
        return daclass in TW.Facets[ty]
      })
    }

    // value getter
    let getVal
    if (daclass in TW.sigmaAttributes) {
      getVal = TW.sigmaAttributes[daclass](TW.partialGraph)
    }
    else {
      getVal = function (nd) { return nd.attributes[daclass]}
    }

    var min_pow = 0;
    for (var k in forTypes) {
      let nids = TW.ByType[TW.catDict[forTypes[k]]]
      for (var j in nids) {
        let attval = getVal(TW.Nodes[ nids[j] ]);
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
    }

    var NodeID_Val = {}
    var real_min = 1000000;
    var real_max = -1;
    var themult = Math.pow(10,min_pow);
    // console.log('themult', themult)

    for (var k in forTypes) {
      let nids = TW.partialGraph.graph.getNodesByType(
        TW.catDict[forTypes[k]]   // unordered type names to type id
      )
      for (var j in nids) {
        let nid = nids[j]
        var attval = getVal(TW.Nodes[nid])

        var attnumber = Number(attval);
        if (isNaN(attnumber)) {
          continue;
        }

        var round_number = Math.round(  attnumber*themult ) ;

        NodeID_Val[nid] = { "round":round_number , "real":attnumber };

        if (round_number<real_min) real_min = round_number;
        if (round_number>real_max) real_max = round_number;
      }
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
    var setSize = (TW.facetOptions[daclass] && TW.facetOptions[daclass].setsize)
    for(var nid in NodeID_Val) {
        var newval_color
        // special case: all nodes have the same size
        if (real_min == real_max) {
          newval_color = 0
        }
        else {
          newval_color = Math.round( ( Min_color+(NodeID_Val[nid]["round"]-real_min)*((Max_color-Min_color)/(real_max-real_min)) ) );
        }
        var hex_color = rgbToHex(255, (255-newval_color) , 0)

        let n = TW.partialGraph.graph.nodes(nid)
        if (n && !n.hidden) {
          n.customAttrs.alt_color = hex_color

          // also recalculating the "unselected" color for next renders
          n.customAttrs.altgrey_color = "rgba("+(hex2rgba(hex_color).slice(0,3).join(','))+",0.4)"

          // optionally changing size
          if (setSize) {
            var newval_size = Math.round( ( Min_size+(NodeID_Val[nid]["round"]-real_min)*((Max_size-Min_size)/(real_max-real_min)) ) );
            n.size = newval_size;
          }

          n.label = "("+NodeID_Val[nid]["real"].toFixed(min_pow)+") "+TW.Nodes[nid].label
        }

        // console.log("real:"+ NodeID_Val[i]["real"] + " | newvalue: "+newval_size)

    }
    //    [ / Scaling node colours(0-255) and sizes(2-7) ]

    // Edge precompute alt_rgb by new source-target nodes-colours combination
    repaintEdges()

    // remember in clusters of each requested type
    for (var k in forTypes) {
      let ty = forTypes[k]
      TW.gui.handpickedcolors[ty] = {
        'alton': true,
        'altattr': daclass,
      }
      let bins = TW.Facets[ty][daclass]
      if (bins && bins.invIdx) {
        for (var i in bins.invIdx) {
          if (bins.invIdx[i].labl != '_non_numeric_') {
            let nidList = bins.invIdx[i]['nids']
            if (nidList.length) {
              // we take first non null exemplar from last in the range
              // (possible skip due to changeLevel or filters)
              for (var k = nidList.length-1 ; k >= 0 ; k--) {
                let nd = TW.partialGraph.graph.nodes(nidList[k])
                if (nd) {
                  bins.invIdx[i].col = nd.customAttrs.alt_color
                  break
                }
              }
            }
            else {
              bins.invIdx[i].col = "#777" // empty bin
            }
          }
          else {
            bins.invIdx[i].col = "#bbb" // non numeric values bin
          }
        }
      }
    }

    // NB legend will group different possible values using
    //    precomputed ticks from TW.Facets[type][daclass]
    updateColorsLegend (daclass, forTypes)

    TW.partialGraph.render();
}



// Edge-colour: precompute alt_rgb by source-target node.alt_color combination
function repaintEdges() {

  for (var eid in TW.Edges) {
    if (eid) {
      let idPair = eid.split(';')
      if (idPair.length != 2) {
        console.warn('skipping invalid edgeId', eid)
      }
      else {
        let e = TW.partialGraph.graph.edges(eid)

        if (e) {
          let src = TW.partialGraph.graph.nodes(idPair[0])
          let tgt = TW.partialGraph.graph.nodes(idPair[1])


          if (src && tgt) {
            let src_color
            let tgt_color

            // handpickedcolors on multiple types may or may not affect
            // a given edge so we need the useAltColor individual flag
            let useAlt = false

            if (TW.gui.handpickedcolors[src.type].alton) {
              src_color = src.customAttrs.alt_color || '#555'
              useAlt = true
            }
            else
              src_color = src.color || '#555'

            if (TW.gui.handpickedcolors[tgt.type].alton) {
              tgt_color = tgt.customAttrs.alt_color || '#555'
              useAlt = true
            }
            else
              tgt_color = tgt.color || '#555'

            e.customAttrs.alt_rgb = sigmaTools.edgeRGB(src_color,tgt_color)
            e.customAttrs.useAltColor = useAlt
            // we don't set e.color because opacity may vary if selected or not
          }
        }
      }
    }
  }
}


// heatmap from cold to warm with middle white
//         (good for values centered around a neutral zone)
// NB - binning is done at parseCustom (cf. TW.Facets)
//    - number of bins can be specified by attribute name in TW.facetOptions[daclass]["n"]
function heatmapColoring(daclass, forTypes) {
  var binColors
  var doModifyLabel = false

  // let's go
  graphResetLabelsAndSizes()    // full loop

  // default value
  let nColors = TW.conf.legendsBins || 5

  // possible user value
  if (TW.facetOptions[daclass]) {
    if (TW.facetOptions[daclass]["n"] != 0) {
      nColors = TW.facetOptions[daclass]["n"]
    }
    else {
      console.warn(`Can't use user-specified number of bins value 0 for attribute ${at}, using TW.conf.legendsBins ${TW.conf.legendsBins} instead`)
    }
  }

  if (typeof forTypes == 'undefined' || ! forTypes.length) {
    // default strategy on multiple types: color all types that have the attr
    forTypes = getActivetypesNames().filter(function(ty){
      return daclass in TW.Facets[ty]
    })
  }

  for (var k in forTypes) {

    var ty = forTypes[k]

    // global flag
    TW.gui.handpickedcolors[ty] = {
      'alton': true,
      'altattr': daclass,
    }

    // our binning
    var tickThresholds = TW.Facets[ty][daclass].invIdx

    // verifications
    if (tickThresholds.length - 1 != nColors) {
      console.log (`heatmapColoring setup mismatch: TW.Facets ticks ${tickThresholds.length} - 1 non_numeric from scanAttributes should == nColors ${nColors}`)
      nColors = tickThresholds.length - 1
    }

    binColors = getHeatmapColors(nColors)

    // use our valueclass => ids mapping
    for (var k in tickThresholds) {

      // console.debug('tick infos', tickThresholds[k])
      // ex: {labl: "terms||growth_rate||[0 ; 0.583]", nids: Array(99), range: [0 ; 0.583210]}

      let theColor

      // skip grouped NaN values case => grey
      if (tickThresholds[k].labl == '_non_numeric_') {
        theColor = '#bbb'
      }
      else {
        theColor = binColors[k]
      }

      if (tickThresholds[k].nids.length) {
        let rgbColStr = hex2rgba(binColors[k]).slice(0,3).join(',')

        // color the referred nodes
        for (var j in tickThresholds[k].nids) {
          let n = TW.partialGraph.graph.nodes(tickThresholds[k].nids[j])
          if (n) {
            n.customAttrs.alt_color = binColors[k]
            n.customAttrs.altgrey_color = "rgba("+rgbColStr+",0.4)"

            var originalLabel = TW.Nodes[n.id].label
            if (doModifyLabel) {
              var valSt = n.attributes[daclass]
              n.label = `(${valSt}) ${originalLabel}`
            }
          }
        }
      }

      // remember
      tickThresholds[k].col = theColor
    }
  }

  // Edge precompute alt_rgb by new source-target nodes-colours combination
  repaintEdges()

  updateColorsLegend ( daclass, forTypes )

  TW.partialGraph.render();
}


function clusterColoring(daclass, forTypes) {

    graphResetLabelsAndSizes()    // full loop (could be avoided most times if flag in sstate)

    if (typeof forTypes == 'undefined' || ! forTypes.length) {
      // default strategy on multiple types: color all types that have the attr
      forTypes = getActivetypesNames().filter(function(ty){
        return daclass in TW.Facets[ty]
      })
    }

    // louvain needs preparation
    if(daclass=="clust_louvain") {
        if(!TW.SystemState().LouvainFait) {
            try {
              RunLouvain(function() {
                clusterColoring("clust_louvain", forTypes)
              })
            }
            catch(e) {
              TW.SystemState().LouvainFait = false
              console.warn("skipped error on louvain, falling back to default colors")
              daclass == 'clust_default'
            }
            return
        }
    }

    if (daclass=="clust_default") {
        for(var nid in TW.Nodes) {
          var original_node_color = TW.Nodes[ nid ].color
          TW.partialGraph.graph.nodes(nid).color = original_node_color

          // reset the alt_color valflag
          TW.partialGraph.graph.nodes(nid).customAttrs.alt_color = null
        }

        // reset the global state
        TW.gui.handpickedcolorsReset()

    }
    else {
      let nColors = TW.gui.colorList.length

      for (var k in forTypes) {
        let typeName = forTypes[k]
        let facets = TW.Facets[typeName][daclass]

        let colList = []
        if (TW.conf.randomizeClusterColors) {
          // shuffle on entire array is better than random sorting function on each element
          colList = shuffle(TW.gui.colorList)
        }
        else {
          colList = TW.gui.colorList
        }

        if (facets && facets.invIdx) {
          for (var i in facets.invIdx) {
            let valGroup = facets.invIdx[i]
            let theColor
            if (valGroup.labl == "_non_numeric_") {
              theColor == '#bbb'
            }
            else {
              let val = valGroup.val || valGroup.range
              // use the int as an index between 0 and nColors
              if (parseInt(val) == val) {
                theColor = colList [val % nColors]
              }
              // or create a representative int on the same range
              else {
                let someRepresentativeInt = stringToSomeInt(val) % nColors
                theColor = colList[ someRepresentativeInt ]
              }
            }

            if (valGroup.nids.length) {
              let rgbColStr = hex2rgba(theColor).slice(0,3).join(',')
              for (let j in valGroup.nids) {
                let theNode = TW.partialGraph.graph.nodes(valGroup.nids[j])
                if (theNode) {
                  theNode.customAttrs.alt_color = theColor
                  theNode.customAttrs.altgrey_color = "rgba("+rgbColStr+","+TW.conf.sigmaJsDrawingProperties.twNodesGreyOpacity+")"
                }
              }
            }

            // remember in TW.Facets
            valGroup.col = theColor
          }
        }
        // fallback on old, slower strategy if scanAttributes inactive
        else {
          let nids = TW.ByType[TW.catDict[typeName]]
          for (var j in nids) {
            let nid = nids[j]
            let the_node = TW.partialGraph.graph.nodes(nid)

            if (the_node) {

              // POSS: use "hidden" in filters instead of remove/readd
              //  typeName     then this condition would be more useful here
              if (! the_node.hidden) {
                var attval = ( !isUndef(the_node.attributes) && !isUndef(the_node.attributes[daclass]) )? the_node.attributes[daclass] : TW.partialGraph.graph.nodes(nid)[daclass];

                let theColor

                if (attval == '_non_numeric_') {
                  theColor = '#bbb'
                }
                else if (! isNaN(parseInt(attval))) {
                  theColor = colList[ attval ]
                }
                else {
                  let someRepresentativeInt = stringToSomeInt(attval) % nColors
                  theColor = colList[ someRepresentativeInt ]
                }

                // TW.partialGraph.graph.nodes(nid).color = theColor
                the_node.customAttrs.alt_color = theColor
                the_node.customAttrs.altgrey_color = "rgba("+(hex2rgba(theColor).slice(0,3).join(','))+",0.4)"
              }
            }
          }
        }
        // set the global state
        TW.gui.handpickedcolors[typeName] = {
          'alton': true,
          'altattr': daclass,
        }
      }
    }

    // Edge precompute alt_rgb by new source-target nodes-colours combination
    repaintEdges()

    updateColorsLegend ( daclass, forTypes )
    TW.partialGraph.render();
}


// for labelThreshold:
// factor to reduce speed of growth of the amount of labels when size goes up
// /!\ important params to avoid having unreadable mess of labels or none at all
function getSizeFactor(val) {
  let nActive = getNActive()
  let sliderFactor
  let adjustmentFactor = TW.conf.sigmaJsDrawingProperties.labelThreshold
  if (nActive == 1) {
    let activeId = TW.catDict[getActivetypesNames()[0]]
    sliderFactor = TW.gui.sizeRatios[activeId]
  }
  else {
    sliderFactor = Math.min.apply(null, TW.gui.sizeRatios)
  }
  return adjustmentFactor * sliderFactor * .9
}

// mobile versions should get lighter settings
function mobileAdaptConf() {

    TW.conf.overSampling = false
    TW.conf.dragNodesAvailable = false

    TW.conf.fa2Available = false
    TW.conf.filterSliders = false
    TW.conf.moreLabelsUnderArea = false

    TW.conf.maxPastStates = 2

    TW.conf.minLengthAutoComplete = 2
    TW.conf.maxSuggestionsAutoComplete = 4

    TW.conf.sigmaJsDrawingProperties.drawEdges = false
    TW.conf.sigmaJsDrawingProperties.enableHovering = false

    TW.conf.sigmaJsDrawingProperties.touchEnabled = true
    TW.conf.sigmaJsDrawingProperties.animationsTime = 0
    TW.conf.sigmaJsDrawingProperties.mouseZoomDuration = 0
    // TW.conf.sigmaJsDrawingProperties.defaultEdgeType = 'line'

    // TW.conf.scanAttributes = false
    // TW.conf.twRendering = false

    // £TODO better CSS for histogram on mobile
    TW.conf.ModulesFlags.histogramModule = false
}
