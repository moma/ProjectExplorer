'use strict;'

// GUI commodity pointers
TW.gui = {}
TW.gui.elHtml = document.getElementsByTagName('html')[0]
TW.gui.elContainer = document.getElementById('sigma-contnr')
TW.gui.sheets = {}
for (var i in document.styleSheets) {
  if (/twjs.css$/.test(document.styleSheets[i].href)) {
    TW.gui.sheets.main = document.styleSheets[i]
  }
  else if (/selection-panels.css$/.test(document.styleSheets[i].href)) {
    TW.gui.sheets.panels = document.styleSheets[i]
  }
}

// GUI vars
TW.gui.selectionActive = false  // <== changes rendering mode
TW.gui.smallView=false;         // tracks if small width
TW.gui.circleSize = 0;
TW.gui.circleSlider = null
TW.gui.checkBox=false;
TW.gui.shiftKey=false;
TW.gui.foldedSide=false;
TW.gui.manuallyChecked = false;
TW.gui.handpickedcolor = false;     // <= changes edge rendering strategy
TW.gui.lastFilters = {}
TW.gui.reldocTabs = [{}, {}]        // <= by nodetype and then dbtype

TW.gui.sizeRatios = [1,1]           // sizeRatios per nodetype

TW.gui.noverlapConf = {
  nodeMargin: .4,
  scaleNodes: 1.5,
  gridSize: 300,
  speed: 7,
  maxIterations: 8,
  easing: 'quadraticOut', // animation transition function
  duration: 1500   // animation duration
                   // NB animation happens *after* processing
}


// POSS: themed variants (ex: for dark bg vs light bg)
// contrasted color list for clusterColoring()
TW.gui.colorList = ["#000000", "#FFFF00", "#1CE6FF", "#FF34FF", "#FF4A46", "#008941",
         "#006FA6", "#A30059", "#FFDBE5", "#7A4900", "#0000A6", "#63FFAC", "#B79762",
         "#004D43", "#8FB0FF", "#997D87", "#5A0007", "#809693", "#FEFFE6", "#1B4400",
         "#4FC601", "#3B5DFF", "#4A3B53", "#FF2F80", "#61615A", "#BA0900", "#6B7900",
         "#00C2A0", "#FFAA92", "#FF90C9", "#B903AA", "#D16100", "#DDEFFF", "#000035",
         "#7B4F4B", "#A1C299", "#300018", "#0AA6D8", "#013349", "#00846F", "#372101",
         "#FFB500", "#C2FFED", "#A079BF", "#CC0744", "#C0B9B2", "#C2FF99", "#001E09",
         "#00489C", "#6F0062", "#0CBD66", "#EEC3FF", "#456D75", "#B77B68", "#7A87A1",
         "#788D66", "#885578", "#FAD09F", "#FF8A9A", "#D157A0", "#BEC459", "#456648",
         "#0086ED", "#886F4C","#34362D", "#B4A8BD", "#00A6AA", "#452C2C", "#636375",
         "#A3C8C9", "#FF913F", "#938A81", "#575329", "#00FECF", "#B05B6F", "#8CD0FF",
         "#3B9700", "#04F757", "#C8A1A1", "#1E6E00", "#7900D7", "#A77500", "#6367A9",
         "#A05837", "#6B002C", "#772600", "#D790FF", "#9B9700", "#549E79", "#FFF69F",
         "#201625", "#72418F", "#BC23FF", "#99ADC0", "#3A2465", "#922329", "#5B4534",
         "#FDE8DC", "#404E55", "#0089A3", "#CB7E98", "#A4E804", "#324E72", "#6A3A4C",
         "#83AB58", "#001C1E", "#D1F7CE", "#004B28", "#C8D0F6", "#A3A489", "#806C66",
         "#222800", "#BF5650", "#E83000", "#66796D", "#DA007C", "#FF1A59", "#8ADBB4",
         "#1E0200", "#5B4E51", "#C895C5", "#320033", "#FF6832", "#66E1D3", "#CFCDAC",
         "#D0AC94", "#7ED379", "#012C58"];


// 24 colors + White, divided in cold and warm range for getHeatmapColors() fun
TW.gui.heatmapColorListWhite = "#F9F7ED"
TW.gui.heatmapColorListToColdest = [
  "#B4FF50",
  "#A4FF24",
  "#79FF23",
  "#42F923",
  "#22F226",
  "#02CB36",
  "#01C462",
  "#01BC8D",
  "#00B5B1",
  "#0088AE",
  "#005197",
  "#002FA0"
]

TW.gui.heatmapColorListToWarmest = [
  "#FFE37A",
  "#FFE008",
  "#F0C508",
  "#E89A09",
  "#E48509",
  "#DF7009",
  "#DB5B09",
  "#D7450A",
  "#D3300A",
  "#CF1B0A",
  "#CB060B",
  "#B21014"
];


