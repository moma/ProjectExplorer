
function pr(msg) {
    console.log(msg);
}

function isUndef(variable){
    if(typeof(variable)==="undefined") return true;
    else return false;
}

$.fn.toggleClick = function(){
        methods = arguments, // store the passed arguments for future reference
            count = methods.length; // cache the number of methods 

        //use return this to maintain jQuery chainability
        return this.each(function(i, item){
            // for each element you bind to
            index = 0; // create a local counter for that element
            $(item).click(function(){ // bind a click handler to that element
                return methods[index++ % count].apply(this,arguments); // that when called will apply the 'index'th method to that element
                // the index % count means that we constrain our iterator between 0 and (count-1)
            });
        });
};

getUrlParam = (function () {
    var get = {
        push:function (key,value){
            var cur = this[key];
            if (cur.isArray){
                this[key].push(value);
            }else {
                this[key] = [];
                this[key].push(cur);
                this[key].push(value);
            }
        }
    },
    search = document.location.search,
    decode = function (s,boo) {
        var a = decodeURIComponent(s.split("+").join(" "));
        return boo? a.replace(/\s+/g,''):a;
    };
    search.replace(/\??(?:([^=]+)=([^&]*)&?)/g, function (a,b,c) {
        if (get[decode(b,true)]){
            get.push(decode(b,true),decode(c));
        }else {
            get[decode(b,true)] = decode(c);
        }
    });
    return get;
})();


function ArraySortByValue(array, sortFunc){
    var tmp = [];
    oposMAX=0;
    for (var k in array) {
        if (array.hasOwnProperty(k)) {
            tmp.push({
                key: k, 
                value:  array[k]
            });
            if((array[k]) > oposMAX) oposMAX= array[k];
        }
    }

    tmp.sort(function(o1, o2) {
        return sortFunc(o1.value, o2.value);
    });   
    return tmp;      
}

function ArraySortByKey(array, sortFunc){
    var tmp = [];
    for (var k in array) {
        if (array.hasOwnProperty(k)) {
            tmp.push({
                key: k, 
                value:  array[k]
            });
        }
    }

    tmp.sort(function(o1, o2) {
        return sortFunc(o1.key, o2.key);
    });   
    return tmp;      
}
    
function is_empty(obj) {
    // Assume if it has a length property with a non-zero value
    // that that property is correct.
    if (obj.length && obj.length > 0)    return false;
    if (obj.length && obj.length === 0)  return true;

    for (var key in obj) {
        if (hasOwnProperty.call(obj, key))    return false;
    }
    return true;
}

function returnBaseUrl(){
    origin = window.location.origin;
    nameOfHtml=window.location.pathname.substring(window.location.pathname.lastIndexOf('/')+1);
    pathname = window.location.pathname.replace(nameOfHtml,"");
    return origin+pathname+twjs;
}

function cancelSelection (fromTagCloud) {
    pr("\t***in cancelSelection");
    highlightSelectedNodes(false); //Unselect the selected ones :D
    opossites = [];
    selections = [];
    //selections.length = 0;
    selections.splice(0, selections.length);
    partialGraph.refresh();
    
    
    //Nodes colors go back to normal
    overNodes=false;
    e = partialGraph._core.graph.edges;
    for(i=0;i<e.length;i++){
            e[i].color = e[i].attr['grey'] ? e[i].attr['true_color'] : e[i].color;
            e[i].attr['grey'] = 0;
    }
    partialGraph.draw(2,1,2);
                
    partialGraph.iterNodes(function(n){
            n.active=false;
            n.color = n.attr['grey'] ? n.attr['true_color'] : n.color;
            n.attr['grey'] = 0;
    }).draw(2,1,2);
    //Nodes colors go back to normal
    changeButton("unselectNodes");
    
    if(fromTagCloud==false){
        $("#names").html(""); 
        $("#topPapers").html(""); $("#topPapers").hide();
        $("#opossiteNodes").html("");
        $("#information").html("");
        $("#searchinput").val("");
        $("#switchbutton").hide();
        $("#tips").html(getTips());
    }   
    for(var i in deselections){
        partialGraph._core.graph.nodesIndex[i].forceLabel=false;
        partialGraph._core.graph.nodesIndex[i].neighbour=false;
    }
    deselections={};
    partialGraph.draw();
}

function highlightSelectedNodes(flag){ 
    pr("\t***methods.js:highlightSelectedNodes(flag)"+flag+" selEmpty:"+is_empty(selections))
    if(!is_empty(selections)){          
        for(var i in selections) {
            if(Nodes[i].type==catSoc && swclickActual=="social"){
                node = partialGraph._core.graph.nodesIndex[i];
                node.active = flag;
            }
            else if(Nodes[i].type==catSem && swclickActual=="semantic") {
                node = partialGraph._core.graph.nodesIndex[i];
                node.active = flag;
            }
            else if(swclickActual=="sociosemantic") {
                node = partialGraph._core.graph.nodesIndex[i];
                node.active = flag;
            }
            else break;        
        }
        
    }
}
function alertCheckBox(eventCheck){    
    if(!isUndef(eventCheck.checked)) checkBox=eventCheck.checked;
}

function pushSWClick(arg){
    swclickPrev = swclickActual;
    swclickActual = arg;
}

function selection(currentNode){
    pr("\t***in selection()");
    if(checkBox==false && cursor_size==0) {
        highlightSelectedNodes(false);
        opossites = [];
        selections = [];
        partialGraph.refresh();
    }    
    if(socsemFlag==false){
        if(isUndef(selections[currentNode.id])){
            selections[currentNode.id] = 1;
            if(Nodes[currentNode.id].type==catSoc && !isUndef(bipartiteD2N[currentNode.id])){
                for(i=0;i<bipartiteD2N[currentNode.id].neighbours.length;i++) {
                    if(isUndef(opossites[bipartiteD2N[currentNode.id].neighbours[i]])){
                        opossites[bipartiteD2N[currentNode.id].neighbours[i]]=1;
                    }
                    else {
                        opossites[bipartiteD2N[currentNode.id].neighbours[i]]++;
                    }
                }
            }  
            if(Nodes[currentNode.id].type==catSem){
                if(!isUndef(bipartiteN2D[currentNode.id])){
                    for(i=0;i<bipartiteN2D[currentNode.id].neighbours.length;i++) {
                        if(isUndef(opossites[bipartiteN2D[currentNode.id].neighbours[i]])){
                            opossites[bipartiteN2D[currentNode.id].neighbours[i]]=1;
                        }
                        else opossites[bipartiteN2D[currentNode.id].neighbours[i]]++;
                
                    }
                }
            }
            currentNode.active=true; 
        }
        else {
            delete selections[currentNode.id];        
            markAsSelected(currentNode.id,false);
            if(Nodes[currentNode.id].type==catSoc){
                for(i=0;i<bipartiteD2N[currentNode.id].neighbours.length;i++) {
                    if(isUndef(opossites[bipartiteD2N[currentNode.id].neighbours[i]])) {
                        console.log("lala");
                    }
                    if(opossites[bipartiteD2N[currentNode.id].neighbours[i]]==1){
                        delete opossites[bipartiteD2N[currentNode.id].neighbours[i]];
                    }
                    if(opossites[bipartiteD2N[currentNode.id].neighbours[i]]>1){
                        opossites[bipartiteD2N[currentNode.id].neighbours[i]]--;
                    }
                }
            }    
            if(Nodes[currentNode.id].type==catSem){
                for(i=0;i<bipartiteN2D[currentNode.id].neighbours.length;i++) {
                    if(isUndef(opossites[bipartiteN2D[currentNode.id].neighbours[i]])) {
                        console.log("lala");
                    }
                    if(opossites[bipartiteN2D[currentNode.id].neighbours[i]]==1){
                        delete opossites[bipartiteN2D[currentNode.id].neighbours[i]];
                    }
                    if(opossites[bipartiteN2D[currentNode.id].neighbours[i]]>1){
                        opossites[bipartiteN2D[currentNode.id].neighbours[i]]--;
                    }
                }
            }
        
            currentNode.active=false;
        }
    }
    
    /* ============================================================================================== */
    
    else {
        if(isUndef(selections[currentNode.id])){
            selections[currentNode.id] = 1;
        
            if(Nodes[currentNode.id].type==catSoc){
                for(i=0;i<bipartiteD2N[currentNode.id].neighbours.length;i++) {
                    //opossitesbipartiteD2N[currentNode.id].neighbours[i]];
                    if(isUndef(opossites[bipartiteD2N[currentNode.id].neighbours[i].toString()])){
                        opossites[bipartiteD2N[currentNode.id].neighbours[i]]=1;
                    }
                    else {
                        opossites[bipartiteD2N[currentNode.id].neighbours[i]]++;
                    }
                }
            }    
            if(Nodes[currentNode.id].type==catSem){
                for(i=0;i<nodes2[currentNode.id].neighbours.length;i++) {
                    if(isUndef(opossites[nodes2[currentNode.id].neighbours[i]])){
                        opossites[nodes2[currentNode.id].neighbours[i]]=1;
                    }
                    else opossites[nodes2[currentNode.id].neighbours[i]]++;
                
                }
            }
        
            currentNode.active=true;
        }
        else {
            delete selections[currentNode.id];
            markAsSelected(currentNode.id,false);
            
            if(Nodes[currentNode.id].type==catSoc){
                for(i=0;i<bipartiteD2N[currentNode.id].neighbours.length;i++) {
                    if(isUndef(opossites[bipartiteD2N[currentNode.id].neighbours[i]])) {
                        console.log("lala");
                    }
                    if(opossites[bipartiteD2N[currentNode.id].neighbours[i]]==1){
                        delete opossites[bipartiteD2N[currentNode.id].neighbours[i]];
                    }
                    if(opossites[bipartiteD2N[currentNode.id].neighbours[i]]>1){
                        opossites[bipartiteD2N[currentNode.id].neighbours[i]]--;
                    }
                }
            }    
            if(Nodes[currentNode.id].type==catSem){
                for(i=0;i<nodes2[currentNode.id].neighbours.length;i++) {
                    if(isUndef(opossites[nodes2[currentNode.id].neighbours[i]])) {
                        console.log("lala");
                    }
                    if(opossites[nodes2[currentNode.id].neighbours[i]]==1){
                        delete opossites[nodes2[currentNode.id].neighbours[i]];
                    }
                    if(opossites[nodes2[currentNode.id].neighbours[i]]>1){
                        opossites[nodes2[currentNode.id].neighbours[i]]--;
                    }
                }
            }
        
            currentNode.active=false;
        }
    }
    partialGraph.zoomTo(partialGraph._core.width / 2, partialGraph._core.height / 2, 0.8);
    partialGraph.refresh();
}

