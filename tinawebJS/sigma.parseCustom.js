'use strict';
// TODO REFA longterm refactoring: scanXX and dictifyXX is doing double work
//   (for instance loop on full gexf in scanGexf then again in dictfyGexf)

// Level-01
ParseCustom = function ( format , data ) {

    if (format == 'gexf') {
      this.data = $.parseXML(data)
    }
    else {
      this.data = data
    }
    this.format = format;
    this.nbCats = 0;

    // input = GEXFstring
    this.getGEXFCategories = function() {
        return scanGexf( this.data );
    }// output = {'cats':[ "cat1" , "cat2" , ...], 'rev': {cat1: 0, cat2: 1...}}


    // input = [ "cat1" , "cat2" , ...]
    this.parseGEXF = function(categories ) {
        return dictfyGexf( this.data , categories );
    }// output = [ nodes, edges, nodes1, ... ]



    // input = JSONstring
    this.getJSONCategories = function(json) {
        return scanJSON( this.data );
    }// output = {'cats':[ "cat1" , "cat2" , ...], 'rev': {cat1: 0, cat2: 1...}}


    // input = [ "cat1" , "cat2" , ...]
    this.parseJSON = function(categories ) {
        return dictfyJSON( this.data , categories );
    }// output = [ nodes, edges, nodes1, ... ]
};

// Level-02
ParseCustom.prototype.scanFile = function() {
    let catInfos = {'categories':[], 'lookup_dict': {}}
    switch (this.format) {
        case "api.json":
            console.log("scanFile: "+this.format)
            break;
        case "db.json":
            console.log("scanFile: "+this.format)
            break;
        case "json":
            console.log("scanFile: "+this.format)
            catInfos = this.getJSONCategories( this.data );
            return catInfos;
            break;
        case "gexf":
            console.log("scanFile: "+this.format)
            catInfos = this.getGEXFCategories( this.data );
            return catInfos;
            break;
        default:
            console.log("scanFile   jsaispas: "+this.format)
            break;
    }
};

// Level-02
ParseCustom.prototype.makeDicts = function(categories) {
    let dictionaries = {}
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

      // console.debug('>>> tr: nodesAttributes', nodesAttributes)
      // console.debug('>>> tr: edgesAttributes', edgesAttributes)

      return {nAttrs: nodesAttributes, eAttrs: edgesAttributes}
}

