'use strict';


// @args is an object with 4 possible properties that define the new state
//     ex: new selections:  {sels: [268]}
//     ex: new activetypes: {activetypes:[false, true]}
//     ex: new level:       {level:false}
TW.pushGUIState = function( args ) {

    let lastState = TW.states.slice(-1)[0]   // <=> TW.SystemState()

    if (TW.conf.debug.logStates) console.log("setState args: ", args);

    // 1) we start from a copy
    let newState = Object.assign({}, lastState)

    // counter à toutes fins utiles
    newState.id ++

    // console.log("pushGUIState:", newState.id)

    // 2) we update it with provided args
    if (!isUndef(args.activetypes))    newState.activetypes = args.activetypes
    if (!isUndef(args.activereltypes)) newState.activereltypes = args.activereltypes
    if (!isUndef(args.level))          newState.level = args.level;
    if (!isUndef(args.sels))           newState.selectionNids = args.sels;

    // this one just needed for changeType "comeback" case
    if (!isUndef(args.comingFromType)) newState.comingFromType = args.comingFromType

    // neighbors (of any type) and their edges in an .selectionRels[type] slot
    if(!isUndef(args.rels))          newState.selectionRels = args.rels;

    // POSS1: add common changeGraphAppearanceByFacets effects inside this function

    // POSS2: add filterSliders params to be able to recreate subsets at a given time
    //      cf. usage of TW.partialGraph.graph.nodes() as current scope in changeType
    //            and n.hidden usage in sliders

    // legacy : we prefer to redo louvain than to miss a new nodeset
    //          (wouldn't be needed if POSS2 implemented)
    newState.LouvainFait = false;


    // 3) apply all GUI effects

    // if global level, change level depends on a selection
    // if local then it's always available to go back to global
    LevelButtonDisable( newState.level && newState.selectionNids.length == 0 );

    // recreate sliders after activetype or level changes
    if (TW.conf.filterSliders
        && (!isUndef(args.level)
            || !isUndef(args.activetypes)
            || !isUndef(args.activereltypes))
          ) {

      for (let actypeId in newState.activetypes) {
        if (! newState.activetypes[actypeId]) {
          $(".for-nodecategory-"+actypeId).hide()
        }
        else {
          $(".for-nodecategory-"+actypeId).show()
          NodeWeightFilter( `#slidercat${actypeId}nodesweight` ,  actypeId);
          EdgeWeightFilter(`#slidercat${actypeId}edgesweight`, `${actypeId}${actypeId}`, "weight");
        }
      }
    }

    // recreate tabs after type changes
    // project_conf.json conf entry (POSS unify s/TW.File/TW.sourceId/g)
    if (TW.conf.getRelatedDocs
        && !isUndef(args.activetypes)
        && TW.currentRelDocsDBs) {

      resetTabs(newState.activetypes, TW.currentRelDocsDBs)
    }

    // 4) store it in TW.states
    TW.states.push(newState)

    // 5) forget oldest states if needed
    while (TW.states.length > TW.conf.maxPastStates) {
      TW.states.shift()
    }

    if (TW.conf.debug.logStates)
      console.log(`updated states: ${JSON.stringify(TW.states)}`)
};



TW.resetGraph = function() {
  // remove the selection
  cancelSelection(false, {norender: true})

  // and set tabs to none
  resetTabs()

  // call the sigma graph clearing
  TW.instance.clearSigma()

  // reset rendering gui flags
  TW.gui.selectionActive = false

  // reset circle size and cursor
  TW.gui.circleSize = 0
  TW.gui.circleSlider.setValue(0)

  // reset other gui flags
  TW.gui.checkBox=false
  TW.gui.lastFilters = {}

  // reset colors legends
  updateColorsLegend()

  // forget the states
  TW.states = [TW.initialSystemState]

  // remaining global vars will be reset by new graph mainStartGraph
}

// create more human-readable graph labels for the menu
// data/project/coolgraph.gexf ==> "project: coolgraph"
function graphPathToLabel(fullPath) {
  return fullPath.replace(
      /^(?:data\/)?([^/]+)\/(.*)(?:\.(?:gexf|json))?/,
      "$1: $2"
    )
}


