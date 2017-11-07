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
TW.gui.lastFilters = {}             // <= last values, by slider id
TW.gui.reldocTabs = [{}, {}]        // <= by nodetype and then dbtype

TW.gui.sizeRatios = [1,1]           // sizeRatios per nodetype
TW.gui.handpickedcolors = {};        // <= changes rendering, by nodetype
TW.gui.handpickedcolorsReset = function (forTypes = TW.categories) {
  TW.gui.handpickedcolors = {}
  for (var k in forTypes) {
    TW.gui.handpickedcolors[forTypes[k]] = {
      'alton': false,
      'altattr': null
    }
  }
}

// normalize defaultNodeColor format and create the unselected def color
let defaultNodeRgbStr = normalizeColorFormat( TW.conf.sigmaJsDrawingProperties.defaultNodeColor )
TW.gui.defaultNodeColor = `rgb(${defaultNodeRgbStr})`
TW.gui.defaultGreyNodeColor = "rgba("+defaultNodeRgbStr+","+TW.conf.sigmaJsDrawingProperties.twNodesGreyOpacity+")"


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


TW.FA2Params = {
  // adapting speed -------------
  slowDown: .8,                      // above 1:slower, in [.2;1]:faster, under .2:unstable
  startingIterations: 2,             // keep it an even number to reduce visible oscillations at rendering
  iterationsPerRender: 4,            // idem
  barnesHutOptimize: false,
  // barnesHutTheta: .5,

  // global behavior -----------
  linLogMode: true,
  edgeWeightInfluence: .8,          // <= slowish when above .5, unstable at 1
  gravity: 1,
  strongGravityMode: false,
  scalingRatio: 4,
  skipHidden: false,      // if true fa2 initial filter nodes

  adjustSizes: false,     // ~ messy but sort of in favor of overlap prevention

  // favors global centrality
  // (rather not needed for large preferential attachment type of data ?)
  outboundAttractionDistribution: false
}


