'use strict;'

// always useful
var theHtml = document.getElementsByTagName('html')[0]

// GUI vars
TW.gui = {}
TW.gui.selectionActive = false  // <== changes rendering mode
TW.gui.circleSize = 0;
TW.gui.circleSlider = null
TW.gui.checkBox=false;
TW.gui.shiftKey=false;
TW.gui.manuallyChecked = false;
TW.gui.handpickedcolor = false;     // <= changes edge rendering strategy
TW.gui.lastFilters = {}


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
  let skipStep = parseInt(listsLen / nHalfToPick)

  // cold colors
  for (let i = listsLen-1 ; i > 0 ; i -= skipStep ) {
    outColors.push(TW.gui.heatmapColorListToColdest[i])
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


function writeBrand (brandString) {
  document.getElementById('twbrand').innerHTML = brandString
}

function writeLabel (aMapLabel) {
  document.getElementById('maplabel').innerHTML = aMapLabel
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
    var present = TW.states.slice(-1)[0]; // Last
    var past = TW.states.slice(-2)[0] // avant Last
    var lastpos = TW.states.length-1;
    var avantlastpos = lastpos-1;


    var level = present.level;
    var sels = present.selectionNids
    var t0Activetypes = present.activetypes;
    var t0ActivetypesKey = t0Activetypes.map(Number).join("|")


    // console.debug("CHANGE TYPE, present.selections", present.selectionNids)

    var selsbackup = present.selectionNids.slice();


    // type "grammar"
    //     used to distinguish types in TW.Relations

    // activetypes eg [true]          <=> key '1'
    //                [true, true]    <=> key '1|1'
    //                [true, false]   <=> key '1|0'

    // Complement of the received state ~[X\Y] )
    var t1Activetypes = []
    for(var i in t0Activetypes) t1Activetypes[i] = !t0Activetypes[i]
    var t1ActivetypesKey = t1Activetypes.map(Number).join("|")

    var binSumCats = []
    for(var i in t0Activetypes)
        binSumCats[i] = (t0Activetypes[i]||t1Activetypes[i])
    var str_binSumCats = binSumCats.map(Number).join("|")

    var nextState = []
    if(level) nextState = t1Activetypes;
    else nextState = binSumCats;

    if(!level && past!=false) {
        var sum_past = present.activetypes.map(Number).reduce(function(a, b){return a+b;})
        console.log("sum_past:")
        console.log(sum_past)
        console.log("past.activetypes:")
        console.log(past.activetypes)
        if(sum_past>1) {
            nextState = past.activetypes;
        }
    }
    var str_nextState = nextState.map(Number).join("|")

    var prevnodes = {}
    var prevedges = {}

    // for all possible nodes, which ones actually in the graph atm
    for(var i in TW.nodeIds) {
        let nid = TW.nodeIds[i]
        let anode = TW.partialGraph.graph.nodes(nid);
        if(anode) {
            prevnodes[nid] = true
        }
    }

    var links_sels = {}

    for(var i in TW.edgeIds) {
        let eid = TW.edgeIds[i]
        let anedge = TW.partialGraph.graph.edges(eid);
        if(anedge) {
            prevedges[eid] = true;
            if(anedge.customAttrs) {
                if(anedge.customAttrs["grey"]==0) {
                    links_sels[eid] = true;
                }
            }
        }
    }

    TW.partialGraph.graph.clear();

    var nodes_2_colour = {}
    var edges_2_colour = {}

    console.log("CHanging the TYpE!!: "+present.level)

    if(present.level) { //If level=Global, fill all {X}-component

        for(var nid in TW.Nodes) {
            if(t1Activetypes[TW.catDict[TW.Nodes[nid].type]]) {
              add1Elem(nid)
            }
        }
        for(var eid in TW.Edges) {

            if(TW.Edges[eid].categ==t1ActivetypesKey)
                add1Elem(eid)
        }
    } else /* Local level, change to previous or alter component*/ {
        if(sels.length==0) {
            console.log(" * * * * * * * * * * * * * * ")
            console.log("the past: ")
            console.log(past.activetypes.map(Number)+" , "+past.level)
            console.log(past)

            console.log("the present: ")
            console.log(present.activetypes.map(Number)+" , "+present.level)
            console.log(present)

            console.log("t0ActivetypesKey: "+t0ActivetypesKey)
            console.log("t1ActivetypesKey: "+t1ActivetypesKey)
            console.log("str_nextState: "+str_nextState)

            var newsels = {}
            var sumpastcat = t0Activetypes.map(Number).reduce(function(a, b){return a+b;})
            if(sumpastcat==1) /* change to alter comp*/ {
                for(var nid in prevnodes) {
                    let neigh = TW.Relations[str_nextState][nid]
                    if(neigh) {
                        for(var j in neigh) {
                            let tid = neigh[j]
                            nodes_2_colour[tid]=true;
                        }
                    }
                }

                for(var nid in nodes_2_colour) {
                    let neigh = TW.Relations[t1ActivetypesKey][nid]
                    if(neigh) {
                        for(var j in neigh) {
                            let tid = neigh[j]
                            if(nodes_2_colour[tid]) {
                                edges_2_colour[nid+";"+tid]=true;
                                edges_2_colour[tid+";"+nid]=true;
                            }
                        }
                    }
                    nodes_2_colour[nid] = false;
                }

                for(var nid in nodes_2_colour)
                    add1Elem(nid)
                for(var eid in edges_2_colour)
                    add1Elem(eid)

                nextState = t1Activetypes;

            }

            if(sumpastcat==2) {

            }
            console.log(" * * * * * * * * * * * * * * ")
        }
    }

    if(sels.length>0) { // and if there's some selection:

        // console.log("active selection 01:")
        // console.log(sels)

        // Defining the new selection (if it's necessary)
        var sumCats = t0Activetypes.map(Number).reduce(function(a, b){return a+b;})
        var sumFutureCats = nextState.map(Number).reduce(function(a, b){return a+b;})

        nextState = (sumFutureCats==2 && !level && sumCats==1 )? nextState : t1Activetypes;
        if(t1ActivetypesKey=="0|0" ) nextState=past.activetypes;
        // nextState = ( past.activetypes && !level && sumCats==1 )? past.activetypes : t1Activetypes;
        str_nextState = nextState.map(Number).join("|")
        var sumNextState = nextState.map(Number).reduce(function(a, b){return a+b;})

        // [ ChangeType: incremental selection ;]
        if(sumCats==1 && sumNextState<2) {

            var indexCat = str_binSumCats;//(level)? t1ActivetypesKey : str_binSumCats ;
            // Dictionaries of: opposite-neighs of current selection
            var newsels = {}
            for(var i in sels) {
                s = sels[i];
                neigh = TW.Relations[indexCat][s]
                if(neigh) {
                    for(var j in neigh) {
                        t = neigh[j]
                        newsels[t]=true;
                    }
                }
            }
            for(var i in sels) {
                delete newsels[sels[i]];
                // if(level) delete newsels[sels[i]];
                // else newsels[sels[i]]=true;
            }

            sels = Object.keys(newsels);
            // output: newsels=[opposite-neighs]
        } // [ / ChangeType: incremental selection ]

        if (TW.conf.debug.logSelections)
          console.log("new virtually selected nodes:", sels)

        var selDict={}
        for(var i in sels) // useful for case: (sumNextState==2)
            selDict[sels[i]]=true

        if(sumNextState==1) { // we're moving to {X}-subgraph
            // Saving all the nodes&edges to be highlighted.
            for(var i in sels) {
                s = sels[i];
                neigh = TW.Relations[str_nextState][s]
                if(neigh) {
                    for(var j in neigh) {
                        t = neigh[j]
                        nodes_2_colour[t]=false;
                        edges_2_colour[s+";"+t]=true;
                        edges_2_colour[t+";"+s]=true;
                    }
                }
            }
            for(var i in sels)
                nodes_2_colour[sels[i]]=true;
            // output: nodes_2_colour and edges_2_colour
        }

        if(sumNextState==2) { // we're moving to bipartite subgraph
            for(var i in TW.Edges) {
                n = i.split(";")
                if( selDict[ n[0] ] || selDict[ n[1] ]  ) {
                    nodes_2_colour[n[0]]=false;
                    nodes_2_colour[n[1]]=false;
                    edges_2_colour[n[0]+";"+n[1]]=true;
                }
            }
            for(var i in sels)
                nodes_2_colour[sels[i]] = true;
        }

        // Adding just selection+neighs
        if(!present.level) {
            for(var nid in nodes_2_colour)
                add1Elem(nid)
            for(var eid in edges_2_colour)
                add1Elem(eid)
        }

        // to recreate the selection in the new type graph
        TW.instance.selNgn.MultipleSelection2({
                    nodes: sels,
                    nodesDict:nodes_2_colour,
                    edgesDict:edges_2_colour
                });
        TW.gui.selectionActive=true;
    }

    // £TODO this should be done by setState()
    TW.states[avantlastpos] = {};
    TW.states[avantlastpos].LouvainFait = false;
    TW.states[avantlastpos].level = present.level;
    TW.states[avantlastpos].selectionNids = selsbackup;
    TW.states[avantlastpos].activetypes = present.activetypes;
    // possible: integrated highlighted opposite- and same-side neighbours from MS2
    // (var used to exist but wasn't filled and used consistently)
    TW.setState({
        activetypes: nextState,
        level: level,
        sels: sels,
        oppos: []
    })

    // REFA new sigma.js
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
// changeLevel :     macro selection SysSt = {level: true, type:XY}
//                         ^
//                         |
//                         v
//                   local selection SysSt = {level: false, type:XY}
//
//  where SysSt is the last state aka TW.states.slice(-1)[0]
//    and SysSt.level is aka swMacro

function changeLevel() {
    // show waiting cursor
    theHtml.classList.add('waiting');

    // let the waiting cursor appear
    setTimeout(function() {
      var present = TW.states.slice(-1)[0]; // Last
      var past = TW.states.slice(-2)[0] // avant Last
      var lastpos = TW.states.length-1;
      var avantlastpos = lastpos-1;

      var level = present.level;
      var sels = present.selectionNids ;//[144, 384, 543]//TW.states[last].selectionNids;

      let selsChecker = {}
      for (let i in sels) {
        selsChecker[sels[i]] = true
      }

      // type "grammar"
      //     used to distinguish types in TW.Relations

      // types eg [true]          <=> '1'
      //          [true, true]    <=> '1|1'

      var t0Activetypes = present.activetypes;
      var t0ActivetypesKey = t0Activetypes.map(Number).join("|")

      // [X|Y]-change (NOT operation over the received state [X\Y] )
      var t1Activetypes = []
      for(var i in t0Activetypes) t1Activetypes[i] = !t0Activetypes[i]
      var t1ActivetypesKey = t1Activetypes.map(Number).join("|")

      TW.partialGraph.graph.clear();

      var voisinage = {}
      // Dictionaries of: selection+neighbors
      var nodes_2_colour = {}
      var edges_2_colour = {}

      // POSS: factorize with same strategy in MultipleSelection2 beginning
      for(var i in sels) {
          s = sels[i];
          neigh = TW.Relations[t0ActivetypesKey][s]
          if(neigh) {
              for(var j in neigh) {
                  t = neigh[j]
                  nodes_2_colour[t]=false;
                  edges_2_colour[s+";"+t]=true;
                  edges_2_colour[t+";"+s]=true;
                  if( !selsChecker[t]  )
                      voisinage[ t ] = true;
              }
          }
      }
      for(var i in sels)
          nodes_2_colour[sels[i]]=true;


      var futurelevel = []

      if(present.level) { // [Change to Local] when level=Global(1)
          for(var nid in nodes_2_colour)
              add1Elem(nid)
          for(var eid in edges_2_colour)
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
              if(t0Activetypes[TW.catDict[TW.Nodes[nid].type]])
                  // we add 1 by 1
                  add1Elem(nid)
          }
          for(var eid in TW.Edges) {
              if(TW.Edges[eid].categ==t0ActivetypesKey)
                  add1Elem(eid)
          }

          // var t1 = performance.now()
          futurelevel = true;

          // console.log("returning to global took:", t1-t0)

          // Nodes Selection now:
          if(sels.length>0) {
              TW.instance.selNgn.MultipleSelection2({
                          nodes:sels,
                          nodesDict:nodes_2_colour,
                          edgesDict:edges_2_colour
                      });
              TW.gui.selectionActive=true;
          }
      }

      // console.log("enviroment changeLevel nodes_2_colour", nodes_2_colour)
      TW.states[avantlastpos] = {};
      TW.states[avantlastpos].level = present.level;
      TW.states[avantlastpos].activetypes = present.activetypes;
      TW.states[avantlastpos].selectionNids = present.selectionNids;

      TW.setState({
          activetypes: present.activetypes,
          level: futurelevel,
          sels: sels,
          oppos: []
      })

      TW.partialGraph.camera.goTo({x:0, y:0, ratio:1.2, angle: 0})
      TW.partialGraph.refresh()

      // recreate FA2 nodes array after you change the nodes
      reInitFa2({
        useSoftMethod: !futurelevel,
        callback: function() {
          theHtml.classList.remove('waiting');

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

  return stepToIdsArray
}


//    Execution modes:
//	EdgeWeightFilter("#sliderAEdgeWeight", "1",   "weight");
//	EdgeWeightFilter("#sliderAEdgeWeight", "1|0", "weight");
//	EdgeWeightFilter("#sliderBEdgeWeight", "0|1", "weight");

// NB new sigma js: dropEdge is quite slow so we add a waiting cursor

function EdgeWeightFilter(sliderDivID , typestr ,  criteria) {
    if(TW.partialGraph.graph.nEdges()<2) {
        console.warn('not enough edges for subsets: skipping GUI slider init')
        showDisabledSlider(sliderDivID)
        return;
    }


    var stepToIdsArr = edgeSizesSteps(typestr)
    var steps = stepToIdsArr.length

    if(steps<2) {
        console.warn('no size steps for edges: skipping GUI slider init')
        showDisabledSlider(sliderDivID)
        return;
    }


    // cache initial value
    var initialValue=("0-"+(steps-1));
    TW.gui.lastFilters[sliderDivID] = initialValue

    var present = TW.states.slice(-1)[0];

    // console.log('init freshslider for edges, steps:', steps, sliderDivID)

    var edgeSlideTimeout = null

    if (steps == 0) {
      return
    }

    //finished
    $(sliderDivID).freshslider({
        range: true,
        step: 1,
        min:0,
        // green for docs, orange for terms
        bgcolor: (typestr=="1|0" || typestr=="1")?"#27c470":"#FFA500" ,
        max:steps-1,
        value:[0,steps-1],
        onchange:function(low, high) {
          theHtml.classList.add('waiting');

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
                var lastvalue = TW.gui.lastFilters[sliderDivID]
                // sliderDivID+"_"+filtervalue

                // console.debug("\nprevious value "+lastvalue+" | current value "+filtervalue)

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
                                  TW.Edges[eid].lock = false;

                                  // global level case
                                  if(present.level) {
                                      // console.log("\tADD "+eid)
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
                                    // console.log(nidkeys)

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
                              // console.log("deleting "+ids.join())
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
                                      // POSS ideally: implement a batch dropEdges
                                      //                or use graph.clear and rebuild the rest

                                      // console.log("\tDEL "+ID)

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

                  console.log("lastvalue===", lastvalue)
                  TW.gui.lastFilters[sliderDivID] = lastvalue
                  // pushFilterValue( sliderDivID , lastvalue )
                }

                else {
                  // console.log('edges:::same position')
                }

                // in any case
                setTimeout( function() {
                  theHtml.classList.remove('waiting')
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
    let nodesBySize = TW.partialGraph.graph.getNodesBySize(tgtNodeType)
    var sortedSizes = Object.keys(nodesBySize).sort(function(a,b){return a-b})

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
        bgcolor:( tgtNodeType==TW.categories[0] )?"#27c470":"#FFA500" ,
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

  icon.src = TW.conf.libspath + '/img2/loader.gif'

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
}
//============================= </OTHER ACTIONS > =============================//
