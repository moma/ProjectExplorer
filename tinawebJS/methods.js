'use strict';


// @args is an object with 4 possible properties that define the new state
//     ex: new selections:  {sels: [268]}
//     ex: new activetypes: {activetypes:[false, true]}
//     ex: new level:       {level:false}
TW.setState = function( args ) {
    var bistate=false, typesKey=false;

    // £TODO we could append the new state in this function too
    var present = TW.states.slice(-1)[0]; // Last
    var past = TW.states.slice(-2)[0] // avant Last

    if (TW.conf.debug.logSelections) console.log("setState args: ", args);

    if(!isUndef(args.activetypes)) {

        // record into last state
        present.activetypes = args.activetypes;


        bistate= present.activetypes.map(Number).reduce(
          function(a, b){return a+b;}
        )
        typesKey = present.activetypes.map(Number).join("|")
    }
    // console.log("printing the typesKey:", typesKey)

    if(!isUndef(args.level)) present.level = args.level;
    if(!isUndef(args.sels))  present.selectionNids = args.sels;
    present.LouvainFait = false;

    // change level needs a selection
    LevelButtonDisable(false);  // £TODO rename toggleLevelButton
    if(   present.level
       && present.selectionNids
       && present.selectionNids.length==0)
        LevelButtonDisable(true);

    // case to go back
    if(present.level==false && bistate>1)
        LevelButtonDisable(true)

    // recreate sliders after activetype or level changes
    if (TW.conf.filterSliders
        && (present.level != past.level
            || present.activetypes.map(Number).join("|") != past.activetypes.map(Number).join("|"))) {

      // terms
      if(typesKey=="0|1") {
          $(".for-nodecategory-0").hide()
          $(".for-nodecategory-1").show();


          NodeWeightFilter( "#slidercat1nodesweight" ,  TW.categories[1], "size");
          EdgeWeightFilter("#slidercat1edgesweight", typesKey, "weight");
      }

      // docs
      if(typesKey=="1|0") {
        $(".for-nodecategory-0").show()
        $(".for-nodecategory-1").hide();

          NodeWeightFilter( "#slidercat0nodesweight" ,  TW.categories[0], "size");
          EdgeWeightFilter("#slidercat0edgesweight", typesKey, "weight");
      }

      // terms and docs
      if(typesKey=="1|1") {
        $(".for-nodecategory-0").show()
        $(".for-nodecategory-1").show();
          NodeWeightFilter( "#slidercat0nodesweight" ,  TW.categories[0], "size");
          NodeWeightFilter( "#slidercat1nodesweight" ,  TW.categories[1], "size");
          EdgeWeightFilter("#slidercat0edgesweight", "1|0", "weight");
          EdgeWeightFilter("#slidercat1edgesweight", "0|1", "weight");
      }
    }

};


TW.resetGraph = function() {
  // call the sigma graph clearing
  TW.instance.clearSigma()

  // TW.categories, TW.Nodes and TW.Edges will be reset by mainStartGraph

  // reset remaining global vars
  TW.labels = []

  // reset rendering gui flags
  TW.gui.selectionActive = false
  TW.gui.handpickedcolor = false

  // reset circle size and cursor
  TW.gui.circleSize = 0
  TW.gui.circleSlider.setValue(0)

  // reset other gui flags
  TW.gui.checkBox=false
  TW.gui.lastFilters = {}
}


