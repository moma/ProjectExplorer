

//============================ < NEW BUTTONS > =============================//

// Documentation Level: *****
function changeType() {
    var present = TW.partialGraph.states.slice(-1)[0]; // Last
    var past = TW.partialGraph.states.slice(-2)[0] // avant Last
    var lastpos = TW.partialGraph.states.length-1;
    var avantlastpos = lastpos-1;


    var level = present.level;
    var sels = present.selections
    var catDict = present.categoriesDict;
    var type_t0 = present.type;    
    var str_type_t0 = type_t0.map(Number).join("|")

    var selsbackup = present.selections.slice();
    
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
    for(var i in TW.partialGraph._core.graph.nodesIndex) {
        anode = TW.partialGraph._core.graph.nodesIndex[i];
        if(anode) {
            prevnodes[i] = true
        }
    }

    var links_sels = {}
    for(var i in TW.partialGraph._core.graph.edgesIndex) {
        anedge = TW.partialGraph._core.graph.edgesIndex[i];
        if(anedge) {
            prevedges[i] = true;
            if(anedge.attr) {
                if(anedge.attr["grey"]==0) {
                    links_sels[i] = true;
                }
            }
        }
    }

    TW.partialGraph.emptyGraph();

    var nodes_2_colour = {}
    var edges_2_colour = {}

    pr("CHanging the TYpE!!: "+present.level)

    if(present.level) { //If level=Global, fill all {X}-component 

        for(var n in TW.Nodes) {
            if(type_t1[catDict[TW.Nodes[n].type]]) 
                add1Elem(n)
        }
        for(var e in TW.Edges) {
            if(TW.Edges[e].categ==str_type_t1) 
                add1Elem(e)
        }
    } else /* Local level, change to previous or alter component*/ {
        if(sels.length==0) {
            pr(" * * * * * * * * * * * * * * ")
            pr("the past: ")
            pr(past.type.map(Number)+" , "+past.level)
            pr(past)

            pr("the present: ")
            pr(present.type.map(Number)+" , "+present.level)
            pr(present)

            pr("str_type_t0: "+str_type_t0)
            pr("str_type_t1: "+str_type_t1)
            pr("str_nextState: "+str_nextState)

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

                for(var i in nodes_2_colour)
                    add1Elem(i)
                for(var i in edges_2_colour)
                    add1Elem(i)

                nextState = type_t1;

            } 

            if(sumpastcat==2) {

            }
            pr(" * * * * * * * * * * * * * * ")
        }
    }

    if(sels.length>0) { // and if there's some selection:

        console.log("active selection 01:")
        console.log(sels)

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

            sels = Object.keys(newsels).map(Number);
            // output: newsels=[opposite-neighs]
        } // [ / ChangeType: incremental selection ]

        console.log("new virtually selected nodes:")
        console.log(sels)
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
                n = i.split(";").map(Number)
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
            for(var i in nodes_2_colour)
                add1Elem(i)
            for(var i in edges_2_colour)
                add1Elem(i)
        }

        var SelInst = new SelectionEngine();
        SelInst.MultipleSelection2({
                    nodesDict:nodes_2_colour,
                    edgesDict:edges_2_colour
                });
        overNodes=true;
    }

    TW.partialGraph.states[avantlastpos] = {};
    TW.partialGraph.states[avantlastpos].LouvainFait = false;
    TW.partialGraph.states[avantlastpos].level = present.level;
    TW.partialGraph.states[avantlastpos].selections = selsbackup;
    TW.partialGraph.states[avantlastpos].type = present.type; 
    TW.partialGraph.states[avantlastpos].opposites = present.opposites;
    TW.partialGraph.states[avantlastpos].categories = present.categories;//to_del
    TW.partialGraph.states[avantlastpos].categoriesDict = present.categoriesDict;//to_del

    TW.partialGraph.states[lastpos].setState({
        type: nextState,
        level: level,
        sels: Object.keys(selections).map(Number),
        oppos: []
    })
    TW.partialGraph.states[lastpos].categories = present.categories;//to_del
    TW.partialGraph.states[lastpos].categoriesDict = catDict;//to_del

    
    fa2enabled=true; TW.partialGraph.zoomTo(TW.partialGraph._core.width / 2, TW.partialGraph._core.height / 2, 0.8).draw();//.startForceAtlas2();
}

