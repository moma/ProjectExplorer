/*
 *Categories example (bigraph):
 *  ISItermsAlexandrePartCountry
 *  Authors
 **/


function parse(gexfPath) {
    var gexfhttp;
    gexfhttp = window.XMLHttpRequest ?
    new XMLHttpRequest() :
    new ActiveXObject('Microsoft.XMLHTTP');

    gexfhttp.open('GET', gexfPath, false);
    gexfhttp.send();
    gexf = gexfhttp.responseXML;
}


function scanCategories(){
    nodesNodes = gexf.getElementsByTagName('nodes');
    for(i=0; i<nodesNodes.length; i++){       
        var nodesNode = nodesNodes[i];  // Each xml node 'nodes' (plural)
        node = nodesNode.getElementsByTagName('node');
        
        for(j=0; j<node.length; j++){
            attvalueNodes = node[j].getElementsByTagName('attvalue');
            for(k=0; k<attvalueNodes.length; k++){
                attvalueNode = attvalueNodes[k];
                attr = attvalueNode.getAttribute('for');
                val = attvalueNode.getAttribute('value');
                pr(val)
                if (attr=="category") categories[val]=val;
            }
        }
    }
    pr("The categories");
    pr(categories);
    pr("");
    i=0;
    for (var cat in categories) {
        categoriesIndex[i] = cat;
        i++;
    }
    pr("The categoriesIndex");
    pr(categoriesIndex);
    pr("");
    return Object.keys(categories).length;
}


function onepartiteExtract(){
    
    var i, j, k;
    //    partialGraph.emptyGraph();
    // Parse Attributes
    // This is confusing, so I'll comment heavily
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
    minNodeSize=5.00;
    maxNodeSize=5.00;
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
            var size=1;
            sizeNodes = nodeNode.getElementsByTagName('size');
            sizeNodes = sizeNodes.length ?
                        sizeNodes :
                        nodeNode.getElementsByTagName('viz:size');
            if(sizeNodes.length>0){
              sizeNode = sizeNodes[0];
              size = parseFloat(sizeNode.getAttribute('value'));
            }
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
            var atts={};
            for(k=0; k<attvalueNodes.length; k++){
                var attvalueNode = attvalueNodes[k];
                var attr = attvalueNode.getAttribute('for');
                var val = attvalueNode.getAttribute('value');
                   // node.attributes.push({
                   //     attr:attr, 
                   //     val:val
                   // });
                atts[attr]=val;
                node.attributes = atts;
            }
            node.id=id;
            node.type = catSoc;
            //if(node.attributes[0].attr=="weight"){
            if(typeof(node.size)==="undefined") node.size=parseInt(node.attributes["weight"]);
            //}
               // if(node.attributes[1].attr=="weight"){
               //     node.size=node.attributes[1].val;
               // }
                
            partialGraph.addNode(id,node);
            labels.push({
                'label' : label,
                'desc'  : node.type
            });
            
            if(parseInt(node.size) < parseInt(minNodeSize)) minNodeSize= node.size;
            if(parseInt(node.size) > parseInt(maxNodeSize)) maxNodeSize= node.size;
            // Create Node
            Nodes[id] = node  // The graph node
            //pr(node);
        }
    }    
    
    //New scale for node size: now, between 2 and 5 instead [1,70]
    for(var it in Nodes){
        Nodes[it].size = 
        desirableNodeSizeMIN+
        (parseInt(Nodes[it].size)-1)*
        ((desirableNodeSizeMAX-desirableNodeSizeMIN)/
            (maxNodeSize-minNodeSize));
        partialGraph._core.graph.nodesIndex[it].size=Nodes[it].size;
    }
    

    var edgeId = 0;
    var edgesNodes = gexf.getElementsByTagName('edges');
    minEdgeWeight=5.0;
    maxEdgeWeight=0.0;
    for(i=0; i<edgesNodes.length; i++){
        var edgesNode = edgesNodes[i];
        var edgeNodes = edgesNode.getElementsByTagName('edge');
        for(j=0; j<edgeNodes.length; j++){
            var edgeNode = edgeNodes[j];
            var source = edgeNode.getAttribute('source');
            var target = edgeNode.getAttribute('target');
            var indice=source+";"+target;
            
            var edge = {
                id:         j,
                sourceID:   source,
                targetID:   target,
                label:      "",
                weight: 1,
                lock: false,
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
                if(k==3) {
                    edge.weight = val;
                    if(edge.weight < minEdgeWeight) minEdgeWeight= edge.weight;
                    if(edge.weight > maxEdgeWeight) maxEdgeWeight= edge.weight;
                }
                edge.attributes.push({
                    attr:attr, 
                    val:val
                });
            }
            edge.label="nodes1";            
            if((typeof nodes1[source])=="undefined"){
                nodes1[source] = {
                    label: Nodes[source].label,
                    neighbours: []
                };
                nodes1[source].neighbours.push(target);
            } else nodes1[source].neighbours.push(target);        
            if((typeof nodes1[target])=="undefined"){
                nodes1[target] = {
                    label: Nodes[target].label,
                    neighbours: []
                };
                nodes1[target].neighbours.push(source);
            } else nodes1[target].neighbours.push(source);
            Edges[indice] = edge;
            if( (typeof partialGraph._core.graph.edgesIndex[target+";"+source])=="undefined" ){
                partialGraph.addEdge(indice,source,target,edge);
            }
                            
        }
    }
}