// settings: {norender: Bool}
function cancelSelection (fromTagCloud, settings) {
    if (TW.conf.debug.logSelections) { console.log("\t***in cancelSelection"); }
    if (!settings) settings = {}

    highlightSelectedNodes(false); //Unselect the selected ones :D

    // clear the current state's selection and neighbors arrays
    TW.SystemState.selectionNids.splice(0, TW.SystemState.selectionNids.length)

    // global flag
    TW.gui.selectionActive = false


    //Edges colors go back to normal
    if (TW.partialGraph.settings('drawEdges')) {
      for(let i in TW.edgeIds){
        let e = TW.partialGraph.graph.edges(TW.edgeIds[i])
        // console.log("cancelSelection: edge", e)
        if (e) {
          e.color = e.customAttrs['true_color'];
          e.customAttrs.grey = 0;

          if (e.customAttrs.activeEdge) {
            e.customAttrs.activeEdge = 0;
          }
        }
      }
    }

    //Nodes colors go back to previous
    // £TODO partly duplicate effort with (de)highlightSelectedNodes
    //       => could be replaced by a (de)highlightSelectedAndNeighbors
    //          on smaller set (here entire nodeset!)
    for(let j in TW.nodeIds){
      let n = TW.partialGraph.graph.nodes(TW.nodeIds[j])
      // console.log("cancelSelection: node", n)
      if (n) {
        n.active = false;
        n.color = TW.gui.handpickedcolor ? n.customAttrs['alt_color'] : n.customAttrs['true_color'];
        n.customAttrs.grey = 0
        n.customAttrs.forceLabel = 0
        n.customAttrs.highlight = 0
      }
    }

    // hide all selection panels
    if(fromTagCloud==false){
        $("#names").html("");
        $("#topPapers").html(""); $("#topPapers").hide();
        $("#opossiteNodes").html(""); $("#tab-container").hide();
        $("#information").html("");
        $("#searchinput").val("");
        $("#unselectbutton").hide();
        $("#lefttopbox").hide();
        $("#tips").html(getTips());
    }

    // send "eraseNodeSet" event
    $('#searchinput').trigger("tw:eraseNodeSet");
    // (signal for plugins that any selection behavior is finished)

    if(TW.states.slice(-1)[0].level)
        LevelButtonDisable(true);

    if (!settings.norender) {
      // finally redraw
      TW.partialGraph.render();
    }
}

// returns an array of the name(s) of active type(s)
// this area is quite underspecified so we assume here
//   - that all typenames have a mapping to cat[0] (terms) or cat[1] (contexts)
//   - that currentState.activetypes is an array of 2 bools for the currently displayed cat(s)
function getActivetypes() {
  let currentTypes = []
  let currentTypeIdx
  let lastState = TW.states.slice(-1)[0]

  for (var possType in TW.catDict) {
    currentTypeIdx = TW.catDict[possType]
    if (lastState.activetypes[currentTypeIdx]) {
      currentTypes.push(possType)
    }
  }

  // ex: ['Document'] or ['Ngrams'] or ['Document','Ngrams']
  return currentTypes
}

function getActivetypesKey() {
  let lastState = TW.states.slice(-1)[0]

  // ex: '1'        or  '0|1'   or   '1|1'
  return lastState.activetypes.map(Number).join('|')
}

// transitional function:
// ----------------------
// Goal: determine if a single nodetype or global activetype is semantic or social
// Explanation: some older functions (eg topPapers) used this distinction
//              (via semi-deprecated global swclickActual),
//              but the specification changed twice since then:
//                - 1st change: types described as type 0 and type 1 and possible default type
//                - 2nd change default type of monopartite case changed from document to semantic
function swActual(aNodetype) {
  if (TW.categories.length == 1) {
    return 'semantic'
  }
  else if (TW.categories.length == 2) {
    return (aNodetype == TW.categories[0]) ? 'social' : 'semantic'
  }
}



function highlightSelectedNodes(flag){
    if (TW.conf.debug.logSelections)
      console.log("\t***methods.js:highlightSelectedNodes(flag)"+flag+" sel:"+TW.SystemState.selectionNids)
    for(let i in TW.SystemState.selectionNids) {
      let nid = TW.SystemState.selectionNids[i]
      TW.partialGraph.graph.nodes(nid).active = flag
    }
}

function manualForceLabel(nodeid, active, justHover) {
	// console.log("manual|"+nodeid+"|"+active)
  var nd = TW.partialGraph.graph.nodes(nodeid)

  // TODO harmonize with other status => bien re-distinguer neighbor et active
  // nd.active=active;

  // console.log('justHover', justHover)
  // var t0, t1

  if (justHover) {
    // using single node redraw in hover layer (much faster ~ 0.5ms)
    redrawNodesInHoverLayer([nd])
  }
  else {
    // using full redraw in permanent layers (slow ~ 70ms)
    TW.partialGraph.render();
  }
}