function getOpossitesNodes(node_id, entireNode) {
    pr("\tin getOpossitesNodes");
    node="";    
    if(entireNode==true) node=node_id;
    else node = partialGraph._core.graph.nodesIndex[node_id];
    if(socsemFlag==true) {
        pr("wtf is this -> if(socsemFlag==true) {");
        cancelSelection(false);
        socsemFlag=false;
    }
    
    if (!node) return null;
    //selection(node);
    
    if(categoriesIndex.length==1) selectionUni(node);
    if(categoriesIndex.length==2) selection(node);
    
    opos = ArraySortByValue(opossites, function(a,b){
        return b-a
    });
//        console.log("WOLOLO WOLOLO WOLOLO WOLOLO");
//        $.ajax({
//            type: 'GET',
//            url: 'http://localhost/getJsonFromUrl/tagcloud.php',
//            data: "url="+JSON.stringify(opos),
//            //contentType: "application/json",
//            //dataType: 'json',
//            success : function(data){ 
//                console.log(data);
//            },
//            error: function(){ 
//                pr("Page Not found.");
//            }
//        });
}

function updateLeftPanel(){
    pr("\t ** in updateLeftPanel() ** ");
    names='';
    opossitesNodes='';
    information='';
    
    counter=0;
    names+='<div id="selectionsBox">';
    names += '<h4>';
    for(var i in selections){
        if(counter==4){
            names += '<h4>[...]</h4>';
            break;
        }
        names += Nodes[i].label+', ';
        counter++;
    }
    names += '</h4>';
    names=names.replace(", </h4>","</h4>");
    names=names.replace(", <h4>","<h4>");
    names+='</div>';
    
    
    js2='\');"';
    if(swclickActual=="social") {
        opossitesNodes+= '<br><h4>Keywords: </h4>';
        opossitesNodes+='<div id="opossitesBox">';/*tochange*/
        js1='onclick="edgesTF=false;cancelSelection(true);graphNGrams(\'';
        for(var i in opos){
            if(i==22){
                opossitesNodes += '<li>[...]</li>';
                break;
            }
            //fontSize=(opos[i].value/maxFont)*(maxFont-minFont)+minFont;
            if(oposMAX==1){
                fontSize=desirableTagCloudFont_MIN;
            }
            else {
                fontSize=desirableTagCloudFont_MIN+(opos[i].value-1)*((desirableTagCloudFont_MAX-desirableTagCloudFont_MIN)/(oposMAX-1));
            }
            if(!isUndef(nodes2[opos[i].key])){
                opossitesNodes += '<span style="display:inline-block;font-size:'+fontSize+'px;cursor: pointer;" '
                +js1+opos[i].key+js2+'>' + nodes2[opos[i].key].label+ '</span>,&nbsp;&nbsp;';
            }

        }
        opossitesNodes += '</div>';
        
        getTopPapers("social");

        
        information += '<br><h4>Information:</h4>';
        information += '<ul>';
            
        for(var i in selections){
            information += '<li><b>' + Nodes[i].label + '</b></li>';
            if(Nodes[i].htmlCont==""){
                information += '<li>' + Nodes[i].attributes["level"] + '</li>';
            }
            else {
                information += '<li>' + $("<div/>").html(Nodes[i].htmlCont).text() + '</li>';
            }
            information += '</ul><br>';
        }
    }
    
    if(swclickActual=="semantic") {       
        opossitesNodes+= '<br><h4>Scholars: </h4>';
        opossitesNodes+='<div id="opossitesBox">';
        js1='onclick="edgesTF=false;cancelSelection(true);graphDocs(\'';
        
        for(var i in opos){
            if(i==22){
                opossitesNodes += '<li>[...]</li>';
                break;
            }
            //fontSize=(opos[i].value/maxFont)*(maxFont-minFont)+minFont;
            if(oposMAX==1){
                fontSize=desirableTagCloudFont_MIN;
            }
            else {
                fontSize=desirableTagCloudFont_MIN+(opos[i].value-1)*((desirableTagCloudFont_MAX-desirableTagCloudFont_MIN)/(oposMAX-1));
            }
            if(!isUndef(nodes1[opos[i].key])){
                opossitesNodes += '<span style="display:inline-block;font-size:'+fontSize+'px; cursor: pointer;" '
                +js1+opos[i].key+js2+'>' + nodes1[opos[i].key].label+ '</span>,&nbsp;&nbsp;';
            }

        }
        opossitesNodes+='</div>';
        
        
        getTopPapers("semantic");

        
        information += '<br><h4>Information:</h4>';
        information += '<ul>';
            
        for(var i in selections){
            information += '<li><b>' + Nodes[i].label + '</b></li>';
            google='<a href=http://www.google.com/#hl=en&source=hp&q=%20'+Nodes[i].label.replace(" ","+")+'%20><img src="'+twjs+'img/google.png"></img></a>';
            wiki = '<a href=http://en.wikipedia.org/wiki/'+Nodes[i].label.replace(" ","_")+'><img src="'+twjs+'img/wikipedia.png"></img></a>';
            flickr= '<a href=http://www.flickr.com/search/?w=all&q='+Nodes[i].label.replace(" ","+")+'><img src="'+twjs+'img/flickr.png"></img></a>';
            information += '<li>'+google+"&nbsp;"+wiki+"&nbsp;"+flickr+'</li><br>';
            
        }
        information += '</ul><br>';
    }
    
    
    if(swclickActual=="sociosemantic") {
        pr("\t***updLefPan: sociosem case")
        fullurl = returnBaseUrl()+"img/trans/";
        if (swclickPrev=="social"){
            
            pr("\t\t\tI've to show scholars");    
            
            
            counter=0;
            names ='<div id="selectionsBox">';
            names += '<h4>';
            for(var i in selections){
                if(Nodes[i].type==catSem){
                    if(counter==4){
                        names += '<h4>[...]</h4>';
                        break;
                    }
                    names += Nodes[i].label+', ';
                    counter++;
                }
            }
            names += '</h4>';
            names=names.replace(", </h4>","</h4>");
            names=names.replace(", <h4>","<h4>");
            names+='</div>';
            
            opossitesNodes+= '<br><h4>Scholars: </h4>';
            opossitesNodes+='<div id="opossitesBox">';
            js1='onclick="edgesTF=false;cancelSelection(true);graphDocs(\'';
            opos_aux = opos.filter(function(n) {
                             return (Nodes[n['key']].type==catSoc) ? n['key'] : null;
                        });        
                        
            for(var i in opos_aux){
                if(i==22){
                    opossitesNodes += '<li>[...]</li>';
                    break;
                }
                //fontSize=(opos[i].value/maxFont)*(maxFont-minFont)+minFont;
                if(oposMAX==1){
                    fontSize=desirableTagCloudFont_MIN;
                }
                else {
                    fontSize=desirableTagCloudFont_MIN+(opos_aux[i].value-1)*((desirableTagCloudFont_MAX-desirableTagCloudFont_MIN)/(oposMAX-1));
                }
                if(!isUndef(nodes1[opos_aux[i].key])){
                    opossitesNodes += '<span style="display:inline-block;font-size:'+fontSize+'px; cursor: pointer;" '
                    +js1+opos_aux[i].key+js2+'>' + nodes1[opos_aux[i].key].label+ '</span>,&nbsp;&nbsp;';
                }
            }
            opossitesNodes+='</div>';
            information += '<br><h4>Information:</h4>';
            information += '<ul>';

            for(var i in selections){
                if(Nodes[i].type==catSem){
                    information += '<li><b>' + Nodes[i].label + '</b></li>';
                    google='<a href=http://www.google.com/#hl=en&source=hp&q=%20'+Nodes[i].label.replace(" ","+")+'%20><img src="'+twjs+'img/google.png"></img></a>';
                    wiki = '<a href=http://en.wikipedia.org/wiki/'+Nodes[i].label.replace(" ","_")+'><img src="'+twjs+'img/wikipedia.png"></img></a>';
                    flickr= '<a href=http://www.flickr.com/search/?w=all&q='+Nodes[i].label.replace(" ","+")+'><img src="'+twjs+'img/flickr.png"></img></a>';
                    information += '<li>'+google+"&nbsp;"+wiki+"&nbsp;"+flickr+'</li><br>';
                  }
           }
            information += '</ul><br>';
            
            
        } else {
            pr("\t\t\tI've to show keywords");
  
            counter=0;
            names ='<div id="selectionsBox">';
            names += '<h4>';
            for(var i in selections){
                if(Nodes[i].type==catSoc){
                    if(counter==4){
                        names += '<h4>[...]</h4>';
                        break;
                    }
                    names += Nodes[i].label+', ';
                    counter++;
                }
            }
            names += '</h4>';
            names=names.replace(", </h4>","</h4>");
            names=names.replace(", <h4>","<h4>");
            names+='</div>';           
            
            opossitesNodes+= '<br><h4>Keywords: </h4>';
            opossitesNodes+='<div id="opossitesBox">';/*tochange*/
            js1='onclick="edgesTF=false;cancelSelection(true);graphNGrams(\'';
            
                      
            opos_aux = opos.filter(function(n) {
                            return (Nodes[n['key']].type==catSem) ? n['key'] : null;
                        }); 
            for(var i in opos_aux){
                if(i==22){
                    opossitesNodes += '<li>[...]</li>';
                    break;
                }
                //fontSize=(opos[i].value/maxFont)*(maxFont-minFont)+minFont;
                if(oposMAX==1){
                    fontSize=desirableTagCloudFont_MIN;
                }
                else {
                    fontSize=desirableTagCloudFont_MIN+(opos_aux[i].value-1)*((desirableTagCloudFont_MAX-desirableTagCloudFont_MIN)/(oposMAX-1));
                }
                if(!isUndef(nodes2[opos_aux[i].key])){
                    opossitesNodes += '<span style="display:inline-block;font-size:'+fontSize+'px;cursor: pointer;" '
                    +js1+opos_aux[i].key+js2+'>' + nodes2[opos_aux[i].key].label+ '</span>,&nbsp;&nbsp;';
                }

            }
            opossitesNodes += '</div>';

            information += '<br><h4>Information:</h4>';
            information += '<ul>';

            for(var i in selections){                
                if(Nodes[i].type==catSoc){
                    information += '<li><b>' + Nodes[i].label + '</b></li>';
                    if(Nodes[i].htmlCont==""){
                        information += '<li>' + Nodes[i].attributes["level"] + '</li>';
                    }
                    else {
                        information += '<li>' + $("<div/>").html(Nodes[i].htmlCont).text() + '</li>';
                    }
                    information += '</ul><br>';
                }
            }
        }
    }
    
    $("#names").html(names); //Information extracted, just added
    $("#opossiteNodes").html(opossitesNodes); //Information extracted, just added
    $("#information").html(information); //Information extracted, just added
    $("#tips").html("");
     $("#topPapers").show();
        
    /***** The animation *****/
    _cG = $("#leftcolumn");
    _cG.animate({
        "left" : "0px"
    }, function() {
        $("#aUnfold").attr("class","leftarrow");
        $("#zonecentre").css({
            left: _cG.width() + "px"
        });
    });
}