// Level-00
function scanGexf(gexfContent) {
    console.debug("ParseCustom : scanGexf ======= ")
    var categoriesDict={};

    // adding gexfCheckAttributesMap call
    // to create a map from nodes/node/@for values to declared attribute name (title)

    var declaredAttrs = gexfCheckAttributesMap(gexfContent)

    let elsNodes = gexfContent.getElementsByTagName('nodes');
    // console.debug('>>> tr: elsNodes', elsNodes) // <<<
    for(i=0; i<elsNodes.length; i++){
        var elNodes = elsNodes[i];  // Each xml node 'nodes' (plural)
        let node = elNodes.getElementsByTagName('node');
        for(j=0; j<node.length; j++){
            let attvalueNodes = node[j].getElementsByTagName('attvalue');
            for(k=0; k<attvalueNodes.length; k++){
                let attvalueNode = attvalueNodes[k];
                let attr = attvalueNode.getAttribute('for');
                let val = attvalueNode.getAttribute('value');

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

    // sorting observed json node types into Sem (=> 1)/Soc (=> 0)
    return sortNodeTypes(categoriesDict)
}

// sorting observed node types into Sem/Soc (factorized 11/05/2017)
// --------------------
// FIXME this factorizes what we had twice (json & gexf scanFile workflows),
//       and we just added missing TW.catSoc/Sem comparisons
//       *but it doesn't fix the underlying logic*
//       (current expected structure in 'categories' can only accomodate 2 types
//        and the way it and catDict are used is not entirely coherent throughout
//        the project, cf. among others: - the effect on 'typestring'
//                                       - the effect on 'swclickActual'
//                                       - the way default cat is handled as 0...)
// -------------------
// expected content: usually a just a few cats over all nodes
// ex: terms
// ex: ISItermsriskV2_140 & ISItermsriskV2_140
function sortNodeTypes(observedTypesDict) {
  var observedTypes = Object.keys(observedTypesDict)
  var catDict = {}

  var nTypes = observedTypes.length

  if(nTypes==0) {
      observedTypes[0]="Document";
      catDict["Document"] = 0;
  }
  if(nTypes==1) {
      // if we have only one category, it gets the same code 0 as Document
      // but in practice it's more often terms. anyways doesn't affect much
      catDict[observedTypes[0]] = 0;
      console.log("-----cat unique =>0")
  }
  if(nTypes>1) {
      var newcats = []

      // POSSible: allow more than 2 cats
      for(var i in observedTypes) {
          let c = observedTypes[i]
          if(c == TW.catSoc || (c != TW.catSem && c.indexOf("term")==-1)) {// NOT a term-category
              newcats[0] = c;
              catDict[c] = 0;
          }
          else {
              newcats[1] = c; // IS a term-category
              catDict[c] = 1;
          }
      }
      observedTypes = newcats;
  }
  return {'categories': observedTypes, 'lookup_dict': catDict}
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

    var declaredAtts = gexfCheckAttributesMap(gexf)
    var nodesAttributes = declaredAtts.nAttrs
    // var edgesAttributes = declaredAtts.eAttrs

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

    // if scanClusters, we'll also use:
    var tmpVals = {}        // to build inverted index attval => nodes
                            // (to inventory subclasses for a given attr)
                            //   if < maxDiscreteValues: keep all in legend
                            //   else:  show intervals in legend
    var Atts_2_Exclude = {} // to exclude strings that don't convert to number

    // usually there is only 1 <nodes> element...
    for(i=0; i<elsNodes.length; i++) {
        var elNodes = elsNodes[i];  // Each xml element 'nodes' (plural)
        var elsNode = elNodes.getElementsByTagName('node'); // The list of xml nodes 'node' (no 's')

        for(j=0; j<elsNode.length; j++) {

            var elNode = elsNode[j];  // Each xml node 'node' (no 's')

            // window.NODE = elNode;

            // if (j == 0) {
            //   console.debug('>>> tr: XML nodes/node (1 of'+elsNode.length+')', elNodes)
            // }

            // [ get ID ]
            var id = elNode.getAttribute('id');
            // [ get Label ]
            var label = elNode.getAttribute('label') || id;

            // [ get Size ]
            var size=false;
            let sizeNodes = elNode.getElementsByTagName('size');
            sizeNodes = sizeNodes.length ? sizeNodes : elNode.getElementsByTagName('viz:size');
            if(sizeNodes.length>0){
              let sizeNode = sizeNodes[0];
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
                let colorNode = colorNodes[0];
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

                if(nodesAttributes[attr]) attr = atts[nodesAttributes[attr]]=val
                else atts[attr]=val;
            }
            node.attributes = atts;

            let node_cat = ""
            // nodew=parseInt(attributes["weight"]);
            if ( atts["category"] ) {
              node_cat = atts["category"];
            }
            else {
              // basic TW type idx is 0 (~ terms if one type, doc if both types)
              node_cat = categories[0]
            }

            if (!catCount[node_cat]) catCount[node_cat] = 0
            catCount[node_cat]++;
            node.type = node_cat;

            // node.id = (node_cat==categories[0])? ("D:"+node.id) : ("N:"+node.id);
            if(!node.size) console.log("node without size: "+node.id+" : "+node.label);

            // user-indicated default => copy for old default accessors
            if (node.attributes[TW.nodeClusAtt]) {
              node.attributes['clust_default'] = node.attributes[TW.nodeClusAtt]
            }

            // save record
            nodes[node.id] = node

            if(parseInt(node.size) < parseInt(minNodeSize))
                minNodeSize= node.size;

            if(parseInt(node.size) > parseInt(maxNodeSize))
                maxNodeSize= node.size;

            // console.debug("node.attributes", node.attributes)

            if (TW.scanClusters) {
              if (!tmpVals[node_cat])      tmpVals[node_cat]={}
              for (var at in node.attributes) {
                if (!tmpVals[node_cat][at])  tmpVals[node_cat][at]={'vals':[],'map':{}}

                let someval = Number(node.attributes[at])
                // Identifying the attribute datatype: exclude strings and objects
                if ( isNaN(someval) ) {
                    if (!Atts_2_Exclude[at]) Atts_2_Exclude[at]=true;
                }
                // numeric attr => build facets
                else {
                  if (!tmpVals[node_cat][at].map[someval]) tmpVals[node_cat][at].map[someval] = []

                  tmpVals[node_cat][at].vals.push(someval)      // for ordered scale
                  tmpVals[node_cat][at].map[someval].push(node.id)  // inverted index
                }
              }
            }

        } // finish nodes loop
    }

    // console.warn ('parseCustom output nodes', nodes)
    // console.warn ('parseCustom inverted index: vals to srcType', tmpVals)

    // -------------- debug: for local stats ----------------
    // allSizes.sort();
    // let N = allSizes.length
    // sizeStats.median = allSizes[Math.round(N/2)]
    // sizeStats.mean = Math.round(sumSizes/N * 100)/100
    //
    // console.log("parseCustom(gexf) sizeStats:", sizeStats)
    // ------------- /debug: for local stats ----------------


    var classvalues_deb = performance.now()
    // console.log('dictfyGexf: begin TW.Clusters')

    var gotClusters = false
    for (var nodecat in tmpVals) {
      gotClusters = gotClusters || (tmpVals[nodecat]['cluster_index'] || tmpVals[nodecat][TW.nodeClusAtt])
    }

    // clusters and other facets => type => name => [{label,val/range,nodeids}]
    TW.Clusters = {}

    // sorting out properties in n.attributes ==> £TODO shared function createClusterIndex() up to classvalues_fin
    // --------------------------------------

    if(gotClusters) {
      // 1) default cluster properties "cluster_index" [, "cluster_label"]
      for (var t_type in tmpVals) {
        var t_clusname

        // all distinct values to create labels
        var t_cnumbers = []
        var allTicks = []
        if (TW.nodeClusAtt != undefined && tmpVals[t_type][TW.nodeClusAtt]) {
          t_clusname = TW.nodeClusAtt
        }
        else if (tmpVals[t_type]["cluster_index"]) {
          t_clusname = "cluster_index"
        }
        if (t_clusname) {
          // values (we assume they are cluster numbers)
          t_cnumbers = Object.keys(tmpVals[t_type][t_clusname].map)

          // add label names (TODO use cluster_label if present
          //                 £POSS, use maxsize node label if absent)
          for (var l in t_cnumbers) {
            var t_cnumber = t_cnumbers[l]

            var newTick = {
              'labl': `${t_type}||${t_clusname}||${t_cnumber}`,
              'val': t_cnumber,
              // val2ids: [nid5,nid27..]
              'nids': tmpVals[t_type][TW.nodeClusAtt].map[t_cnumber]
            }
            allTicks.push(newTick)
          }

          TW.Clusters[t_type] = {}
          TW.Clusters[t_type]["clust_default"] = allTicks
        }
      }
    }


    // 2) all scanned
    for (var cat in tmpVals) {
      if (!TW.Clusters[cat])    TW.Clusters[cat] = {}

      for (var at in tmpVals[cat]) {
        // console.log(`======= ${cat}::${at} =======`)


        var allTicks = []
        // skip non-numeric or already done
        if (Atts_2_Exclude[at] || at == "clust_default") {
          continue
        }

        // array of valueclass/interval/bin objects
        TW.Clusters[cat][at] = []

        // if n possible values doesn't need binify
        if (Object.keys(tmpVals[cat][at].map).length <= TW.maxDiscreteValues) {
          for (var pval in tmpVals[cat][at].map) {
            TW.Clusters[cat][at].push({
              'labl': `${cat}||${at}||${pval}`,
              'val': pval,
              // val2ids
              'nids': tmpVals[cat][at].map[pval]
            })
          }
        }
        // if binify
        else {
          var len = tmpVals[cat][at].vals.length

          // sort out vals
          tmpVals[cat][at].vals.sort(function (a,b) {
                 return Number(a)-Number(b)
          })

          // (enhanced intervalsInventory)
          // => creates bin, binlabels, inverted index per bins
          var legendRefTicks = []

          // how many bins for this attribute ?
          var nBins = 3
          if (TW.customLegendsBins && TW.customLegendsBins[at]) {
            nBins = TW.customLegendsBins[at]
          }
          else if (TW.legendsBins) {
            nBins = TW.legendsBins
          }

          // create tick thresholds
          for (var l=0 ; l < nBins ; l++) {
            let nthVal = Math.floor(len * l / nBins)
            legendRefTicks.push(tmpVals[cat][at].vals[nthVal])
          }

          console.debug("intervals for", at, legendRefTicks)

          var nTicks = legendRefTicks.length
          var sortedDistinctVals = Object.keys(tmpVals[cat][at].map).sort(function(a,b){return Number(a)-Number(b)})

          var nDistinctVals = sortedDistinctVals.length
          var lastCursor = 0

          // create ticks objects with retrieved full info
          for (var l in legendRefTicks) {
            l = Number(l)

            let lowThres = Number(legendRefTicks[l])
            let hiThres = null
            if (l < nTicks-1) {
              hiThres = Number(legendRefTicks[l+1])
            }
            else {
              hiThres = Infinity
            }

            var newTick = {
              'labl':'',
              'nids':[],
              'range':[lowThres, hiThres]
            }

            // 1) union of idmaps
            for (var k = lastCursor ; k <= nDistinctVals ; k++) {
              var val = Number(sortedDistinctVals[k])
              if (val < lowThres) {
                console.error("mixup !!", val, lowThres, at)
              }
              else if ((val >= lowThres) && (val < hiThres)) {
                if (!tmpVals[cat][at].map[val]) {
                  console.error("unscanned val2ids mapping", val, at)
                }
                else {
                  // eg bin2ids map for 2 <= val < 3
                  //    will be U(val2ids maps for 2, 2.1, 2.2,...,2.9)
                  for (var j in tmpVals[cat][at].map[val]) {
                    newTick.nids.push(tmpVals[cat][at].map[val][j])
                  }
                }
              }
              // we're over the interval upper bound
              // we just need to remember where we were for next interval
              else if (val >= hiThres) {
                lastCursor = k
                break
              }
            }

            // create label
            // round %.6f for display
            var labLowThres = Math.round(lowThres*1000000)/1000000
            var labHiThres = (l==nTicks-1)? '+ ∞' : Math.round(hiThres*1000000)/1000000
            newTick.labl = `${cat}||${at}||[${labLowThres} ; ${labHiThres}]`

            // save these bins as the cluster index (aka faceting)
            if (newTick.nids.length) {
              TW.Clusters[cat][at].push(newTick)
            }
          }
        }
      }
    }

    var classvalues_fin = performance.now()
    console.log('dictfyGexf: end TW.Clusters, own time:', classvalues_fin-classvalues_deb)

    //New scale for node size: now, between 2 and 5 instead [1,70]
    for(var nid in nodes){
        // console.log("dictfyGexf node", nid)
        nodes[nid].size =  desirableNodeSizeMIN+ (parseInt(nodes[nid].size)-1)*((desirableNodeSizeMAX-desirableNodeSizeMIN) / (maxNodeSize-minNodeSize));
    }


    // £TODO second shared function: createRelations() (same for gexf/json)

    var edgeId = 0;
    var edgesNodes = gexf.getElementsByTagName('edges');

    for(i=0; i<edgesNodes.length; i++) {
        var edgesNode = edgesNodes[i];
        var edgeNodes = edgesNode.getElementsByTagName('edge');
        console.log("edgeNodes.length", edgeNodes.length)
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

            let edge_weight = edgeNode.getAttribute('weight')
            edge.weight = (edge_weight)?edge_weight:1;

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

              let typestring = findEdgeType(nodes, source, target)

              // save edge property
              edge.categ = typestring
              TW.Relations = updateRelations( TW.Relations,
                                              typestring,
                                              source, target )
              // save
              if(!edges[target+";"+source])
                  edges[indice] = edge;
            }
        }
    }

    for(var i in TW.Relations) {
        for(var j in TW.Relations[i]) {
            TW.Relations[i][j] = Object.keys(TW.Relations[i][j])
        }
    }

    // ------------------------------- resDict <<<
    let resDict = {}
    resDict.catCount = catCount;        // ex:  {'ISIterms':1877}  ie #nodes
    resDict.nodes = nodes;              //  { nid1: {label:"...", size:"11.1", attributes:"...", color:"#aaa", etc}, nid2: ...}
    resDict.edges = edges;
    resDict.n1 = nodes1;       // relations
    if(nodes2) resDict.n2 = nodes2;
    if(bipartiteD2N) resDict.D2N = bipartiteD2N;
    if(bipartiteN2D) resDict.N2D = bipartiteN2D;

    return resDict;
}



// To find the edge type (Doc=Doc, Doc=Term...)
function findEdgeType(nodes, srcId, tgtId) {
  let srcType=nodes[srcId].type;
  let tgtType=nodes[tgtId].type;

  // if(srcId==89 || tgtId==89) console.log(edge)

  // [ New Code! ]
  let petitDict = {}
  petitDict[ srcType ] = true;
  petitDict[ tgtType ] = true;
  let idInRelations = []
  for(var c in petitDict) idInRelations[TW.catDict[c]] = true;
  for(var c=0; c<TW.categories.length;c++) {
      if(!idInRelations[c]) idInRelations[c] = false;
  }
  let idArray = idInRelations.map(Number).join("|")
  // [ / New Code! ]

  // console.debug("new relation of type", idArray)

  // aka edge.categ aka typestring
  return idArray
}

// To fill TW.Relations with edges sorted by type (Doc=Doc, Doc=Term...)
function updateRelations(typedRelations, edgeCateg, srcId, tgtId){
  if(!typedRelations[edgeCateg]) typedRelations[edgeCateg] = {}
  if(isUndef(typedRelations[edgeCateg][srcId])) typedRelations[edgeCateg][srcId] = {};
  if(isUndef(typedRelations[edgeCateg][tgtId])) typedRelations[edgeCateg][tgtId] = {};
  typedRelations[edgeCateg][srcId][tgtId]=true;
  typedRelations[edgeCateg][tgtId][srcId]=true;

  return typedRelations
}


// creates and updates nodes1 nodes2 and bipartiteN2D and bipartiteD2N
// but seems useless because all info is already in each nodes.type and edge.categ
// (especially when changeType uses a loop on all nodes anyway)
// (was previously done at the same time that updateRelations)
// (could be restored if we needed faster changeType)
function sortNodesByTypeDeprecated() {
  // Doc <-> Doc
  // if(srcType==categories[0] && tgtType==categories[0] ) {
  //
  //     edge.label = "nodes1";
  //     if(isUndef(nodes1[source])) {
  //         nodes1[source] = {
  //             label: nodes[source].label,
  //             neighbours: []
  //         };
  //     }
  //     if(isUndef(nodes1[target])) {
  //         nodes1[target] = {
  //             label: nodes[target].label,
  //             neighbours: []
  //         };
  //     }
  //     nodes1[source].neighbours.push(target);
  //     nodes1[target].neighbours.push(source);
  // }
  //
  // if(categories.length>1) {
  //
  //     // Term <-> Term
  //     if(srcType==categories[1] && tgtType==categories[1]){
  //         edge.label = "nodes2";
  //
  //         if(isUndef(nodes2[source])) {
  //             nodes2[source] = {
  //                 label: nodes[source].label,
  //                 neighbours: []
  //             };
  //         }
  //         if(isUndef(nodes2[target])) {
  //             nodes2[target] = {
  //                 label: nodes[target].label,
  //                 neighbours: []
  //             };
  //         }
  //         nodes2[source].neighbours.push(target);
  //         nodes2[target].neighbours.push(source);
  //     }
  //
  //     // Doc <-> Term
  //     if((srcType==categories[0] && tgtType==categories[1]) ||
  //         (srcType==categories[1] && tgtType==categories[0])) {
  //         edge.label = "bipartite";
  //
  //         // // Source is Document
  //         if(srcType == categories[0]) {
  //
  //             if(isUndef(bipartiteD2N[source])) {
  //                 bipartiteD2N[source] = {
  //                     label: nodes[source].label,
  //                     neighbours: []
  //                 };
  //             }
  //             if(isUndef(bipartiteN2D[target])) {
  //                 bipartiteN2D[target] = {
  //                     label: nodes[target].label,
  //                     neighbours: []
  //                 };
  //             }
  //
  //             bipartiteD2N[source].neighbours.push(target);
  //             bipartiteN2D[target].neighbours.push(source);
  //
  //         // // Source is NGram
  //         } else {
  //
  //             if(isUndef(bipartiteN2D[source])) {
  //                 bipartiteN2D[source] = {
  //                     label: nodes[source].label,
  //                     neighbours: []
  //                 };
  //             }
  //             if(isUndef(bipartiteD2N[target])) {
  //                 bipartiteD2N[target] = {
  //                     label: nodes[target].label,
  //                     neighbours: []
  //                 };
  //             }
  //             bipartiteN2D[source].neighbours.push(target);
  //             bipartiteD2N[target].neighbours.push(source);
  //         }
  //     }
  // }
}




// Level-00
function scanJSON( data ) {

    var categoriesDict={};
    var nodes = data.nodes;

    for(var i in nodes) {
        let n = nodes[i];
        if(n.type) categoriesDict[n.type]=n.type;
    }

    // sorting observed json node types into Sem (=> 1)/Soc (=> 0)
    return sortNodeTypes(categoriesDict);
}

// Level-00
// for {1,2}partite graphs
function dictfyJSON( data , categories ) {
    console.debug(`dictfyJSON, categories:${categories}, data:`, data)
    var catDict = {}
    var catCount = {}
    for(var i in categories)  catDict[categories[i]] = i;

    var edges={}, nodes={}, nodes1={}, nodes2=false, bipartiteD2N=false, bipartiteN2D=false;

    if(categories.length>1) {
        nodes2={}, bipartiteD2N={}, bipartiteN2D={}
    }

    for(var i in data.nodes) {
        let n = data.nodes[i];
        let node = {}
        node.id = (n.id) ? n.id : i ; // use the key if no id
        node.label = (n.label)? n.label : ("node_"+node.id) ;
        node.size = (n.size)? n.size : 3 ;
        node.type = (n.type)? n.type : "Document" ;
        node.x = (n.x)? n.x : Math.random();
        node.y = (n.y)? n.y : Math.random();
        node.color = (n.color)? n.color : "#FFFFFF" ;
        if(n.shape) node.shape = n.shape;
        if(n.attributes) node.attributes = n.attributes
        else             node.attributes = {}
        node.type = (n.type)? n.type : categories[0] ;

        // £TODO REFA new sigma.js: shape is not attr but custom type linked to a renderer's name
        // node.shape = "square";

        // £TODO generalize some alternate names in here and maybe gexf
        if (node.term_occ) {
          node.size = Number(node.term_occ)
        }

        if (!catCount[node.type]) catCount[node.type] = 0
        catCount[node.type]++;


        nodes[node.id] = node;
    }

    colorList.sort(function(){ return Math.random()-0.5; });
    for (var i in nodes ){
        if (nodes[i].color=="#FFFFFF") {
            var attval = ( isUndef(nodes[i].attributes) || isUndef(nodes[i].attributes["clust_default"]) )? 0 : nodes[i].attributes["clust_default"] ;
            nodes[i].color = colorList[ attval ]
        }
    }

    // edges
    for(var i in data.links){
        let e = data.links[i];
        let edge = {}

        var source = (!isUndef(e.s))? e.s : e.source;
        var target = (!isUndef(e.t))? e.t : e.target;
        var weight = (!isUndef(e.w))? e.w : e.weight;
        var type = (!isUndef(e.type))? e.type : "curve";
        var id=source+";"+target;

        edge.id = id;
        edge.source = source;
        edge.target = target;
        edge.weight = weight;
        edge.type = type;

        if ( nodes[source] && nodes[target] ) {
          // console.debug('>>> tr: new edge has matching source and target nodes')

          let typestring = findEdgeType(nodes, source, target)

          // save edge property
          edge.categ = typestring
          TW.Relations = updateRelations( TW.Relations,
                                          typestring,
                                          source, target )
          // save
          if(!edges[target+";"+source])
              edges[id] = edge;
        }
    }

    for(var i in TW.Relations) {
        for(var j in TW.Relations[i]) {
            TW.Relations[i][j] = Object.keys(TW.Relations[i][j])
        }
    }

    let resDict = {}
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

        let bin = (i).toString(2)
        let bin_splitted = []
        for(var j in bin)
            bin_splitted.push(bin[j])

        let bin_array = [];
        let toadd = cats.length-bin_splitted.length;
        for (k = 0; k < toadd; k++)
            bin_array.push("0")

        for(var j in bin)
            bin_array.push(bin[j])

        bin_array = bin_array.map(Number)
        let sum = bin_array.reduce(function(a, b){return a+b;})

        if( sum != 0 && sum < 3) {
            let id = bin_array.join("|")
            systemstates[id] = bin_array.map(Boolean)
        }
    }
    return systemstates;
}
