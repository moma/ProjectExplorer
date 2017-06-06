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
    for(let j in TW.nodeIds){
      let n = TW.partialGraph.graph.nodes(TW.nodeIds[j])
      // console.log("cancelSelection: node", n)
      if (n) {
        n.active = false;
        n.color = TW.handpickedcolor ? n.customAttrs['alt_color'] : n.customAttrs['true_color'];
        n.customAttrs.grey = 0
        n.customAttrs.forceLabel = 0
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

function alertCheckBox(eventCheck){
    // NB: we use 2 booleans to adapt to SHIFT checking
    //      - var TW.gui.checkBox  ---------> has the real box state
    //      - var TW.gui.manuallyChecked  --> remembers if it was changed here
    if(!isUndef(eventCheck.checked)) {
        TW.gui.checkBox=eventCheck.checked;
        TW.gui.manuallyChecked = eventCheck.checked
    }
}


//  THIS IS THE ORIGINAL FIRST VERSION OF changeType()
//  It's not used since before I arrived, but useful as a logical resume
//
// States:
// A : Macro-Social
// B : Macro-Semantic
// A*: Macro-Social w/selections
// B*: Macro-Semantic w/selections
// a : Meso-Social
// b : Meso-Semantic
// AaBb: Socio-Semantic
function RefreshState(newNOW){

    console.log("\t\t\tin RefreshState newNOW:_"+newNOW+"_.")

	if (newNOW!="") {
	    PAST = NOW;
	    NOW = newNOW;

		// if(NOW=="a" || NOW=="A" || NOW=="AaBb") {
		// 	$("#category-A").show();
		// }
		// if(NOW=="b" || NOW=="B" || NOW=="AaBb") {
		// 	$("#category-B").show();
		// }
	}

    $("#category-A").hide();
    $("#category-B").hide();
    // i=0; for(var s in selections) { i++; break;}
    // if(is_empty(selections) || i==0) LevelButtonDisable(true);
    // else LevelButtonDisable(false);

    //complete graphs case
    // sels=getNodeIDs(selections).length
    if(NOW=="A" || NOW=="a") {
    	// N : number of nodes
    	// k : number of ( selected nodes + their neighbors )
    	// s : number of selections
        var N=( Object.keys(TW.Nodes).filter(function(n){return TW.Nodes[n].type==TW.conf.catSoc}) ).length
        var k=Object.keys(getNeighs(Object.keys(selections),nodes1)).length
        var s=Object.keys(selections).length
        console.log("in social N: "+N+" - k: "+k+" - s: "+s)
        if(NOW=="A"){
            if( (s==0 || k>=(N-1)) ) {
                LevelButtonDisable(true);
            } else LevelButtonDisable(false);
            if(s==N) LevelButtonDisable(false);
        }

        if(NOW=="a") {
            LevelButtonDisable(false);
        }

        $("#semLoader").hide();
        $("#category-A").show();
        $("#colorGraph").show();

    }
    if(NOW=="B" || NOW=="b") {
        var N=( Object.keys(TW.Nodes).filter(function(n){return TW.Nodes[n].type==TW.conf.catSem}) ).length
        var k=Object.keys(getNeighs(Object.keys(selections),nodes2)).length
        var s=Object.keys(selections).length
        console.log("in semantic N: "+N+" - k: "+k+" - s: "+s)
        if(NOW=="B") {
            if( (s==0 || k>=(N-1)) ) {
                LevelButtonDisable(true);
            } else LevelButtonDisable(false);
            if(s==N) LevelButtonDisable(false);
        }

        if(NOW=="b") {
            LevelButtonDisable(false);
        }
        if ( semanticConverged ) {
            $("#semLoader").hide();
            $("#category-B").show();
            setTimeout(function(){
              EdgeWeightFilter("#sliderBEdgeWeight", "0|1", "weight");
              NodeWeightFilter ( "#sliderBNodeWeight" , "NGram", "size");
            },30)
        } else {
            $("#semLoader").css('visibility', 'visible');
            $("#semLoader").show();
        }

    }
    if(NOW=="AaBb"){
        LevelButtonDisable(true);
        $("#category-A").show();
        $("#category-B").show();
    }

    TW.partialGraph.render();

}

function pushSWClick(arg){
    swclickPrev = swclickActual;
    swclickActual = arg;
}

// tag cloud div
// [but not used in monopart case]
function htmlfied_alternodes(elems) {
    var oppositesNodes=[]
    var js1='onclick="graphTagCloudElem(\'';
    var js2="');\""
    var frecMAX=elems[0].value

    console.log("htmlfied_alternodes elems", elems)
    console.log("htmlfied_alternodes frecMAX", frecMAX)

    for(var i in elems){
        var id=elems[i].key
        var frec=elems[i].value
        var fontSize
        var htmlfied_alternode
        if(frecMAX==1) fontSize=TW.conf.tagcloudFontsizeMin;
        else {
            fontSize=
            TW.conf.tagcloudFontsizeMin+
            (frec-1)*
            ((TW.conf.tagcloudFontsizeMax-TW.conf.tagcloudFontsizeMin)/(frecMAX-1));
        }
        if(!isUndef(TW.Nodes[id])){

            htmlfied_alternode = '<span class="tagcloud-item" style="font-size:'+fontSize+'px;" '+js1+id+js2+'>'+ TW.Nodes[id].label+ '</span>';
            oppositesNodes.push(htmlfied_alternode)
        }
    }
    return oppositesNodes
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
// Explanation: it's perfect for temporary change cases because hover layer
//              is *over* all other layers and contains nothing by default
//              (this way step A can reset B avoiding whole graph refresh)
function redrawNodesInHoverLayer(someNodes) {
  var targetLayer = TW.rend.contexts.hover

  // A - clear entire targetLayer
  targetLayer.clearRect(
    0, 0,
    targetLayer.canvas.width,
    targetLayer.canvas.height
  )

  var locSettings = TW.partialGraph.settings.embedObjects({prefix:'renderer1:'})

  for (var k in someNodes) {
    // B - we use our largerall renderer to write single nodes to overlay
    sigma.canvas.hovers.def( someNodes[k], targetLayer, locSettings)
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

            let htmlLabel = '<span class="tagcloud-item" style="font-size:'+fontSize+'px;" '+jspart+'>'+ TW.Nodes[id].label+ '</span>';
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

function printStates() {
	console.log("\t\t\t\t---------"+getClientTime()+"---------")
	console.log("\t\t\t\tswMacro: "+swMacro)
	console.log("\t\t\t\tswActual: "+swclickActual+" |  swPrev: "+swclickPrev)
	console.log("\t\t\t\tNOW: "+NOW+" |  PAST: "+PAST)
	console.log("\t\t\t\tselections: ")
	console.log(TW.SystemState.selectionNids)
	console.log("\t\t\t\topposites neighbors: ")
	console.log(TW.SystemState.opposideSortdNeighs)
	console.log("\t\t\t\tsame neighbors: ")
	console.log(TW.SystemState.samesideSortdNeighs)
	console.log("\t\t\t\t------------------------------------")
}

//	just css
//true: button disabled
//false: button enabled
function LevelButtonDisable( TF ){
	$('#changelevel').prop('disabled', TF);
}

// handler for clicking on a related or opposite node
//  - provokes changeLevel to macro
//  - if opposite node: provokes changeType
function graphTagCloudElem(nodes) {
    console.log("in graphTagCloudElem, nodae_id: "+nodes);
    cancelSelection();

    var ndsids=[]
    if(! $.isArray(nodes)) ndsids.push(nodes);
    else ndsids=nodes;

    let newselsChecker = {}
    for (let i in ndsids) {
      newselsChecker[ndsids[i]] = true
    }

    var vars = []

    var catDict = TW.catDict;
    var type = TW.Nodes[ndsids[0]].type;
    var nextTypes = [];
    for(var c in catDict)
        nextTypes.push( c==type )
    var nextTypesKey = nextTypes.map(Number).join("|")

    // £TODO fix low-level selectionlogic duplicate with MultipleSelection2 function 1/2
    // Dictionaries of: selection+neighbors
    var nodes_2_colour = {}
    var edges_2_colour = {}
    var voisinage = {}
    for(var i in ndsids) {
        let nid = ndsids[i];
        let neigh = TW.Relations[nextTypesKey][nid]
        if(neigh) {
            for(var j in neigh) {
                t = neigh[j]

                // FIXME deprecated should use customAttrs.highlight = true;
                // nodes_2_colour[t]=false;

                edges_2_colour[nid+";"+t]=true;
                edges_2_colour[t+";"+s]=true;
                if( !newselsChecker[t]  )
                    voisinage[ Number(t) ] = true;
            }
        }
        // we make the selected (source) node active too
        nodes_2_colour[ndsids[i]]=true;
    }

    // old strategy recreated a graph with the selected and its neighbors:
    //  we now do it only if type is different
    if (nextTypesKey != getActivetypesKey()) {
      TW.partialGraph.graph.clear();
      for(var nid in nodes_2_colour)
          add1Elem(nid)
      for(var eid in edges_2_colour)
          add1Elem(eid)

      // Adding intra-neighbors edges O(voisinage²)
      voisinage = Object.keys(voisinage)
      for(var i=0;i<voisinage.length;i++) {
          for(var j=1;j<voisinage.length;j++) {
              if( voisinage[i]!=voisinage[j] ) {
                  console.log( "\t" + voisinage[i] + " vs " + voisinage[j] )
                  add1Elem( voisinage[i]+";"+voisinage[j] )
              }
          }
      }
    }

    // Nodes Selection now:
    // ££TODO fix  low-level selectionlogic duplicate with MultipleSelection2 function 2/2
    if(ndsids.length>0) {
        TW.instance.selNgn.MultipleSelection2({
                    nodesDict:nodes_2_colour,
                    edgesDict:edges_2_colour
                });
        TW.gui.selectionActive = true
    }

    var present = TW.states.slice(-1)[0]; // Last
    var level = present.level;
    var lastpos = TW.states.length-1;

    // like pushing down in a lifo state present becomes state penultimate
    // £TODO setState should be doing this shifting
    var avantlastpos = lastpos-1;
    TW.states[avantlastpos] = {};
    TW.states[avantlastpos].selectionNids = present.selectionNids;
    TW.states[avantlastpos].level = present.level;
    TW.states[avantlastpos].activetypes = present.activetypes;

    // recording the new state
    TW.setState({
        activetypes: nextTypes,
        level: false,  // forced macro
        sels: present.selectionNids
    })

    TW.partialGraph.camera.goTo({x:0, y:0, ratio:0.9, angle: 0})
    TW.partialGraph.refresh({skipIndexation:true});

    sigma_utils.smartForceAtlas({'duration': TW.conf.fa2Milliseconds/2})

    //
    // ChangeGraphAppearanceByAtt(true)
}


function unHide(nodeId) {
  TW.partialGraph.graph.nodes(nodeId).hidden=false
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

//
// function hideEverything(){
//     console.log("\thiding all");
//     nodeslength=0;
//
//     var nodes = TW.partialGraph.nodes()
//     for(var j in nodes){
//         nodes[j].hidden=true;
//     }
//     if (TW.partialGraph.settings('drawEdges')) {
//       var edges = TW.partialGraph.graph.edges()
//       for(var i in edges){
//           edges[i].hidden=true;
//       }
//     }
//     overNodes=false;//magic line!
//     console.log("\tall hidded");
//     //Remember that this function is the analogy of EmptyGraph
//     //"Saving node positions" should be applied in this function, too.
// }



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