function graphNGrams(node_id){   
    pr("\tin graphNGrams");/**/
    fullurl = returnBaseUrl()+"img/trans/";
    document.getElementById("viewType").src=fullurl+"status_meso_view.png";
    document.getElementById("socio").src=fullurl+"inactive_scholars.png";
    document.getElementById("semantic").src=fullurl+"active_tags.png";
    document.getElementById("sociosemantic").src=fullurl+"inactive_sociosem.png";
    document.getElementById("switch").src=fullurl+"graph_macro.png";
    
    
    console.log("in graphNGrams, nodae_id: "+node_id);
    if(Nodes[node_id].type==catSem) {
        labels = [];
        hideEverything() 
        //partialGraph.stopForceAtlas2();
        
        unHide(node_id);

        for(i=0;i<nodes2[node_id].neighbours.length;i++) {
            unHide(nodes2[node_id].neighbours[i]);  
        }  
        
        /* ALGORITMO ESTRELLA*/
        existingNodes = partialGraph._core.graph.nodes.filter(function(n) {
                            return !n['hidden'];
                        });
        edgesFound = [];
        for(i=0; i < existingNodes.length ; i++){
            if(existingNodes[i].id==node_id) i++;
            for(j=0; j < existingNodes.length ; j++){
                
                i1=existingNodes[i].id+";"+existingNodes[j].id;                    
                i2=existingNodes[j].id+";"+existingNodes[i].id;          
                      
                if(!isUndef(Edges[i1]) && !isUndef(Edges[i2])){
                    
                    if(Edges[i1].weight > Edges[i2].weight){
                        unHide(i1);
                    }
                    if(Edges[i1].weight < Edges[i2].weight){
                        unHide(i2);
                    }
                    if(Edges[i1].weight == Edges[i2].weight){
                        unHide(i1);
                    }
                }                
            }            
        } 
        node = partialGraph._core.graph.nodesIndex[node_id];
        selection(node);
        partialGraph.startForceAtlas2();        
        updateEdgeFilter("semantic");
        updateNodeFilter("semantic");
        $("#category-A").hide();
        $("#category-B").show();
        changeButton("active_tags.png");
    }
}
        
function graphDocs(node_id){
    pr("\tin graphDocs, node_id: "+node_id);    
    
    fullurl = returnBaseUrl()+"img/trans/";
    document.getElementById("viewType").src=fullurl+"status_meso_view.png";
    document.getElementById("socio").src=fullurl+"active_scholars.png";
    document.getElementById("semantic").src=fullurl+"inactive_tags.png";
    document.getElementById("sociosemantic").src=fullurl+"inactive_sociosem.png";
    document.getElementById("switch").src=fullurl+"graph_macro.png";
    
    hideEverything()
    //partialGraph.stopForceAtlas2();
    
    if(Nodes[node_id].type==catSoc) {
        labels = [];
        
        unHide(node_id);
        for(i=0;i<nodes1[node_id].neighbours.length;i++) {
            unHide(nodes1[node_id].neighbours[i]);
        }
        
        existingNodes = partialGraph._core.graph.nodes.filter(function(n) {
                            return !n['hidden'];
                        });
        for(i=0; i < existingNodes.length ; i++){
            if(existingNodes[i].id==node_id) i++;
            for(j=0; j < existingNodes.length ; j++){
                
                i1=existingNodes[i].id+";"+existingNodes[j].id;                    
                i2=existingNodes[j].id+";"+existingNodes[i].id;                    
                      
                if(!isUndef(Edges[i1]) && !isUndef(Edges[i2])){
                    
                    if(Edges[i1].weight > Edges[i2].weight){
                        unHide(i1);
                    }
                    if(Edges[i1].weight < Edges[i2].weight){
                        unHide(i2);
                    }
                    if(Edges[i1].weight == Edges[i2].weight){
                        unHide(i1);
                    }
                }
            }
        }
        node = partialGraph._core.graph.nodesIndex[node_id];
        selection(node);
        partialGraph.startForceAtlas2();        
        $("#category-A").show();
        $("#category-B").hide();
        updateEdgeFilter("social");        
        changeButton("active_scholars.png");
    }
}
       
