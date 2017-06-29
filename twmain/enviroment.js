'use strict;'

// GUI commodity pointers
TW.gui = {}
TW.gui.elHtml = document.getElementsByTagName('html')[0]
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

TW.gui.sizeRatios = [1,1]           // sizeRatios per nodetype


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

// Documentation Level: *****
function changeType() {

    var present = TW.SystemState() ; // current state before the change

    var level = present.level;
    var sels = present.selectionNids
    var t0Activetypes = present.activetypes;
    var t0ActivetypesKey = t0Activetypes.map(Number).join("|")

    // type "grammar"
    //     used to distinguish types in TW.Relations

    // activetypes eg [true]          <=> key '1'         => this function is not accessible
    //                [true, false]   <=> key '1|0'      <=> just sem
    //                [true, true]    <=> key '1|1'      <=> both types


    // normal case
    // new state is the complement of the received state ~[X\Y]
    var t1Activetypes = []
    for(var i in t0Activetypes) t1Activetypes[i] = !t0Activetypes[i]
    var t1ActivetypesKey = t1Activetypes.map(Number).join("|")

    // "union realm" (where we'll search the real bipartite Relations)
    var bipartiteKey = "1|1"

    let mixedStart = false

    // special case: "both were active"
    //    when t0Activetypes is both (aka "1|1")
    //    the complement is "0|0" aka **none**    :-/
    //    so => we set here a fallback to "1|0"
    if (t1ActivetypesKey == "0|0") {
      t1Activetypes = [true, false]
      t1ActivetypesKey = "1|0"

      // this case "0|0" => "1|0" won't have a unique edge realm to look at
      // nodes of "1|0" will need their "1|0" neighbors
      // and other nodes will need their "1|1" neighbors
      mixedStart = true
    }

    // special case: "macro level opens bipartite possibilities"
    if(!level)   t1Activetypes = [true, true];


    // list of present nodes: needed *before* clearing
    // (but only needed if local and no selections)
    let prevnodes = []
    if (!level && !sels.length) {
      // simple fix: a source set with all the (few) local nodes
      prevnodes = TW.partialGraph.graph.nodes()
    }

    // we start from blank
    TW.partialGraph.graph.clear();

    var sourceNodes = []

    // console.log("CHanging the TYpE!! => ",t1Activetypes, sels.length, present.level)


    if(present.level) { //If level=Global, fill all {X}-component
        // POSS full index by type could be useful here
        for(var nid in TW.Nodes) {
            if(t1Activetypes[TW.catDict[TW.Nodes[nid].type]]) {
              add1Elem(nid)
            }
        }
        for(var eid in TW.Edges) {

            if(TW.Edges[eid].categ==t1ActivetypesKey)
                add1Elem(eid)

            // NB ie we don't add sameside edges "1|0" or "0|1" when target
            //       activetypes is "1|1" (aka "both")
        }

        sourceNodes = sels
    }

    /* Local level but nothing selected*/
    else {
        if(sels.length==0) {
            // NB: In macro level, the target subset (ie nodes of opposite type
            //     to show) is defined by the selections's opposite neighbors.
            //     It means here the target would be empty b/c we have no sels now,
            for (let j in prevnodes) {
              sourceNodes.push(prevnodes[j].id)
            }
        }
        else {
          sourceNodes = sels
        }
    }

    // console.log('starting point nodes', sourceNodes)

    // Projection
    // -----------
    // now we have a set of source nodes
    // we'll use Relations to define the new selected nodeset
    //                 (or if !present.level, the new nodeset to *display*)

    // [ ChangeType: incremental selection ;]

    // Dictionaries of: opposite-neighs of current source nodes
    var newsels = {}
    var edgesToAdd = {}
    for(var i in sourceNodes) {
        let srcnid = sourceNodes[i];
        let srctyp = TW.Nodes[srcnid].type
        let neighs = []
        if (!mixedStart) {
          // case where we have an single kind of Relations to consider
          // ie the realm of the bipartite relations called "1|1"
          neighs = TW.Relations[bipartiteKey][srcnid]
        }
        else {
          // case with a mixed starting point
          // => kind of Relation depends on node
          if (t1Activetypes[TW.catDict[srctyp]]) {
            // here src node is already within the target active type
            // so we look for neighbors in there
            neighs = TW.Relations[t1ActivetypesKey][srcnid]
          }
          else {
            // here src node is of the other type so we use the bipartite relations
            neighs = TW.Relations[bipartiteKey][srcnid]
          }
        }
        if(neighs) {
          for(var j in neighs) {
            let tgtnid = neighs[j]
            let tgttyp = TW.Nodes[tgtnid].type

            // add neighbors of the good target type(s)
            if (t1Activetypes[TW.catDict[tgttyp]]) {
              newsels[tgtnid]=true;

              // since we're here we keep the edges if needed
              if (!present.level) {
                edgesToAdd[`${srcnid};${tgtnid}`] = true
                edgesToAdd[`${tgtnid};${srcnid}`] = true
              }
            }
          }
        }

        // also add self if of the good target type
        if (t1Activetypes[TW.catDict[srctyp]]) {
          newsels[srcnid]=true;
        }
    }

    // our result is newsels: the projected + filtered selection

    // [ / ChangeType: incremental selection ]

    // finally in macro case we still need to add the actual nodes & edges
    if(!present.level) {
        // Adding just selection+neighs
        for(var nid in newsels) {
          add1Elem(nid)
        }
        for(var eid in edgesToAdd) {
          add1Elem(eid)
        }
    }

    let newselsArr = Object.keys(newsels)

    TW.gui.handpickedcolor = false

    TW.pushState({
        activetypes: t1Activetypes,
        sels: newselsArr,
        // rels: added by MS2 (highlighted opposite- and same-side neighbours)
        // possible: add it in an early way here and request that MS2 doesn't change state
    })

    // update the color menu
    changeGraphAppearanceByFacets( getActivetypesNames() )

    // to recreate the new selection in the new type graph, if we had one before
    // NB relies on new actypes so should be after pushState
    if (newselsArr.length && sels.length) {
      TW.instance.selNgn.MultipleSelection2({nodes: newselsArr});
      if (TW.conf.debug.logSelections)
        console.log("selection transitive projection from",sels, "to", newsels)
    }

    TW.partialGraph.camera.goTo({x:0, y:0, ratio:1, angle: 0})
    TW.partialGraph.refresh()

    // recreates FA2 nodes array from new nodes
    reInitFa2({
      useSoftMethod: false,
      callback: function() {
        sigma_utils.smartForceAtlas()
      }
    })
}


