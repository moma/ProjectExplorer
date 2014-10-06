
//for socialgraph
function showMeSomeLabels(N){
        /*======= Show some labels at the beginning =======*/
        minIn=50,
        maxIn=0,
        minOut=50,
        maxOut=0;        
        partialGraph.iterNodes(function(n){
            if(n.hidden==false){
                if(parseInt(n.inDegree) < minIn) minIn= n.inDegree;
                if(parseInt(n.inDegree) > maxIn) maxIn= n.inDegree;
                if(parseInt(n.outDegree) < minOut) minOut= n.outDegree;
                if(parseInt(n.outDegree) > maxOut) maxOut= n.outDegree;
            }
        });
        counter=0;
        n = getVisibleNodes();
        for(i=0;i<n.length;i++) {
            if(n[i].hidden==false){
                if(n[i].inDegree==minIn && n[i].forceLabel==false) {
                    n[i].forceLabel=true;
                    counter++;
                }
                if(n[i].inDegree==maxIn && n[i].forceLabel==false) {
                    n[i].forceLabel=true;
                    counter++;
                }
                if(n[i].outDegree==minOut && n[i].forceLabel==false) {
                    n[i].forceLabel=true;
                    counter++;
                }
                if(n[i].outDegree==maxOut && n[i].forceLabel==false) {
                    n[i].forceLabel=true;
                    counter++;
                }
                if(counter==N) break;
            }
        }
        partialGraph.draw()
        /*======= Show some labels at the beginning =======*/
}

function getnodes(){
    return partialGraph._core.graph.nodes;
}

function getnodesIndex(){
    return partialGraph._core.graph.nodesIndex;
}

function getedges(){
    return partialGraph._core.graph.edges;
}

function getedgesIndex(){
    return partialGraph._core.graph.edgesIndex;
}

function getVisibleEdges() {
	return partialGraph._core.graph.edges.filter(function(e) {
                return !e['hidden'];
    });
}

function getVisibleNodes() {
    return partialGraph._core.graph.nodes.filter(function(n) {
                return !n['hidden'];
    });
}


function getNodesByAtt(att) {
    return partialGraph._core.graph.nodes.filter(function(n) {
                return n['type']==att;
    });
}

function getn(id){
    return partialGraph._core.graph.nodesIndex[id];
}

function gete(id){
    return partialGraph._core.graph.edgesIndex[id];
}


function find(label){
    var results=[];
    var nds=getnodesIndex();
    label=label.toLowerCase()
    for(var i in nds){
        var n=nds[i];
        if(n.hidden==false){
        	var possiblematch=n.label.toLowerCase()
            if (possiblematch.indexOf(label)!==-1) {
                results.push(n);
            }  
        }
    }
    return results;
}

function exactfind(label) {
    nds=getnodesIndex();
    for(var i in nds){
        n=nds[i];
        if(!n.hidden){
            if (n.label==label) {
                return n;
            }
        }
    }
    return null;
}

//to general utils (not used btw)
function cloneObject(source) {
    for (i in source) {
        if (typeof source[i] == 'source') {
            this[i] = new cloneObject(source[i]);
        }
        else{
            this[i] = source[i];
	}
    }
}

function getSelections(){    
        params=[];
        for(var i in selections){
            params.push(Nodes[i].label);
        }
        return params;
}


//This receives an array not a dict!
//  i added an excpt... why
function getNeighs(sels,arr){ 
    neighDict={};
    for(var i in sels) {
        id = sels[i]
        if(!isUndef(arr[id])) {
            A=arr[id].neighbours;
            for(var j in A){
                neighDict[A[j]]=1
            }
            neighDict[id]=1;
        }
    }    
    return Object.keys(neighDict);
}//It returns an array not a dict!


//to general utils
function getArrSubkeys(arr,id) {
    var result = []
    for(var i in arr) {
        result.push(arr[i][id])
    }
    return result;
}