// Here we draw within hover layer instead of nodes layer, labels layer
//
// args:
//   - someNodes: an array of actual nodes (not nids)
//   - canvasDrawer: (optional) one of drawing methods from sigma.canvas
// Explanation: it's perfect for temporary change cases because hover layer
//              is *over* all other layers and contains nothing by default
//              (this way step A can reset B avoiding whole graph refresh)
function redrawNodesInHoverLayer(someNodes, canvasDrawer) {

  if (!canvasDrawer) {
    canvasDrawer = "hovers"
  }

  var targetLayer = TW.rend.contexts.hover

  // A - clear entire targetLayer
  targetLayer.clearRect(
    0, 0,
    targetLayer.canvas.width,
    targetLayer.canvas.height
  )

  var locSettings = TW.partialGraph.settings.embedObjects({prefix:TW.rend.options.prefix})

  for (var k in someNodes) {
    // B - we use our largerall renderer to write single nodes to overlay
    sigma.canvas[canvasDrawer].def( someNodes[k], targetLayer, locSettings)
  }
}


function clearHover() {
  var hoverLayer = TW.rend.contexts.hover
  hoverLayer.clearRect(
    0, 0,
    hoverLayer.canvas.width,
    hoverLayer.canvas.height
  )
}


// nodes information div
function htmlfied_nodesatts(elems){

    var socnodes=[]
    var semnodes=[]

    if (TW.conf.debug.logSelections) console.log("htmlfied_nodesatts", elems)

    for(var i in elems) {

        var information=[]

        var id=elems[i]
        var node = TW.Nodes[id]

        if(node.type==TW.conf.catSoc){
            information += '<li><b>' + node.label + '</b></li>';
            if(node.htmlCont==""){
                if (!isUndef(node.level)) {
                    information += '<li>' + node.level + '</li>';
                }
            } else {
                information += '<li>' + $("<div/>").html(node.htmlCont).text() + '</li>';
            }
            socnodes.push(information)
        }

        if(node.type==TW.conf.catSem){
            information += '<li><b>' + node.label + '</b></li>';
            let google='<a href=http://www.google.com/#hl=en&source=hp&q=%20'+node.label.replace(" ","+")+'%20><img src="'+'img/google.png"></img></a>';
            let wiki = '<a href=http://en.wikipedia.org/wiki/'+node.label.replace(" ","_")+'><img src="'+'img/wikipedia.png"></img></a>';
            let flickr= '<a href=http://www.flickr.com/search/?w=all&q='+node.label.replace(" ","+")+'><img src="'+'img/flickr.png"></img></a>';
            information += '<li>'+google+"&nbsp;"+wiki+"&nbsp;"+flickr+'</li><br>';
            semnodes.push(information)
        }

    }
    return socnodes.concat(semnodes)
}


function manualSelectNode ( nodeid ) {
    cancelSelection(false);
    TW.instance.selNgn.MultipleSelection2({nodes:[nodeid]});
    // (MultipleSelection2 will do the re-rendering)
}

function htmlProportionalLabels(elems , limit, selectableFlag) {
    if(elems.length==0) return false;
    let resHtml=[]

    let fontSize   // <-- normalized for display

    // we assume already sorted
    let frecMax = elems[0].value
    let frecMin = elems.slice(-1)[0].value

    let sourceRange = frecMax - frecMin
    let targetRange = TW.conf.tagcloudFontsizeMax - TW.conf.tagcloudFontsizeMin

    for(var i in elems){
        if(i==limit)
            break
        let id=elems[i].key
        let frec=elems[i].value

        fontSize = ((frec - frecMin) * (targetRange) / (sourceRange)) + TW.conf.tagcloudFontsizeMin

        // debug
        // console.log('htmlfied_tagcloud (',id, TW.Nodes[id].label,') freq',frec,' fontSize', fontSize)

        if(!isUndef(TW.Nodes[id])){
            var jspart = ''

            if (selectableFlag) {
              jspart = ' onclick="manualSelectNode(\''+id+'\')" onmouseover="manualForceLabel(\''+id+'\',true, true)"  onmouseout="manualForceLabel(\''+id+'\',false, true)"'
            }

            // using em instead of px to allow global x% resize at css box level
            let htmlLabel = '<span class="tagcloud-item" style="font-size:'+fontSize+'em;" '+jspart+'>'+ TW.Nodes[id].label+ '</span>';
            resHtml.push(htmlLabel)
        }
    }
    return resHtml
}