// Documentation Level: *****
function changeLevel() {
    var present = TW.partialGraph.states.slice(-1)[0]; // Last
    var past = TW.partialGraph.states.slice(-2)[0] // avant Last
    var lastpos = TW.partialGraph.states.length-1;
    var avantlastpos = lastpos-1;

    var level = present.level;
    var sels = present.selections;//[144, 384, 543]//TW.partialGraph.states.selections;
    var catDict = present.categoriesDict;

    var type_t0 = present.type;    
    var str_type_t0 = type_t0.map(Number).join("|")
    
    // [X|Y]-change (NOT operation over the received state [X\Y] )
    var type_t1 = []
    for(var i in type_t0) type_t1[i] = !type_t0[i]
    var str_type_t1 = type_t1.map(Number).join("|")

    // 
    var binSumCats = []
    for(var i in type_t0) 
        binSumCats[i] = (type_t0[i]||type_t1[i])
    var str_binSumCats = binSumCats.map(Number).join("|")

    var nextState = []
    if(level) nextState = type_t1;
    else nextState = binSumCats;
    if(!level && past!=false) {
        var sum_past = past.type.map(Number).reduce(function(a, b){return a+b;})
        if(sum_past>1) {
            nextState = past.type;
        }      
    }
    var str_nextState = nextState.map(Number).join("|")

    TW.partialGraph.emptyGraph();

    var voisinage = {}
    // Dictionaries of: selection+neighbors
    var nodes_2_colour = {}
    var edges_2_colour = {}
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
                    voisinage[ Number(t) ] = true;
            }
        }
    }
    for(var i in sels)
        nodes_2_colour[sels[i]]=true;



    var futurelevel = []

    if(present.level) { // [Change to Local] when level=Global(1)
        for(var i in nodes_2_colour)
            add1Elem(i)
        for(var i in edges_2_colour)
            add1Elem(i)

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
    } else { // [Change to Global] when level=Local(0)
        for(var n in TW.Nodes) {
            if(type_t0[catDict[TW.Nodes[n].type]]) 
                add1Elem(n)
        }
        for(var e in TW.Edges) {
            if(TW.Edges[e].categ==str_type_t0) 
                add1Elem(e)
        }
        futurelevel = true;
    }




    // Nodes Selection now:
    if(sels.length>0) {
        var SelInst = new SelectionEngine();
        SelInst.MultipleSelection2({
                    nodesDict:nodes_2_colour,
                    edgesDict:edges_2_colour
                });
        overNodes=true;
    }

    TW.partialGraph.states[avantlastpos] = {};
    TW.partialGraph.states[avantlastpos].level = present.level;
    TW.partialGraph.states[avantlastpos].selections = present.selections;
    TW.partialGraph.states[avantlastpos].type = present.type; 
    TW.partialGraph.states[avantlastpos].opposites = present.opposites;
    TW.partialGraph.states[avantlastpos].categories = present.categories;//to_del
    TW.partialGraph.states[avantlastpos].categoriesDict = present.categoriesDict;//to_del

    TW.partialGraph.states[lastpos].setState({
        type: present.type,
        level: futurelevel,
        sels: Object.keys(selections).map(Number),
        oppos: []
    })
    TW.partialGraph.states[lastpos].categories = present.categories;//to_del
    TW.partialGraph.states[lastpos].categoriesDict = catDict;//to_del

    fa2enabled=true; TW.partialGraph.zoomTo(TW.partialGraph._core.width / 2, TW.partialGraph._core.height / 2, 0.8).draw().startForceAtlas2();
}
//============================= </ NEW BUTTONS > =============================//