// read the server files menu list
// (list of source paths available)
function readMenu(infofile) {
  if (TW.conf.debug.logFetchers)  console.info(`attempting to load filemenu ${infofile}`)

  var preRES = AjaxSync({ url: infofile, datatype:"json" });

  if (preRES['OK'] && preRES.data) {
    if (TW.conf.debug.logFetchers) console.log('initial AjaxSync result preRES', preRES)
  }

  // we just make a clean copy, skipping invalid entries
  let serverMenu = {}
  let firstProject = null

  // check all the paths and associated sources
  for( var projectPath in preRES.data ) {
    if (! preRES.data[projectPath] || ! preRES.data[projectPath].length) {
      console.warn("sourceMenu: Skipping invalid project entry:", projectPath)
    }
    else {
      if (projectPath == "first_project") {
        firstProject = preRES.data['first_project']
      }
      else {
        // test and copy if ok
        serverMenu[projectPath] = []
        for (var l in preRES.data[projectPath]) {
          let sourceFile = preRES.data[projectPath][l]
          let fileExists = linkCheck(projectPath+'/'+sourceFile)
          if (fileExists) {
            serverMenu[projectPath].push(sourceFile)
          }
        }
        if (! serverMenu[projectPath].length) {
          console.warn(`sourceMenu: Skipping project path ${projectPath} (none of the referenced source files are present.)`)
          delete serverMenu[projectPath]
        }
      }
    }
  }
  return [serverMenu, firstProject]
}

// read project_conf.json files in the project dir for this file
function readProjectConf(projectPath, filePath) {
  let declaredNodetypes
  let declaredDBConf

  let projectConfFile = projectPath + '/project_conf.json'

  if (! linkCheck(projectConfFile)) {
    console.warn (`no project_conf.json next to the file, ${filePath},
                   will try using default nodetypes`)
  }
  else {

    if (TW.conf.debug.logFetchers)
      console.info(`attempting to load project conf ${projectConfFile}`)

    var pjconfRes = AjaxSync({ url: projectConfFile, datatype:"json" });

    if (TW.conf.debug.logFetchers)
      console.log('project conf AjaxSync result pjconfRes', pjconfRes)

    if (! pjconfRes['OK']
       || ! pjconfRes.data
       || ! pjconfRes.data[filePath] ) {
       console.warn (`project_conf.json in ${projectPath} is not valid json
                      or does not contain an entry for ${filePath},
                      will try using default nodetypes`)
    }
    else {
      let confEntry = pjconfRes.data[filePath]
      for (var ndtype in confEntry) {
        if (! /node\d+/.test(ndtype)) {
          console.warn (`project_conf.json in ${projectPath}, in the entry
                         for ${filePath}, should only contain properties
                         like 'node0', 'node1', etc.`)
        }
        else {
          if (! confEntry[ndtype].name) {
            console.warn (`project_conf.json in ${projectPath}, in the entry for
                          ${filePath}.${ndtype}, should contain a 'name' slot`)
          }
          // valid case !
          else {
            if (! declaredNodetypes)  declaredNodetypes = {}

            // fill simple nodetypes
            declaredNodetypes[ndtype] = confEntry[ndtype].name
          }

          // optional reldbs -----------------------
          if (confEntry[ndtype].reldbs) {
            if (! declaredDBConf)     declaredDBConf = {}

            // it must match because we tested well-formedness above
            let ndtypeId = ndtype.match(/^node(\d+)/)[1]

            declaredDBConf[ndtypeId] = {}
            for (var dbtype in confEntry[ndtype].reldbs) {
              if (! TW.conf.relatedDocsAPIS[dbtype]) {
                console.info (`project_conf.json: ${projectPath}.${filePath}.${ndtype}:
                               skipping unknown related docs db type **${dbtype}**.
                               The only available db types are:
                               ${Object.keys(TW.conf.relatedDocsAPIS)}.`)
              }
              else {
                declaredDBConf[ndtypeId][dbtype] = confEntry[ndtype].reldbs[dbtype]
              }
            }
          }
          // ----------------------------------------

        }
      }
    }
  }
  return [declaredNodetypes, declaredDBConf]
}