//to general utils
function getClientTime(){
    var totalSec = new Date().getTime() / 1000;
    var d = new Date();
    var hours = d.getHours();
    var minutes = parseInt( totalSec / 60 ) % 60;
    var seconds = (totalSec % 60).toFixed(4);
    var result = (hours < 10 ? "0" + hours : hours) + ":" + (minutes < 10 ? "0" + minutes : minutes) + ":" + (seconds  < 10 ? "0" + seconds : seconds);
    return result;
}

function getCountries(){
    var nodes = getVisibleNodes();
    var countries = {}
    pr("in getCountries")
    for(var i in nodes) {
        // pr(i)
        // pr(nodes[i].id+" : "+nodes[i].attr["CC"]+" , "+nodes[i].attr["ACR"])
        if (nodes[i].attr["CC"]!="-")
            countries[nodes[i].attr["CC"]]=1
        // pr("")
    }
    return Object.keys(countries);
}


function getAcronyms() {
    var nodes = getVisibleNodes();
    var acrs = {}
    pr("in getAcronyms")
    for(var i in nodes) {
        // pr(i)
        // pr(nodes[i].id+" : "+nodes[i].attr["CC"]+" , "+nodes[i].attr["ACR"])
        if (nodes[i].attr["ACR"]!="-")
            acrs[nodes[i].attr["ACR"]]=1
        // pr("")
    }
    return ( Object.keys(acrs) );
}

function clustersBy(daclass) {
    if (daclass=="country") {

        CCs = getCountries()
        CCxID = {}
        for(var i in CCs) { 
            code = CCs[i]
            CCxID[code]=parseInt(i);
        }
        pr(CCxID)
        
        var nodes = getVisibleNodes();
        for(var i in nodes) {
            nodes[i].color = Nodes[ nodes[i].id ].color;            
        }

        colorList.sort(function(){ return Math.random()-0.5; }); 
        // pr(colorList);
        for(var i in nodes) {
            cc = nodes[i].attr["CC"]
            if( !isUndef( cc ) && cc!="-" ) {
                nodes[i].color = colorList[ CCxID[cc] ];
            }
        }
    }

    if (daclass=="acronym") {

        CCs = getAcronyms()
        CCxID = {}
        for(var i in CCs) { 
            code = CCs[i]
            CCxID[code]=parseInt(i);
        }
        pr(CCxID)
        
        var nodes = getVisibleNodes();
        for(var i in nodes) {
            nodes[i].color = Nodes[ nodes[i].id ].color;            
        }

        colorList.sort(function(){ return Math.random()-0.5; }); 
        // pr(colorList);
        for(var i in nodes) {
            cc = nodes[i].attr["ACR"]
            if( !isUndef( cc ) && cc!="-" ) {
                nodes[i].color = colorList[ CCxID[cc] ];
            }
        }

    }


    if (daclass=="default") {
        var nodes = getVisibleNodes();
        for(var i in nodes) {
            nodes[i].color = Nodes[ nodes[i].id ].color;            
        }
    }

    partialGraph.refresh()
    partialGraph.draw();
}

function hex2rga(sent_hex) {
    result = []
    hex = ( sent_hex.charAt(0) === "#" ? sent_hex.substr(1) : sent_hex );
    // check if 6 letters are provided
    if (hex.length === 6) {
        result = calculateFull(hex);
        return result;
    }
    else if (hex.length === 3) {
        result = calculatePartial(hex);
        return result;
    }
}

function calculateFull(hex) {
    var r = parseInt(hex.substring(0, 2), 16);
    var g = parseInt(hex.substring(2, 4), 16);
    var b = parseInt(hex.substring(4, 6), 16);
    return [r,g,b];
}


// function for calculating 3 letters hex value
function calculatePartial(hex) {
    var r = parseInt(hex.substring(0, 1) + hex.substring(0, 1), 16);
    var g = parseInt(hex.substring(1, 2) + hex.substring(1, 2), 16);
    var b = parseInt(hex.substring(2, 3) + hex.substring(2, 3), 16);
    return [r,g,b];
}