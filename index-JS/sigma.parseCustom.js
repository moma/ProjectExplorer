function startLoader(){
    target = document.getElementById('progressBar');
    spinner = new Spinner(opts).spin(target);
    $('#left').hide();
    $('#right').hide();
    $('#center').hide();
    $('#zonecentre').hide();
    $('#leftcolumn').hide();
}

function stopLoader(){
    spinner.stop();
    $('#left').show();
    $('#right').show();
    $('#center').show();
    $('#zonecentre').show();
    $('#leftcolumn').show();
}

function parse(){
    //"http://localhost:5000/"+unique_id+"/"+iterations;
    //http://localhost:8080/getJSON?callback=xxx&unique_id=Elisa__Omodei&it=3&_=1377043258090
    startLoader();
    if(getUrlParam.nodeidparam.indexOf("__")===-1){
        //gexfPath = "php/bridgeClientServer_filter.php?query="+getUrlParam.nodeidparam;
        //pr(gexfPath)
        $.ajax({
            type: 'GET',
            url: bridge["forFilteredQuery"],
            data: "query="+getUrlParam.nodeidparam+"&it="+iterationsFA2,
            contentType: "application/json",
            dataType: 'jsonp',
            async: false,
            success : function(data){ 
                extractFromJson(data); 
                stopLoader();
                updateEdgeFilter("social");
                //updateEdgeFilter_attempt("social");
                updateNodeFilter("social");
                pushSWClick("social");
                cancelSelection(false);
                console.log("Parsing complete.");     
                partialGraph.zoomTo(partialGraph._core.width / 2, partialGraph._core.height / 2, 0.8).draw();
                partialGraph.startForceAtlas2();   
//
                startEnviroment(); 
            },
            error: function(data){ 
                pr("Page Not found. parseCustom, inside the IF");
                pr("what i send");
                pr("query="+getUrlParam.nodeidparam+"&it="+iterationsFA2);
                pr(data);
            }
        });
        return true;
    }
    else {
        //If you're searching a specific scholar
        unique_id = getUrlParam.nodeidparam;
        $.ajax({
            type: 'GET',
            url: bridge["forNormalQuery"],
            data: "unique_id="+unique_id+"&it="+iterationsFA2,
            contentType: "application/json",
            dataType: 'jsonp',
            async: false,
            success : function(data){ 
                //pr("unique_id="+unique_id+"&it="+iterationsFA2);
                extractFromJson(data); 
                stopLoader();
                updateEdgeFilter("social");
                //updateEdgeFilter_attempt("social");
                updateNodeFilter("social");
                pushSWClick("social");
                cancelSelection(false);
                console.log("Parsing complete.");     
                partialGraph.zoomTo(partialGraph._core.width / 2, partialGraph._core.height / 2, 0.8).draw();
                partialGraph.startForceAtlas2();   
//
                startEnviroment(); 
            },
            error: function(){ 
                pr("Page Not found. parseCustom, inside the ELSE");
            }
        });
        return false;
    }
}