function updateDownNodeEvent(selectionRadius){
    pr("actualizando eventos downode");
    partialGraph.unbind("downnodes");
    partialGraph.unbind("overnodes");
    partialGraph.unbind("outnodes");
    hoverNodeEffectWhileFA2(selectionRadius);
}

function greyEverything(){
//    pr("\t\t\tin grey everything");
//    for(var i in deselections){
//        partialGraph._core.graph.nodesIndex[i].forceLabel=false;
//    }
//    deselections={};
    greyColor = '#9b9e9e';
    
    nds = partialGraph._core.graph.nodes.filter(function(n) {
                            return !n['hidden'];
                        });
    for(var i in nds){
            if(!nds[i].attr['grey']){
                nds[i].attr['true_color'] = nds[i].color;
                nds[i].color = greyColor;
            }
            nds[i].attr['grey'] = 1;
    }
    
    eds = partialGraph._core.graph.edges.filter(function(e) {
                            return !e['hidden'];
                        });
    for(var i in eds){
            if(!eds[i].attr['grey']){
                eds[i].attr['true_color'] = eds[i].color;
                eds[i].color = greyColor;
            }
            eds[i].attr['grey'] = 1;
    }
    for(var i in selections){
        if(!isUndef(nodes1[i])){
            if(!isUndef(nodes1[i]["neighbours"])){
                nb=nodes1[i]["neighbours"];
                for(var j in nb){
                    deselections[nb[j]]=1;
                    partialGraph._core.graph.nodesIndex[nb[j]].forceLabel=true;
                    partialGraph._core.graph.nodesIndex[nb[j]].neighbour=true;
                }
            }
        }
    }
}