function fullExtract(){
    var i, j, k;
    // Parse Attributes
    // This is confusing, so I'll comment heavily
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
            
            var size=1;
            sizeNodes = nodeNode.getElementsByTagName('size');
            sizeNodes = sizeNodes.length ?
                        sizeNodes :
                        nodeNode.getElementsByTagName('viz:size');
            if(sizeNodes.length>0){
              sizeNode = sizeNodes[0];
              size = parseFloat(sizeNode.getAttribute('value'));
            }
            
            var x = 100 - 200*Math.random();
            var y = 100 - 200*Math.random();
            var color;
      
            var positionNodes = nodeNode.getElementsByTagName('position');
            positionNodes = positionNodes.length ? positionNodes : nodeNode.getElementsByTagNameNS('*','position');
            if(positionNodes.length>0){
                var positionNode = positionNodes[0];
                x = parseFloat(positionNode.getAttribute('x'));
                y = parseFloat(positionNode.getAttribute('y'));
            }

            var colorNodes = nodeNode.getElementsByTagName('color');
            colorNodes = colorNodes.length ? colorNodes : nodeNode.getElementsByTagNameNS('*','color');
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
            var atts={};
            for(k=0; k<attvalueNodes.length; k++){
                var attvalueNode = attvalueNodes[k];
                var attr = attvalueNode.getAttribute('for');
                var val = attvalueNode.getAttribute('value');
                atts[attr]=val;
                node.attributes = atts;
                /*      Para asignar tamaño a los NGrams    */
                if(atts["category"]===categoriesIndex[1]) {
                    if(typeof(node.size)==="undefined") node.size=parseInt(val).toFixed(2);
                   /* Type of Node*/
                   //console.log(val);
                   //if(val<30) val=30;
                   //Nodes[id].size=(parseInt(val).toFixed(2)*5)/70;
                   //                    Nodes[id].size=parseInt(val).toFixed(2);
                   //                    node.size=Nodes[id].size;
                   //                    if(id.charAt(0)=="D") {
                   //                        Nodes[id].size = "5";
                   //                        node.size = "5";
                   //                    }
                }
                /*      Para asignar tamaño a los NGrams    */
            }
            //console.log(node.attributes);
            nodecat=node.attributes["category"];
            nodew=parseInt(node.attributes["weight"]);
            if( nodecat===categoriesIndex[1]){
                node.type=catSoc;
                node.shape="square";
                numberOfDocs++;
                //node.size=desirableScholarSize;
                if(typeof(node.size)==="undefined") node.size=nodew;
            }
            else {
                node.type=catSem;
                numberOfNGrams++;
                if(typeof(node.size)==="undefined") node.size=nodew;
            }      
            
            if(parseInt(node.size) < parseInt(minNodeSize)) minNodeSize= node.size;
            if(parseInt(node.size) > parseInt(maxNodeSize)) maxNodeSize= node.size;
            // Create Node
            Nodes[id] = node  // The graph node
            //pr(Nodes[id]);
        }
    }  
    //New scale for node size: now, between 2 and 5 instead [1,70]
    for(var i in Nodes){
        normalizedSize=desirableNodeSizeMIN+(Nodes[i].size-1)*((desirableNodeSizeMAX-desirableNodeSizeMIN)/(parseInt(maxNodeSize)-parseInt(minNodeSize)));
        Nodes[i].size = ""+normalizedSize;
        if(Nodes[i].type==catSem) {
            nodeK = Nodes[i];
            nodeK.hidden=true;
            partialGraph.addNode(i,nodeK);  
            delete Nodes[i].hidden; 
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
                if(k==3) {
                    edge.weight = val;
                    if(edge.weight < minEdgeWeight) minEdgeWeight= edge.weight;
                    if(edge.weight > maxEdgeWeight) maxEdgeWeight= edge.weight;
                }
                edge.attributes.push({
                    attr:attr, 
                    val:val
                });
            }
            
            
            idS=Nodes[edge.sourceID].type.charAt(0);
            idT=Nodes[edge.targetID].type.charAt(0);
            //pr(idS+";"+idT);
            if(idS=="D" && idT=="D"){
                edge.label="nodes1";
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
                
               // if((typeof nodes1[target])=="undefined"){
               //     nodes1[target] = {
               //         label: Nodes[target].label,
               //         neighbours: []
               //     };
               //     nodes1[target].neighbours.push(source);
               // }
               // else nodes1[target].neighbours.push(source);
            }
           
           
            if(idS=="N" && idT=="N"){
                edge.label="nodes2";
                //pr("nodes2");
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
            
            if((idS=="D" && idT=="N")||(idS=="N" && idT=="D")){
                edge.label="bipartite";
                //pr("bipartite");
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
            partialGraph.addEdge(indice,source,target,edge);
            delete edge.hidden;
            Edges[indice]=edge;
        }
    }
}
    

