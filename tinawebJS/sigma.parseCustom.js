
// TODO REFA longterm refactoring: scanXX and dictifyXX is doing double work
//   (for instance loop on full gexf in scanGexf then again in dictfyGexf)

// Level-01
ParseCustom = function ( format , data ) {
    this.data = data;
    this.format = format;
    this.nbCats = 0;

    // input = GEXFstring
    this.getGEXFCategories = function(aGexfFile) {
        this.data = $.parseXML(aGexfFile) // <===================== (XML parse)
        return scanGexf( this.data );
    }// output = [ "cat1" , "cat2" , ...]


    // input = [ "cat1" , "cat2" , ...]
    this.parseGEXF = function(categories ) {
        return dictfyGexf( this.data , categories );
    }// output = [ nodes, edges, nodes1, ... ]



    // input = JSONstring
    this.getJSONCategories = function(json) {
        this.data = json;
        return scanJSON( this.data );
    }// output = [ "cat1" , "cat2" , ...]


    // input = [ "cat1" , "cat2" , ...]
    this.parseJSON = function(categories ) {
        return dictfyJSON( this.data , categories );
    }// output = [ nodes, edges, nodes1, ... ]
};

// Level-02
ParseCustom.prototype.scanFile = function() {
    switch (this.format) {
        case "api.json":
            console.log("scanFile: "+this.format)
            break;
        case "db.json":
            console.log("scanFile: "+this.format)
            break;
        case "json":
            console.log("scanFile: "+this.format)
            categories = this.getJSONCategories( this.data );
            return categories;
            break;
        case "gexf":
            console.log("scanFile: "+this.format)
            categories = this.getGEXFCategories( this.data );
            return categories;
            break;
        default:
            console.log("scanFile   jsaispas: "+this.format)
            break;
    }
};

// Level-02
ParseCustom.prototype.makeDicts = function(categories) {
    switch (this.format) {
        case "api.json":
            console.log("makeDicts: "+this.format)
            break;
        case "db.json":
            console.log("makeDicts: "+this.format)
            break;
        case "json":
            console.log("makeDicts: "+this.format)
            dictionaries = this.parseJSON( categories );
            return dictionaries;
            break;
        case "gexf":
            console.log("makeDicts: "+this.format)
            dictionaries = this.parseGEXF( categories );
            return dictionaries;
            break;
        default:
            console.log("makeDicts   jsaispas: "+this.format)
            break;
    }
};