function markAsSelected(n_id,sel){
    greyColor = '#9b9e9e';
    if(!isUndef(n_id.id)) nodeSel=n_id;
    else nodeSel = partialGraph._core.graph.nodesIndex[n_id];
    
    if(sel==true){
        
        nodeSel.color = nodeSel.attr['true_color'];
        nodeSel.attr['grey'] = 0;
        
        if(categoriesIndex.length==1){
            if( !isUndef(nodes1[nodeSel.id]) &&
                    !isUndef(nodes1[nodeSel.id].neighbours)
                  ){
                    neigh=nodes1[nodeSel.id].neighbours;/**/
                    for(var i in neigh){
                        vec = partialGraph._core.graph.nodesIndex[neigh[i]];
                        vec.color = vec.attr['true_color'];
                        vec.attr['grey'] = 0;
                        an_edge=partialGraph._core.graph.edgesIndex[vec.id+";"+nodeSel.id];
                        if(!isUndef(an_edge) && an_edge.hidden==false){
                            an_edge.color = an_edge.attr['true_color'];
                            an_edge.attr['grey'] = 0;
                        }
                        an_edge=partialGraph._core.graph.edgesIndex[nodeSel.id+";"+vec.id];
                        if(!isUndef(an_edge) && an_edge.hidden==false){
                            an_edge.color = an_edge.attr['true_color'];
                            an_edge.attr['grey'] = 0;
                        }
                    }
                }
        }
        else {
            if(swclickActual=="social") {
                if(nodeSel.type==catSoc){
                    if( !isUndef(nodes1[nodeSel.id]) &&
                        !isUndef(nodes1[nodeSel.id].neighbours)
                      ){
                        neigh=nodes1[nodeSel.id].neighbours;/**/
                        for(var i in neigh){
                            vec = partialGraph._core.graph.nodesIndex[neigh[i]];
                            vec.color = vec.attr['true_color'];
                            vec.attr['grey'] = 0;
                            an_edge=partialGraph._core.graph.edgesIndex[vec.id+";"+nodeSel.id];
                            if(!isUndef(an_edge) && an_edge.hidden==false){
                                an_edge.color = an_edge.attr['true_color'];
                                an_edge.attr['grey'] = 0;
                            }
                            an_edge=partialGraph._core.graph.edgesIndex[nodeSel.id+";"+vec.id];
                            if(!isUndef(an_edge) && an_edge.hidden==false){
                                an_edge.color = an_edge.attr['true_color'];
                                an_edge.attr['grey'] = 0;
                            }
                        }
                    }
                }
                else { 

                    if( !isUndef(bipartiteN2D[nodeSel.id]) &&
                        !isUndef(bipartiteN2D[nodeSel.id].neighbours)
                      ){
                        neigh=bipartiteN2D[nodeSel.id].neighbours;/**/
                        for(var i in neigh){
                            vec = partialGraph._core.graph.nodesIndex[neigh[i]];
                            vec.color = vec.attr['true_color'];
                            vec.attr['grey'] = 0;
                            an_edge=partialGraph._core.graph.edgesIndex[vec.id+";"+nodeSel.id];
                            if(!isUndef(an_edge) && an_edge.hidden==false){
                                an_edge.color = an_edge.attr['true_color'];
                                an_edge.attr['grey'] = 0;
                            }
                            an_edge=partialGraph._core.graph.edgesIndex[nodeSel.id+";"+vec.id];
                            if(!isUndef(an_edge) && an_edge.hidden==false){
                                an_edge.color = an_edge.attr['true_color'];
                                an_edge.attr['grey'] = 0;
                            }
                        }
                      }
                }
            }
            if(swclickActual=="semantic") {
                if(nodeSel.type==catSoc){           
                    if( !isUndef(bipartiteD2N[nodeSel.id]) &&
                        !isUndef(bipartiteD2N[nodeSel.id].neighbours)
                      ){
                        neigh=bipartiteD2N[nodeSel.id].neighbours;/**/
                        for(var i in neigh){
                            vec = partialGraph._core.graph.nodesIndex[neigh[i]];
                            vec.color = vec.attr['true_color'];
                            vec.attr['grey'] = 0;
                            an_edge=partialGraph._core.graph.edgesIndex[vec.id+";"+nodeSel.id];
                            if(!isUndef(an_edge) && an_edge.hidden==false){
                                an_edge.color = an_edge.attr['true_color'];
                                an_edge.attr['grey'] = 0;
                            }
                            an_edge=partialGraph._core.graph.edgesIndex[nodeSel.id+";"+vec.id];
                            if(!isUndef(an_edge) && an_edge.hidden==false){
                                an_edge.color = an_edge.attr['true_color'];
                                an_edge.attr['grey'] = 0;
                            }
                        }
                      }
                }
                else {                   
                    if( !isUndef(nodes2[nodeSel.id]) &&
                        !isUndef(nodes2[nodeSel.id].neighbours)
                      ){
                        neigh=nodes2[nodeSel.id].neighbours;/**/
                        for(var i in neigh){
                            vec = partialGraph._core.graph.nodesIndex[neigh[i]];
                            vec.color = vec.attr['true_color'];
                            vec.attr['grey'] = 0;
                            an_edge=partialGraph._core.graph.edgesIndex[vec.id+";"+nodeSel.id];
                            if(!isUndef(an_edge) && an_edge.hidden==false){
                                an_edge.color = an_edge.attr['true_color'];
                                an_edge.attr['grey'] = 0;
                            }
                            an_edge=partialGraph._core.graph.edgesIndex[nodeSel.id+";"+vec.id];
                            if(!isUndef(an_edge) && an_edge.hidden==false){
                                an_edge.color = an_edge.attr['true_color'];
                                an_edge.attr['grey'] = 0;
                            }
                        }
                      }
                }
            }
            if(swclickActual=="sociosemantic") {
                if(nodeSel.type==catSoc){  

                    if( !isUndef(nodes1[nodeSel.id]) &&
                        !isUndef(nodes1[nodeSel.id].neighbours)
                      ){
                        neigh=nodes1[nodeSel.id].neighbours;/**/
                        for(var i in neigh){
                            vec = partialGraph._core.graph.nodesIndex[neigh[i]];
                            vec.color = vec.attr['true_color'];
                            vec.attr['grey'] = 0;
                            an_edge=partialGraph._core.graph.edgesIndex[vec.id+";"+nodeSel.id];
                            if(!isUndef(an_edge) && an_edge.hidden==false){
                                an_edge.color = an_edge.attr['true_color'];
                                an_edge.attr['grey'] = 0;
                            }
                            an_edge=partialGraph._core.graph.edgesIndex[nodeSel.id+";"+vec.id];
                            if(!isUndef(an_edge) && an_edge.hidden==false){
                                an_edge.color = an_edge.attr['true_color'];
                                an_edge.attr['grey'] = 0;
                            }
                        }   
                    }

                    if( !isUndef(bipartiteD2N[nodeSel.id]) &&
                        !isUndef(bipartiteD2N[nodeSel.id].neighbours)
                      ){
                        neigh=bipartiteD2N[nodeSel.id].neighbours;/**/
                        for(var i in neigh){
                            vec = partialGraph._core.graph.nodesIndex[neigh[i]];
                            vec.color = vec.attr['true_color'];
                            vec.attr['grey'] = 0;
                            an_edge=partialGraph._core.graph.edgesIndex[vec.id+";"+nodeSel.id];
                            if(!isUndef(an_edge) && an_edge.hidden==false){
                                an_edge.color = an_edge.attr['true_color'];
                                an_edge.attr['grey'] = 0;
                            }
                            an_edge=partialGraph._core.graph.edgesIndex[nodeSel.id+";"+vec.id];
                            if(!isUndef(an_edge) && an_edge.hidden==false){
                                an_edge.color = an_edge.attr['true_color'];
                                an_edge.attr['grey'] = 0;
                            }
                        }
                      }
                }
                else {                
                    if( !isUndef(nodes2[nodeSel.id]) &&
                        !isUndef(nodes2[nodeSel.id].neighbours)
                      ){
                        neigh=nodes2[nodeSel.id].neighbours;/**/
                        for(var i in neigh){
                            vec = partialGraph._core.graph.nodesIndex[neigh[i]];
                            vec.color = vec.attr['true_color'];
                            vec.attr['grey'] = 0;
                            an_edge=partialGraph._core.graph.edgesIndex[vec.id+";"+nodeSel.id];
                            if(!isUndef(an_edge) && an_edge.hidden==false){
                                an_edge.color = an_edge.attr['true_color'];
                                an_edge.attr['grey'] = 0;
                            }
                            an_edge=partialGraph._core.graph.edgesIndex[nodeSel.id+";"+vec.id];
                            if(!isUndef(an_edge) && an_edge.hidden==false){
                                an_edge.color = an_edge.attr['true_color'];
                                an_edge.attr['grey'] = 0;
                            }
                        }
                    }

                    if( !isUndef(bipartiteN2D[nodeSel.id]) &&
                        !isUndef(bipartiteN2D[nodeSel.id].neighbours)
                      ){
                        neigh=bipartiteN2D[nodeSel.id].neighbours;/**/
                        for(var i in neigh){
                            vec = partialGraph._core.graph.nodesIndex[neigh[i]];
                            vec.color = vec.attr['true_color'];
                            vec.attr['grey'] = 0;
                            an_edge=partialGraph._core.graph.edgesIndex[vec.id+";"+nodeSel.id];
                            if(!isUndef(an_edge) && an_edge.hidden==false){
                                an_edge.color = an_edge.attr['true_color'];
                                an_edge.attr['grey'] = 0;
                            }
                            an_edge=partialGraph._core.graph.edgesIndex[nodeSel.id+";"+vec.id];
                            if(!isUndef(an_edge) && an_edge.hidden==false){
                                an_edge.color = an_edge.attr['true_color'];
                                an_edge.attr['grey'] = 0;
                            }
                        }
                    }
                }
            }
    }
    }
//    /* Just in case of unselection */
//    /* Finally I decide not using this unselection. */
//    /* We just grayEverything and color the selections[] */
//    else { //   sel=false <-> unselect(nodeSel)
//                
//        nodeSel.color = greyColor;
//        nodeSel.attr['grey'] = 1;
//        
//        if(swclickActual=="social") {
//            if(nodeSel.type==catSoc){
//                neigh=nodes1[nodeSel.id].neighbours;/**/
//                for(var i in neigh){
//                    vec = partialGraph._core.graph.nodesIndex[neigh[i]];
//                    vec.color = greyColor;
//                    vec.attr['grey'] = 1;
//                    an_edge=partialGraph._core.graph.edgesIndex[vec.id+";"+nodeSel.id];
//                    if(typeof(an_edge)!="undefined" && an_edge.hidden==false){
//                        an_edge.color = greyColor;
//                        an_edge.attr['grey'] = 1;
//                    }
//                    an_edge=partialGraph._core.graph.edgesIndex[nodeSel.id+";"+vec.id];
//                    if(typeof(an_edge)!="undefined" && an_edge.hidden==false){
//                        an_edge.color = greyColor;
//                        an_edge.attr['grey'] = 1;
//                    }
//                }
//            }
//            else {     
//                neigh=bipartiteN2D[nodeSel.id].neighbours;/**/
//                for(var i in neigh){
//                    vec = partialGraph._core.graph.nodesIndex[neigh[i]];
//                    vec.color = greyColor;
//                    vec.attr['grey'] = 1;
//                    an_edge=partialGraph._core.graph.edgesIndex[vec.id+";"+nodeSel.id];
//                    if(typeof(an_edge)!="undefined" && an_edge.hidden==false){
//                        an_edge.color = greyColor;
//                        an_edge.attr['grey'] = 1;
//                    }
//                    an_edge=partialGraph._core.graph.edgesIndex[nodeSel.id+";"+vec.id];
//                    if(typeof(an_edge)!="undefined" && an_edge.hidden==false){
//                        an_edge.color = greyColor;
//                        an_edge.attr['grey'] = 1;
//                    }
//                }
//            }
//        }
//        if(swclickActual=="semantic") {
//            if(nodeSel.type==catSoc){   
//                neigh=bipartiteD2N[nodeSel.id].neighbours;/**/
//                for(var i in neigh){
//                    vec = partialGraph._core.graph.nodesIndex[neigh[i]];
//                    vec.color = greyColor;
//                    vec.attr['grey'] = 1;
//                    an_edge=partialGraph._core.graph.edgesIndex[vec.id+";"+nodeSel.id];
//                    if(typeof(an_edge)!="undefined" && an_edge.hidden==false){
//                        an_edge.color = greyColor;
//                        an_edge.attr['grey'] = 1;
//                    }
//                    an_edge=partialGraph._core.graph.edgesIndex[nodeSel.id+";"+vec.id];
//                    if(typeof(an_edge)!="undefined" && an_edge.hidden==false){
//                        an_edge.color = greyColor;
//                        an_edge.attr['grey'] = 1;
//                    }
//                }
//            }
//            else {   
//                neigh=nodes2[nodeSel.id].neighbours;/**/
//                for(var i in neigh){
//                    vec = partialGraph._core.graph.nodesIndex[neigh[i]];
//                    vec.color = greyColor;
//                    vec.attr['grey'] = 1;
//                    an_edge=partialGraph._core.graph.edgesIndex[vec.id+";"+nodeSel.id];
//                    if(typeof(an_edge)!="undefined" && an_edge.hidden==false){
//                        an_edge.color = greyColor;
//                        an_edge.attr['grey'] = 1;
//                    }
//                    an_edge=partialGraph._core.graph.edgesIndex[nodeSel.id+";"+vec.id];
//                    if(typeof(an_edge)!="undefined" && an_edge.hidden==false){
//                        an_edge.color = greyColor;
//                        an_edge.attr['grey'] = 1;
//                    }
//                }
//            }
//        }
//        if(swclickActual=="sociosemantic") {
//            if(nodeSel.type==catSoc){    
//                neigh=nodes1[nodeSel.id].neighbours;/**/
//                for(var i in neigh){
//                    vec = partialGraph._core.graph.nodesIndex[neigh[i]];
//                    vec.color = greyColor;
//                    vec.attr['grey'] = 1;
//                    an_edge=partialGraph._core.graph.edgesIndex[vec.id+";"+nodeSel.id];
//                    if(typeof(an_edge)!="undefined" && an_edge.hidden==false){
//                        an_edge.color = greyColor;
//                        an_edge.attr['grey'] = 1;
//                    }
//                    an_edge=partialGraph._core.graph.edgesIndex[nodeSel.id+";"+vec.id];
//                    if(typeof(an_edge)!="undefined" && an_edge.hidden==false){
//                        an_edge.color = greyColor;
//                        an_edge.attr['grey'] = 1;
//                    }
//                }    
//                neigh=bipartiteD2N[nodeSel.id].neighbours;/**/
//                for(var i in neigh){
//                    vec = partialGraph._core.graph.nodesIndex[neigh[i]];
//                    vec.color = greyColor;
//                    vec.attr['grey'] = 1;
//                    an_edge=partialGraph._core.graph.edgesIndex[vec.id+";"+nodeSel.id];
//                    if(typeof(an_edge)!="undefined" && an_edge.hidden==false){
//                        an_edge.color = greyColor;
//                        an_edge.attr['grey'] = 1;
//                    }
//                    an_edge=partialGraph._core.graph.edgesIndex[nodeSel.id+";"+vec.id];
//                    if(typeof(an_edge)!="undefined" && an_edge.hidden==false){
//                        an_edge.color = greyColor;
//                        an_edge.attr['grey'] = 1;
//                    }
//                }
//            }
//            else { 
//                neigh=nodes2[nodeSel.id].neighbours;/**/
//                for(var i in neigh){
//                    vec = partialGraph._core.graph.nodesIndex[neigh[i]];
//                    vec.color = greyColor;
//                    vec.attr['grey'] = 1;
//                    an_edge=partialGraph._core.graph.edgesIndex[vec.id+";"+nodeSel.id];
//                    if(typeof(an_edge)!="undefined" && an_edge.hidden==false){
//                        an_edge.color = greyColor;
//                        an_edge.attr['grey'] = 1;
//                    }
//                    an_edge=partialGraph._core.graph.edgesIndex[nodeSel.id+";"+vec.id];
//                    if(typeof(an_edge)!="undefined" && an_edge.hidden==false){
//                        an_edge.color = greyColor;
//                        an_edge.attr['grey'] = 1;
//                    }
//                }
//                neigh=bipartiteN2D[nodeSel.id].neighbours;/**/
//                for(var i in neigh){
//                    vec = partialGraph._core.graph.nodesIndex[neigh[i]];
//                    vec.color = greyColor;
//                    vec.attr['grey'] = 1;
//                    an_edge=partialGraph._core.graph.edgesIndex[vec.id+";"+nodeSel.id];
//                    if(typeof(an_edge)!="undefined" && an_edge.hidden==false){
//                        an_edge.color = greyColor;
//                        an_edge.attr['grey'] = 1;
//                    }
//                    an_edge=partialGraph._core.graph.edgesIndex[nodeSel.id+";"+vec.id];
//                    if(typeof(an_edge)!="undefined" && an_edge.hidden==false){
//                        an_edge.color = greyColor;
//                        an_edge.attr['grey'] = 1;
//                    }
//                }
//            }
//        }
//    }
}