//=========================== < FILTERS-SLIDERS > ===========================//
//    Execution modes:
//	EdgeWeightFilter("#sliderAEdgeWeight", "label" , "nodes1", "weight");
//	EdgeWeightFilter("#sliderBEdgeWeight", "label" , "nodes2", "weight");
function EdgeWeightFilter(sliderDivID , type_attrb , type ,  criteria) {
	// if ($(sliderDivID).html()!="") {
	// 	pr("\t\t\t\t\t\t[[ algorithm not applied "+sliderDivID+" ]]")
	// 	return;
	// }

	// sliderDivID = "#sliderAEdgeWeight"
	// type = "nodes1"
	// type_attrb = "label"
	// criteria = "weight"

	// sliderDivID = "#sliderBNodeSize"
	// type = "NGram"
	// type_attrb = "type"
	// criteria = "size"

    if(TW.partialGraph._core.graph.edges.length<3) {
        $(sliderDivID).freshslider({
            range: true,
            step:1,
            value:[10, 60],
            enabled: false,
            onchange:function(low, high){
                console.log(low, high);
            }
        });
        return;
    }

    var filterparams = AlgorithmForSliders ( TW.Edges , type_attrb , type , criteria) //OK
    pr("EdgeWeightFilter: "+type)
    pr(filterparams)
    var steps = filterparams["steps"]
    var finalarray = filterparams["finalarray"]
    if(steps<3) {
        $(sliderDivID).freshslider({
            range: true,
            step:1,
            value:[10, 60],
            enabled: false,
            onchange:function(low, high){
                console.log(low, high);
            }
        });
        return;
    }
    

    var lastvalue=("0-"+(steps-1));

    pushFilterValue( sliderDivID , lastvalue )
    
    var present = TW.partialGraph.states.slice(-1)[0];

    //finished
    $(sliderDivID).freshslider({
        range: true,
        step: 1,
        min:0,
        bgcolor: (type=="nodes1")?"#27c470":"#FFA500" ,
        max:steps-1,
        value:[0,steps-1],
        onchange:function(low, high) {

            var filtervalue = low+"-"+high

            if(filtervalue!=lastFilter[sliderDivID]["last"]) {

                $.doTimeout(sliderDivID+"_"+lastFilter[sliderDivID]["last"]);

                $.doTimeout( sliderDivID+"_"+filtervalue,300,function () {

                    pr("\nprevious value "+lastvalue+" | current value "+filtervalue)

                    // [ Stopping FA2 ]
                    TW.partialGraph.stopForceAtlas2();
                    // [ / Stopping FA2 ]

                    var t0 = lastvalue.split("-")
                    var mint0=parseInt(t0[0]), maxt0=parseInt(t0[1]), mint1=parseInt(low), maxt1=parseInt(high);
                    var addflag = false;
                    var delflag = false;

                    var iterarr = []


                    if(mint0!=mint1) {
                        if(mint0<mint1) {
                            delflag = true;
                            pr("cotainferior   --||>--------||   a la derecha")
                        }
                        if(mint0>mint1) {
                            addflag = true;
                            pr("cotainferior   --<||--------||   a la izquierda")
                        }
                        iterarr = calc_range(mint0,mint1).sort(compareNumbers);
                    }

                    if(maxt0!=maxt1) {
                        if(maxt0<maxt1) {
                            addflag = true;
                            pr("cotasuperior   ||--------||>--   a la derecha")
                        }
                        if(maxt0>maxt1) {
                            delflag = true;
                            pr("cotasuperior   ||--------<||--   a la izquierda")
                        }
                        iterarr = calc_range(maxt0,maxt1).sort(compareNumbers);
                    }

                    // do the important stuff
                    for( var c in iterarr ) {
                        
                        var i = iterarr[c];
                        ids = finalarray[i]

                        if(i>=low && i<=high) {
                            if(addflag) {
                                // pr("adding "+ids.join())
                                for(var id in ids) {                            
                                    ID = ids[id]
                                    TW.Edges[ID].lock = false;

                                    if(present.level) {
                                        // pr("\tADD "+ID)
                                        // n = ID.split(";")
                                        // if(n.length>1)
                                        //     pr("\t\tsource:("+TW.Nodes[n[0]].x+","+TW.Nodes[n[0]].y+") ||| target:("+TW.Nodes[n[1]].x+","+TW.Nodes[n[1]].y+")")
                                        add1Elem(ID)
                                    } else {
                                        for (var n in TW.partialGraph._core.graph.nodesIndex) {
                                            sid = TW.Edges[ID].sourceID
                                            tid = TW.Edges[ID].targetID
                                            if (sid==n || tid==n) {
                                                if(isUndef(getn(sid))) unHide(sid)
                                                if(isUndef(getn(tid))) unHide(tid)
                                                add1Elem(ID)
                                                // pr("\tADD "+ID)
                                            }
                                        }
                                    }
                                    
                                }
                            }

                        } else {
                            if(delflag) {
                                // pr("deleting "+ids.join())
                                for(var id in ids) {
                                    ID = ids[id]
                                    if(!isUndef(gete(ID))) {
                                        TW.partialGraph.dropEdge(ID)
                                        TW.Edges[ID].lock = true;
                                        // pr("\tDEL "+ID)
                                        // n = ID.split(";")
                                        // if(n.length>1)
                                        //     pr("\t\tsource:("+TW.Nodes[n[0]].x+","+TW.Nodes[n[0]].y+") ||| target:("+TW.Nodes[n[1]].x+","+TW.Nodes[n[1]].y+")")
                                    }                                    
                                }
                            }
                        }
                    }

                    TW.partialGraph.refresh()
                    TW.partialGraph.draw()

                    // console.log("\t\tedgesfilter:")
                    // console.log("\t\t[ Starting FA2 ]")
                    // [ Starting FA2 ]
                    $.doTimeout(10,function(){
                        fa2enabled=true; TW.partialGraph.startForceAtlas2();
                        // $.doTimeout(10,function(){
                        //     TW.partialGraph.stopForceAtlas2();
                        // });
                    });
                    // [ / Starting FA2 ]

                    lastvalue = filtervalue;
                });
                pushFilterValue( sliderDivID , filtervalue )
            }
            
        }
    });    
}

