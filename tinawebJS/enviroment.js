'use strict;'

// always useful
var theHtml = document.getElementsByTagName('html')[0]

function writeBrand (brandString) {
  document.getElementById('twbrand').innerHTML = brandString
}

//============================ < NEW BUTTONS > =============================//

// Documentation Level: *****
function changeType() {
    var present = TW.partialGraph.states.slice(-1)[0]; // Last
    var past = TW.partialGraph.states.slice(-2)[0] // avant Last
    var lastpos = TW.partialGraph.states.length-1;
    var avantlastpos = lastpos-1;


    var level = present.level;
    var sels = present.selections
    var type_t0 = present.type;
    var str_type_t0 = type_t0.map(Number).join("|")


    console.debug("CHANGE TYPE, present.selections", present.selections)

    var selsbackup = present.selections.slice();


    // type "grammar"
    //     used to distinguish types in TW.Relations

    // types eg [true]          <=> '1'
    //          [true, true]    <=> '1|1'
    //          [true, false]   <=> '1|0'

    // Complement of the received state ~[X\Y] )
    var type_t1 = []
    for(var i in type_t0) type_t1[i] = !type_t0[i]
    var str_type_t1 = type_t1.map(Number).join("|")

    var binSumCats = []
    for(var i in type_t0)
        binSumCats[i] = (type_t0[i]||type_t1[i])
    var str_binSumCats = binSumCats.map(Number).join("|")

    var nextState = []
    if(level) nextState = type_t1;
    else nextState = binSumCats;

    if(!level && past!=false) {
        var sum_past = present.type.map(Number).reduce(function(a, b){return a+b;})
        console.log("sum_past:")
        console.log(sum_past)
        console.log("past.type:")
        console.log(past.type)
        if(sum_past>1) {
            nextState = past.type;
        }
    }
    var str_nextState = nextState.map(Number).join("|")

    var prevnodes = {}
    var prevedges = {}

    // for all possible nodes, which ones actually in the graph atm
    for(var i in TW.nodeIds) {
        anode = TW.partialGraph.graph.nodes(TW.nodeIds[i]);
        if(anode) {
            prevnodes[i] = true
        }
    }

    var links_sels = {}

    for(var i in TW.edgeIds) {
        anedge = TW.partialGraph.graph.edges(TW.edgeIds[i]);
        if(anedge) {
            prevedges[i] = true;
            if(anedge.customAttrs) {
                if(anedge.customAttrs["grey"]==0) {
                    links_sels[i] = true;
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
            if(type_t1[TW.catDict[TW.Nodes[nid].type]]) {
              add1Elem(nid)
            }
        }
        for(var eid in TW.Edges) {

            if(TW.Edges[eid].categ==str_type_t1)
                add1Elem(eid)
        }
    } else /* Local level, change to previous or alter component*/ {
        if(sels.length==0) {
            console.log(" * * * * * * * * * * * * * * ")
            console.log("the past: ")
            console.log(past.type.map(Number)+" , "+past.level)
            console.log(past)

            console.log("the present: ")
            console.log(present.type.map(Number)+" , "+present.level)
            console.log(present)

            console.log("str_type_t0: "+str_type_t0)
            console.log("str_type_t1: "+str_type_t1)
            console.log("str_nextState: "+str_nextState)

            var newsels = {}
            var sumpastcat = type_t0.map(Number).reduce(function(a, b){return a+b;})
            if(sumpastcat==1) /* change to alter comp*/ {
                for(var i in prevnodes) {
                    s = i;
                    neigh = TW.Relations[str_nextState][s]
                    if(neigh) {
                        for(var j in neigh) {
                            t = neigh[j]
                            nodes_2_colour[t]=true;
                        }
                    }
                }

                for(var i in nodes_2_colour) {
                    s = i;
                    neigh = TW.Relations[str_type_t1][s]
                    if(neigh) {
                        for(var j in neigh) {
                            t = neigh[j]
                            if(nodes_2_colour[t]) {
                                edges_2_colour[s+";"+t]=true;
                                edges_2_colour[t+";"+s]=true;
                            }
                        }
                    }
                    nodes_2_colour[i] = false;
                }

                for(var nid in nodes_2_colour)
                    add1Elem(nid)
                for(var eid in edges_2_colour)
                    add1Elem(eid)

                nextState = type_t1;

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
        var sumCats = type_t0.map(Number).reduce(function(a, b){return a+b;})
        var sumFutureCats = nextState.map(Number).reduce(function(a, b){return a+b;})

        nextState = (sumFutureCats==2 && !level && sumCats==1 )? nextState : type_t1;
        if(str_type_t1=="0|0" ) nextState=past.type;
        // nextState = ( past.type && !level && sumCats==1 )? past.type : type_t1;
        str_nextState = nextState.map(Number).join("|")
        var sumNextState = nextState.map(Number).reduce(function(a, b){return a+b;})

        // [ ChangeType: incremental selection ]
        if(sumCats==1 && sumNextState<2) {

            var indexCat = str_binSumCats;//(level)? str_type_t1 : str_binSumCats ;
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

        // console.log("new virtually selected nodes:")
        // console.log(sels)

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
        // var SelInst = new SelectionEngine();
        // SelInst.MultipleSelection2({
        //             nodesDict:nodes_2_colour,
        //             edgesDict:edges_2_colour
        //         });
        var SelInst2 = new SelectionEngine();
        SelInst2.MultipleSelection2({ nodes: sels });
        overNodes=true;
    }

    TW.partialGraph.states[avantlastpos] = {};
    TW.partialGraph.states[avantlastpos].LouvainFait = false;
    TW.partialGraph.states[avantlastpos].level = present.level;
    TW.partialGraph.states[avantlastpos].selections = selsbackup;
    TW.partialGraph.states[avantlastpos].type = present.type;
    TW.partialGraph.states[avantlastpos].opposites = present.opposites;

    TW.partialGraph.states[lastpos].setState({
        type: nextState,
        level: level,
        sels: Object.keys(selections),
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
//  where SysSt is the last state aka TW.partialGraph.states.slice(-1)[0]
//    and SysSt.level is aka swMacro

function changeLevel() {
    // show waiting cursor
    theHtml.classList.add('waiting');

    // let the waiting cursor appear
    setTimeout(function() {
      var present = TW.partialGraph.states.slice(-1)[0]; // Last
      var past = TW.partialGraph.states.slice(-2)[0] // avant Last
      var lastpos = TW.partialGraph.states.length-1;
      var avantlastpos = lastpos-1;

      var level = present.level;
      var sels = present.selections;//[144, 384, 543]//TW.partialGraph.states.selections;


      // type "grammar"
      //     used to distinguish types in TW.Relations

      // types eg [true]          <=> '1'
      //          [true, true]    <=> '1|1'

      var type_t0 = present.type;
      var str_type_t0 = type_t0.map(Number).join("|")

      // [X|Y]-change (NOT operation over the received state [X\Y] )
      var type_t1 = []
      for(var i in type_t0) type_t1[i] = !type_t0[i]
      var str_type_t1 = type_t1.map(Number).join("|")

      TW.partialGraph.graph.clear();

      var voisinage = {}
      // Dictionaries of: selection+neighbors
      var nodes_2_colour = {}
      var edges_2_colour = {}

      // POSS: factorize with same strategy in MultipleSelection2 beginning
      for(var i in sels) {
          s = sels[i];
          neigh = TW.Relations[str_type_t0][s]
          if(neigh) {
              for(var j in neigh) {
                  t = neigh[j]
                  nodes_2_colour[t]=false;
                  edges_2_colour[s+";"+t]=true;
                  edges_2_colour[t+";"+s]=true;
                  if( !selections[t]  )
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
              if(type_t0[TW.catDict[TW.Nodes[nid].type]])
                  // we add 1 by 1
                  add1Elem(nid)
          }
          for(var eid in TW.Edges) {
              if(TW.Edges[eid].categ==str_type_t0)
                  add1Elem(eid)
          }

          // var t1 = performance.now()
          futurelevel = true;

          // console.log("returning to global took:", t1-t0)

          // Nodes Selection now:
          if(sels.length>0) {
              var SelInst = new SelectionEngine();
              SelInst.MultipleSelection2({
                          nodes:sels,
                          nodesDict:nodes_2_colour,
                          edgesDict:edges_2_colour
                      });
              overNodes=true;
          }
      }

      // console.log("enviroment changeLevel nodes_2_colour", nodes_2_colour)


      TW.partialGraph.states[avantlastpos] = {};
      TW.partialGraph.states[avantlastpos].level = present.level;
      TW.partialGraph.states[avantlastpos].selections = present.selections;
      TW.partialGraph.states[avantlastpos].type = present.type;
      TW.partialGraph.states[avantlastpos].opposites = present.opposites;

      TW.partialGraph.states[lastpos].setState({
          type: present.type,
          level: futurelevel,
          sels: Object.keys(selections),
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


    var lastvalue=("0-"+(steps-1));

    pushFilterValue( sliderDivID , lastvalue )

    var present = TW.partialGraph.states.slice(-1)[0];

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

          // 500ms timeout to let the waiting cursor appear
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

                if(filtervalue!=lastFilter[sliderDivID]["last"]) {

                  // £TODO better memoize the last filter value
                  // $.doTimeout(sliderDivID+"_"+lastFilter[sliderDivID]["last"]);


                  // sliderDivID+"_"+filtervalue

                  console.log("\nprevious value "+lastvalue+" | current value "+filtervalue)

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
                    sigma_utils.smartForceAtlas(2000) // shorter FA2 sufficient
                  }, 10)
                // [ / Starting FA2 ]

                  lastvalue = filtervalue;
                  pushFilterValue( sliderDivID , filtervalue )
                }

                setTimeout( function() {
                  theHtml.classList.remove('waiting')
                }, 20)

            }, 700) // large-ish debounce timeout



          }, 500)  // wait cursor timeout

        }
    });

}



//   Execution modes:
// NodeWeightFilter ( "#sliderANodeWeight" , "Document"  , "size")
// NodeWeightFilter ( "#sliderBNodeWeight" ,  "NGram"   , "size")
function NodeWeightFilter( sliderDivID , tgtNodeType ,  criteria) {

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

    //finished
    $(sliderDivID).freshslider({
        range: true,
        step: 1,
        min:0,
        max:steps-1,
        bgcolor:( tgtNodeType==TW.categories[0] )?"#27c470":"#FFA500" ,
        value:[0,steps-1],
        onchange:function(low, high){
            var filtervalue = low+"-"+high

            if(filtervalue!=lastFilter[sliderDivID]["last"]) {
                if(lastFilter[sliderDivID]["orig"]=="-") {
                    pushFilterValue( sliderDivID , filtervalue )
                    return false
                }

                // [ Stopping FA2 ]
                if (TW.partialGraph.isForceAtlas2Running())
                    sigma_utils.ourStopFA2();
                // [ / Stopping FA2 ]


                // debounced
                if (nodeSlideTimeout){
                  // console.log('clearing updated function', nodeSlideTimeout)
                  clearTimeout(nodeSlideTimeout)
                }

                // scheduled: graph rm nodes
                nodeSlideTimeout = setTimeout ( function () {

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
                    pushFilterValue(sliderDivID,filtervalue)

                    TW.partialGraph.render()

                    // [ Starting FA2 ]
                    setTimeout(function() {
                      sigma_utils.smartForceAtlas(2000) // shorter FA2 sufficient
                    }, 10)
                  // [ / Starting FA2 ]

                }, 300)
            }

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
    labels.push({
        'id' : id,
        'label' : name,
        'desc': type
    });
}

function extractContext(string, context) {
    var matched = string.toLowerCase().indexOf(context.toLowerCase());

    if (matched == -1)
        return string.slice(0, 20) + '...';

    var begin_pts = '...', end_pts = '...';

    if (matched - 20 > 0) {
        var begin = matched - 20;
    } else {
        var begin = 0;
        begin_pts = '';
    }

    if (matched + context.length + 20 < string.length) {
        var end = matched + context.length + 20;
    } else {
        var end = string.length;
        end_pts = '';
    }

    str = string.slice(begin, end);

    if (str.indexOf(" ") != Math.max(str.lastIndexOf(" "), str.lastIndexOf(".")))
        str = str.slice(str.indexOf(" "), Math.max(str.lastIndexOf(" "), str.lastIndexOf(".")));

    return begin_pts + str + end_pts;
}


// TODO check duplicate function with sigmaUtils exactfind()
function searchLabel(string){
    var id_node = '';
    var n;

    nds = TW.partialGraph._core.graph.nodes.filter(function(x){return !x["hidden"]});
    for(var i in nds){
        n = nds[i]
            if (n.label == string) {
                return n;
            }
    }
}
//============================ < / SEARCH > ============================//