// provides a heatmap color list centered on a white class
// arg: number of classes
// NB: if number of classes is *even*,
//     then the 2 middle categories
//     will get the white "epsilon" color
function getHeatmapColors(nClasses) {

  // our dev param == colorListToWarmest.length == colorListToColdest.length
  let listsLen = 12

  // our result
  var outColors = []

  if (nClasses > listsLen*2) {
    throw(`this function implementation can only give up to ${listsLen*2} classes`)
  }

  let nHalfToPick = 0
  if (nClasses % 2 == 0) {
    nHalfToPick = nClasses/2 - 1
  }
  else {
    nHalfToPick = (nClasses-1)/2
  }

  // floor
  let exactStep = listsLen / nHalfToPick
  let skipStep = parseInt(exactStep)    // incrmt must be int (used for arr idx)

  // to compensate for the fractional part
  let delta = exactStep - skipStep
  let drift = 0

  // cold colors, starting from deepest color
  for (let i = listsLen-1 ; i > 0 ; i -= skipStep ) {
    outColors.push(TW.gui.heatmapColorListToColdest[i])

    // catching back one step from time to time
    drift += delta
    if (drift >= 1) {
      i--
      drift -= 1
    }
  }

  // white
  outColors.push(TW.gui.heatmapColorListWhite)
  if (nClasses % 2 == 0) {
    outColors.push(TW.gui.heatmapColorListWhite)
  }

  // warm colors
  for (let i = 0 ; i < listsLen ; i += skipStep ) {
    outColors.push(TW.gui.heatmapColorListToWarmest[i])
  }

  return outColors
}


function writeBrand (brandString, brandLink) {
  document.getElementById('twbrand').innerHTML = brandString
  let anchors = document.getElementsByClassName('twbrand-link')
  for (var k in anchors) {
    if (anchors[k] && anchors[k].href) {
      anchors[k].href = brandLink
    }
  }
}

function writeLabel (aMapLabel) {
  document.getElementById('maplabel').innerHTML = aMapLabel
}


// some actions handled by js overrides the CSS from our stylesheets
// => this function removes all these changes to restore stylesheet rules
function cssReset() {
  $("#sigma-contnr").css('right', '')
  $("#ctlzoom").css('right','')
  $("#sidebar").css('right','')
  $("#sidebar").show()
  TW.gui.foldedSide = false
}