function extractFromJson(data,seed){
    var i, j, k;
    rand=new RVUniformC(seed);                     
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
    
    categories[catSoc]=catSoc;
    categories[catSem]=catSem;
    categoriesIndex[0]=catSoc;
    categoriesIndex[1]=catSem;

    for(var i in nodesNodes) {
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
                x:rand.getRandom(), 
                y:rand.getRandom(), 
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
                node.CC = nodesNodes[i].CC;
                node.ACR = nodesNodes[i].ACR;
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
        // pr(Nodes[i])
    }
    
    var edgeId = 0;
    var edgesNodes = data.edges;
    for(var i in edgesNodes) {
        //pr(edgesNodes[i]);        
        var source = edgesNodes[i].s;
        var target = edgesNodes[i].t;
        var indice=source+";"+target;
        if(indice.indexOf("D::593")!==-1) pr(indice)
        var edge = {
                id:         indice,
                sourceID:   source,
                targetID:   target,
                lock : false,
                label:      edgesNodes[i].type,
                weight: edgesNodes[i].w
            };
        if(edge.weight < minEdgeWeight) minEdgeWeight= edge.weight;
        if(edge.weight > maxEdgeWeight) maxEdgeWeight= edge.weight;
        Edges[indice] = edge;
        
        
        
        
            if(edge.label=="nodes1"){   
                edge.hidden=false;

                if(isUndef(nodes1[source])) {
                    nodes1[source] = {
                        label: Nodes[source].label,
                        neighbours: []
                    };                    
                }
                if(isUndef(nodes1[target])) {
                    nodes1[target] = {
                        label: Nodes[target].label,
                        neighbours: []
                    };                    
                }   
                nodes1[source].neighbours.push(target);
                nodes1[target].neighbours.push(source);
            }
            
            
            if(edge.label=="nodes2"){ 
                edge.hidden=true;

                if(isUndef(nodes2[source])) {
                    nodes2[source] = {
                        label: Nodes[source].label,
                        neighbours: []
                    };                    
                }
                if(isUndef(nodes2[target])) {
                    nodes2[target] = {
                        label: Nodes[target].label,
                        neighbours: []
                    };                    
                }
                nodes2[source].neighbours.push(target);
                nodes2[target].neighbours.push(source);
            }
            
            
            if(edge.label=="bipartite"){   
                edge.hidden=true;

                s = edge.sourceID

                // // Source is Document
                if(Nodes[s].type == catSoc) {

                    if(isUndef(bipartiteD2N[source])) {
                        bipartiteD2N[source] = {
                            label: Nodes[source].label,
                            neighbours: []
                        };                    
                    }
                    if(isUndef(bipartiteN2D[target])) {
                        bipartiteN2D[target] = {
                            label: Nodes[target].label,
                            neighbours: []
                        };                    
                    }

                    bipartiteD2N[source].neighbours.push(target);
                    bipartiteN2D[target].neighbours.push(source);

                // // Source is NGram
                } else {

                    if(isUndef(bipartiteN2D[source])) {
                        bipartiteN2D[source] = {
                            label: Nodes[source].label,
                            neighbours: []
                        };                    
                    }
                    if(isUndef(bipartiteD2N[target])) {
                        bipartiteD2N[target] = {
                            label: Nodes[target].label,
                            neighbours: []
                        };                    
                    }
                    bipartiteN2D[source].neighbours.push(target);
                    bipartiteD2N[target].neighbours.push(source);
                }
            }
            
            //edge.hidden=false/**///should be commented
            partialGraph.addEdge(indice,source,target,edge);
    }
}