// read optional legends.json file in the project dir for this file
function readProjectFacetsConf(projectPath, filePath) {
  let declaredFacetsConf

  let legendConfFile = projectPath + '/legends.json'

  if (! linkCheck(legendConfFile)) {
    console.log (`no legend.json next to the file, ${filePath},
                   will try using default facet options`)
  }
  else {
    if (TW.conf.debug.logFetchers)
      console.info(`attempting to load legends conf ${legendConfFile}`)

    var legconfRes = AjaxSync({ url: legendConfFile, datatype:"json" });

    if (TW.conf.debug.logFetchers)
      console.log('legends conf AjaxSync result legconfRes', legconfRes)

    if (! legconfRes['OK']
       || ! legconfRes.data) {
       console.warn (`legends.json in ${projectPath} is not valid json: skipped`)
    }
    else {
      // load attributes params as they are
      declaredFacetsConf = legconfRes.data
      // (each coloring function has own fallbacks and checks on these params)
    }
  }
  return declaredFacetsConf
}



// settings: {norender: Bool}
function cancelSelection (fromTagCloud, settings) {
    if (TW.conf.debug.logSelections) { console.log("\t***in cancelSelection"); }
    if (!settings) settings = {}

    // SystemState effects
    // -------------------
    // clear the current state's selection and neighbors arrays
    deselectNodes(TW.SystemState())    //Unselect the selected ones :D

    // new state
    TW.pushGUIState({sels:[], rels:{}})

    // GUI effects
    // -----------
    // global flag
    TW.gui.selectionActive = false

    // hide all selection panels
    if(!fromTagCloud){
        // POSS give them all a common class
        $("#names").html("");
        $("#topPapers").html("");
        $("#topPapers").hide();
        $("#read-sameside-neighs").html("");
        $("#read-opposite-neighs").html("");
        $("#selection-tabs-contnr").hide();
        $("#reldocs-tabs-wrapper").hide();
        $("#information").html("");
        $("#searchinput").val("");
        $("#unselectbutton").hide();
        $("#lefttopbox").hide();           // <= main selection list cf namesDIV
        $("#names").html("");              // <= contained by #lefttopbox
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
function getActivetypesNames() {
  let currentTypeNames = []

  // for instance [true, false] if type0 is active
  let activeFlags = TW.SystemState().activetypes

  for (var i = 0 ; i < TW.categories.length ; i++) {
    if (activeFlags[i]) {
      currentTypeNames.push(TW.categories[i])
    }
  }

  // ex: ['Document'] or ['Ngrams'] or ['Document','Ngrams']
  return currentTypeNames
}

function getActiverelsKey(someState) {
  if (! someState)   someState = TW.SystemState()
  if (someState.activetypes.indexOf(false) != -1) {
    // ex "00" or "11"
    return someState.activetypes.indexOf(true).toString().repeat(2)
  }
  else {
    return "XR"
  }
}

// how many types are currently active
function getNActive(someState) {
  return TW.SystemState().activetypes.filter(function(bool){return bool}).length
}



// deselectNodes
// -------------
// works only on the sigma part:
// changes attributes of nodes and edges to remove:
//  - active flags
//  - highlight flags
//  - and activeEdge flags

// NB: "low-level" <=> by design, does NOT change the state, gui nor global flag
//                     but ought to be called by "scenario" functions that do

// fast because works on the subset of active nodes indicated in SystemState()
function deselectNodes(aSystemState){
    if (isUndef(aSystemState))   aSystemState = TW.SystemState()

    // active nodes
    let sels = aSystemState.selectionNids
    if (TW.conf.debug.logSelections)
      console.log("deselecting using SystemState's lists")

    for(let i in sels) {
      let n = TW.partialGraph.graph.nodes(sels[i])

      if (!n || n.hidden) continue

      // mark as unselected!
      n.customAttrs.active = 0

      // for only case legend highlight...
      n.customAttrs.highlight = 0
    }

    // active relations
    // (give us neighbors and edges to dehighlight/deactivate)
    let rels = aSystemState.selectionRels

    for (var reltyp in rels) {
      for (var srcnid in rels[reltyp]) {
        for (var tgtnid in rels[reltyp][srcnid]) {
          let tgt = TW.partialGraph.graph.nodes(tgtnid)
          if (tgt && !tgt.hidden) {
            tgt.customAttrs.highlight = 0
            let eid1 = `${srcnid};${tgtnid}`
            let eid2 = `${tgtnid};${srcnid}`

            let e1 = TW.partialGraph.graph.edges(`${srcnid};${tgtnid}`)
            if(e1 && !e1.hidden) {
              e1.customAttrs.activeEdge = 0
            }
            let e2 = TW.partialGraph.graph.edges(`${tgtnid};${srcnid}`)
            if(e2 && !e2.hidden) {
              e2.customAttrs.activeEdge = 0
            }
          }
        }
      }
    }
}

// called by tagcloud neighbors
function manualForceLabel(nodeid, flagToSet, justHover) {
  let nd = TW.partialGraph.graph.nodes(nodeid)

  nd.customAttrs.forceLabel = flagToSet

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
// POSS: merge with hit_templates from additional conf
function htmlfied_nodesatts(elems){

    var socnodes=[]
    var semnodes=[]

    if (TW.conf.debug.logSelections) console.log("htmlfied_nodesatts", elems)

    for(var i in elems) {

        var information=[]

        var id=elems[i]
        var node = TW.Nodes[id]

        if(TW.catDict[node.type] == 1){
            information += '<li><b>' + node.label + '</b></li>';
            if(node.htmlCont==""){
                if (!isUndef(node.level)) {
                    information += '<li class="infosoc">' + node.level + '</li>';
                }
            } else {
                information += '<li class="infosoc">' + $("<div/>").html(node.htmlCont).text() + '</li>';
            }
            socnodes.push(information)
        }
        else {
          information += '<li><b>' + node.label + '</b></li>';
          let google='<a target="_blank" href=http://www.google.com/#hl=en&source=hp&q=%20'+node.label.replace(" ","+")+'%20><img src="'+TW.conf.paths.ourlibs+'/img/google.png"></img></a>';
          let wiki = '<a target="_blank" href=http://en.wikipedia.org/wiki/'+node.label.replace(" ","_")+'><img src="'+TW.conf.paths.ourlibs+'/img/wikipedia.png"></img></a>';
          let flickr= '<a target="_blank" href=http://www.flickr.com/search/?w=all&q='+node.label.replace(" ","+")+'><img src="'+TW.conf.paths.ourlibs+'/img/flickr.png"></img></a>';
          information += '<li>'+google+"&nbsp;"+wiki+"&nbsp;"+flickr+'</li><br>';
          semnodes.push(information)
        }

    }
    return socnodes.concat(semnodes)
}


function manualSelectNode ( nodeid ) {
    // it was hovered but with no hover:out so we first remove hover effect
    manualForceLabel(nodeid, false, true)

    // and it's a new selection
    TW.instance.selNgn.MultipleSelection2({nodes:[nodeid]});
    // (MultipleSelection2 will do the re-rendering and push the new state)
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

        if (sourceRange) {
          fontSize = ((frec - frecMin) * (targetRange) / (sourceRange)) + TW.conf.tagcloudFontsizeMin
        }
        else {
          // 1em when all elements have the same freq
          fontSize = 1
        }

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
        sameNodesDIV+='<div id="relatedBox">';//tagcloud
        var sameNeighTagcloudHtml = htmlProportionalLabels( same , TW.conf.tagcloudSameLimit, true )
        sameNodesDIV+= (sameNeighTagcloudHtml!=false) ? sameNeighTagcloudHtml.join("\n")  : "No related items.";
        sameNodesDIV+= '</div>';
    }

    informationDIV += '<br><h4>Information:</h4><ul class="infoitems">';
    informationDIV += htmlfied_nodesatts( sels ).join("<br>\n")
    informationDIV += '</ul><br>';

    // selection panels and tabs
    $("#lefttopbox").show();
    $("#selection-tabs-contnr").show();
    $("#names").html(namesDIV).readmore({maxHeight:100});
    $("#information").html(informationDIV);

    // easytab + readmore needs "click" on active tab to update HTML correctly
    let tabAnchors = document.querySelectorAll('.etabs > li > a')
    for (var i = 0 ; i < tabAnchors.length ; i++) {
      if (tabAnchors[i] && tabAnchors[i].classList.contains("active"))
      $('#selection-tabs-contnr').easytabs(
        'select', tabAnchors[i].getAttribute('href')
      );
    }

    if(oppos.length>0) {
      $("#read-opposite-neighs").readmore('destroy')
      $("#read-opposite-neighs").html(alterNodesDIV)
      $("#read-opposite-neighs").readmore({maxHeight:200});
    }
    $("#read-sameside-neighs").readmore('destroy')
    $("#read-sameside-neighs").html(sameNodesDIV)
    $("#read-sameside-neighs").readmore({maxHeight:200});

    if (TW.conf.getRelatedDocs) {
      let rdTabCount = 0
      // update all related docs tabs
      for (let ntId in TW.SystemState().activetypes) {
        if (TW.SystemState().activetypes[ntId]) {
          let qWords = queryForType(ntId)
          // console.log("available topPapers tabs:", TW.gui.reldocTabs[ntId])
          for (let relDbType in TW.gui.reldocTabs[ntId]) {
            let tabId = `rd-${ntId}-${relDbType}`
            rdTabCount ++

            // if not already done
            if (! TW.lastRelDocQueries[tabId]
                || TW.lastRelDocQueries[tabId] != qWords) {
              getTopPapers(qWords, ntId, relDbType, tabId)

              // memoize
              TW.lastRelDocQueries[tabId] = qWords
            }
          }
        }
      }
      if (rdTabCount > 0)    $("#reldocs-tabs-wrapper").show();
    }
    else {
      $("#reldocs-tabs-wrapper").hide();
    }
}

//	just css
//true: button disabled
//false: button enabled
function LevelButtonDisable( TF ){
	$('#changelevel').prop('disabled', TF);
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
      // will not be modified
      n.color = TW.conf.sigmaJsDrawingProperties.defaultNodeColor
      rgbStr = n.color.split(',').splice(0, 3).join(',');
    }

    n.customAttrs = {
      // status flags
      active: false,              // when selected
      highlight: false,           // when neighbors or legend's click

      // default unselected color
      defgrey_color : "rgba("+rgbStr+","+TW.conf.sigmaJsDrawingProperties.twNodesGreyOpacity+")",

      // will be used for repainting (read when TW.gui.handpickedcolors flags)
      alt_color: null,
      altgrey_color: null,
    }

    // POSS n.type: distinguish rendtype and twtype
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
        saveGEXF ( getVisibleNodes() , getVisibleEdges(), atts )
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
function reInitFa2 (params = {}) {

  sigma_utils.ourStopFA2()

  // if (params.useSoftMethod) {
    // soft method: we just update FA2 internal index
    // (is good enough if new nodes are subset of previous nodes)
    TW.partialGraph.supervisor.graphToByteArrays(
      {'skipHidden': params.skipHidden || !TW.conf.stablePositions}
    )

    // now cb
    if (params.callback) {
      params.callback()
    }
  // }
  // else {
  //   TW.partialGraph.killForceAtlas2()
  //
  //   // after 1s to let killForceAtlas2 finish
  //   setTimeout ( function() {
  //     // init FA2
  //     if (params.skipHidden || !TW.conf.stablePositions) {
  //       TW.FA2Params.skipHidden = true
  //     }
  //     TW.partialGraph.configForceAtlas2(TW.FA2Params)
  //
  //     // now cb
  //     if (params.callback) {
  //       params.callback()
  //     }
  //   }, 1000)
  // }
}