function foldingReset() {
  if (TW.gui.foldedSide) {
    $("#sideunfold").show()
    $("#sidefold").hide()
  }
  else {
    $("#sideunfold").hide()
    $("#sidefold").show()
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


// fileChooser: added to the environment when user opens explorer as local file
// -----------
// TODO: because source files now get a project_conf.md, find a way to open it too if it exists
function createFilechooserEl () {

  var inputComment = document.createElement("p")
  inputComment.innerHTML = `<strong>Choose a graph from your filesystem (gexf or json).</strong>`
  inputComment.classList.add('comment')
  inputComment.classList.add('centered')

  var graphFileInput = document.createElement('input')
  graphFileInput.id = 'localgraphfile'
  graphFileInput.type = 'file'
  graphFileInput.accept = 'application/xml,application/gexf,application/json'
  graphFileInput.classList.add('centered')

  // NB file input will trigger mainStartGraph() when the user chooses something


  graphFileInput.onchange = function() {
    if (this.files && this.files[0]) {

      let clientLocalGraphFile = this.files[0]

      // determine the format
      let theFormat
      if (/\.(?:gexf|xml)$/.test(clientLocalGraphFile.name)) {
        theFormat = 'gexf'
      }
      else if (/\.json$/.test(clientLocalGraphFile.name)) {
        theFormat = 'json'
      }
      else {
        alert('unrecognized file format')
      }

      // retrieving the content
      let rdr = new FileReader()

      rdr.onload = function() {
        if (! rdr.result ||  !rdr.result.length) {
          alert('the selected file is not readable')
          writeLabel(`Local file: unreadable!`)
        }
        else {
          // we might have a previous graph opened
          TW.resetGraph()

          // run
          mainStartGraph(theFormat, rdr.result, TW.instance)

          // NB 3rd arg null = we got no additional conf for this "unknown" file

          writeLabel(`Local file: ${clientLocalGraphFile.name}`)
        }
      }
      rdr.readAsText(clientLocalGraphFile)
    }
  }

  var filechooserBox = document.createElement('div')
  filechooserBox.appendChild(inputComment)
  filechooserBox.appendChild(graphFileInput)

  return filechooserBox
}

//============================ < NEW BUTTONS > =============================//

function changeType(optionaltypeFlag) {

    // RELATION TYPES
    //
    //           SOURCE NODE              TARGET NODE
    //  -----------------------------------------------------
    //        |   [NODES 0] ============== [NODES 0]
    //   S  S |                                              00
    //   A  I |   [NODES 1]                [NODES 1]
    //   M  D |----------------------------------------------
    //   E  E |   [NODES 0]                [NODES 0]
    //        |                                              11
    //        |   [NODES 1] ============== [NODES 1]
    //  -----------------------------------------------------
    //   C  R |   [NODES 0]        ======= [NODES 0]
    //   R  E |                  //                          XR
    //   O  L |   [NODES 1] =====          [NODES 1]
    //   S  S
    //   S


    // OPERATIONS WE NEED TO DO
    //  |
    //  |
    //  ├─in macro case
    //  |  ├─ basic case
    //  |  |     |
    //  |  |    remove the nodes of current node type
    //  |  |    add all the nodes of new node type
    //  |  |    if selection
    //  |  |         └─ project the selection via "cross rels" (bipartite edges)
    //  |  |             └─ create a new selection from matching opposite nodes
    //  |  |
    //  |  |
    //  |  └─ 'comeback' case -- :coming back from mixed view to nodes[0]:
    //  |        |
    //  |       remove all nodes / n[ ~ O ] (the not-target = nodes0 ones)
    //  |       if selection
    //  |            └─ remove "half" of the selection (the not-target ones)
    //  |
    //  |
    //  └─in meso/micro case
    //     ├─ basic case
    //     |     |
    //     |   (same as macro basic case) ∩ (scope)
    //     |                                   |
    //     |                         microlevel: subset of nodes
    //     |
    //     └─ '1|1 jutsu' case -- :going to mixed view:
    //           |
    //          starting from selection or full micro graph
    //          add the nodes from the opposite type via "cross rels"
    //
    //
    //  => push a new gui state (node type [+ sels + highlight rels])
    //                      |
    //                      updates the sliders and selection panels

    let typeFlag
    let outgoing = TW.SystemState()
    let oldTypeId = outgoing.activetypes.indexOf(true)
    let mixedState = (outgoing.activereltypes.length > 1)
    let preservedNodes = {}

    // 1 - make the targetTypes choices
    if (!isUndef(optionaltypeFlag)) {
      typeFlag = optionaltypeFlag
    }
    else {
      // "comeback" case: going back from mixed view to nodes0 view
      // ----------
      if (mixedState) {
        typeFlag = 0
      }
      // "jutsu" case: macrolevel opens mixed view
      // -------
      else if (!outgoing.level) {
        typeFlag = 'all'
      }
      // normal case: show the opposite type
      // -----------
      else {
        typeFlag = (oldTypeId + 1) % 2    // binary toggle next  0 => 1
                                          //                     1 => 0
      }
    }

    // 2 - infer consequences of targetTypes
    let newActivetypes = []
    if (typeFlag == 'all') {
      for (var i in TW.categories) { newActivetypes.push(true) }
    }
    else {
      for (var i in TW.categories) {
        if (i == typeFlag)  newActivetypes.push(true)
        else                newActivetypes.push(false)
      }
    }
    // console.log('newActivetypes', newActivetypes)

    let newReltypes = TW.instance.inferActivereltypes(newActivetypes)
    // console.log('newReltypes', newReltypes)


    // 3 - define the projected selection (sourceNids => corresponding opposites)
    let sourceNids = outgoing.selectionNids
    if (!outgoing.level && !sourceNids.length) {
      // when local and no selection => all local graph is selection
      sourceNids = TW.partialGraph.graph.nodes().map(function(n){return n.id})
    }
    let targetNids = {}
    if (!mixedState && outgoing.level) {
      targetNids = getNeighbors(sourceNids, 'XR')
    }
    else {
      // in mixed state we need to separate those already tgt state from others
      let alreadyOk = TW.partialGraph.graph.getNodesByType(typeFlag)
      let alreadyOkLookup = {}
      for (var i in alreadyOk) {alreadyOkLookup[alreadyOk[i]] = true}
      let needTransition = []
      for (var i in sourceNids) {
        let nid = sourceNids[i]
        if (alreadyOkLookup[nid])         targetNids[nid] = true
        else                              needTransition.push(nid)
      }
      targetNids = Object.assign(targetNids, getNeighbors(needTransition, 'XR'))
    }

    // 4 - define the nodes to be added
    let newNodes = {}

    // when scope is "entire graph" => entire sets by type
    if (outgoing.level) {
      for (let typeId in newActivetypes) {
        if (newActivetypes[typeId]) {
          newNodes = Object.assign(newNodes, getNodesOfType(typeId))
        }
      }
    }
    // when scope is "local subset" => selection's projection
    else {
      for (var nid in targetNids) {
        newNodes[nid] = TW.Nodes[nid]
      }
    }
    // console.log('newNodes', newNodes)

    // 5 - define the new selection
    let newselsArr = []
    if (outgoing.selectionNids.length) {
      if (typeFlag != 'all') {
        newselsArr = Object.keys(targetNids)
      }
      else {
        // not extending selection to all transitive neighbors
        // makes the operation stable (when clicked several times,
        // we extend slower towards transitive closure)
        newselsArr = outgoing.selectionNids
      }
    }


    // 6 - effect the changes on nodes
    deselectNodes()
    if (typeFlag != "all") {
      TW.partialGraph.graph.clear()   // a new start is faster except in "jutsu"
    }
    else {
      TW.partialGraph.graph.getNodesByType(oldTypeId).map(
        function(nid){ preservedNodes[nid]=true }
      )
    }

    for (var nid in newNodes) {
      try {
        TW.partialGraph.graph.addNode(newNodes[nid])
      } catch(e) {continue}
    }

    // 7 - add the relations
    let newEdges = {}
    let allNodes = {}
    if (typeFlag != "all")  allNodes = newNodes
    else                    allNodes = Object.assign(newNodes, preservedNodes)
    for (var srcnid in allNodes) {
      for (var k in newReltypes) {
        let relKey = newReltypes[k]
        if (TW.Relations[relKey]
            && TW.Relations[relKey][srcnid]
            && TW.Relations[relKey][srcnid].length) {
          for (var j in TW.Relations[relKey][srcnid]) {
            let tgtnid = TW.Relations[relKey][srcnid][j]
            if (allNodes[tgtnid]) {
              let eids = [`${srcnid};${tgtnid}`, `${tgtnid};${srcnid}`]
              for (var l in eids) {
                let eid = eids[l]
                if (eid && TW.Edges[eid] && !TW.partialGraph.graph.edges(eid)){
                  newEdges[eid] = TW.Edges[eid]
                  break
                }
              }
            }
          }
        }
      }
    }

    // 8 - effect the changes on edges
    for (var eid in newEdges) {
      try {
        TW.partialGraph.graph.addEdge(newEdges[eid])
      } catch(e) {continue}
    }

    // 9 - refresh view and record the state
    TW.partialGraph.camera.goTo({x:0, y:0, ratio:1, angle: 0})
    TW.partialGraph.refresh()
    TW.pushGUIState({
        activetypes: newActivetypes,
        activereltypes: newReltypes,
        sels: newselsArr
        // rels: added by MS2 (highlighted opposite- and same-side neighbours)
        // possible: add it in an early way here and request that MS2 doesn't change state
    })

    // to recreate the new selection in the new type graph, if we had one before
    // NB relies on new actypes so should be after pushState
    if (newselsArr.length) {
      TW.instance.selNgn.MultipleSelection2({nodes: newselsArr});
      if (TW.conf.debug.logSelections)
        console.log("selection transitive projection from",sourceNids, "to", newselsArr)
    }

    // update search labels
    TW.labels.splice(0, TW.labels.length)
    for (var nid in allNodes) {
      updateSearchLabels(nid,allNodes[nid].label,allNodes[nid].type);
    }


    // update the gui (POSS could be handled by TW.pushGUIState)
    TW.gui.handpickedcolor = false
    changeGraphAppearanceByFacets( getActivetypesNames() )
    if (typeFlag != 'all') {
      graphResetLabelsAndSizes()
    }
    TW.partialGraph.settings('labelThreshold', getSizeFactor())
    fillAttrsInForm('choose-attr')
    fillAttrsInForm('attr-titling-metric', 'num')

    // recreates FA2 nodes array from new nodes
    reInitFa2({
      useSoftMethod: false,
      callback: function() {
        sigma_utils.smartForceAtlas()
      }
    })
}


// the pool of available nodes of a given type
function getNodesOfType (typeid){
  let res = {}
  if (TW.ByType[typeid]) {
    for (var j in TW.ByType[typeid]) {
      let nid = TW.ByType[typeid][j]
      let n = TW.Nodes[TW.ByType[typeid][j]]
      res[nid] = n
    }
  }
  return res
}


// one transitive step
function getNeighbors(sourceNids, relKey) {
  let targetDict = {}
  for (var i in sourceNids) {
    let srcnid = sourceNids[i]
    if (TW.Relations[relKey]
        && !isUndef(TW.Relations[relKey][srcnid])
        && TW.Relations[relKey][srcnid].length) {
      for (var j in TW.Relations[relKey][srcnid]) {
        let tgtnid = TW.Relations[relKey][srcnid][j]
        targetDict[tgtnid] = true
      }
    }
  }
  return targetDict
}


//
// changeLevel :     macro selection SysSt = {level: true, activetypes:XY}
//                         ^
//                         |
//                         v
//                   local selection SysSt = {level: false, activetypes:XY}
//
//  POSS: rewrite using .hidden instead of add/remove
//
function changeLevel(optionalTgtState) {
    // show waiting cursor
    TW.gui.elHtml.classList.add('waiting');

    // let the waiting cursor appear
    setTimeout(function() {
      var present = TW.SystemState(); // Last

      // array of nids [144, 384, 543]
      let sels = optionalTgtState ? optionalTgtState.selectionNids : present.selectionNids

      let selsChecker = {}
      for (let i in sels) {
        selsChecker[sels[i]] = true
      }

      // type "grammar"
      //     used to distinguish types in TW.Relations

      // types eg [true]          <=> '1'
      //          [true, true]    <=> '1|1'

      var activetypes = present.activetypes;
      var activereltypes = present.activereltypes

      TW.partialGraph.graph.clear();

      var voisinage = {}
      // Dictionaries of: selection+neighbors
      var nodesToAdd = {}
      var edgesToAdd = {}

      for(var i in sels) {
          s = sels[i];
          nodesToAdd[s]=true;
          for (var k in activereltypes) {
            let activereltype = activereltypes[k]
            if (TW.Relations[activereltype]) {
              neigh = TW.Relations[activereltype][s]
              if(neigh) {
                  for(var j in neigh) {
                      t = neigh[j]
                      nodesToAdd[t]=true;
                      edgesToAdd[s+";"+t]=true;
                      edgesToAdd[t+";"+s]=true;
                      if( !selsChecker[t]  )
                          voisinage[ t ] = true;
                  }
              }
            }
            else {
              // case where no edges at all (ex: scholars have no common keywords)
              console.log("no edges between these nodes")
            }
          }
      }

      var futurelevel = optionalTgtState ? optionalTgtState.level : !present.level

      if(!futurelevel) { // [Change to Local] when level=Global(1)

        TW.gui.elContainer.style.backgroundColor = TW.conf.mesoBackground

        for(var nid in nodesToAdd)
          add1Elem(nid)
        for(var eid in edgesToAdd)
          add1Elem(eid)

          // Adding intra-neighbors edges O(voisinage²)
          voisinage = Object.keys(voisinage)
          for(var i=0;i<voisinage.length;i++) {
              for(var j=1;j<voisinage.length;j++) {
                  if( voisinage[i]!=voisinage[j] ) {
                      // console.log( "\t" + voisinage[i] + " vs " + voisinage[j] )
                      add1Elem( voisinage[i]+";"+voisinage[j] )
                      add1Elem( voisinage[j]+";"+voisinage[i] )
                  }
              }
          }
      } else { // [Change to Global] when level=Local(0)

          TW.gui.elContainer.style.backgroundColor =  TW.conf.normalBackground

          // var t0 = performance.now()
          for(var nid in TW.Nodes) {
              if(activetypes[TW.catDict[TW.Nodes[nid].type]])
                  // we add 1 by 1
                  add1Elem(nid)
          }
          for(var eid in TW.Edges) {
            for (var k in activereltypes) {
              let activereltype = activereltypes[k]
              if(TW.Edges[eid].categ == activereltype)
                  add1Elem(eid)
            }
          }
          // var t1 = performance.now()
          // console.log("returning to global took:", t1-t0)
      }

      // sels and activereltypes unchanged, no need to call MultipleSelection2

      TW.pushGUIState({
          level: futurelevel,
          sels: sels
      })

      TW.partialGraph.camera.goTo({x:0, y:0, ratio:1.2, angle: 0})
      TW.partialGraph.refresh()

      // recreate FA2 nodes array after you change the nodes
      reInitFa2({
        useSoftMethod: false,
        callback: function() {
          TW.gui.elHtml.classList.remove('waiting');

          // rearrange nodes in all cases (&& if fa2Enabled)
          sigma_utils.smartForceAtlas()
        }
      })
    },500 // cursor waiting
  )
}
//============================= </ NEW BUTTONS > =============================//





//=========================== < FILTERS-SLIDERS > ===========================//

// census of edges by property criterion (eg 'weight'), for a given type
// (replaces deprecated AlgorithmForSliders, but without the sqrt transform)
function edgeSizesLookup(eTypeStrs, criterion) {
  var edgeweis = {}

  for (let eid in TW.Edges) {
    let e = TW.partialGraph.graph.edges(eid)

    for (var etype_i in eTypeStrs) {
      let eTypeStr = eTypeStrs[etype_i]
      if (e && e.categ && e.categ == eTypeStr) {
        if (!edgeweis[e.categ])               edgeweis[e.categ] = {}
        if (!edgeweis[e.categ][e[criterion]]) edgeweis[e.categ][e[criterion]] = []

        edgeweis[e.categ][e[criterion]].push(e.id)
      }
    }
  }
  return edgeweis
}

function edgeSizesSteps(eTypeStr, esizesCensus) {
  var stepToIdsArray = []
  if (esizesCensus[eTypeStr]) {
    var sortedSizes = Object.keys(
                        esizesCensus[eTypeStr]
                      ).sort(function(a,b){return a-b})

    for (let l in sortedSizes) {
      stepToIdsArray.push(esizesCensus[eTypeStr][sortedSizes[l]])
    }
  }

  // console.warn (`edgeSizesSteps: for etype ${eTypeStr}` , stepToIdsArray)

  return stepToIdsArray
}


//    Execution modes:
//	EdgeWeightFilter("#sliderAEdgeWeight", "00", "weight");
//	EdgeWeightFilter("#sliderAEdgeWeight", "11", "weight");

// NB new sigma js: dropEdge is quite slow so we add a waiting cursor

function EdgeWeightFilter(sliderDivID , reltypestr ,  criteria) {

    if(TW.partialGraph.graph.nEdges()<2) {
        console.log('not enough edges for subsets: skipping GUI slider init')
        showDisabledSlider(sliderDivID)
        return;
    }

    // building the index with the generic indexing function
    var esizesCensus = edgeSizesLookup([reltypestr], criteria)

    // sorting it for the type we need
    var stepToIdsArr = edgeSizesSteps(reltypestr, esizesCensus)
    var steps = stepToIdsArr.length

    if(steps<2) {
        console.log('no size steps for edges: skipping GUI slider init')
        showDisabledSlider(sliderDivID)
        return;
    }


    // cache initial value
    var initialValue=("0-"+(steps-1));
    TW.gui.lastFilters[`${sliderDivID}/${reltypestr}`] = initialValue

    var present = TW.states.slice(-1)[0];

    // console.log('init freshslider for edges, steps:', steps, sliderDivID)

    var edgeSlideTimeout = null

    if (steps == 0) {
      return
    }


    // Relations are of 3 kinds: within nodes0, within nodes1, true bipartite
    //                                 00            11            XR

    // three-way slider colors to represent that
    // orange for terms, green for docs/people/contexts, violet for bipartite
    switch (reltypestr) {
      case '00':
        edgeTypeColor = "#FFA500"
        break;
      case '11':
        edgeTypeColor = "#27c470"
        break;
      case 'XR':
        edgeTypeColor = "#A40DFF"
        break;
    }

    // legacy technique (should use .hidden more and possibly edg indx by sizes)
    $(sliderDivID).freshslider({
        range: true,
        step: 1,
        min:0,
        bgcolor: edgeTypeColor,
        max:steps-1,
        value:[0,steps-1],
        onchange:function(low, high) {
          TW.gui.elHtml.classList.add('waiting');

          // 40ms timeout to let the waiting cursor appear
          setTimeout(function() {

            var totalDeletingTime = 0

            // debounced
            if (edgeSlideTimeout){
              // console.log('clearing updated function', edgeSlideTimeout)
              clearTimeout(edgeSlideTimeout)
            }

            // scheduled: costly graph rm edges
            edgeSlideTimeout = setTimeout ( function () {

                var filtervalue = low+"-"+high
                var lastvalue = TW.gui.lastFilters[`${sliderDivID}/${reltypestr}`]

                if(filtervalue!=lastvalue) {

                  // [ Stopping FA2 ]
                  if (TW.partialGraph.isForceAtlas2Running())
                      sigma_utils.ourStopFA2();
                  // [ / Stopping FA2 ]

                  var t0 = lastvalue.split("-")
                  var mint0=parseInt(t0[0]), maxt0=parseInt(t0[1]), mint1=parseInt(low), maxt1=parseInt(high);
                  var addflag = false;
                  var delflag = false;

                  var iterarr = []

                  if(mint0!=mint1) {
                      if(mint0<mint1) {
                          delflag = true;
                          // console.log("cotainferior   --||>--------||   a la derecha")
                      }
                      if(mint0>mint1) {
                          addflag = true;
                          // console.log("cotainferior   --<||--------||   a la izquierda")
                      }
                      iterarr = calc_range(mint0,mint1).sort(compareNumbers);
                  }

                  if(maxt0!=maxt1) {
                      if(maxt0<maxt1) {
                          addflag = true;
                          // console.log("cotasuperior   ||--------||>--   a la derecha")
                      }
                      if(maxt0>maxt1) {
                          delflag = true;
                          // console.log("cotasuperior   ||--------<||--   a la izquierda")
                      }
                      iterarr = calc_range(maxt0,maxt1).sort(compareNumbers);
                  }

                  // do the important stuff
                  // ex iterarr [0:0, 1:1...]
                  // ex stepToIdsArr [0: [eid1,eid2], 1:[eid3,eid4,eid5]...]
                  for( var c in iterarr ) {

                      var i = iterarr[c];
                      var eids = stepToIdsArr[i]

                      if(i>=low && i<=high) {
                          if(addflag) {
                              // console.log("adding "+ids.join())
                              for(var i in eids) {
                                  let eid = eids[i]

                                  if (TW.Edges[eid])
                                    TW.Edges[eid].lock = false;
                                  else
                                    console.warn("skipped missing eid", eid)

                                  // local level case
                                  // stepToIdsArr is full of edges that don't really exist at this point
                                  // we need to distinguish between absent edges => keep them absent because of local
                                  //         and edges with hidden nodes => effect of a node slider => make them appear
                                  if (! present.level) {

                                    // NB we assume the sigma convention eid = "nid1;nid2"
                                    let nidkeys = eid.split(';')

                                    if (nidkeys.length != 2) {
                                      console.error("invalid edge id:" + eid)
                                    }
                                    else {
                                      let sid = nidkeys[0]
                                      let tid = nidkeys[1]

                                      // if nodes not removed by local view
                                      if (   TW.partialGraph.graph.nodes(sid)
                                          && TW.partialGraph.graph.nodes(tid)) {
                                            if(TW.partialGraph.graph.nodes(sid).hidden) unHide(sid)
                                            if(TW.partialGraph.graph.nodes(tid).hidden) unHide(tid)
                                            if (! TW.partialGraph.graph.edges(eid)) {
                                              add1Elem(eid)
                                            }
                                            TW.partialGraph.graph.edges(eid).hidden = false
                                            TW.Edges[eid].lock = false;
                                      }
                                    }
                                  }
                                  // in any case we show the edge
                                  // global level case
                                  if (! TW.partialGraph.graph.edges(eid)) {
                                    // legacy fallback shouldn't be necessary
                                    add1Elem(eid)
                                  }
                                  TW.partialGraph.graph.edges(eid).hidden = false
                                  TW.Edges[eid].lock = false;
                              }
                          }
                      } else {
                          if(delflag) {
                              for(var i in eids) {
                                  let eid = eids[i]
                                  if(!isUndef(TW.partialGraph.graph.edges(eid))) {
                                      var t0 = performance.now()
                                      if (TW.partialGraph.graph.edges(eid)) {
                                        TW.partialGraph.graph.edges(eid).hidden = true
                                        TW.Edges[eid].lock = true;
                                      }
                                      var t1 = performance.now()

                                      totalDeletingTime += (t1-t0)

                                      // console.log("\thiding "+eid)

                                      // n = ID.split(";")
                                      // if(n.length>1)
                                      //     console.log("\t\tsource:("+TW.Nodes[n[0]].x+","+TW.Nodes[n[0]].y+") ||| target:("+TW.Nodes[n[1]].x+","+TW.Nodes[n[1]].y+")")
                                  }
                              }
                          }
                      }
                  }

                  if(delflag) {
                    console.info('totalDeletingTime', totalDeletingTime)
                    // NB: performance with hiding: more or less 8x faster than with dropEdge on large graphs
                  }

                  // [ Starting FA2 ]
                  setTimeout(function() {
                    sigma_utils.smartForceAtlas({'duration': 2000}) // shorter FA2 sufficient
                  }, 10)
                // [ / Starting FA2 ]

                  // memoize as last value
                  TW.gui.lastFilters[`${sliderDivID}/${reltypestr}`] = filtervalue
                }

                // in any case
                setTimeout( function() {
                  TW.partialGraph.refresh()
                  TW.gui.elHtml.classList.remove('waiting')
                }, 40)

            }, 1000) // large-ish debounce timeout

          }, 40)  // wait cursor timeout

        }
    });
}



//   Execution modes:
// NodeWeightFilter ( "#sliderANodeWeight" ,  1)
// NodeWeightFilter ( "#sliderBNodeWeight" ,  0)
function NodeWeightFilter( sliderDivID , tgtNodeKey) {

    if (typeof tgtNodeKey == "undefined") {
      throw 'no nodetype'
    }

    if(TW.partialGraph.graph.nNodes() < 2) {
      console.warn('not enough nodes for subsets: skipping GUI slider init')
      showDisabledSlider(sliderDivID)
      return;
    }

    // ids per weight level
    // we use live index from prepareSigmaCustomIndices
    let nodesByTypeNSize = TW.partialGraph.graph.getNodesBySize(tgtNodeKey)
    var sortedSizes = Object.keys(nodesByTypeNSize).sort(function(a,b){return a-b})

    var stepToIdsArr = []

    for (let l in sortedSizes) {

      var nidsWithThatSize = TW.partialGraph.graph.getNodesBySize(tgtNodeKey, sortedSizes[l])

      if (nidsWithThatSize.length) {
        stepToIdsArr.push(nidsWithThatSize)
      }
    }

    var steps = stepToIdsArr.length

    // console.warn('NodeWeightFilter: steps', steps)

    if(steps<2) {
      console.warn('no size steps for nodes: skipping GUI slider init')
      showDisabledSlider(sliderDivID)
      return;
    }

    var nodeSlideTimeout = null

    // cache initial value
    TW.gui.lastFilters[sliderDivID] = `0-${steps-1}`

    // freshslider widget
    $(sliderDivID).freshslider({
        range: true,
        step: 1,
        min:0,
        max:steps-1,
        bgcolor:( tgtNodeKey==0 )?"#FFA500":"#27c470" ,
        value:[0,steps-1],

        // handler
        onchange:function(low, high){

            var filtervalue = low+"-"+high

            // [ Stopping FA2 ]
            if (TW.partialGraph.isForceAtlas2Running())
                sigma_utils.ourStopFA2();
            // [ / Stopping FA2 ]

            // debounced
            if (nodeSlideTimeout){
              clearTimeout(nodeSlideTimeout)
            }

            // scheduled: graph rm nodes
            nodeSlideTimeout = setTimeout ( function () {

                // check memoized value to see if any changes needed
                if(filtervalue!=TW.gui.lastFilters[sliderDivID]) {

                  for(var i in stepToIdsArr) {
                      ids = stepToIdsArr[i]
                      if(i>=low && i<=high){
                          for(var id in ids) {
                              ID = ids[id]
                              if (! TW.Nodes[ID]) {
                                console.warn ('nodeslider asks for nonexistatn ID', ID)
                                continue;
                              }

                              TW.Nodes[ID].lock = false;
                              if(TW.partialGraph.graph.nodes(ID))
                                  TW.partialGraph.graph.nodes(ID).hidden = false;
                          }
                      } else {
                          for(var id in ids) {
                              ID = ids[id]
                              TW.Nodes[ID].lock = true;
                              if(TW.partialGraph.graph.nodes(ID))
                                  TW.partialGraph.graph.nodes(ID).hidden = true;
                          }
                      }
                  }
                  TW.gui.lastFilters[sliderDivID] = filtervalue

                  TW.partialGraph.render()

                  // [ Starting FA2 ]
                  setTimeout(function() {
                    sigma_utils.smartForceAtlas({'duration': 2000}) // shorter FA2 sufficient
                  }, 10)
                  // [ / Starting FA2 ]
                }
            }, 1000)
        }
    });
}

function showDisabledSlider(someDivId) {
  $(someDivId).freshslider({
      range: true,
      step:1,
      min: 0,
      max: 1,
      value:[0, 1],
      enabled: false
  });
  $(someDivId).css('cursor', 'not-allowed')
}

//=========================== </ FILTERS-SLIDERS > ===========================//


//============================= < SEARCH > =============================//
function updateSearchLabels(id,name,type){
    TW.labels.push({
        'id' : id,
        'label' : name,
        'desc': type
    });
}

//============================ < / SEARCH > ============================//


//============================= < OTHER ACTIONS > =============================//
function createWaitIcon(idname, width) {
  let icon = document.createElement('img')

  icon.src = TW.conf.paths.ourlibs+'/img/loader.gif'

  icon.style.position = 'absolute'
  icon.style.left = '0'
  icon.style.width = width || '100%'

  if (idname) {
    icon.id = idname
  }

  return icon
}

activateRDTab = function(elTgt) {
  let relDbType = elTgt.dataset.reldocstype
  let ndTypeId = elTgt.dataset.nodetype

  let tabs = document.querySelectorAll('ul#reldocs-tabs > li')
  for (var tabLi of tabs) {
    if (tabLi != elTgt.parentNode)
      tabLi.classList.remove("active")
    else
      tabLi.classList.add("active")
  }

  let divs = document.querySelectorAll("div#reldocs-boxes > div.tab-pane")

  let theId = `rd-${ndTypeId}-${relDbType}`

  // POSS: animate with transitions here
  for (var tabDiv of divs) {
    if (tabDiv.id != theId)
      tabDiv.classList.remove("active", "in")
    else
      tabDiv.classList.add("active", "in")
  }
}


// set up tabs for a given activetypes state and project_conf.json relDB entry
function resetTabs(activetypes, dbconf) {
  let ul = document.getElementById('reldocs-tabs')
  let divs = document.getElementById('reldocs-boxes')

  // remove any previous tabs
  ul.innerHTML = ""
  divs.innerHTML = ""
  TW.gui.reldocTabs = [{},{}]

  // used with no args for full reset
  if (!activetypes || !dbconf) {
    return
  }

  // for all active nodetypes
  for (let nodetypeId in activetypes) {
    if (activetypes[nodetypeId]) {
      let possibleAPIs = []

      if (dbconf[nodetypeId]) {
        if (TW.conf.debug.logSettings)
          console.log ("additional db conf for this source", dbconf[nodetypeId])
        possibleAPIs = dbconf[nodetypeId]
      }

      let nAPIs = Object.keys(possibleAPIs).length
      if (nAPIs > 0) {
        // some more vars to know which one to activate
        let iAPI = 0
        let didActiveFlag = false

        for (var possibleAPI in possibleAPIs){

          // the tab's id
          let tabref = `rd-${nodetypeId}-${possibleAPI}`

          // create valid tabs
          let newLi = document.createElement('li')
          newLi.setAttribute("role", "presentation")
          let newRDTab =  document.createElement('a')
          newRDTab.text = `${possibleAPI} (${nodetypeId==0?'sem':'soc'})`
          newRDTab.setAttribute("role", "tab")
          newRDTab.dataset.reldocstype = possibleAPI
          newRDTab.dataset.nodetype = nodetypeId
          newRDTab.setAttribute("class", `for-nodecategory-${nodetypeId}`)
          // newRDTab.dataset.toggle = 'tab'  // only needed if using bootstrap

          // keep access
          TW.gui.reldocTabs[nodetypeId][possibleAPI] = newRDTab

          // create corresponding content box
          let newContentDiv = document.createElement('div')
          newContentDiv.setAttribute("role", "tabpanel")
          newContentDiv.setAttribute("class", "topPapers tab-pane")
          newContentDiv.id = tabref

          // add to DOM
          ul.append(newLi)
          newLi.append(newRDTab)
          divs.append(newContentDiv)

          // select currently preferred reldoc tabs
          // (we activate if favorite or if no matching favorite and last)
          if (possibleAPI == TW.conf.relatedDocsType
              || (!didActiveFlag && iAPI == nAPIs - 1)) {
            newLi.classList.add("active")
            newContentDiv.classList.add("active", "in")
            didActiveFlag = true
          }

          // add handler to switch relatedDocsType
          newRDTab.addEventListener('click', function(e){
            // tab mecanism
            activateRDTab(e.target)
            // no need to run associated query:
            // (updateRelatedNodesPanel did it at selection time)
          })

          iAPI++
        }
      }
    }
  }
}


function openGraph(graphPath){
    let serverPrefix = ''
    var pathcomponents = window.location.pathname.split('/')
    for (var i in pathcomponents) {
      if (pathcomponents[i] != 'explorerjs.html')
        serverPrefix += '/'+pathcomponents[i]
    }

    var newDataRes = AjaxSync({ "url": window.location.origin+serverPrefix+'/'+graphPath });

    // remove any previous instance and flags
    TW.resetGraph()

    TW.File = graphPath
    mainStartGraph(newDataRes["format"], newDataRes["data"], TW.instance)
    writeLabel(graphPathToLabel(graphPath))
}
//============================= </OTHER ACTIONS > =============================//