//missing: getTopPapers for both node types
//considering complete graphs case! <= maybe i should mv it
function updateRelatedNodesPanel( sels , same, oppos ) {

    var namesDIV=''
    var alterNodesDIV=''
    var informationDIV=''
    var sameNodesDIV = '';

    // var alternodesname=getNodeLabels(opos)

    namesDIV+='<div id="selectionsBox"><h4>';
    namesDIV+= getNodeLabels( sels ).join(' <b>/</b> ')//aqui limitar
    namesDIV += '</h4></div>';

    if(oppos.length>0) {
      alterNodesDIV+='<div id="oppositesBox">';//tagcloud
      alterNodesDIV+= htmlProportionalLabels( oppos , TW.conf.tagcloudOpposLimit, false).join("\n")
      alterNodesDIV+= '</div>';
    }

    if(sels.length>0) {
        sameNodesDIV+='<div id="sameNodes">';//tagcloud
        var sameNeighTagcloudHtml = htmlProportionalLabels( same , TW.conf.tagcloudSameLimit, true )
        sameNodesDIV+= (sameNeighTagcloudHtml!=false) ? sameNeighTagcloudHtml.join("\n")  : "No related items.";
        sameNodesDIV+= '</div>';
    }

        // getTopPapers("semantic");

    informationDIV += '<br><h4>Information:</h4><ul>';
    informationDIV += htmlfied_nodesatts( sels ).join("<br>\n")
    informationDIV += '</ul><br>';

    //using the readmore.js
    // ive put a limit for nodes-name div
    // and opposite-nodes div aka tagcloud div
    // and im commenting now because github is not
    // pushing my commit
    // because i need more lines, idk
    $("#lefttopbox").show();
    $("#names").html(namesDIV).readmore({maxHeight:100});
    $("#tab-container").show();
    $("#oppositeNodes").html(alterNodesDIV).readmore({maxHeight:200});
    $("#sameNodes").html(sameNodesDIV).readmore({maxHeight:200});
    $("#information").html(informationDIV);
    $("#tips").html("");

    if(TW.categories.length==1) getTopPapers("semantic");
    else getTopPapers(swActual(getActivetypes()[0]));
}

//	just css
//true: button disabled
//false: button enabled
function LevelButtonDisable( TF ){
	$('#changelevel').prop('disabled', TF);
}

// edges greyish color for unselected, when we have a selection
// NB: we just change the flags, not the colors
//     renderer will see the flags and handle the case accordingly
function greyEverything(){

  for(var j in TW.nodeIds){
    let n = TW.partialGraph.graph.nodes(TW.nodeIds[j])

    if (n && !n.hidden) {
      // normal case handled by node renderers
      // will see the n.customAttrs.grey flag => use n.customAttrs.defgrey_color
      n.customAttrs.grey=1

      n.active = false
      n.customAttrs.forceLabel = false;
      n.customAttrs.highlight = false;
    }
  }

  if (TW.partialGraph.settings('drawEdges')) {
    for(var i in TW.edgeIds){
      let e = TW.partialGraph.graph.edges(TW.edgeIds[i])
      if (e && !e.hidden && !e.customAttrs.grey) {
        e.customAttrs.grey = 1
        e.customAttrs.activeEdge = 0
      }
    }
  }

}