// contrasted color lists for clusterColoring()
// ----------------------
// TW.gui.Palettes:  all available theme variants (ex: for dark bg vs light bg)
// TW.gui.colorList: the chosen active palette
// refs http://tools.medialab.sciences-po.fr/iwanthue/
//      http://colorbrewer2.org
//      https://graphicdesign.stackexchange.com/questions/3682/
//      Kelly 1965 (http://nvlpubs.nist.gov/nistpubs/Legacy/SP/nbsspecialpublication440.pdf)
//      Zeileis, Hornik, Murrell 2007 (http://epub.wu.ac.at/1692/1/document.pdf)
TW.gui.Palettes = {
  "9CBrewerSet1": ["#e41a1c","#377eb8","#4daf4a","#984ea3","#ff7f00","#ffff33","#a65628","#f781bf","#999999"],

  "12CBrewerPaired": ["#a6cee3","#1f78b4","#b2df8a","#33a02c","#fb9a99","#e31a1c","#fdbf6f","#ff7f00","#cab2d6","#6a3d9a","#ffff99","#b15928"],

  "22Kelly": ['#F2F3F4','#222222','#F3C300','#875692','#F38400','#A1CAF1','#BE0032','#C2B280','#848482','#008856','#E68FAC','#0067A5','#F99379','#604E97','#F6A600','#B3446C','#DCD300','#882D17','#8DB600','#654522','#E25822','#2B3D26'],

  "24DivergingZeileis": ["#023fa5", "#7d87b9", "#bec1d4", "#d6bcc0", "#bb7784", "#8e063b", "#4a6fe3", "#8595e1", "#b5bbe3", "#e6afb9", "#e07b91", "#d33f6a", "#11c638", "#8dd593", "#c6dec7", "#ead3c6", "#f0b98d", "#ef9708", "#0fcfc0", "#9cded6", "#d5eae7", "#f3e1eb", "#f6c4e1", "#f79cd4"],

  "24ContrastedPastel": ["#5fa571","#ab9ba2","#da876d","#bdd3ff","#b399df","#ffdfed","#33c8f3","#739e9a","#caeca3","#f6f7e5","#f9bcca","#ccb069","#c9ffde","#c58683","#6c9eb0","#ffd3cf","#ccffc7","#52a1b0","#d2ecff","#99fffe","#9295ae","#5ea38b","#fff0b3","#d99e68"],

  "50Fluo": ["#ecdd6f","#efd745","#dab94c","#aced80","#61f2cb","#f18cac","#70c642","#e6b03a","#ef92e2","#a9d878","#59f68a","#4cce9c","#47d06d","#ec81f1","#a8e5a7","#3be03c","#5cc672","#47bdf5","#f1a72c","#acc15c","#bdbe4a","#eaad73","#86c255","#f4ce21","#f99643","#cba0f6","#83c689","#8eeeac","#d1f6ac","#5de76b","#59dfcd","#d7e431","#c0e35a","#f59881","#a8e335","#50eda2","#58e2f2","#82e951","#b5c883","#acaaf5","#eade90","#e9a4d9","#83ea36","#e0ea87","#38c2d1","#c1b66a","#dfbe64","#c9b71e","#82e68f","#e4a557"],

  "50Pastel": ["#829b98","#cfcbff","#94c0ff","#e2fee0","#b9f4ff","#45a4a3","#ffe6d4","#4ac7fb","#fba988","#b68e6e","#fcf6e3","#d0fff1","#4ce6fe","#c48960","#9b91b7","#819d89","#ffcee9","#aacf88","#bcbb70","#f8fabe","#00b8bd","#4ed1bf","#c48ac7","#7798c5","#ae8e93","#80bf84","#7ca765","#ffbf9f","#aee0ff","#ffbefc","#b48e81","#b5905b","#b69e58","#ffa1a4","#4d9fcb","#de807d","#619fb7","#e6c27d","#ffa5d0","#939b60","#71d4ac","#c4abf3","#d5e89c","#b9ffcb","#ffbac1","#ef8ea9","#ffe7a9","#a68aca","#dce4ff","#ffd4a7"],

  "80Pastel": ["#de7999","#ff698a","#d9737a","#de5461","#f92d54","#d3604f","#ff9279","#d65f2c","#ff9762","#ff8744","#be6f43","#ce6a00","#ffb36f","#b8740d","#ffbc4f","#af7a00","#ffc96c","#fec400","#b2994d","#a38800","#ffe067","#f6de8d","#ffe237","#eddf00","#ffff91","#a5af00","#bac800","#f4ff5b","#838931","#d2e600","#768c15","#c9ff47","#d7ff73","#73c000","#9abe72","#bfff91","#ceffab","#499428","#00b00e","#00c535","#00db4c","#00b23e","#84ff98","#249649","#00f379","#acfcbe","#4bff8e","#02e98b","#02d583","#7bffc2","#009665","#00a370","#29966c","#00c890","#01f3dc","#01feff","#82aeff","#8295ff","#8c76cb","#b996ff","#b17eff","#a367dc","#ca78ff","#b65cdd","#eaabff","#cd4eef","#a86eb4","#ee93ff","#feb7ff","#e345e5","#ff7af5","#d840cd","#f3a8e8","#c177b3","#ff91da","#ce57a8","#ff72bf","#f518a2","#e64097","#ff71a8"],

  "128Tina": ["#000000", "#FFFF00", "#1CE6FF", "#FF34FF", "#FF4A46", "#008941",
   "#006FA6", "#A30059", "#FFDBE5", "#7A4900", "#0000A6", "#63FFAC", "#B79762",
   "#004D43", "#8FB0FF", "#997D87", "#5A0007", "#809693", "#FEFFE6", "#1B4400",
   "#4FC601", "#3B5DFF", "#4A3B53", "#FF2F80", "#61615A", "#BA0900", "#6B7900",
   "#00C2A0", "#FFAA92", "#FF90C9", "#B903AA", "#D16100", "#DDEFFF", "#000035",
   "#7B4F4B", "#A1C299", "#300018", "#0AA6D8", "#013349", "#00846F", "#372101",
   "#FFB500", "#C2FFED", "#A079BF", "#CC0744", "#C0B9B2", "#C2FF99", "#001E09",
   "#00489C", "#6F0062", "#0CBD66", "#EEC3FF", "#456D75", "#B77B68", "#7A87A1",
   "#788D66", "#885578", "#FAD09F", "#FF8A9A", "#D157A0", "#BEC459", "#456648",
   "#0086ED", "#886F4C", "#34362D", "#B4A8BD", "#00A6AA", "#452C2C", "#636375",
   "#A3C8C9", "#FF913F", "#938A81", "#575329", "#00FECF", "#B05B6F", "#8CD0FF",
   "#3B9700", "#04F757", "#C8A1A1", "#1E6E00", "#7900D7", "#A77500", "#6367A9",
   "#A05837", "#6B002C", "#772600", "#D790FF", "#9B9700", "#549E79", "#FFF69F",
   "#201625", "#72418F", "#BC23FF", "#99ADC0", "#3A2465", "#922329", "#5B4534",
   "#FDE8DC", "#404E55", "#0089A3", "#CB7E98", "#A4E804", "#324E72", "#6A3A4C",
   "#83AB58", "#001C1E", "#D1F7CE", "#004B28", "#C8D0F6", "#A3A489", "#806C66",
   "#222800", "#BF5650", "#E83000", "#66796D", "#DA007C", "#FF1A59", "#8ADBB4",
   "#1E0200", "#5B4E51", "#C895C5", "#320033", "#FF6832", "#66E1D3", "#CFCDAC",
   "#D0AC94", "#7ED379", "#012C58"]
}