function extractFromJson(data){
    var i, j, k;
    //partialGraph.emptyGraph();
    // Parse Attributes
    // This is confusing, so I'll comment heavily
    var nodesAttributes = [];   // The list of attributes of the nodes of the graph that we build in json
    var edgesAttributes = [];   // The list of attributes of the edges of the graph that we build in json
    //var attributesNodes = gexf.getElementsByTagName('attributes');  // In the gexf (that is an xml), the list of xml nodes 'attributes' (note the plural 's')
    
    var nodesNodes = data.nodes // The list of xml nodes 'nodes' (plural)
    labels = [];
    numberOfDocs=0;
    numberOfNGrams=0;
    
    for(var i in nodesNodes){
            colorRaw = nodesNodes[i].color.split(",");
            color = '#'+sigma.tools.rgbToHex(
                    parseFloat(colorRaw[2]),
                    parseFloat(colorRaw[1]),
                    parseFloat(colorRaw[0]));
                    //Colors inverted... Srsly??
            
            var node = ({
                id:i,
                label:nodesNodes[i].label, 
                size:1, 
                x:nodesNodes[i].x, 
                y:nodesNodes[i].y, 
                //x:Math.random(),
                //y:Math.random(),
                type:"",
                htmlCont:"",
                color:color
            });  // The graph node
            if(nodesNodes[i].type=="Document"){
                node.htmlCont = nodesNodes[i].content;
                node.type="Document";
                node.shape="square";
                numberOfDocs++;
                node.size=desirableScholarSize;
            }
            else {
                node.type="NGram";
                numberOfNGrams++;
                node.size=parseInt(nodesNodes[i].term_occ).toFixed(2);
                if(parseInt(node.size) < parseInt(minNodeSize)) minNodeSize= node.size;
                if(parseInt(node.size) > parseInt(maxNodeSize)) maxNodeSize= node.size;
            }
            Nodes[i] = node;
    }

    for(var i in Nodes){
        if(Nodes[i].type=="NGram") {
            normalizedSize=desirableNodeSizeMIN+(Nodes[i].size-1)*((desirableNodeSizeMAX-desirableNodeSizeMIN)/(parseInt(maxNodeSize)-parseInt(minNodeSize)));
            Nodes[i].size = ""+normalizedSize;
            
            nodeK = Nodes[i];
            nodeK.hidden=true;/**///should be uncommented
            partialGraph.addNode(i,nodeK);   
        }
        else {
            partialGraph.addNode(i,Nodes[i]);  
            unHide(i);
        }
    }
    
    var edgeId = 0;
    var edgesNodes = data.edges;
    for(var i in edgesNodes){
        //pr(edgesNodes[i]);
        var indice=edgesNodes[i].s+";"+edgesNodes[i].t;
        var source = edgesNodes[i].s;
        var target = edgesNodes[i].t;
        var edge = {
                id:         indice,
                sourceID:   source,
                targetID:   target,
                label:      edgesNodes[i].type,
                weight: edgesNodes[i].w
            };
        if(edge.weight < minEdgeWeight) minEdgeWeight= edge.weight;
        if(edge.weight > maxEdgeWeight) maxEdgeWeight= edge.weight;
        Edges[indice] = edge;
        
        
        
        
            if(edge.label=="nodes1"){             
                if( (typeof partialGraph._core.graph.edgesIndex[target+";"+source])=="undefined" ){
                    edge.hidden=false;
                }
                else edge.hidden=true;
                
                if((typeof nodes1[source])=="undefined"){
                    nodes1[source] = {
                        label: Nodes[source].label,
                        neighbours: []
                    };
                    nodes1[source].neighbours.push(target);
                }
                else nodes1[source].neighbours.push(target);
            }
            
            
            if(edge.label=="nodes2"){ 
                edge.hidden=true;
                if((typeof nodes2[source])=="undefined"){
                    nodes2[source] = {
                        label: Nodes[source].label,
                        neighbours: []
                    };
                    nodes2[source].neighbours.push(target);
                }
                else nodes2[source].neighbours.push(target);
            }
            
            
            if(edge.label=="bipartite"){   
                edge.hidden=true;
                // Document to NGram 
                if((typeof bipartiteD2N[source])=="undefined"){
                    bipartiteD2N[source] = {
                        label: Nodes[source].label,
                        neighbours: []
                    };
                    bipartiteD2N[source].neighbours.push(target);
                }
                else bipartiteD2N[source].neighbours.push(target);
                
                // NGram to Document 
                if((typeof bipartiteN2D[target])=="undefined"){
                    bipartiteN2D[target] = {
                        label: Nodes[target].label,
                        neighbours: []
                    };
                    bipartiteN2D[target].neighbours.push(source);
                }
                else bipartiteN2D[target].neighbours.push(source);
            }
            
            //edge.hidden=false/**///should be commented
            partialGraph.addEdge(indice,source,target,edge);
    }
}