//
// changeLevel :     macro selection SysSt = {level: true, activetypes:XY}
//                         ^
//                         |
//                         v
//                   local selection SysSt = {level: false, activetypes:XY}
//
function changeLevel() {
    // show waiting cursor
    TW.gui.elHtml.classList.add('waiting');

    // let the waiting cursor appear
    setTimeout(function() {
      var present = TW.SystemState(); // Last

      var sels = present.selectionNids ;//[144, 384, 543]//TW.states[last].selectionNids;

      deselectNodes()

      let selsChecker = {}
      for (let i in sels) {
        selsChecker[sels[i]] = true
      }

      // type "grammar"
      //     used to distinguish types in TW.Relations

      // types eg [true]          <=> '1'
      //          [true, true]    <=> '1|1'

      var activetypes = present.activetypes;
      var activetypesKey = activetypes.map(Number).join("|")

      TW.partialGraph.graph.clear();

      var voisinage = {}
      // Dictionaries of: selection+neighbors
      var nodesToAdd = {}
      var edgesToAdd = {}

      for(var i in sels) {
          s = sels[i];
          nodesToAdd[s]=true;
          if (TW.Relations[activetypesKey]) {
            neigh = TW.Relations[activetypesKey][s]
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

      var futurelevel = null

      if(present.level) { // [Change to Local] when level=Global(1)
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
                  }
              }
          }

          futurelevel = false;
          // Selection is unchanged, no need to call MultipleSelection2


      } else { // [Change to Global] when level=Local(0)

          // var t0 = performance.now()
          for(var nid in TW.Nodes) {
              if(activetypes[TW.catDict[TW.Nodes[nid].type]])
                  // we add 1 by 1
                  add1Elem(nid)
          }
          for(var eid in TW.Edges) {
              if(TW.Edges[eid].categ == activetypesKey)
                  add1Elem(eid)
          }

          // var t1 = performance.now()
          futurelevel = true;

          // console.log("returning to global took:", t1-t0)

          // Nodes Selection now:
          if(sels.length>0) {
              TW.instance.selNgn.MultipleSelection2({nodes:sels});
              TW.gui.selectionActive=true;
          }
      }

      TW.pushState({
          level: futurelevel
      })

      TW.partialGraph.camera.goTo({x:0, y:0, ratio:1.2, angle: 0})
      TW.partialGraph.refresh()

      // recreate FA2 nodes array after you change the nodes
      reInitFa2({
        useSoftMethod: false,
        callback: function() {
          TW.gui.elHtml.classList.remove('waiting');

          // when going local, it's nice to see the selected nodes rearrange
          if (!futurelevel) {
            sigma_utils.smartForceAtlas()
          }
        }
      })
    },500 // cursor waiting
  )
}
//============================= </ NEW BUTTONS > =============================//