// Converts from read nodes (sigma.parseCustom )
// Remarks:
//  - modifies nodesDict in-place
//  - run it once at init
//  - it will be used by FillGraph and add1Elem
function prepareNodesRenderingProperties(nodesDict) {
  for (var nid in nodesDict) {
    var n = nodesDict[nid]

    let sizeFactor = TW.conf.sizeMult[TW.catDict[n.type]] || 1

    // 3 decimals is way more tractable
    // and quite enough in precision !!
    n.size = Math.round(n.size*sizeFactor*1000)/1000

    // new initial setup of properties
    n.active = false

    var rgba, rgbStr, invalidFormat = false;

    if (n.color) {
      // rgb[a] color string ex: "19,180,244"
      if (/^\d{1,3},\d{1,3},\d{1,3}$/.test(n.color)) {
        rgba = n.color.split(',')
        if (rgba.length = 3) {
          rgbStr = n.color
          rgba.push(255)
        }
        else if (rgba.length == 4) {
          rgbStr = rgba.splice(0, 3).join(',');
        }
        else {
          invalidFormat = true
        }
      }
      // hex color ex "#eee or #AA00AA"
      else if (/^#[A-Fa-f0-9]{3,6}$/.test(n.color)) {
        rgba = hex2rgba(n.color)
        rgbStr = rgba.splice(0, 3).join(',');
      }
      else {
        invalidFormat = true
      }
    }
    else {
      invalidFormat = true
    }

    if (!invalidFormat) {
      n.color = `rgb(${rgbStr})`
    }
    else {
      n.color = TW.conf.sigmaJsDrawingProperties.defaultNodeColor
      rgbStr = n.color.split(',').splice(0, 3).join(',');
    }

    n.customAttrs = {
      grey: false,
      highlight: false,
      true_color : n.color,
      defgrey_color : "rgba("+rgbStr+","+TW.conf.sigmaJsDrawingProperties.twNodesGreyOpacity+")"
    }

    // POSS n.type: distinguish rendtype and twtype

    // POSS flags like this
    // // sigma's flags: active and hidden
    // active: false,
    // hidden: false,
    // customFlags : {
    //   // our status flags
    //   grey: false,
    //   highlight: false,
    //   // forceLabel: false,
    // }
  }
}

function prepareEdgesRenderingProperties(edgesDict, nodesDict) {
  for (var eid in edgesDict) {
    var e = edgesDict[eid]

    e.weight = Math.round(e.weight*1000)/1000
    // e.size = e.weight // REFA s/weight/size/ ?

    var rgbStr = sigmaTools.edgeRGB(nodesDict[e.source].color, nodesDict[e.target].color)

    e.color = "rgba("+rgbStr+","+TW.conf.sigmaJsDrawingProperties.twEdgeDefaultOpacity+")"
    e.customAttrs = {
      grey: false,
      activeEdge : false,
      true_color : e.color,
      rgb : rgbStr
    }
  }
}


// use case: slider, changeLevel re-add nodes
function add1Elem(id) {
    id = ""+id;

    if(id.split(";").length==1) { // i've received a NODE

        // if already exists
        if(!isUndef(TW.partialGraph.graph.nodes(id))) return;

        if(TW.Nodes[id]) {
            var n = TW.Nodes[id]

            // WE AVOIDED A COPY HERE BECAUSE properties are already complete
            // ... however, TODO check if we shouldn't remove the n.attributes Obj

            // var anode = {}
            // anode.id = n.id;
            // anode.label = n.label;
            // anode.size = n.size;
            // anode.x = n.x;
            // anode.y = n.y;
            // anode.hidden= n.lock ;
            // anode.type = n.type;
            // anode.color = n.color;
            // if( n.shape ) n.shape = n.shape;
            // anode.customAttrs = n.customAttrs

            // if(Number(anode.id)==287) console.log("coordinates of node 287: ( "+anode.x+" , "+anode.y+" ) ")

            if(!n.lock) {
                updateSearchLabels(id,n.label,n.type);
            }
            // TW.partialGraph.graph.addNode(anode);
            TW.partialGraph.graph.addNode(n);
            return;
        }
    } else { // It's an edge!
        if(!isUndef(TW.partialGraph.graph.edges(id))) return;
        var e  = TW.Edges[id]
        if(e && !e.lock){
            // var anedge = {
            //     id:         id,
            //     source: e.source,
            //     target: e.target,
            //     lock : false,
            //     hidden: false,
            //     label:  e.label,
            //     type:   e.type,
            //     // categ:  e.categ,
            //     weight: e.weight,
            //     customAttrs : e.customAttrs
            // };

            // TW.partialGraph.graph.addEdge(anedge);
            TW.partialGraph.graph.addEdge(e);
            return;
        }
    }
}


function saveGraph() {

    let size = getByID("check_size").checked
    let color = getByID("check_color").checked
    let atts = {"size":size,"color":color}

    if(getByID("fullgraph").checked) {
        saveGEXF ( TW.Nodes , TW.Edges , atts);
    }

    if(getByID("visgraph").checked) {
        saveGEXF ( TW.partialGraph.graph.nodes() , TW.partialGraph.graph.edges(), atts )
    }

    $("#closesavemodal").click();
}