function fullExtract(){
    var i, j, k;
    partialGraph.emptyGraph();
    // Parse Attributes
    // This is confusing, so I'll comment heavilyAttr
    var nodesAttributes = [];   // The list of attributes of the nodes of the graph that we build in json
    var edgesAttributes = [];   // The list of attributes of the edges of the graph that we build in json
    var attributesNodes = gexf.getElementsByTagName('attributes');  // In the gexf (that is an xml), the list of xml nodes 'attributes' (note the plural 's')
  
    for(i = 0; i<attributesNodes.length; i++){
        var attributesNode = attributesNodes[i];  // attributesNode is each xml node 'attributes' (plural)
        if(attributesNode.getAttribute('class') == 'node'){
            var attributeNodes = attributesNode.getElementsByTagName('attribute');  // The list of xml nodes 'attribute' (no 's')
            for(j = 0; j<attributeNodes.length; j++){
                var attributeNode = attributeNodes[j];  // Each xml node 'attribute'
        
                var id = attributeNode.getAttribute('id'),
                title = attributeNode.getAttribute('title'),
                type = attributeNode.getAttribute('type');
        
                var attribute = {
                    id:id, 
                    title:title, 
                    type:type
                };
                nodesAttributes.push(attribute);
        
            }
        } else if(attributesNode.getAttribute('class') == 'edge'){
            var attributeNodes = attributesNode.getElementsByTagName('attribute');  // The list of xml nodes 'attribute' (no 's')
            for(j = 0; j<attributeNodes.length; j++){
                var attributeNode = attributeNodes[j];  // Each xml node 'attribute'
        
                var id = attributeNode.getAttribute('id'),
                title = attributeNode.getAttribute('title'),
                type = attributeNode.getAttribute('type');
          
                var attribute = {
                    id:id, 
                    title:title, 
                    type:type
                };
                edgesAttributes.push(attribute);
        
            }
        }
    }
  
    var nodesNodes = gexf.getElementsByTagName('nodes') // The list of xml nodes 'nodes' (plural)
  
    labels = [];
    numberOfDocs=0;
    numberOfNGrams=0;
    for(i=0; i<nodesNodes.length; i++){
        var nodesNode = nodesNodes[i];  // Each xml node 'nodes' (plural)
        var nodeNodes = nodesNode.getElementsByTagName('node'); // The list of xml nodes 'node' (no 's')

        for(j=0; j<nodeNodes.length; j++){
            var nodeNode = nodeNodes[j];  // Each xml node 'node' (no 's')
      
      
            window.NODE = nodeNode;

            var id = nodeNode.getAttribute('id');
            var label = nodeNode.getAttribute('label') || id;
      
            //viz
            var size = 1;
            var x = 100 - 200*Math.random();
            var y = 100 - 200*Math.random();
            var color;
      
            var positionNodes = nodeNode.getElementsByTagName('position');
            positionNodes = positionNodes.length ? 
            positionNodes : 
            nodeNode.getElementsByTagNameNS('*','position');
            if(positionNodes.length>0){
                var positionNode = positionNodes[0];
                x = parseFloat(positionNode.getAttribute('x'));
                y = parseFloat(positionNode.getAttribute('y'));
            }

            var colorNodes = nodeNode.getElementsByTagName('color');
            colorNodes = colorNodes.length ? 
            colorNodes : 
            nodeNode.getElementsByTagNameNS('*','color');
            if(colorNodes.length>0){
                colorNode = colorNodes[0];
                color = '#'+sigma.tools.rgbToHex(parseFloat(colorNode.getAttribute('r')),
                    parseFloat(colorNode.getAttribute('g')),
                    parseFloat(colorNode.getAttribute('b')));
            }
            
            var node = ({
                id:id,
                label:label, 
                size:size, 
                x:x, 
                y:y, 
                type:"",
                attributes:[], 
                color:color
            });  // The graph node
                
            // Attribute values
            var attvalueNodes = nodeNode.getElementsByTagName('attvalue');
            for(k=0; k<attvalueNodes.length; k++){
                var attvalueNode = attvalueNodes[k];
                var attr = attvalueNode.getAttribute('for');
                var val = attvalueNode.getAttribute('value');
                node.attributes.push({
                    attr:attr, 
                    val:val
                });
                /*      Para asignar tamaño a los NGrams    */
                if(attr==4) {
                    //if(val<30) val=30;
                    //Nodes[id].size=(parseInt(val).toFixed(2)*5)/70;
                    node.size=parseInt(val).toFixed(2);
                    if(id.charAt(0)=="D") {
                        node.size = ""+desirableScholarSize;
                    }
                    
                }
            /*      Para asignar tamaño a los NGrams    */
            }
                
            if(node.attributes[0].val=="Document"){
                node.type="Document";
                node.shape="square";
                numberOfDocs++;
                node.size=desirableScholarSize;
                //partialGraph.addNode(id,node); // 
            }
            else {
                node.type="NGram";
                numberOfNGrams++;
                if(parseInt(node.size) < parseInt(minNodeSize)) minNodeSize= node.size;
                if(parseInt(node.size) > parseInt(maxNodeSize)) maxNodeSize= node.size;
                
            }
            Nodes[id] = node;
        }
    }  
    //constantNGramFilter= ((parseInt(maxNodeSize)*(5-2+0.1))/(5))*0.001;
    //New scale for node size: now, between 2 and 5 instead [1,70]
    for(var i in Nodes){
        if(Nodes[i].type=="NGram") {
            normalizedSize=desirableNodeSizeMIN+(Nodes[i].size-1)*((desirableNodeSizeMAX-desirableNodeSizeMIN)/(parseInt(maxNodeSize)-parseInt(minNodeSize)));
            Nodes[i].size = ""+normalizedSize;
            
            nodeK = Nodes[i];
            nodeK.hidden=true;
            partialGraph.addNode(i,nodeK);   
        }
        else {
            partialGraph.addNode(i,Nodes[i]);  
            unHide(i);
        }
    }
    var edgeId = 0;
    var edgesNodes = gexf.getElementsByTagName('edges');
    for(i=0; i<edgesNodes.length; i++){
        var edgesNode = edgesNodes[i];
        var edgeNodes = edgesNode.getElementsByTagName('edge');
        for(j=0; j<edgeNodes.length; j++){
            var edgeNode = edgeNodes[j];
            var source = edgeNode.getAttribute('source');
            var target = edgeNode.getAttribute('target');
            var indice=source+";"+target;
            //console.log(indice);
            var edge = {
                id:         indice,
                sourceID:   source,
                targetID:   target,
                label:      "",
                weight: 1,
                attributes: []
            };

            var weight = edgeNode.getAttribute('weight');
            if(weight!=undefined){
                edge['weight'] = weight;
            }
            var kind;
            var attvalueNodes = edgeNode.getElementsByTagName('attvalue');
            for(k=0; k<attvalueNodes.length; k++){
                var attvalueNode = attvalueNodes[k];
                var attr = attvalueNode.getAttribute('for');
                var val = attvalueNode.getAttribute('value');
                if(k==1) {
                    kind=val;
                    edge.label=val;
                }
                if(k==0) {
                    edge.weight = val;
                    if(edge.weight < minEdgeWeight) minEdgeWeight= edge.weight;
                    if(edge.weight > maxEdgeWeight) maxEdgeWeight= edge.weight;
                }
                edge.attributes.push({
                    attr:attr, 
                    val:val
                });
            }   
            
            
            Edges[indice] = edge;
            
            if(edge.attributes[1].val=="nodes1"){             
                if( (typeof partialGraph._core.graph.edgesIndex[target+";"+source])=="undefined" ){
                    edge.hidden=false;
                }
                else edge.hidden=true;
                partialGraph.addEdge(indice,source,target,edge);
                
                if((typeof nodes1[source])=="undefined"){
                    nodes1[source] = {
                        label: Nodes[source].label,
                        neighbours: []
                    };
                    nodes1[source].neighbours.push(target);
                }
                else nodes1[source].neighbours.push(target);
            }
            
            
            if(edge.attributes[1].val=="nodes2"){ 
                edge.hidden=true;
                partialGraph.addEdge(indice,source,target,edge);
                if((typeof nodes2[source])=="undefined"){
                    nodes2[source] = {
                        label: Nodes[source].label,
                        neighbours: []
                    };
                    nodes2[source].neighbours.push(target);
                }
                else nodes2[source].neighbours.push(target);
            }
            
            
            if(edge.attributes[1].val=="bipartite"){   
                edge.hidden=true;
                partialGraph.addEdge(indice,source,target,edge);
                /* Document to NGram */
                if((typeof bipartiteD2N[source])=="undefined"){
                    bipartiteD2N[source] = {
                        label: Nodes[source].label,
                        neighbours: []
                    };
                    bipartiteD2N[source].neighbours.push(target);
                }
                else bipartiteD2N[source].neighbours.push(target);
                
                /* NGram to Document */
                if((typeof bipartiteN2D[target])=="undefined"){
                    bipartiteN2D[target] = {
                        label: Nodes[target].label,
                        neighbours: []
                    };
                    bipartiteN2D[target].neighbours.push(source);
                }
                else bipartiteN2D[target].neighbours.push(source);
            }
        }
    }
    
}
    