function gexfCheckAttributesMap (someXMLContent) {

    // excerpt from targeted XML:
    // <graph defaultedgetype="undirected" mode="static">
    // |  <attributes class="node" mode="static">
    // |    <attribute id="0" title="category" type="string"></attribute>
    // |    <attribute id="1" title="country" type="float"></attribute>
    // |  </attributes>
    //   (...)


      // THIS SEGMENT USED TO BE IN dictifyGexf
      // Census of the conversions between attr and some attr name
      var i, j, k;
      var nodesAttributes = [];   // The list of attributes of the nodes of the graph that we build in json
      var edgesAttributes = [];   // The list of attributes of the edges of the graph that we build in json

      // In the gexf (that is an xml), the list of xml nodes 'attributes' (note the plural 's')
      var attributesNodes = someXMLContent.getElementsByTagName('attributes');

      for(i = 0; i<attributesNodes.length; i++){
          var attributesNode = attributesNodes[i];  // attributesNode is each xml node 'attributes' (plural)
          if(attributesNode.getAttribute('class') == 'node'){
              var attributeNodes = attributesNode.getElementsByTagName('attribute');  // The list of xml nodes 'attribute' (no 's')
              for(j = 0; j<attributeNodes.length; j++){
                  var attributeNode = attributeNodes[j];  // Each xml node 'attribute'

                  var id = attributeNode.getAttribute('id'),
                  title = attributeNode.getAttribute('title'),
                  type = attributeNode.getAttribute('type');

                  // ex:    id   = "in-degree"   or "3"  <= can be an int to be resolved into the title
                  // ex:   title = "in-degree"
                  // ex:   type  = "string"

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
      } //out: nodesAttributes Array

      console.debug('>>> tr: nodesAttributes', nodesAttributes)
      console.debug('>>> tr: edgesAttributes', edgesAttributes)

      return {nAttrs: nodesAttributes, eAttrs: edgesAttributes}
}

// Level-00
function scanGexf(gexfContent) {
  console.log("ParseCustom : scanGexf ======= ")
    var categoriesDict={}, categories=[];


    // adding gexfCheckAttributesMap call
    // to create a map from nodes/node/@for values to declared attribute name (title)

    var declaredAttrs = gexfCheckAttributesMap(gexfContent)

    elsNodes = gexfContent.getElementsByTagName('nodes');
    // console.debug('>>> tr: elsNodes', elsNodes) // <<<
    for(i=0; i<elsNodes.length; i++){
        var elNodes = elsNodes[i];  // Each xml node 'nodes' (plural)
        node = elNodes.getElementsByTagName('node');
        for(j=0; j<node.length; j++){
            attvalueNodes = node[j].getElementsByTagName('attvalue');
            for(k=0; k<attvalueNodes.length; k++){
                attvalueNode = attvalueNodes[k];
                attr = attvalueNode.getAttribute('for');
                val = attvalueNode.getAttribute('value');

                // some attrs are gexf-local indices refering to an <attributes> declaration
                // so if it matches declared we translate their integer in title
                // FIXME use a dict by id in gexfCheckAttributesMap for loop rm
                if(Number.isInteger(Number(attr))) {
                  // mini loop inside declared node attrs (eg substitute 0 for 'centrality')
                  for (var l=0;l<declaredAttrs.nAttrs.length;l++) {
                    let declared = declaredAttrs.nAttrs[l]
                    if (declared.id == attr) {
                      attr = declared.title
                    }
                  }
                }
                // console.log('attr', attr)

                // THIS WILL BECOME catDict (if ncats == 1 => monopart)
                if (attr=="category") categoriesDict[val]=val;
            }
        }
    }

    for(var cat in categoriesDict)
        // usually a just a few cats over entire node set
        // ex: terms
        // ex: ISItermsriskV2_140 & ISItermsriskV2_140
        console.debug('>>> tr: cat', cat)
        categories.push(cat);

    var catDict = {}
    if(categories.length==0) {
        categories[0]="Document";
        catDict["Document"] = 0;
    }
    if(categories.length==1) {
        catDict[categories[0]] = 0;
    }
    if(categories.length>1) {
        var newcats = []
        for(var i in categories) {
            c = categories[i]
            if(c.indexOf("term")==-1) {// NOT a term-category
                newcats[0] = c;
                catDict[c] = 0;
            }
            else {
                newcats[1] = c; // IS a term-category
                catDict[c] = 1;
            }
        }
        categories = newcats;
    }
    return categories;
}

// Level-00
// for {1,2}partite graphs
function dictfyGexf( gexf , categories ){

  console.log("ParseCustom gexf 2nd loop, main data extraction, with categories", categories)


    // var catDict = {'terms':"0"}

    var catDict = {}
    var catCount = {}
    for(var i in categories)  catDict[categories[i]] = i;

    var edges={}, nodes={}, nodes1={}, nodes2=false, bipartiteD2N=false, bipartiteN2D=false;
    if(categories.length>1) {
        nodes2={}, bipartiteD2N={}, bipartiteN2D={}
    }

    // --------------------8<-----------------------
    // HERE REMOVED XML <attributes> parsing
    //              b/c a priori useless at this point ?
    //             (moved earlier to scanGexf)
    //
    // var atts = gexfCheckAttributesMap(gexf)
    // var nodesAttributes = atts.nAttrs
    // var edgesAttributes = atts.eAttrs
    // --------------------8<-----------------------

    var elsNodes = gexf.getElementsByTagName('nodes') // The list of xml nodes 'nodes' (plural)
    labels = [];
    minNodeSize=999.00;
    maxNodeSize=0.001;
    numberOfDocs=0;
    numberOfNGrams=0;

    // debug: for local stats
    // let allSizes = []
    // let sumSizes = 0
    // let sizeStats = {'mean':null, 'median':null, 'max':0, 'min':1000000000}

    // usually there is only 1 <nodes> element...
    for(i=0; i<elsNodes.length; i++) {
        var elNodes = elsNodes[i];  // Each xml element 'nodes' (plural)
        var elsNode = elNodes.getElementsByTagName('node'); // The list of xml nodes 'node' (no 's')

        for(j=0; j<elsNode.length; j++) {

            var elNode = elsNode[j];  // Each xml node 'node' (no 's')

            // window.NODE = elNode;

            if (j == 0) {
              console.debug('>>> tr: XML nodes/node (1 of'+elsNode.length+')', elNodes)
            }

            // [ get ID ]
            var id = elNode.getAttribute('id');
            // [ get Label ]
            var label = elNode.getAttribute('label') || id;

            // [ get Size ]
            var size=false;
            sizeNodes = elNode.getElementsByTagName('size');
            sizeNodes = sizeNodes.length ? sizeNodes : elNode.getElementsByTagName('viz:size');
            if(sizeNodes.length>0){
              sizeNode = sizeNodes[0];
              size = parseFloat(sizeNode.getAttribute('value'));

              // debug: for stats  ---------------------------
              // allSizes.push(size)
              // sumSizes += size
              // if (size < sizeStats.min)  sizeStats.min = size
              // if (size > sizeStats.max)  sizeStats.max = size
              // --------------------------------------------

            }// [ / get Size ]
            // console.debug('>>> tr: node size', size)

            // [ get Coordinates ]
            var x = 100 - 200*Math.random();
            var y = 100 - 200*Math.random();
            var positionNodes = elNode.getElementsByTagName('position');
            positionNodes = positionNodes.length ? positionNodes : elNode.getElementsByTagNameNS('*','position');
            if(positionNodes.length>0){
                var positionNode = positionNodes[0];
                x = parseFloat(positionNode.getAttribute('x'));
                y = parseFloat(positionNode.getAttribute('y'));
            }// [ / get Coordinates ]
            // x = x*-1
            y = y*-1   // aka -y

            // [ get Colour ]
            var colorNodes = elNode.getElementsByTagName('color');
            colorNodes = colorNodes.length ? colorNodes : elNode.getElementsByTagNameNS('*','color');
            var color;
            if(colorNodes.length>0){
                colorNode = colorNodes[0];
                color = '#'+sigmaTools.rgbToHex(parseFloat(colorNode.getAttribute('r')),
                    parseFloat(colorNode.getAttribute('g')),
                    parseFloat(colorNode.getAttribute('b')));
            }// [ / get Colour ]

            var node = ({
                id:id,
                label:label,
                size:size,
                x:x,
                y:y,
                color:color
            });

            // console.debug('>>> tr: read node', node)


            // Attribute values
            var attributes = []
            var attvalueNodes = elNode.getElementsByTagName('attvalue');
            var atts={};
            for(k=0; k<attvalueNodes.length; k++){
                var attvalueNode = attvalueNodes[k];
                var attr = attvalueNode.getAttribute('for');
                var val = attvalueNode.getAttribute('value');



                // TODO use here nodesAttributes










                if(catDict[val]) atts["category"] = val;






                else atts[attr]=val;
                attributes = atts;
            }

            // nodew=parseInt(attributes["weight"]);
            if ( attributes["category"] ) {
              node_cat = attributes["category"];
            }
            else {
              node_cat = 0     // basic TW node type is 0 (~ terms)
            }

            node.type = node_cat;
            if (!catCount[node_cat]) catCount[node_cat] = 0
            catCount[node_cat]++;

            // node.id = (node_cat==categories[0])? ("D:"+node.id) : ("N:"+node.id);
            if(!node.size) console.log("node without size: "+node.id+" : "+node.label);

            node.attributes = attributes;

            // save record
            nodes[node.id] = node

            if(parseInt(node.size) < parseInt(minNodeSize))
                minNodeSize= node.size;

            if(parseInt(node.size) > parseInt(maxNodeSize))
                maxNodeSize= node.size;

        }
    }

    // console.warn ('parseCustom output nodes', nodes)

    // -------------- debug: for local stats ----------------
    // allSizes.sort();
    // let N = allSizes.length
    // sizeStats.median = allSizes[Math.round(N/2)]
    // sizeStats.mean = Math.round(sumSizes/N * 100)/100
    //
    // console.log("parseCustom(gexf) sizeStats:", sizeStats)
    // ------------- /debug: for local stats ----------------

    var attention = false
    if( TW.Clusters.length == 0 ) {
        for( var i in nodes ) {
            if( nodes[i].attributes["cluster_index"] ) {
                attention = true;
            }
            break
        }
    }

    TW.Clusters = {}
    //New scale for node size: now, between 2 and 5 instead [1,70]
    for(var it in nodes){
        nodes[it].size =  desirableNodeSizeMIN+ (parseInt(nodes[it].size)-1)*((desirableNodeSizeMAX-desirableNodeSizeMIN) / (maxNodeSize-minNodeSize));
        if(attention) {
            var t_type = nodes[it].type
            var t_cnumber = nodes[it].attributes["cluster_index"]
            if (!t_cnumber) {
              t_cnumber = nodes[it].attributes[TW.nodeClusAtt]
            }
            nodes[it].attributes["clust_default"] = t_cnumber;
            var t_label = (nodes[it].attributes["cluster_label"])?nodes[it].attributes["cluster_label"]:"cluster_"+nodes[it].attributes["cluster_index"]
            if(!TW.Clusters[t_type]) {
                TW.Clusters[t_type] = {}
                TW.Clusters[t_type]["clust_default"] = {}
            }
            TW.Clusters[t_type]["clust_default"][t_cnumber] = t_label
        }
        // TW.partialGraph._core.graph.nodesIndex[it].size=Nodes[it].size;
    }

    var edgeId = 0;
    var edgesNodes = gexf.getElementsByTagName('edges');
    for(i=0; i<edgesNodes.length; i++) {
        var edgesNode = edgesNodes[i];
        var edgeNodes = edgesNode.getElementsByTagName('edge');
        for(j=0; j<edgeNodes.length; j++) {
            var edgeNode = edgeNodes[j];
            var source = parseInt( edgeNode.getAttribute('source') );
            var target = parseInt( edgeNode.getAttribute('target') );
            var type = edgeNode.getAttribute('type');//line or curve

            var indice=source+";"+target;

            var edge = {
                id: indice,
                source: source,
                target: target,
                type : (type) ? type : sigmaJsDrawingProperties['defaultEdgeType'],
                label: "",
                categ: "",
                attributes: []
            };

            edge_weight = edgeNode.getAttribute('weight')
            edge.weight = (edge_weight)?edge_weight:1;

            var kind;
            var attvalueNodes = edgeNode.getElementsByTagName('attvalue');
            for(k=0; k<attvalueNodes.length; k++){
                var attvalueNode = attvalueNodes[k];
                var attr = attvalueNode.getAttribute('for');
                var val = attvalueNode.getAttribute('value');
                edge.attributes.push({
                    attr:attr,
                    val:val
                });
            }

            // console.debug('>>> tr: read edge', edge)

            if ( nodes[source] && nodes[target] ) {
                // console.debug('>>> tr: new edge has matching source and target nodes')

                idS=nodes[source].type;
                idT=nodes[target].type;

                // if(source==89 || target==89) console.log(edge)

                // [ New Code! ]
                petitDict = {}
                petitDict[ nodes[source].type ] = true;
                petitDict[ nodes[target].type ] = true;
                idInRelations = []
                for(var c in petitDict) idInRelations[catDict[c]] = true;
                for(var c=0; c<categories.length;c++) {
                    if(!idInRelations[c]) idInRelations[c] = false;
                }
                idArray = idInRelations.map(Number).join("|")
                edge.categ = idArray;
                if(!TW.Relations[idArray]) TW.Relations[idArray] = {}

                if(isUndef(TW.Relations[idArray][source])) TW.Relations[idArray][source] = {};
                if(isUndef(TW.Relations[idArray][target]))  TW.Relations[idArray][target] = {};
                TW.Relations[idArray][source][target]=true;
                TW.Relations[idArray][target][source]=true;
                // [ / New Code! ]


                // Doc <-> Doc
                if(idS==categories[0] && idT==categories[0] ) {

                    edge.label = "nodes1";
                    if(isUndef(nodes1[source])) {
                        nodes1[source] = {
                            label: nodes[source].label,
                            neighbours: []
                        };
                    }
                    if(isUndef(nodes1[target])) {
                        nodes1[target] = {
                            label: nodes[target].label,
                            neighbours: []
                        };
                    }
                    nodes1[source].neighbours.push(target);
                    nodes1[target].neighbours.push(source);
                    // TW.partialGraph.addEdge(indice,source,target,edge);
                }

                if(categories.length>1) {

                    // Term <-> Term
                    if(idS==categories[1] && idT==categories[1]){
                        edge.label = "nodes2";

                        if(isUndef(nodes2[source])) {
                            nodes2[source] = {
                                label: nodes[source].label,
                                neighbours: []
                            };
                        }
                        if(isUndef(nodes2[target])) {
                            nodes2[target] = {
                                label: nodes[target].label,
                                neighbours: []
                            };
                        }
                        nodes2[source].neighbours.push(target);
                        nodes2[target].neighbours.push(source);

                        // otherGraph.addEdge(indice,source,target,edge);
                    }

                    // Doc <-> Term
                    if((idS==categories[0] && idT==categories[1]) ||
                        (idS==categories[1] && idT==categories[0])) {
                        edge.label = "bipartite";

                        // // Source is Document
                        if(idS == categories[0]) {

                            if(isUndef(bipartiteD2N[source])) {
                                bipartiteD2N[source] = {
                                    label: nodes[source].label,
                                    neighbours: []
                                };
                            }
                            if(isUndef(bipartiteN2D[target])) {
                                bipartiteN2D[target] = {
                                    label: nodes[target].label,
                                    neighbours: []
                                };
                            }

                            bipartiteD2N[source].neighbours.push(target);
                            bipartiteN2D[target].neighbours.push(source);

                        // // Source is NGram
                        } else {

                            if(isUndef(bipartiteN2D[source])) {
                                bipartiteN2D[source] = {
                                    label: nodes[source].label,
                                    neighbours: []
                                };
                            }
                            if(isUndef(bipartiteD2N[target])) {
                                bipartiteD2N[target] = {
                                    label: nodes[target].label,
                                    neighbours: []
                                };
                            }
                            bipartiteN2D[source].neighbours.push(target);
                            bipartiteD2N[target].neighbours.push(source);
                        }
                    }
                }

                if(!edges[target+";"+source])
                    edges[indice] = edge;




            }
        }
    }

    for(var i in TW.Relations) {
        for(var j in TW.Relations[i]) {
            TW.Relations[i][j] = Object.keys(TW.Relations[i][j]).map(Number)
        }
    }


    // ------------------------------- resDict <<<
    resDict = {}
    // TODO unify catDict and catCount (dict is count.keys())
    resDict.catDict = catDict;          // ex : {'ISIterms':0}
    resDict.catCount = catCount;        // ex:  {'ISIterms':1877}  ie #nodes
    resDict.nodes = nodes;              //  { nid1: {label:"...", size:"11.1", attributes:"...", color:"#aaa", etc}, nid2: ...}
    resDict.edges = edges;
    resDict.n1 = nodes1;       // relations
    if(nodes2) resDict.n2 = nodes2;
    if(bipartiteD2N) resDict.D2N = bipartiteD2N;
    if(bipartiteN2D) resDict.N2D = bipartiteN2D;

    return resDict;
}

// Level-00
function scanJSON( data ) {

    var categoriesDict={}, categories=[];
    var nodes = data.nodes;

    for(var i in nodes) {
        n = nodes[i];
        if(n.type) categoriesDict[n.type]=n.type;
    }

    for(var cat in categoriesDict)
        categories.push(cat);

    var catDict = {}
    if(categories.length==0) {
        categories[0]="Document";
        catDict["Document"] = 0;
    }
    if(categories.length==1) {
        catDict[categories[0]] = 0;
    }
    if(categories.length>1) {
        var newcats = []
        for(var i in categories) {
            c = categories[i]
            if(c.indexOf("term")==-1) {// NOT a term-category
                newcats[0] = c;
                catDict[c] = 0;
            }
            else {
                newcats[1] = c; // IS a term-category
                catDict[c] = 1;
            }
        }
        categories = newcats;
    }

    return categories;
}

// Level-00
// for {1,2}partite graphs
function dictfyJSON( data , categories ) {

    var catDict = {}
    var catCount = {}
    for(var i in categories)  catDict[categories[i]] = i;

    var edges={}, nodes={}, nodes1={}, nodes2=false, bipartiteD2N=false, bipartiteN2D=false;

    if(categories.length>1) {
        nodes2={}, bipartiteD2N={}, bipartiteN2D={}
    }

    for(var i in data.nodes) {
        n = data.nodes[i];
        node = {}
        node.id = n.id;
        node.label = (n.label)? n.label : ("node_"+n.id) ;
        node.size = (n.size)? n.size : 3 ;
        node.type = (n.type)? n.type : "Document" ;
        node.x = (n.x)? n.x : Math.random();
        node.y = (n.y)? n.y : Math.random();
        node.color = (n.color)? n.color : "#FFFFFF" ;
        if(n.shape) node.shape = n.shape;
        if(n.attributes) node.attributes = n.attributes;
        node.type = (n.type)? n.type : categories[0] ;
        // node.shape = "square";

        if (!catCount[node.type]) catCount[node.type] = 0
        catCount[node.type]++;

        nodes[n.id] = node;
    }

    colorList.sort(function(){ return Math.random()-0.5; });
    for (var i in nodes ){
        if (nodes[i].color=="#FFFFFF") {
            var attval = ( isUndef(nodes[i].attributes) || isUndef(nodes[i].attributes["clust_default"]) )? 0 : nodes[i].attributes["clust_default"] ;
            nodes[i].color = colorList[ attval ]
        }
    }

    for(var i in data.links){
        e = data.links[i];
        edge = {}

        var source = (!isUndef(e.s))? e.s : e.source;
        var target = (!isUndef(e.t))? e.t : e.target;
        var weight = (!isUndef(e.w))? e.w : e.weight;
        var type = (!isUndef(e.type))? e.type : "curve";
        var id=source+";"+target;

        edge.id = id;
        edge.source = parseInt(source);
        edge.target = parseInt(target);
        edge.weight = weight;
        edge.type = type;

        if (nodes[source] && nodes[target]) {
            idS=nodes[source].type;
            idT=nodes[target].type;


            // [ New Code! ]
            petitDict = {}
            petitDict[ nodes[source].type ] = true;
            petitDict[ nodes[target].type ] = true;
            idInRelations = []
            for(var c in petitDict) idInRelations[catDict[c]] = true;
            for(var c=0; c<categories.length;c++) {
                if(!idInRelations[c]) idInRelations[c] = false;
            }
            idArray = idInRelations.map(Number).join("|")
            edge.categ = idArray;
            if(!TW.Relations[idArray]) TW.Relations[idArray] = {}

            if(isUndef(TW.Relations[idArray][source])) TW.Relations[idArray][source] = {};
            if(isUndef(TW.Relations[idArray][target]))  TW.Relations[idArray][target] = {};
            TW.Relations[idArray][source][target]=true;
            TW.Relations[idArray][target][source]=true;
            // [ / New Code! ]


            // Doc <-> Doc
            if(idS==categories[0] && idT==categories[0] ) {

                edge.label = "nodes1";
                if(isUndef(nodes1[source])) {
                    nodes1[source] = {
                        label: nodes[source].label,
                        neighbours: []
                    };
                }
                if(isUndef(nodes1[target])) {
                    nodes1[target] = {
                        label: nodes[target].label,
                        neighbours: []
                    };
                }
                nodes1[source].neighbours.push(target);
                nodes1[target].neighbours.push(source);
            }

            if(categories.length>1) {

                // Term <-> Term
                if(idS==categories[1] && idT==categories[1]){
                    edge.label = "nodes2";

                    if(isUndef(nodes2[source])) {
                        nodes2[source] = {
                            label: nodes[source].label,
                            neighbours: []
                        };
                    }
                    if(isUndef(nodes2[target])) {
                        nodes2[target] = {
                            label: nodes[target].label,
                            neighbours: []
                        };
                    }
                    nodes2[source].neighbours.push(target);
                    nodes2[target].neighbours.push(source);

                    // otherGraph.addEdge(indice,source,target,edge);
                }

                // Doc <-> Term
                if((idS==categories[0] && idT==categories[1]) ||
                    (idS==categories[1] && idT==categories[0])) {
                    edge.label = "bipartite";

                    // // Source is Document
                    if(idS == categories[0]) {

                        if(isUndef(bipartiteD2N[source])) {
                            bipartiteD2N[source] = {
                                label: nodes[source].label,
                                neighbours: []
                            };
                        }
                        if(isUndef(bipartiteN2D[target])) {
                            bipartiteN2D[target] = {
                                label: nodes[target].label,
                                neighbours: []
                            };
                        }

                        bipartiteD2N[source].neighbours.push(target);
                        bipartiteN2D[target].neighbours.push(source);

                    // // Source is NGram
                    } else {

                        if(isUndef(bipartiteN2D[source])) {
                            bipartiteN2D[source] = {
                                label: nodes[source].label,
                                neighbours: []
                            };
                        }
                        if(isUndef(bipartiteD2N[target])) {
                            bipartiteD2N[target] = {
                                label: nodes[target].label,
                                neighbours: []
                            };
                        }
                        bipartiteN2D[source].neighbours.push(target);
                        bipartiteD2N[target].neighbours.push(source);
                    }
                }
            }

            if(!edges[target+";"+source])
                edges[id] = edge;
        }
    }

    for(var i in TW.Relations) {
        for(var j in TW.Relations[i]) {
            TW.Relations[i][j] = Object.keys(TW.Relations[i][j]).map(Number)
        }
    }

    resDict = {}
    resDict.catDict = catDict;
    resDict.catCount = catCount;
    resDict.nodes = nodes;
    resDict.edges = edges;
    resDict.n1 = nodes1;
    if(nodes2) resDict.n2 = nodes2;
    if(bipartiteD2N) resDict.D2N = bipartiteD2N;
    if(bipartiteN2D) resDict.N2D = bipartiteN2D;

    return resDict;
}

// to move
function buildInitialState( categories ) {
    var firstState = []
    for(var i=0; i<categories.length ; i++) {
        if(i==0) firstState.push(true)
        else firstState.push(false)
    }
    return firstState;
}

//to move
function makeSystemStates (cats) {
    var systemstates = {}
    var N=Math.pow(2 , cats.length);

    for (i = 0; i < N; i++) {

        bin = (i).toString(2)
        bin_splitted = []
        for(var j in bin)
            bin_splitted.push(bin[j])

        bin_array = [];
        toadd = cats.length-bin_splitted.length;
        for (k = 0; k < toadd; k++)
            bin_array.push("0")

        for(var j in bin)
            bin_array.push(bin[j])

        bin_array = bin_array.map(Number)
        sum = bin_array.reduce(function(a, b){return a+b;})

        if( sum != 0 && sum < 3) {
            id = bin_array.join("|")
            systemstates[id] = bin_array.map(Boolean)
        }
    }
    return systemstates;
}