//=========================== < FILTERS-SLIDERS > ===========================//

// census of edges by type and by size
// (replaces deprecated AlgorithmForSliders, but without the sqrt transform)
function edgeSizesLookup() {
  var edgeweis = {}

  for (let i in TW.edgeIds) {
    let e = TW.partialGraph.graph.edges(TW.edgeIds[i])
    if (e) {
      if (!edgeweis[e.categ])           edgeweis[e.categ] = {}
      if (!edgeweis[e.categ][e.weight]) edgeweis[e.categ][e.weight] = []

      edgeweis[e.categ][e.weight].push(e.id)
    }
  }
  return edgeweis
}

function edgeSizesSteps(eTypeStr) {
  let esizesCensus = edgeSizesLookup()
  var stepToIdsArray = []


  if (esizesCensus[eTypeStr]) {
    var sortedSizes = Object.keys(
                        esizesCensus[eTypeStr]
                      ).sort(function(a,b){return a-b})

    for (let l in sortedSizes) {
      stepToIdsArray.push(esizesCensus[eTypeStr][sortedSizes[l]])
    }
  }

  // console.warn ("edgeSizesSteps:", eTypeStr, stepToIdsArray)

  return stepToIdsArray
}


//    Execution modes:
//	EdgeWeightFilter("#sliderAEdgeWeight", "1",   "weight");
//	EdgeWeightFilter("#sliderAEdgeWeight", "1|0", "weight");
//	EdgeWeightFilter("#sliderBEdgeWeight", "0|1", "weight");
//	EdgeWeightFilter("#sliderBEdgeWeight", "1|1", "weight");

// NB new sigma js: dropEdge is quite slow so we add a waiting cursor