// user-conf
if (TW.conf.colorTheme && TW.gui.Palettes[TW.conf.colorTheme]) {
  TW.gui.colorList = TW.gui.Palettes[TW.conf.colorTheme]
}
// default
else {
  TW.gui.colorList = TW.gui.Palettes["24DivergingZeileis"]
}


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


function writeBrand (brandingParams = {}) {
  let brandString = brandingParams.name || ''
  let brandLink   = brandingParams.link || ''
  let brandVideo  = brandingParams.video || ''

  let elTitle = document.getElementById('twbrand')
  if (elTitle) {
    elTitle.innerHTML = brandString
  }

  let anchors = document.getElementsByClassName('twbrand-link')
  for (var k in anchors) {
    if (anchors[k] && anchors[k].href) {
      anchors[k].href = brandLink
    }
  }

  if (brandVideo) {
    let elVideo = document.getElementById("twbrand-video")
    if (elVideo) {
      elVideo.src = brandVideo
    }
  }
  else {
    let vidPanel = document.getElementById("video_explanation")
    if (vidPanel) { vidPanel.remove() }
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
    // var ctstart = performance.now()

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

    sigma_utils.ourStopFA2();

    let typeFlag
    let outgoing = TW.SystemState()
    let oldTypeId = outgoing.activetypes.indexOf(true)
    let mixedState = (outgoing.activereltypes.length > 1)

    // needed selection content diagnostic for mixed meso target choice
    let selectionTypeId = false
    if (outgoing.selectionNids.length) {
      if (!mixedState) {
        selectionTypeId = oldTypeId
      }
      else if (!outgoing.level) {
        let selMajorityType = TW.categories[oldTypeId]
        let counts = {}
        for (var j in outgoing.selectionNids) {
          let ty = TW.Nodes[outgoing.selectionNids[j]].type
          if (! counts[ty])   counts[ty]  = 1
          else                counts[ty] += 1
        }
        for (var ty in counts) {
          if (counts[ty] > counts[selMajorityType]) {
            selMajorityType = ty
          }
        }
        selectionTypeId = TW.catDict[ty]
      }
    }

    // 1 - make the targetTypes choices
    if (!isUndef(optionaltypeFlag)) {
      typeFlag = optionaltypeFlag
    }
    else {
      // "comeback" case: going back from mixed view to selections majority view
      //                  (or last non-mixed view if no selection)
      // ----------
      if (mixedState) {
        typeFlag = selectionTypeId || outgoing.comingFromType || 0
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

    // nodes already in target type
    let alreadyOk = {}
    if (mixedState) {
      let arr = TW.partialGraph.graph.getNodesByType(typeFlag)
      for (var i in arr) {alreadyOk[arr[i]] = true}
    }

    // 3 - define the projected selection (sourceNids => corresponding opposites)
    let sourceNids = outgoing.selectionNids
    // when jutsu and no selection => we pick one selection at random (in meso mode we can't go to another meso with no selection, because nothing would appear)
    if (typeFlag == 'all' && !sourceNids.length) {
      sourceNids = []
      for (var nid in TW.Nodes) {
        if (! TW.Nodes[nid].hidden) {
          sourceNids.push(nid)
          break
        }
      }
    }

    let targetNids = {}
    if (!mixedState) {
      targetNids = getNeighbors(sourceNids, 'XR')
    }
    else {
      // in mixed local state we need to separate those already tgt state from others
      let needXRTransition = []
      for (var i in sourceNids) {
        let nid = sourceNids[i]
        if (alreadyOk[nid])         targetNids[nid] = true
        else                        needXRTransition.push(nid)
      }
      //   if none of the selection in new type  => selection's projection
      //   if some of the selection in new type  => this majority subset of selection
      //                                            without the projection of others
      if (! Object.keys(targetNids).length) {
        targetNids = getNeighbors(needXRTransition, "XR")
      }
      // console.log("mixedState start, selections targetNids:", targetNids)
    }

    // 4 - define the nodes to be added
    let newNodes = {}

    // in mode all the current selection (and only it) is preserved
    if (typeFlag == 'all') {
      for (var i in sourceNids) {
        let nid = sourceNids[i]
        newNodes[nid] = true
      }
    }

    // when scope is "entire graph" => entire sets by type
    if (outgoing.level) {
      for (let typeId in newActivetypes) {
        if (newActivetypes[typeId]) {
          newNodes = Object.assign(newNodes, getNodesOfType(typeId))
        }
      }
    }
    else {
      if (Object.keys(targetNids).length) {
        for (var nid in targetNids) {
          newNodes[nid] = true
        }

        // also more added because they are the "meso" sameside neighbors of the selection
        let rel = typeFlag.toString().repeat(2)
        let additionalNewTypeNids = getNeighbors(Object.keys(targetNids), rel)
        for (var nid in additionalNewTypeNids) {
          newNodes[nid] = true
        }
      }
      // if no selection, meso shouldn't be possible, but we can still
      // show something: those that were already of the correct type
      else if (mixedState) {
        for (var nid in alreadyOk) {
          newNodes[nid] = true
        }
      }
    }
    // console.log('newNodes', newNodes)

    // 5 - define the new selection
    let newselsArr = []
    if (sourceNids.length) {
      if (typeFlag != 'all') {
        newselsArr = Object.keys(targetNids)
        // NB: if mixedState we already filtered them at step 3
      }
      else {
        // not extending selection to all transitive neighbors
        // makes the operation stable (when clicked several times,
        // without changing selection, we go back to original state)
        newselsArr = sourceNids
      }
    }


    // 6 - effect the changes on nodes
    deselectNodes()

    for (var nid in TW.Nodes) {
      let n = TW.partialGraph.graph.nodes(nid)
      if (newNodes[nid]) {
        n.hidden = false
        n.sliderlock = false
      }
      else {
        n.hidden = true
        n.sliderlock = true
      }
    }

    // 7 - add the relations
    let newEdges = {}
    for (var srcnid in newNodes) {
      for (var k in newReltypes) {
        let relKey = newReltypes[k]
        if (TW.Relations[relKey]
            && TW.Relations[relKey][srcnid]
            && TW.Relations[relKey][srcnid].length) {
          for (var j in TW.Relations[relKey][srcnid]) {
            let tgtnid = TW.Relations[relKey][srcnid][j]
            if (newNodes[tgtnid]) {
              let eids = [`${srcnid};${tgtnid}`, `${tgtnid};${srcnid}`]
              for (var l in eids) {
                let eid = eids[l]
                if (eid && TW.Edges[eid]){
                  newEdges[eid] = true
                  // POSS: do something about all those double-direction edges
                }
              }
            }
          }
        }
      }
    }

    // 8 - effect the changes on edges
    for (var eid in TW.Edges) {
      let e = TW.partialGraph.graph.edges(eid)
      if (newEdges[eid]) {
        e.hidden = false
        e.sliderlock = false
      }
      else {
        e.hidden = true
        e.sliderlock = true
      }
    }

    // 9 - refresh view and record the state
    TW.partialGraph.camera.goTo({x:0, y:0, ratio:1, angle: 0})
    TW.partialGraph.refresh()

    if (typeFlag != "all") {
      TW.pushGUIState({
          activetypes: newActivetypes,
          activereltypes: newReltypes,
          sels: newselsArr
          // rels: added by MS2 (highlighted opposite- and same-side neighbours)
          // possible: add it in an early way here and request that MS2 doesn't change state
      })
    }
    else {
      TW.pushGUIState({
          activetypes: newActivetypes,
          comingFromType: oldTypeId,
          activereltypes: newReltypes,
          sels: newselsArr
      })
    }

    // to recreate the new selection in the new type graph, if we had one before
    // NB relies on new actypes so should be after pushState
    if (newselsArr.length) {
      TW.instance.selNgn.MultipleSelection2({nodes: newselsArr});
      if (TW.conf.debug.logSelections)
        console.log("selection transitive projection from",sourceNids, "to", newselsArr)
    }

    // update search labels
    TW.labels.splice(0, TW.labels.length)
    for (var nid in newNodes) {
      updateSearchLabels(nid,newNodes[nid].label,newNodes[nid].type);
    }

    // update the gui (TODO handle by TW.pushGUIState) =========================
    updateDynamicFacets()

    // console.log("outgoing.activetypes", outgoing.activetypes)
    // console.log("newActivetypes", newActivetypes)

    changeGraphAppearanceByFacets( getActivetypesNames() )

    // turn off the altcolors for outgoing types
    for (var tyId in TW.categories) {
      let ty = TW.categories[tyId]
      if (outgoing.activetypes[tyId] && ! newActivetypes[tyId]) {
        if (TW.gui.handpickedcolors[ty].alton) {
          clearColorLegend([ty])
          TW.gui.handpickedcolors[ty].alton = false
        }
      }
      else if (!outgoing.activetypes[tyId] && newActivetypes[tyId]) {
        if (TW.gui.handpickedcolors[ty].altattr) {
          TW.gui.handpickedcolors[ty].alton = true

          // alt color and legend kept unchanged => out of scope nodes remain grey

          // no re-coloring step, we only need to recreate legend box
          updateColorsLegend(TW.gui.handpickedcolors[ty].altattr, [ty])
        }
      }
    }

    TW.partialGraph.settings('labelThreshold', getSizeFactor())
    fillAttrsInForm('choose-attr')
    fillAttrsInForm('attr-titling-metric', 'num')

    // in meso the changed nodes always need their FA2 config
    if (!outgoing.level || TW.conf.independantTypes || !TW.conf.stablePositions) {
      reInitFa2({
        localZoneSettings: !outgoing.level,
        skipHidden: true,
        typeAdapt: true,
        callback: function() {
          // runs FA2 conditionnaly
          if (!TW.conf.stablePositions) {
            sigma_utils.smartForceAtlas()
          }
          else if (TW.conf.independantTypes) {
            // check if all activetypes done
            for (var tyId in newActivetypes) {
              if (newActivetypes[tyId] && !TW.didFA2OnTypes[tyId]) {
                sigma_utils.smartForceAtlas()
                break
              }
            }
            // mark them as done
            for (var tyId in newActivetypes) {
              if (newActivetypes[tyId]) {
                TW.didFA2OnTypes[tyId] = true
              }
            }
          }
        }
      })
    }

    // console.log("changeType time:", performance.now()-ctstart)

    // end update the gui ======================================================
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
//  optional args:
//    @optionalTgtState: in rare cases we already have it (like CTRL+Z)
//                       (=> avoid redoing property computations and state push)
function changeLevel(optionalTgtState) {

    // var clstart = performance.now()

    // show waiting cursor
    TW.gui.elHtml.classList.add('waiting');

    // let the waiting cursor appear
    setTimeout(function() {

      // array of nids [144, 384, 543]
      var sels

      if (optionalTgtState) {
        sels = optionalTgtState.selectionNids
      }
      else {
        var present = TW.SystemState(); // Last
        sels = present.selectionNids
      }
      deselectNodes()

      let selsChecker = {}
      for (let i in sels) {
        selsChecker[sels[i]] = true
      }

      // type "grammar"
      //     used to distinguish types in TW.Relations

      // types eg [true]          <=> '1'
      //          [true, true]    <=> '1|1'

      if (optionalTgtState) {
        activetypes = optionalTgtState.activetypes
        activereltypes = optionalTgtState.activereltypes
      }
      else {
        activetypes = present.activetypes;
        activereltypes = present.activereltypes;
      }

      let activetypesDict = {}
      for (var i in activetypes) {
        if (activetypes[i]) {
          activetypesDict[TW.categories[i]] = true
        }
      }

      var futurelevel = optionalTgtState ? optionalTgtState.level : !present.level

      if(!futurelevel) { // [Change to Local] when level=Global(1)

        TW.gui.elContainer.style.backgroundColor = TW.conf.mesoBackground

        var voisinage = {}
        // Dictionaries of: selection+neighbors
        var nodesToKeep = {}
        var edgesToKeep = {}

        for(var i in sels) {
            s = sels[i];
            nodesToKeep[s]=true;
            for (var k in activereltypes) {
              let activereltype = activereltypes[k]
              if (TW.Relations[activereltype]) {
                neigh = TW.Relations[activereltype][s]
                if(neigh) {
                    for(var j in neigh) {
                        t = neigh[j]
                        nodesToKeep[t]=true;
                        edgesToKeep[s+";"+t]=true;
                        edgesToKeep[t+";"+s]=true;
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

        for (var nid in TW.Nodes) {
          let n = TW.partialGraph.graph.nodes(nid)
          if (!nodesToKeep[nid]) {
            n.hidden = true
            n.sliderlock = true
          }
          else {
            n.hidden = false
            n.sliderlock = false
          }
        }
        for (var eid in TW.Edges) {
          let e = TW.partialGraph.graph.edges(eid)
          if (! edgesToKeep[eid]) {
            e.hidden = true
            e.sliderlock = true
          }
          else {
            e.hidden = false
            e.sliderlock = false
          }
        }

          // Adding intra-neighbors edges O(voisinage²)
          voisinage = Object.keys(voisinage)
          for(var i=0;i<voisinage.length;i++) {
              for(var j=1;j<voisinage.length;j++) {
                  if( voisinage[i]!=voisinage[j] ) {
                      // console.log( "\t" + voisinage[i] + " vs " + voisinage[j] )
                      let e1 = TW.partialGraph.graph.edges(voisinage[i]+";"+voisinage[j])
                      let e2 = TW.partialGraph.graph.edges(voisinage[j]+";"+voisinage[i])
                      if (e1 && e1.hidden) {
                        e1.hidden = false
                        e1.sliderlock = false
                      }
                      if (e2 && e2.hidden) {
                        e2.hidden = false
                        e2.sliderlock = false
                      }
                  }
              }
          }
      } else { // [Change to Global] when level=Local(0)

          TW.gui.elContainer.style.backgroundColor =  TW.conf.normalBackground

          // var t0 = performance.now()
          for(var nid in TW.Nodes) {
            // we unhide 1 by 1
            let n = TW.partialGraph.graph.nodes(nid)
            if (activetypesDict[TW.Nodes[nid].type]) {
              // if a meso color was on => we grey the out-of-scope nodes as we unhide them
              // (because they can have an old alt_color)
              if (TW.gui.handpickedcolors[n.type].alton && (n.hidden || n.sliderlock)) {
                n.customAttrs.alt_color = TW.gui.defaultNodeColor
                n.customAttrs.altgrey_color = TW.gui.defaultGreyNodeColor
              }
              n.hidden = false
              n.sliderlock = false
            }
            else {
              n.hidden = true
              n.sliderlock = true
            }
          }
          for(var eid in TW.Edges) {
            for (var k in activereltypes) {
              let activereltype = activereltypes[k]
              let e = TW.partialGraph.graph.edges(eid)
              if(TW.Edges[eid].categ == activereltype) {
                e.hidden = false
                e.sliderlock = false
              }
              else {
                e.hidden = true
                e.sliderlock = true
              }
            }
          }
          // var t1 = performance.now()
          // console.log("returning to global took:", t1-t0)
      }

      // Selection is unchanged, but all the nodes are new
      // so we call MultipleSelection2 to set up node attributes
      if (sels.length)
        TW.instance.selNgn.MultipleSelection2({nodes:sels, noState:true});

      // if caller already had the state, he may or may not want to push it
      if (! optionalTgtState) {
        TW.pushGUIState({
            level: futurelevel
        })
      }

      TW.partialGraph.camera.goTo({x:0, y:0, ratio:1.2, angle: 0})
      TW.partialGraph.refresh()

      updateDynamicFacets()
      changeGraphAppearanceByFacets( getActivetypesNames() )

      // recreates FA2 nodes array after changing the nodes
      reInitFa2({
        skipHidden: !futurelevel,          // <= in meso, nodes move freely
        localZoneSettings: !futurelevel,   // <= and they have lighter settings
        callback: function() {
          // runs FA2
          if (! TW.conf.stablePositions) {
            sigma_utils.smartForceAtlas()
          }

          // remove changeLevel waiting cursor
          TW.gui.elHtml.classList.remove('waiting');
        }
      })


      // console.log("changeLevel time:", performance.now() - clstart)
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
      if (e && e.categ && e.categ == eTypeStr && !e.hidden) {
        if (!edgeweis[e.categ])               edgeweis[e.categ] = {}
        if (!edgeweis[e.categ][e[criterion]]) edgeweis[e.categ][e[criterion]] = []

        edgeweis[e.categ][e[criterion]].push(e.id)
      }
    }
  }
  return edgeweis
}

// strategy : if < 25 distinct values: each distinct val becomes a step
//            if > 25 distinct values: we group in 25 bins of +- equal pop
function edgeSizesSteps(eTypeStr, esizesCensus) {
  let allValsToIdsArray = []
  let stepToIdsArray = []
  if (esizesCensus[eTypeStr]) {
    var sortedSizes = Object.keys(
                        esizesCensus[eTypeStr]
                      ).sort(function(a,b){return a-b})

    let nEdges = 0
    for (let l in sortedSizes) {
      let distinctVal = sortedSizes[l]
      allValsToIdsArray.push(esizesCensus[eTypeStr][distinctVal])
      nEdges += esizesCensus[eTypeStr][sortedSizes[l]].length
    }
    // now allValsToIdsArray has length == nb of distinct values

    if (sortedSizes.length <= 25) {
      stepToIdsArray = allValsToIdsArray
    }
    else {
      chunkSize = parseInt(nEdges / 25)

      // console.log("nEdges, nDistinct, chunkSize", nEdges, sortedSizes.length, chunkSize)

      stepToIdsArray = makeSteps(chunkSize, allValsToIdsArray, [])
    }
  }
  return stepToIdsArray
}

// recursive method (POSS: use a drift counter to compensate big exaequo subgroups
//                         resulting in less ticks than 25)
//                   cf. also alternate binning strategy using nthVal
//                            in facetsBinning (samepop case)
function makeSteps(chunkSize, remainder, groupedSteps) {
  if (!remainder.length) {
    return groupedSteps
  }
  else {
    let newChunkIdsArray = []
    while(newChunkIdsArray.length < chunkSize) {
      newChunkIdsArray = newChunkIdsArray.concat(remainder.shift())
    }
    groupedSteps.push(newChunkIdsArray)
    return makeSteps(chunkSize, remainder, groupedSteps)
  }
}

//    Execution modes:
//	EdgeWeightFilter("#sliderAEdgeWeight", "00", "weight");
//	EdgeWeightFilter("#sliderAEdgeWeight", "11", "weight");

// NB new sigma js: dropEdge is quite slow so we add a waiting cursor

function EdgeWeightFilter(sliderDivID , reltypestr ,  criteria) {

    if(TW.partialGraph.graph.nEdges()<2) {
        console.debug('not enough edges for subsets: skipping GUI slider init')
        showDisabledSlider(sliderDivID)
        return;
    }

    // building the index with the generic indexing function
    var esizesCensus = edgeSizesLookup([reltypestr], criteria)

    // sorting it for the type we need
    var stepToIdsArr = edgeSizesSteps(reltypestr, esizesCensus)
    var steps = stepToIdsArr.length

    if(steps<2) {
        console.debug('no size steps for edges: skipping GUI slider init')
        showDisabledSlider(sliderDivID)
        return;
    }

    var sliderId = `${sliderDivID}/${reltypestr}`
    var firstTimeFlag = isUndef(TW.gui.lastFilters[sliderId])

    // cache initial value
    var initialValue=("0-"+(steps-1));
    TW.gui.lastFilters[sliderId] = initialValue

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

    // legacy technique (should possibly use edg indx by sizes)
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
                var lastvalue = TW.gui.lastFilters[sliderId]

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

                              // consequences of local level or change type:
                              // stepToIdsArr is full of edges that don't really exist at this point
                              // we need to distinguish between
                              //    - absent edges (sliderlock true)
                              //       => keep them absent because of local
                              //    - edges with hidden nodes (sliderlock false)
                              //       => effect of a node slider => make them appear

                              // NB we assume the sigma convention eid = "nid1;nid2"
                              let e = TW.partialGraph.graph.edges(eid)
                              if (!e.sliderlock) {
                                let nidkeys = eid.split(';')

                                if (nidkeys.length != 2) {
                                  console.error("invalid edge id:" + eid)
                                }
                                else {
                                  let sid = nidkeys[0]
                                  let tid = nidkeys[1]

                                  let src = TW.partialGraph.graph.nodes(sid)
                                  let tgt = TW.partialGraph.graph.nodes(tid)

                                  // if nothing is locked (nodes not
                                  // removed by changetype or local view)
                                  if (   (src && !src.sliderlock)
                                      && (tgt && !tgt.sliderlock)) {
                                        src.hidden = false
                                        tgt.hidden = false
                                        e.hidden = false
                                  }
                                }
                              }
                            }
                          }
                      } else {
                          if(delflag) {
                              for(var i in eids) {
                                  let eid = eids[i]
                                  let e = TW.partialGraph.graph.edges(eid)
                                  if(!isUndef(e)) {
                                      e.hidden = true
                                  }
                              }
                          }
                      }
                  }

                  if (!firstTimeFlag && !TW.conf.stablePositions) {
                    setTimeout(function() {
                        reInitFa2({
                          // recreates FA2 edges array after changing the edges
                          skipHidden: true,
                          // runs FA2 with args from reInitFa2
                          callback: sigma_utils.smartForceAtlas
                        })
                    }, 10)
                  }

                  // memoize as last value
                  TW.gui.lastFilters[sliderId] = filtervalue
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
      console.debug('not enough nodes for subsets: skipping GUI slider init')
      showDisabledSlider(sliderDivID)
      return;
    }

    // ids per weight level
    // we use live index from prepareSigmaCustomIndices
    let nodesByTypeNSize = TW.partialGraph.graph.getNodesBySize(tgtNodeKey)

    var sortedSizes = []
    if (nodesByTypeNSize)
      sortedSizes = Object.keys(nodesByTypeNSize).sort(function(a,b){return a-b})


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
      console.debug('no size steps for nodes: skipping GUI slider init')
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
                              let n = TW.partialGraph.graph.nodes(ID)
                              if(n && !n.sliderlock)
                                  n.hidden = false;
                          }
                      } else {
                          for(var id in ids) {
                              ID = ids[id]
                              let n = TW.partialGraph.graph.nodes(ID)
                              if(n && !n.sliderlock)
                                  n.hidden = true;
                          }
                      }
                  }
                  console.log("TW.gui.lastFilters", TW.gui.lastFilters)
                  TW.gui.lastFilters[sliderDivID] = filtervalue

                  TW.partialGraph.render()

                  // [ Starting FA2 ]*
                  if (! TW.conf.stablePositions) {
                    setTimeout(function() {
                        reInitFa2({
                          // recreates FA2 nodes array after changing the nodes
                          skipHidden: true,
                          // runs FA2 with args from reInitFa2
                          callback: sigma_utils.smartForceAtlas
                        })
                    }, 10)
                  }
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


// exemple usage:
//  TW.gui.activateRDTab(document.querySelectorAll("#reldocs-tabs > li:not(.active) > a")[0])
TW.gui.activateRDTab = function(elTgt) {
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
            TW.gui.activateRDTab(e.target)
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