function hoverNodeEffectWhileFA2(selectionRadius) { 
    
    partialGraph.bind('downnodes', function (event) {
        pr("\t\t\t\t"+event.content+" -> "+Nodes[event.content].label);
        if(cursor_size==0 && checkBox==false){
            //Normal click on a node
            getOpossitesNodes(event.content, false);//passing just the node-id
        }
        
        if(cursor_size==0 && checkBox==true){
            //Normal click on a node, but we won't clean the previous selections
            getOpossitesNodes(event.content, false);//passing just the node-id
        }
        
        if(cursor_size>0){
            //The click WAS in a node and the cursor_size is ON
            //if(checkBox==false) cancelSelection(false);
            x1 = partialGraph._core.mousecaptor.mouseX;
            y1 = partialGraph._core.mousecaptor.mouseY;
            //dist1(centerClick,selectionRadius)
            partialGraph.iterNodes(function(n){
                if(n.hidden==false){
                    distance = Math.sqrt(
                        Math.pow((x1-parseInt(n.displayX)),2) +
                        Math.pow((y1-parseInt(n.displayY)),2)
                        );
                    if(parseInt(distance)<=cursor_size) {
                        getOpossitesNodes(n,true);//passing the entire node
                    }
                }
            });
        }
        if(categoriesIndex.length==1) updateLeftPanel_uni();
        if(categoriesIndex.length==2) updateLeftPanel();
        
        //The most brilliant way of knowing if an array is empty in the world of JavaScript
        i=0; for(var s in selections) i++;
        
        if(is_empty(selections)==true || i==0){
                pr("cursor radius ON, downNode -> selecciones vacias");
                $("#names").html(""); //Information extracted, just added
                $("#opossiteNodes").html(""); //Information extracted, just added
                $("#information").html("");
                $("#tips").html(getTips());
                $("#topPapers").html(""); $("#topPapers").hide();
                changeButton("unselectNodes");
                //cancelSelection(false);
                graphResetColor();
        }
        else { 
                greyEverything();
                for(var i in selections){
                    markAsSelected(i,true);
                }
                changeButton("selectNode");
        }
        overNodes=true;        
        partialGraph.draw();
    });
}

function graphResetColor(){
    nds = partialGraph._core.graph.nodes.filter(function(x) {
                            return !x['hidden'];
          });
    eds = partialGraph._core.graph.edges.filter(function(x) {
                            return !x['hidden'];
          });
          
    for(var x in nds){
        n=nds[x];
        n.attr["grey"] = 0;
        n.color = n.attr["true_color"];
    }
    
    for(var x in eds){
        e=eds[x];
        e.attr["grey"] = 0;
        e.color = e.attr["true_color"];
    }
    
}

function createEdgesForExistingNodes (typeOfNodes) {
    
    existingNodes = partialGraph._core.graph.nodes.filter(function(n) {
                            return !n['hidden'];
                        });
    if(typeOfNodes=="Bipartite"){
        for(i=0; i < existingNodes.length ; i++){
            for(j=0; j < existingNodes.length ; j++){
                
                i1=existingNodes[i].id+";"+existingNodes[j].id;                    
                i2=existingNodes[j].id+";"+existingNodes[i].id;                    
                    
                indexS1 = existingNodes[i].id;
                indexT1 = existingNodes[j].id; 
                    
                indexS2 = existingNodes[j].id;  
                indexT2 = existingNodes[i].id;     

                if(!isUndef(Edges[i1]) && !isUndef(Edges[i2])){
                    if(Edges[i1].weight > Edges[i2].weight ){
                        unHide(indexS1+";"+indexT1);
                    }
                    if(Edges[i1].weight < Edges[i2].weight){
                        unHide(indexS2+";"+indexT2);
                    }
                    if(Edges[i1].weight == Edges[i2].weight){
                        if(Edges[i1].label!="bipartite") {  /*danger*/   
                            if( isUndef(partialGraph._core.graph.edgesIndex[indexS1+";"+indexT1]) &&
                                isUndef(partialGraph._core.graph.edgesIndex[indexT1+";"+indexS1]) ){
                                unHide(indexS1+";"+indexT1);
                            }
                        }
                    }
                        
                        
                }
                else {
                    if(!isUndef(Edges[i1])){// && Edges[i1].label=="bipartite"){
                        //I've found a source Node
                        unHide(indexS1+";"+indexT1);
                    }
                    if(!isUndef(Edges[i2])){// && Edges[i2].label=="bipartite"){
                        //I've found a target Node
                        unHide(indexS2+";"+indexT2);
                    }
                }
            }            
        }
    }
    else {  
        for(i=0; i < existingNodes.length ; i++){
            for(j=(i+1); j < existingNodes.length ; j++){
                    
                i1=existingNodes[i].id+";"+existingNodes[j].id; 
                i2=existingNodes[j].id+";"+existingNodes[i].id; 

                if(!isUndef(Edges[i1]) && !isUndef(Edges[i2]) && i1!=i2){
                    
                        if(typeOfNodes=="Scholars") { 
                            if(Edges[i1].label=="nodes1" && Edges[i2].label=="nodes1"){                              
                                if(Edges[i1].weight > Edges[i2].weight){
                                    unHide(i1);
                                }
                                if(Edges[i1].weight < Edges[i2].weight){
                                    unHide(i2);
                                }
                                if(Edges[i1].weight == Edges[i2].weight){
                                    unHide(i1);
                                }  
                            }
                        }
                        if(typeOfNodes=="Keywords") { 
                            if(Edges[i1].label=="nodes2" && Edges[i2].label=="nodes2"){ 
                                if(Edges[i1].weight > Edges[i2].weight){
                                    unHide(i1);
                                }
                                if(Edges[i1].weight < Edges[i2].weight){
                                    unHide(i2);
                                }
                                if(Edges[i1].weight == Edges[i2].weight){
                                    unHide(i1);
                                }
                            }
                        }
                }
                else {
                    e=(!isUndef(Edges[i1]))?Edges[i1]:Edges[i2]
                    if(!isUndef(e)){
                        if(typeOfNodes=="Scholars" && e.label=="nodes1") unHide(e.id)
                        if(typeOfNodes=="Keywords" && e.label=="nodes2") unHide(e.id) 
                    }
                }
            }  
        }  
    }
}