function EdgeWeightFilter(sliderDivID , typestr ,  criteria) {

    if(TW.partialGraph.graph.nEdges()<2) {
        console.log('not enough edges for subsets: skipping GUI slider init')
        showDisabledSlider(sliderDivID)
        return;
    }

    // building the index
    var stepToIdsArr = edgeSizesSteps(typestr)
    var steps = stepToIdsArr.length

    if(steps<2) {
        console.log('no size steps for edges: skipping GUI slider init')
        showDisabledSlider(sliderDivID)
        return;
    }


    // cache initial value
    var initialValue=("0-"+(steps-1));
    TW.gui.lastFilters[`${sliderDivID}/${typestr}`] = initialValue

    var present = TW.states.slice(-1)[0];

    // console.log('init freshslider for edges, steps:', steps, sliderDivID)

    var edgeSlideTimeout = null

    if (steps == 0) {
      return
    }


    // Relations are of 3 kinds: within nodes0, within nodes1, true bipartite
    //                                1|0            0|1            1|1

    // three-way slider colors to represent that
    // orange for terms, green for docs/people/contexts, violet for bipartite
    switch (typestr) {
      case '1':
      case '1|0':
        edgeTypeColor = "#FFA500"
        break;
      case '0|1':
        edgeTypeColor = "#27c470"
        break;
      case '1|1':
        edgeTypeColor = "#A40DFF"   // or "#E8200C"
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
                var lastvalue = TW.gui.lastFilters[`${sliderDivID}/${typestr}`]

                // sliderDivID+"_"+filtervalue

                console.debug("\nprevious value "+lastvalue+" | current value "+filtervalue)

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
                          console.log("cotainferior   --||>--------||   a la derecha")
                      }
                      if(mint0>mint1) {
                          addflag = true;
                          console.log("cotainferior   --<||--------||   a la izquierda")
                      }
                      iterarr = calc_range(mint0,mint1).sort(compareNumbers);
                  }

                  if(maxt0!=maxt1) {
                      if(maxt0<maxt1) {
                          addflag = true;
                          console.log("cotasuperior   ||--------||>--   a la derecha")
                      }
                      if(maxt0>maxt1) {
                          delflag = true;
                          console.log("cotasuperior   ||--------<||--   a la izquierda")
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

                                  // global level case
                                  if(present.level) {
                                      console.log("\tADD "+eid)
                                      // n = eid.split(";")
                                      // if(n.length>1)
                                      //     console.log("\t\tsource:("+TW.Nodes[n[0]].x+","+TW.Nodes[n[0]].y+") ||| target:("+TW.Nodes[n[1]].x+","+TW.Nodes[n[1]].y+")")
                                      add1Elem(eid)
                                  }


                                  // local level case
                                  // stepToIdsArr is full of edges that don't really exist at this point
                                  else {

                                    // NB we assume the sigma convention eid = "nid1;nid2"
                                    let nidkeys = eid.split(';')
                                    console.log(nidkeys)

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
                                            add1Elem(eid)
                                      }
                                    }
                                  }

                              }
                          }

                      } else {
                          if(delflag) {
                              console.log("deleting "+eids.join())
                              for(var i in eids) {
                                  ID = eids[i]
                                  if(!isUndef(TW.partialGraph.graph.edges(ID))) {
                                      var t0 = performance.now()
                                      TW.partialGraph.graph.dropEdge(ID)
                                      var t1 = performance.now()
                                      TW.Edges[ID].lock = true;

                                      // usually very long b/c sigma has to update indexes
                                      // <=> shift same arrays many times
                                      totalDeletingTime += (t1-t0)
                                      // POSS ideally: use .hidden

                                      console.log("\tDEL "+ID)

                                      // n = ID.split(";")
                                      // if(n.length>1)
                                      //     console.log("\t\tsource:("+TW.Nodes[n[0]].x+","+TW.Nodes[n[0]].y+") ||| target:("+TW.Nodes[n[1]].x+","+TW.Nodes[n[1]].y+")")
                                  }
                              }
                          }
                      }
                  }

                  if (delflag)
                      console.info('totalDeletingTime', totalDeletingTime)

                  // console.log("\t\tedgesfilter:")
                  // console.log("\t\t[ Starting FA2 ]")
                  // [ Starting FA2 ]
                  setTimeout(function() {
                    sigma_utils.smartForceAtlas({'duration': 2000}) // shorter FA2 sufficient
                  }, 10)
                // [ / Starting FA2 ]

                  // memoize as last value
                  TW.gui.lastFilters[`${sliderDivID}/${typestr}`] = filtervalue
                }

                else {
                  // console.log('edges:::same position')
                }

                // in any case
                setTimeout( function() {
                  TW.partialGraph.refresh()
                  TW.gui.elHtml.classList.remove('waiting')
                }, 20)

            }, 1500) // large-ish debounce timeout

          }, 40)  // wait cursor timeout

        }
    });

}



//   Execution modes:
// NodeWeightFilter ( "#sliderANodeWeight" , "Document"  , "size")
// NodeWeightFilter ( "#sliderBNodeWeight" ,  "NGram"   , "size")
function NodeWeightFilter( sliderDivID , tgtNodeType ,  criteria) {

    if (typeof tgtNodeType == "undefined") {
      throw 'no nodetype'
    }

    if(TW.partialGraph.graph.nNodes() < 2) {
      console.warn('not enough nodes for subsets: skipping GUI slider init')
      showDisabledSlider(sliderDivID)
      return;
    }

    // ids per weight level
    // we use live index from prepareSigmaCustomIndices
    let nodesByTypeNSize = TW.partialGraph.graph.getNodesBySize(tgtNodeType)
    var sortedSizes = Object.keys(nodesByTypeNSize).sort(function(a,b){return a-b})

    var stepToIdsArr = []

    for (let l in sortedSizes) {

      var nidsWithThatSize = TW.partialGraph.graph.getNodesBySize(tgtNodeType, sortedSizes[l])

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
        bgcolor:( tgtNodeType==TW.categories[0] )?"#FFA500":"#27c470" ,
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


function jsActionOnGexfSelector(gexfBasename){
    let gexfPath = TW.gexfPaths[gexfBasename] || gexfBasename+".gexf"
    let serverPrefix = ''
    var pathcomponents = window.location.pathname.split('/')
    for (var i in pathcomponents) {
      if (pathcomponents[i] != 'explorerjs.html')
        serverPrefix += '/'+pathcomponents[i]
    }

    var newDataRes = AjaxSync({ "url": window.location.origin+serverPrefix+'/'+gexfPath });

    // remove any previous instance and flags
    TW.resetGraph()

    mainStartGraph(newDataRes["format"], newDataRes["data"], TW.instance)
    writeLabel(gexfBasename)
    TW.File = gexfPath
}
//============================= </OTHER ACTIONS > =============================//