//   Execution modes:
// NodeWeightFilter ( "#sliderANodeWeight" ,  "Document" , "type" , "size") 
// NodeWeightFilter ( "#sliderBNodeWeight" ,  "NGram" , "type" , "size") 
function NodeWeightFilter( categories ,  sliderDivID , type_attrb , type ,  criteria) {

	// if ($(sliderDivID).html()!="") {
	// 	pr("\t\t\t\t\t\t[[ algorithm not applied "+sliderDivID+" ]]")
	// 	return;
	// }
    
	// sliderDivID = "#sliderAEdgeWeight"
	// type = "nodes1"
	// type_attrb = "label"
	// criteria = "weight"

	// sliderDivID = "#sliderBNodeSize"
	// type = "NGram"
	// type_attrb = "type"
	// criteria = "size"

    if(TW.partialGraph._core.graph.nodes.length<3) {

        $(sliderDivID).freshslider({
            range: true,
            step:1,
            value:[10, 60],
            enabled: false,
            onchange:function(low, high){
                console.log(low, high);
            }
        });

        return;
    }

    var filterparams = AlgorithmForSliders ( TW.Nodes , type , type_attrb , criteria)
    pr("NodeWeightFilter: "+type)
    pr(filterparams)
    
    var steps = filterparams["steps"]
    var finalarray = filterparams["finalarray"]
    if(steps<3) {
        $(sliderDivID).freshslider({
            range: true,
            step:1,
            value:[10, 60],
            enabled: false,
            onchange:function(low, high){
                console.log(low, high);
            }
        });
        return;
    }
    
    //finished
    $(sliderDivID).freshslider({
        range: true,
        step: 1,
        min:0,
        max:steps-1,
        bgcolor:( type_attrb==categories[0] )?"#27c470":"#FFA500" ,
        value:[0,steps-1],
        onchange:function(low, high){    
            var filtervalue = low+"-"+high
            
            if(filtervalue!=lastFilter[sliderDivID]["last"]) {
                if(lastFilter[sliderDivID]["orig"]=="-") {
                    pushFilterValue( sliderDivID , filtervalue )
                    return false
                }

                // [ Stopping FA2 ]
                TW.partialGraph.stopForceAtlas2();
                // [ / Stopping FA2 ]

                for(var i in finalarray) {
                    ids = finalarray[i]
                    if(i>=low && i<=high){
                        for(var id in ids) {
                            ID = ids[id]
                            TW.Nodes[ID].lock = false;
                            if(TW.partialGraph._core.graph.nodesIndex[ID])
                                TW.partialGraph._core.graph.nodesIndex[ID].hidden = false;
                        }
                    } else {
                        for(var id in ids) {
                            ID = ids[id]
                            TW.Nodes[ID].lock = true;
                            if(TW.partialGraph._core.graph.nodesIndex[ID])
                                TW.partialGraph._core.graph.nodesIndex[ID].hidden = true;
                        }                     
                    }
                }
                pushFilterValue(sliderDivID,filtervalue)

                TW.partialGraph.refresh()
                TW.partialGraph.draw()

                // [ Starting FA2 ]
                $.doTimeout(10,function(){
                    fa2enabled=true; TW.partialGraph.startForceAtlas2();
                    // $.doTimeout(10,function(){
                    //     TW.partialGraph.stopForceAtlas2();
                    // });
                });
                // [ / Starting FA2 ]
            }
            
        }
    });
}