function hideEverything(){
    //visibleNodes=[];
    //visibleEdges=[];
//    if(swclickActual=="social" && semanticConverged<2){
//        if(semanticConverged===1) semanticConverged++;
//    }
//    if(swclickActual=="semantic" && socialConverged<2){
//        if(socialConverged===1) socialConverged++;        
//    }
//  
    pr("\thiding all");
    nodeslength=0;
    for(var n in partialGraph._core.graph.nodesIndex){
        partialGraph._core.graph.nodesIndex[n].hidden=true;
    }
    for(var e in partialGraph._core.graph.edgesIndex){
        partialGraph._core.graph.edgesIndex[e].hidden=true;
    }
    overNodes=false;//magic line!
    pr("\tall hidded");
    //Remember that this function is the analogy of EmptyGraph
    //"Saving node positions" should be applied in this function, too.
}

function unHide(id){
    if(id.split(";").length==1){
        updateSearchLabels(id,Nodes[id].label,Nodes[id].type);
        nodeslength++;
        //visibleNodes.push(id);
        partialGraph._core.graph.nodesIndex[id].hidden=false;
    }
    else {// It's an edge!
        //visibleEdges.push(id);
        partialGraph._core.graph.edgesIndex[id].hidden=false;
    }
}

function hideElem(id){
    if(id.split(";").length==1){
        //updateSearchLabels(id,Nodes[id].label,Nodes[id].type);
        partialGraph._core.graph.nodesIndex[id].hidden=true;
    }
    else {// It's an edge!
        partialGraph._core.graph.edgesIndex[id].hidden=true;
    }
}

function unHideElem(id){
    if(id.split(";").length==1){
        //updateSearchLabels(id,Nodes[id].label,Nodes[id].type);
        partialGraph._core.graph.nodesIndex[id].hidden=false;
    }
    else {// It's an edge!
        partialGraph._core.graph.edgesIndex[id].hidden=false;
    }
}

function changeToMeso(iwannagraph) { 
    labels=[]
    pr("changing to Meso-"+iwannagraph);  
    fullurl = returnBaseUrl()+"img/trans/";   
    if(iwannagraph=="social") {
        if(!is_empty(selections)){
//            hideEverything();
            if(swclickPrev=="social") {
                for(var i in partialGraph._core.graph.edgesIndex){
                    e=partialGraph._core.graph.edgesIndex[i];
                    if(e.color=="#9b9e9e") {
                        e.hidden=true;
                    }
                }
                for(var i in partialGraph._core.graph.nodesIndex){
                    n=partialGraph._core.graph.nodesIndex[i];
                    if(n.color=="#9b9e9e") {
                        n.hidden=true;
                    }
                }
//                for(var i in selections) {
//                    unHide(i);
//                    for(var j in nodes1[i].neighbours) { 
//                        id=nodes1[i].neighbours[j];
//                        unHide(id);
//                    }
//                }            
//                createEdgesForExistingNodes("Scholars");/**/
            }
            if(swclickPrev=="semantic") {
                for(var i in selections) {
                    if(Nodes[i].type==catSem){
                        for(var j in opossites) {
                            unHide(j);
                        }
                    }
                    else {
                        unHide(i);
                        neigh=nodes1[i].neighbours;
                        for(var j in neigh) {
                            unHide(neigh[j]);
                        }
                    }
                }
                createEdgesForExistingNodes("Scholars");
            }
            if(swclickPrev=="sociosemantic") { 
                for(var i in selections) {
                    if(Nodes[i].type==catSoc){
                        unHide(i);
                        for(var j in nodes1[i].neighbours) { 
                            id=nodes1[i].neighbours[j];
                            unHide(id);
                        }
                        createEdgesForExistingNodes("Scholars");
                    }
                    if(Nodes[i].type==catSem){
                        for(var j in opossites) {
                            unHide(j);
                        }
                        createEdgesForExistingNodes("Scholars");
                    }
                }                
            }
            updateEdgeFilter(iwannagraph);
        }
    }
    if(iwannagraph=="sociosemantic") {
        if(!is_empty(selections) && !is_empty(opossites)){
            hideEverything();
            for(var i in selections) {
                unHide(i);
            }
                
            for(var i in opossites) {
                unHide(i);
            }
                
            createEdgesForExistingNodes("Bipartite");
            
            partialGraph.startForceAtlas2();
            socsemFlag=true;
            updateBothEdgeFilters();
            updateBothNodeFilters();
        }
    }
     
    if(iwannagraph=="semantic") {
        if(!is_empty(opossites)){
            hideEverything()
            //pr("2. swclickPrev: "+swclickPrev+" - swclickActual: "+swclickActual);
            if(swclickPrev=="semantic") {
                for(var i in selections) {
                    unHide(i);
                    neigh=nodes2[i].neighbours;
                    for(var j in neigh) {
                        unHide(neigh[j]);
                    }
                }
                createEdgesForExistingNodes("Keywords");
            }
            if(swclickPrev=="social") {                
                for(var i in selections) {
                    if(Nodes[i].type==catSoc){
                        for(var j in opossites) {
                            unHide(j);
                        }
                    }
                    else {
                        unHide(i);
                        neigh=nodes2[i].neighbours;
                        for(var j in neigh) {
                            unHide(neigh[j]);
                        }
                    }
                }
                createEdgesForExistingNodes("Keywords");
            }
            if(swclickPrev=="sociosemantic") {                     
                for(var i in selections) {
                    if(Nodes[i].type==catSoc){                        
                        for(var j in opossites) {
                            unHide(j);
                        }
                        createEdgesForExistingNodes("Keywords");
                        break;
                    }
                    if(Nodes[i].type==catSem){                        
                        unHide(i);//sneaky bug!
                        for(var j in nodes2[i].neighbours) { 
                            id=nodes2[i].neighbours[j];
                            unHide(id);
                        }
                        createEdgesForExistingNodes("Keywords");
                    }
                }                
            }
            updateEdgeFilter(iwannagraph);  
            updateNodeFilter("semantic");
        }
    }
    highlightSelectedNodes(true); 
    partialGraph.draw();
    partialGraph.zoomTo(partialGraph._core.width / 2, partialGraph._core.height / 2, 0.8);
    partialGraph.refresh();
    partialGraph.startForceAtlas2();
}