// £TODO: we should use https://github.com/Linkurious/linkurious.js/tree/develop/plugins/sigma.exporters.gexf
function saveGEXF(nodes,edges,atts){
    let gexf = '<?xml version="1.0" encoding="UTF-8"?>\n';
    gexf += '<gexf xmlns="http://www.gexf.net/1.1draft" xmlns:viz="http://www.gephi.org/gexf/viz" version="1.1">\n';
    gexf += '<graph defaultedgetype="undirected" type="static">\n';
    gexf += '<attributes class="node" type="static">\n';
    gexf += ' <attribute id="0" title="category" type="string">  </attribute>\n';
    gexf += ' <attribute id="1" title="country" type="float">    </attribute>\n';
    //gexf += ' <attribute id="2" title="content" type="string">    </attribute>\n';
    //gexf += ' <attribute id="3" title="keywords" type="string">   </attribute>\n';
    //gexf += ' <attribute id="4" title="weight" type="float">   </attribute>\n';
    gexf += '</attributes>\n';
    gexf += '<attributes class="edge" type="float">\n';
    gexf += ' <attribute id="6" title="type" type="string"> </attribute>\n';
    gexf += '</attributes>\n';
    gexf += "<nodes>\n";

    for(var n in nodes){

        gexf += '<node id="'+nodes[n].id+'" label="'+nodes[n].label+'">\n';
        gexf += ' <viz:position x="'+nodes[n].x+'"    y="'+nodes[n].y+'"  z="0" />\n';
        if(atts["color"]) gexf += ' <viz:size value="'+nodes[n].size+'" />\n';
        if(atts["color"]) {
            if (nodes[n].color && nodes[n].color.charAt(0) == '#') {
              col = hex2rgba(nodes[n].color);
              gexf += ' <viz:color r="'+col[0]+'" g="'+col[1]+'" b="'+col[2]+'" a='+col[3]+'/>\n';
            }
        }
        gexf += ' <attvalues>\n';
        gexf += ' <attvalue for="0" value="'+nodes[n].type+'"/>\n';
        gexf += ' <attvalue for="1" value="'+TW.Nodes[nodes[n].id].CC+'"/>\n';
        gexf += ' </attvalues>\n';
        gexf += '</node>\n';
    }
    gexf += "\n</nodes>\n";
    gexf += "<edges>\n";
    let cont = 1;
    for(var e in edges){
        gexf += '<edge id="'+cont+'" source="'+edges[e].source+'"  target="'+edges[e].target+'" weight="'+edges[e].weight+'">\n';
        gexf += '<attvalues> <attvalue for="6" value="'+edges[e].label+'"/></attvalues>';
        gexf += '</edge>\n';
        cont++;
    }
    gexf += "\n</edges>\n</graph>\n</gexf>";
    let uriContent = "data:application/octet-stream," + encodeURIComponent(gexf);
    let newWindow=window.open(uriContent, 'neuesDokument');
}

function saveGraphIMG(){
    TW.rend.snapshot({
      format:'png',
      filename:'tinawebjs-graph.png',
      background:'white',
      download:'true'
    });
}



// reInitFa2 : to call after changeType/changeLevel
// ------------------------------------------------
// sigma 1.2 FA2 supervisor is lazily inited at the
// first call (startForceAtlas2 or configForceAtlas2)
// but it keeps its own node index (as byteArray) and
// so needs to be recreated when nodes change
function reInitFa2 (params) {
  if (!params)  params = {}

  if (params.useSoftMethod) {
    // soft method: we just update FA2 internal index
    // (is good enough if new nodes are subset of previous nodes)
    TW.partialGraph.supervisor.graphToByteArrays()

    // now cb
    if (params.callback) {
      params.callback()
    }
  }
  else {
    TW.partialGraph.killForceAtlas2()

    // after 1s to let killForceAtlas2 finish
    setTimeout ( function() {
      // init FA2
      TW.partialGraph.configForceAtlas2(TW.FA2Params)

      // now cb
      if (params.callback) {
        params.callback()
      }
    }, 1000)
  }
}