function getGraphElement(elem) {
    if(elem.split(";").length==1) return TW.partialGraph._core.graph.nodesIndex[elem];
    else return TW.partialGraph._core.graph.edgesIndex[elem]
}
//   Execution modes:
// AlgorithmForSliders ( TW.partialGraph._core.graph.edges , "label" , "nodes1" , "weight") 
// AlgorithmForSliders ( TW.partialGraph._core.graph.edges , "label" , "nodes2" , "weight") 
// AlgorithmForSliders ( TW.partialGraph._core.graph.nodes , "type" ,  "Document" ,  "size") 
// AlgorithmForSliders ( TW.partialGraph._core.graph.nodes , "type" ,  "NGram" ,  "size") 
function AlgorithmForSliders( elements , type_attrb , type , criteria) {
	// //  ( 1 )
    // // get visible sigma nodes|edges
    if(isUndef(elements)) return {"steps":0 , "finalarray":[]};
    
    var elems = [];
    for(var e in elements) {
        if( elements[e][type_attrb]==type ) {
            if(getGraphElement(e)) {
                elems.push(elements[e])
            } 
        }
    }
    if(elems.length==0)  
        return { "steps":0 , "finalarray":[] };

    // identifying if you received nodes or edges
    var edgeflag = ( !isNaN(elems.slice(-1)[0].id) || elems.slice(-1)[0].id.split(";").length>1)? true : false;
    // //  ( 2 )
    // // extract [ "edgeID" : edgeWEIGHT ] | [ "nodeID" : nodeSIZE ] 
    // // and save this into edges_weight | nodes_size
    var elem_attrb=[]
    for (var i in elems) {
        e = elems[i]
        id = e.id
        elem_attrb[id]=e[criteria]
        // pr(id+"\t:\t"+e[criteria])
    }
    // pr("{ id : size|weight } ")
    // pr(elem_attrb)

    // //  ( 3 )
    // // order dict edges_weight by edge weight | nodes_size by node size
    var result = ArraySortByValue(elem_attrb, function(a,b){
        return a-b
        //ASCENDENT
    });
    // pr(result.length)
    // // ( 4 )
    // // printing ordered ASC by weigth
    // for (var i in result) {
    //     r = result[i]
    //     idid = r.key
    //     elemattrb = r.value
    //     pr(idid+"\t:\t"+elemattrb)
    //     // e = result[i]
    //     // pr(e[criteria])
    // }
    var N = result.length
    // var magnitude = (""+N).length //order of magnitude of edges|nodes
    // var exponent = magnitude - 1
    // var steps = Math.pow(10,exponent) //    #(10 ^ magnit-1) steps
    // var stepsize = Math.round(N/steps)// ~~(visibledges / #steps)


    //var roundsqrtN = Math.round( Math.sqrt( N ) );
    var steps =  Math.round( Math.sqrt( N ) );
    var stepsize = Math.round( N / steps );

    // pr("-----------------------------------")
    // pr("number of visible nodes|edges: "+N); 
    
    // pr("number of steps : "+steps)
    // pr("size of one step : "+stepsize)
    // pr("-----------------------------------")
    

    var finalarray = []
    var counter=0
    for(var i = 0; i < steps*2; i++) {
        // pr(i)
        var IDs = []
        for(var j = 0; j < stepsize; j++)  {
            if(!isUndef(result[counter])) {
                k = result[counter].key
                // w = result[counter].value
                // pr("\t["+counter+"] : "+w)
                IDs.push(k)
            }
            counter++;
        }
        if(IDs.length==0) break;
        
        finalarray[i] = (edgeflag)? IDs : IDs.map(Number);
    }
    // pr("finalarray: ")
    return {"steps":finalarray.length,"finalarray":finalarray}
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