function changeToMacro(iwannagraph) {
    labels=[]
    pr("CHANGING TO Macro-"+iwannagraph);
    fullurl = returnBaseUrl()+"img/trans/";
    if(iwannagraph=="semantic") {
        hideEverything()
        for(var n in Nodes) {                
            if(Nodes[n].type==catSem){
                unHide(n);
            }                
        }  
        createEdgesForExistingNodes("Keywords");
        for(var n in selections){
            if(Nodes[n].type==catSoc){
                highlightOpossites(opossites);
                selectOpossites(opossites);
            }
            break;
        }
        updateEdgeFilter(iwannagraph);
        updateNodeFilter("semantic");
    }
    if(iwannagraph=="social") {
        if(swclickPrev=="social") {
                for(var i in partialGraph._core.graph.edgesIndex){
                    e=partialGraph._core.graph.edgesIndex[i];
                    if(e.hidden==true) {
                        if(e.label=="nodes1") e.hidden=false;
                    }
                }
                for(var i in partialGraph._core.graph.nodesIndex){
                    n=partialGraph._core.graph.nodesIndex[i];
                    if(n.hidden==true) {
                        if(n.type==catSoc) n.hidden=false;
                    }
                }
        } else {            
            hideEverything()
            for(var n in Nodes) {                
                if(Nodes[n].type==catSoc){
                    unHide(n);
                }                
            }
            createEdgesForExistingNodes("Scholars");
            for(var n in selections){
                if(Nodes[n].type==catSem){
                    highlightOpossites(opossites);
                    selectOpossites(opossites);
                }
                break;
            }
        }
        updateEdgeFilter(iwannagraph);
    }
    
    if(iwannagraph=="sociosemantic") {
        hideEverything()
        for(var n in Nodes) {  
            unHide(n);
        }
        //pr(partialGraph._core.graph.edgesIndex);
        for(var e in Edges) {  
            if(Edges[e].label=="nodes1" || Edges[e].label=="nodes2"){
                st=e.split(";");
                index = partialGraph._core.graph.edgesIndex;
                if(index[st[0]+";"+st[1]] && index[st[1]+";"+st[0]] &&
                   index[st[0]+";"+st[1]].hidden==true &&
                   index[st[1]+";"+st[0]].hidden==true
                    ){
                    if(Edges[st[0]+";"+st[1]].weight == Edges[st[1]+";"+st[0]].weight){
                        unHide(st[0]+";"+st[1]);
                    }
                    else {
                        if(Edges[st[0]+";"+st[1]].weight > Edges[st[1]+";"+st[0]].weight){
                            unHide(st[0]+";"+st[1]);
                        }
                        else {
                            unHide(st[1]+";"+st[0]);
                        }
                    }
                }                
            }
            if(Edges[e].label=="bipartite"){
                unHide(e);
            }
        }
        updateBothEdgeFilters();
        updateBothNodeFilters();
    }
    highlightSelectedNodes(true);
    //partialGraph.stopForceAtlas2();
    partialGraph.draw();
    partialGraph.zoomTo(partialGraph._core.width / 2, partialGraph._core.height / 2, 0.8);
    partialGraph.refresh();
    partialGraph.startForceAtlas2();
}

function highlightOpossites (list){/*here*/
    for(var n in list){
        if(!isUndef(partialGraph._core.graph.nodesIndex[n])){
            partialGraph._core.graph.nodesIndex[n].active=true;
        }
    }
}

function selectOpossites (list){//Expanding selection    
    cancelSelection(false);   
    checkBox = true;
    for(var n in list){
        getOpossitesNodes(n,false);
    }
    updateLeftPanel();
    i=0; for(var s in selections) i++;
    if(is_empty(selections)==true || i==0){  
                $("#names").html(""); //Information extracted, just added
                $("#opossiteNodes").html(""); //Information extracted, just added
                $("#information").html("");
                $("#topPapers").html(""); $("#topPapers").hide();
                $("#tips").html(getTips());
                changeButton("unselectNodes");
                cancelSelection(false);
    }
    else { 
                greyEverything();
                for(var i in list){
                    markAsSelected(i,true);
                }
                changeButton("selectNode");
    }
    overNodes=true;    
    checkBox = false;      
    partialGraph.draw();
}

function saveGEXF(){
    json = '<?xml version="1.0" encoding="UTF-8"?>\n';
    json += '<gexf xmlns="http://www.gexf.net/1.1draft" xmlns:viz="http://www.gephi.org/gexf/viz" version="1.1">\n';
    json += '<graph type="static">';
    //json += '<attributes class="node" type="static">\n';
    //json += ' <attribute id="0" title="category" type="string">  </attribute>\n';
    //json += ' <attribute id="1" title="occurrences" type="float">    </attribute>\n';
    //json += ' <attribute id="2" title="content" type="string">    </attribute>\n';
    //json += ' <attribute id="3" title="keywords" type="string">   </attribute>\n';
    //json += ' <attribute id="4" title="weight" type="float">   </attribute>\n';
    //json += '</attributes>\n';
    json += '<attributes class="edge" type="float">\n';
    json += ' <attribute id="6" title="type" type="string"> </attribute>\n';
    json += '</attributes>\n';
    json += "<nodes>\n";
    nodes = partialGraph._core.graph.nodes.filter(function(n) {
                    return !n['hidden'];
            });
    edges = partialGraph._core.graph.edges.filter(function(e) {
                    return !e['hidden'];
            });
    for(var n in nodes){    
        
        json += '<node id="'+nodes[n].id+'" label="'+nodes[n].label+'">\n';
        json += '<viz:position x="'+nodes[n].x+'"    y="'+nodes[n].y+'"  z="0" />\n';
        json += '</node>\n';
    }
    json += "</nodes\n>";
    json += "<edges>\n";    
    cont = 1;
    for(var e in edges){
        json += '<edge id="'+cont+'" source="'+edges[e].source.id+'"  target="'+edges[e].target.id+'" weight="'+edges[e].weight+'">\n';
        json += '<attvalues> <attvalue for="6" value="'+edges[e].label+'"/></attvalues>';
        json += '</edge>\n';
        cont++;
    }
    json += "</edges></graph></gexf>";
    uriContent = "data:application/octet-stream," + encodeURIComponent(json);
    newWindow=window.open(uriContent, 'neuesDokument');
}

function savePNG(){
    $("#PhotoGraph").click(function (){
        
        //canvas=partialGraph._core.domElements.nodes;
        
        var nodesCtx = partialGraph._core.domElements.nodes;
        /*
        var edgesCtx = document.getElementById("sigma_edges_1").getContext('2d');
        
        var edgesImg = edgesCtx.getImageData(0, 0, document.getElementById("sigma_edges_1").width, document.getElementById("sigma_edges_1").height)
        
        nodesCtx.putImageData(edgesImg,0,0);
        
        
        
        
        //ctx.drawImage(partialGraph._core.domElements.edges,0,0)
        //var oCanvas = ctx;  
  */
        //div = document.getElementById("sigma_nodes_1").getContext('2d');
        //ctx = div.getContext("2d");
        //oCanvas.drawImage(partialGraph._core.domElements.edges,0,0);
        Canvas2Image.saveAsPNG(nodesCtx);
        
        /*
        Canvas2Image.saveAsJPEG(oCanvas); // will prompt the user to save the image as JPEG.   
        // Only supported by Firefox.  
  
        Canvas2Image.saveAsBMP(oCanvas);  // will prompt the user to save the image as BMP.  
  
  
        // returns an <img> element containing the converted PNG image  
        var oImgPNG = Canvas2Image.saveAsPNG(oCanvas, true);     
  
        // returns an <img> element containing the converted JPEG image (Only supported by Firefox)  
        var oImgJPEG = Canvas2Image.saveAsJPEG(oCanvas, true);   
                                                         
        // returns an <img> element containing the converted BMP image  
        var oImgBMP = Canvas2Image.saveAsBMP(oCanvas, true);   
  
  
        // all the functions also takes width and height arguments.   
        // These can be used to scale the resulting image:  
  
        // saves a PNG image scaled to 100x100  
        Canvas2Image.saveAsPNG(oCanvas, false, 100, 100);  
        */
    });
}

function getSwitchButton(){
    return document.getElementById("switchbutton").src;
}

function setComponentButton(comp_name){
	document.getElementById(comp_name);
}

function changeSwitchImage(source, target){
    pr("****    changeSwitchImage() does NOTHING    ****")
//    if(target=="social") {
//	setComponentButton("social",true);
//	setComponentButton("semantic",false);
//	setComponentButton("sociosemantic",false);
//    }
//    if(target=="semantic") {
//	setComponentButton("social",false);
//	setComponentButton("semantic",true);
//	setComponentButton("sociosemantic",false);
//    }
//    if(target=="sociosemantic") {
//	setComponentButton("social",false);
//	setComponentButton("semantic",false);
//	setComponentButton("sociosemantic",true);
//    }
//    fullurl = returnBaseUrl()+"img/trans/";
//    if(source=="fromHtml"){
//        if(document.getElementById("switchbutton").src==fullurl+"showKeywords.png"){
//            document.getElementById("switchbutton").src=fullurl+"showScholars.png";
//        }
//        else {
//            document.getElementById("switchbutton").src=fullurl+"showKeywords.png";
//        }
//    }
//    else {
//        if(target=="social") document.getElementById("switchbutton").src=fullurl+"showKeywords.png";
//        if(target=="semantic") document.getElementById("switchbutton").src=fullurl+"showScholars.png";
//    }
    //pr($("#names").text());
}

function switchSelection(){
    if(swclickActual=="social"){
        //If we are seeing the Social Graph, this implies that the left panel
        //is showing Keywords, so we have to invert names and opossites
    }
    if(swclickActual=="semantic"){
        //If we are seeing the Semantic Graph, this implies that the left panel
        //is showing Scholars, so we have to invert names and opossites
    }
    
}
