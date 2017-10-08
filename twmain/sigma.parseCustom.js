'use strict';
// TODO REFA longterm refactoring: scanXX and dictifyXX is doing double work
//   (for instance loop on full gexf in scanGexf then again in dictfyGexf)

// Level-01
var ParseCustom = function ( format , data, optionalNodeConf ) {

    if (format == 'gexf') {
      this.data = $.parseXML(data)
    }
    else {
      this.data = JSON.parse(data)
    }
    this.format = format;
    this.nbCats = 0;

    // input = GEXFstring
    this.getGEXFCategories = function() {
        let observedCategories = scanGexf(this.data)
        let finalCategories = sortNodeTypes(observedCategories,optionalNodeConf)
        return finalCategories;
    }// output = {'cats':[ "cat1" , "cat2" , ...], 'rev': {cat1: 0, cat2: 1...}}


    // input = [ "cat1" , "cat2" , ...]
    this.parseGEXF = function(categories ) {
        return dictfyGexf( this.data , categories );
    }// output = { nodes, edges }



    // input = JSONstring
    this.getJSONCategories = function(json) {
      let observedCategories = scanJSON(this.data)
      let finalCategories = sortNodeTypes(observedCategories, optionalNodeConf)
      return finalCategories;
    }// output = {'cats':[ "cat1" , "cat2" , ...], 'rev': {cat1: 0, cat2: 1...}}


    // input = [ "cat1" , "cat2" , ...]
    this.parseJSON = function(categories ) {
        return dictfyJSON( this.data , categories );
    }// output = { nodes, edges }

};

// Level-02
ParseCustom.prototype.scanFile = function() {
    let catInfos = {'categories': new Array(),
                    'lookup_dict': new Object()}
    switch (this.format) {
        case "api.json":
            break;
        case "db.json":
            break;
        case "json":
            catInfos = this.getJSONCategories( this.data );
            return catInfos;
            break;
        case "gexf":
            catInfos = this.getGEXFCategories( this.data );
            return catInfos;
            break;
        default:
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
    // |    <attribute id="0"         title="category" type="string"></attribute>
    // |    <attribute id="1"         title="country" type="float"></attribute>
    // |    <attribute id="mod_class" title="Modularity Class" type="float"></attribute>
    // |  </attributes>
    //   (...)


    // Census of the conversions between attr and some attr name
    var i, j, k;
    var nodesAttributes = {};
    var edgesAttributes = {};

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
                // ex:   title = "in-degree"   or "In Degree" <= can be a label != id
                // ex:   type  = "string"

                var attribute = {
                    id:id,
                    title:title,
                    type:type
                };
                nodesAttributes[id] = attribute;

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
                edgesAttributes[id] = attribute;

            }
        }
    }

    // console.debug('gexf declared nodesAttributes:', nodesAttributes)
    // console.debug('gexf declared edgesAttributes:', edgesAttributes)

    return {nodeAttrs: nodesAttributes, edgeAttrs: edgesAttributes}
}

// Level-00
function scanGexf(gexfContent) {

    var categoriesDict={};

    // adding gexfCheckAttributesMap call
    // to create a map from nodes/node/@for values to declared attribute name (title)

    var declaredAttrs = gexfCheckAttributesMap(gexfContent)

    let elsNodes = gexfContent.getElementsByTagName('nodes');
    // console.debug('>>> tr: elsNodes', elsNodes) // <<<
    for(var i=0; i<elsNodes.length; i++){
        var elNodes = elsNodes[i];  // Each xml node 'nodes' (plural)
        let node = elNodes.getElementsByTagName('node');
        for(var j=0; j<node.length; j++){
            let attvalueNodes = node[j].getElementsByTagName('attvalue');
            for(var k=0; k<attvalueNodes.length; k++){
                let attvalueNode = attvalueNodes[k];
                let attr = attvalueNode.getAttribute('for');
                let val = attvalueNode.getAttribute('value');

                // some attrs are gexf-local indices refering to an <attributes> declaration
                // so if it matches declared we translate their integer in title
                if (! isUndef(declaredAttrs.nodeAttrs[attr]))
                  attr = declaredAttrs.nodeAttrs[attr].title

                // THIS WILL BECOME catDict (if ncats == 1 => monopart)
                if (attr=="category" || attr=="type") {
                  if (!categoriesDict[val])    categoriesDict[val] = 0
                  categoriesDict[val]++;
                }
            }
        }
    }

    return categoriesDict
}

// sorting observed node types into Sem/Soc
// NB: tina structure in 'categories' can only accomodate 2 types
//   - default cat is handled as cat 0...
// -------------------
// expected content: usually a just a few cats over all nodes
// ex: terms
// ex: ISItermsriskV2_140 & ISItermsriskV2_140
// optional arg optionalNodeConf should contain keys of the form:
//    "node0": "Keywords",
//    "node1": "Scholars"
//     etc.
// (it's read from project_conf.json)
function sortNodeTypes(observedTypesDict, optionalNodeConf) {
  var observedTypes = Object.keys(observedTypesDict)
  observedTypes.sort(function(a,b) {return observedTypesDict[b] - observedTypesDict[a]})

  let nbNodeTypes = 2

  if (observedTypes.length > nbNodeTypes) {
    console.warn(`The graph source data has more different node types than
                  supported. Less frequent node types will be ignored.
                  Max allowed types: ${nbNodeTypes},
                  Found: ${observedTypes.length} (namely: ${observedTypes})`)
  }

  var declaredTypes = []
  for (var i = 0 ; i < nbNodeTypes ; i++ ) {
    if (optionalNodeConf && optionalNodeConf["node"+i]) {
      declaredTypes[i] = optionalNodeConf["node"+i]
      if (TW.conf.debug.logSettings)
        console.log("expected cat (from db.json addtional conf)", i, declaredTypes[i])
    }
    else {
      declaredTypes[i] = TW.conf[i == 0 ? 'catSem' : 'catSoc']
      if (TW.conf.debug.logSettings)
        console.log("expected cat (from settings_explorer defaults)", i, declaredTypes[i])
    }
  }

  // console.log("observedTypes", observedTypes)
  // console.log("declaredTypes", declaredTypes)

  var newcats = []   // will become TW.categories
  var catDict = {}   // will become TW.catDict

  var nTypes = observedTypes.length

  if(nTypes==0) {
      newcats[0]="Terms";
      catDict["Terms"] = 0;
  }
  if(nTypes==1) {
      // if we have only one category, it gets code 0 as Terms
      newcats[0] = observedTypes[0]
      catDict[observedTypes[0]] = 0;

      if (TW.conf.debug.logParsers)
        console.log(`cat unique (${observedTypes[0]}) =>0`)
  }
  if(nTypes>1) {
      // allows multiple node types even if not well declared
      // ----------------------------------------------------
      // POSSIBLE: an "all the rest" last nodeType ?

      let alreadyUsed = {}

      // try declared cats in declared position, independantly from each other
      for (var i = 0 ; i < nbNodeTypes; i++) {
        if (observedTypesDict[declaredTypes[i]]) {
          let validatedType = declaredTypes[i]
          newcats[i] = validatedType;
          alreadyUsed[validatedType] = true
        }
      }

      // console.log("found stipulated cats", newcats, catDict)

      // fallbacks: if some or all stipulated cats are not found
      // ---------

      // heuristic A: fill missing ones, by frequence
      // (eg if nodes0 was not found, then type for nodes0 will be the
      //     majoritary observed one, unless taken where we move one up)
      for (var i = 0 ; i < nbNodeTypes; i++) {
        if (typeof newcats[i] == "undefined") {
          for (var j = 0 ; j < nTypes ; j++) {
            if (!alreadyUsed[observedTypes[j]]) {
              newcats[i] = observedTypes[j]
              alreadyUsed[observedTypes[j]] = true
              break
            }
          }
        }
      }
      // console.log("after filling majority cats", newcats, catDict)

      // all the rest (heuristic B)
      if (!newcats[nbNodeTypes-1]) {
        for(var i in observedTypes) {
          // without a group others: if there is more than two cats altogether,
          //                         only the last cat counts as node1 cat
          let c = observedTypes[i]


          // -------------------------------------------- for a group "others"
          // with a group "others": if there is more than two cats altogether,
          //                         all the non majoritary or non-stipulated
          //                         are grouped here as node1 cat
          // but problem: it break the symetry b/w TW.categories and TW.catDict
          //
          // // c is in "all the rest" group (POSS extend to multitypes)
          // if (c != newcats[0] && c != newcats[1]) {
          //     if (!newcats[1])    newcats[1] = c;
          //     else newcats[1] += '/'+c
          //     catDict[c] = 1;
          // }
          // -------------------------------------------/ for a group "others"
        }
      }
  }

  // reverse lookup
  for (var i in newcats) {
    catDict[newcats[i]] = i
  }

  return {'categories': newcats, 'lookup_dict': catDict}
}


// sorting out n.attributes + binning them if too much distinct values
// --------------------------------------------------------------------
// @arg valuesIdx:
//      a census of present attribute-values with a 4+ tier structure
//           by nodetype
//                => by attribute
//                       => {vals:[allpossiblevalues...],
//                           map:{eachvalue:[matchingnodeids],
//                                eachvalue2:[matchingnodeids]...
//                           vtypes:{str: nbstringvaluesforthisattr
//                                   num: nbnumericvaluesforthisattr}
//                           }

// NB vals and map are both useful and complementary

function facetsBinning (valuesIdx) {

  // console.debug("facetsBinning: valuesIdx", valuesIdx)

  let facetIdx = {}

  if (TW.conf.debug.logFacets) {
    console.log('facetsBinning: begin TW.Facets')
    var classvalues_deb = performance.now()
  }

  // all scanned attributes get an inverted index
  for (var cat in valuesIdx) {
    if (!facetIdx[cat])    facetIdx[cat] = {}

    for (var at in valuesIdx[cat]) {
      if (TW.conf.debug.logFacets) console.log(`======= ${cat}::${at} =======`)


      // console.warn("all raw vals before binning" valuesIdx[cat][at].vals)

      // meta + new array of values/intervals with inverted index to node ids
      facetIdx[cat][at] = {meta:{}, invIdx:[]}


      // the full array of values of the accepted type
      let workingVals = []

      // the observed pre-eminent data type
      let dataType = ''

      // if (less than 2% str) => type is mostly num
      //                                  ----------
      if (valuesIdx[cat][at].vals.vstr.length * 50 < valuesIdx[cat][at].vals.vnum.length) {
        dataType = 'num'

        workingVals = valuesIdx[cat][at].vals.vnum

        // here we just move the str values to isolate them in one legend item
        valuesIdx[cat][at].map['_non_numeric_'] = []
        for (let k in valuesIdx[cat][at].vals.vstr) {
          let unusualValue = valuesIdx[cat][at].vals.vstr[k]

          if (TW.conf.debug.logFacets) console.log(`pruning unusual value ${unusualValue} from legends`)

          for (let j in valuesIdx[cat][at].map[unusualValue]) {
            let nanNid = valuesIdx[cat][at].map[unusualValue][j]
            valuesIdx[cat][at].map['_non_numeric_'].push(nanNid)
          }
          delete valuesIdx[cat][at].map[unusualValue]
        }

      }
      // type str is the catchall type
      // --------
      else {
        dataType = 'str'
        workingVals = valuesIdx[cat][at].vals.vstr
      }

      if (TW.conf.debug.logFacets)  {
        console.debug("datatyping:", dataType)
        console.debug("valuesIdx after datatyping:", valuesIdx[cat][at])
        console.debug("workingVals after datatyping:", workingVals)
      }

      // default options
      let maxDiscreteValues = TW.conf.maxDiscreteValues
      let nBins = TW.conf.legendsBins
      let binningMode = 'samepop'

      // read stipulated options in user settings
      // ----------------------------------------
      if (TW.facetOptions[at]) {
        binningMode = TW.facetOptions[at]["binmode"]
        nBins = TW.facetOptions[at]["n"]
        maxDiscreteValues = nBins

        if (nBins == 0) {
          console.warn(`Can't use user-specified number of bins value 0 for attribute ${at}, using TW.conf.legendsBins ${TW.conf.legendsBins} instead`)
          nBins = TW.conf.legendsBins
        }
        if (TW.conf.debug.logFacets) console.log("TW.facetOptions[at]", TW.facetOptions[at])
      }
      else {
        if (TW.conf.debug.logFacets) console.log("(no specified options in settings for this attribute)")
      }

      // POSSible: auto-detect if vtypes ==> color
      // else {
      // }


      // if (binningMode != "off") console.warn("maxDiscreteValues from settings", maxDiscreteValues)

      var nDistinctVals = Object.keys(valuesIdx[cat][at].map).length

      // if small number of distinct values doesn't need binify
      if (    dataType == 'str'
         || (TW.facetOptions[at]                               // case with custom facetOptions
              && (nDistinctVals <= nBins || binningMode == "off"))
         || (nDistinctVals <= maxDiscreteValues )           // case with unspecified options
       ) {
        for (var pval in valuesIdx[cat][at].map) {

          var idList = valuesIdx[cat][at].map[pval]
          facetIdx[cat][at].invIdx.push({
            // simple label
            'labl': `${pval} (${idList.length})`,
            // verbose label
            'fullLabl': `${cat}||${at}||${pval} (${idList.length})`,
            'val': pval,
            // val2ids
            'nids': idList
          })
        }
      }
      // (if many values && binify)
      else if (dataType == 'num') {
        var len = workingVals.length

        // sort out vals
        workingVals.sort(function (a,b) {
               return Number(a)-Number(b)
        })

        // (enhanced intervalsInventory)
        // => creates bin, binlabels, inverted index per bins
        var legendRefTicks = []

        var lastUpperBound = null

        if (binningMode == 'samerange') {
          // minimax
          let vMin = workingVals[0]
          let vMax = workingVals.slice(-1)[0]
          lastUpperBound = vMax

          // same interval each time
          let step = (vMax - vMin) / nBins
          for (var i = 0 ; i < nBins ; i++) {
            legendRefTicks.push(vMin + i*step)
          }
          // NB these ticks are *minimums* so we stop one step *before* vMax
          //    and simply include it in last interval

          // console.warn(`samerange nBins:${nBins}, n distinct:${workingVals.length} => got n ticks:${legendRefTicks.length}`)
        }

        else if (binningMode == 'samepop') {
          // create tick thresholds
          for (var l=0 ; l < nBins ; l++) {
            let nthVal = Math.floor(len * l / nBins)
            legendRefTicks.push(workingVals[nthVal])
          }
        }

        if (TW.conf.debug.logFacets)    console.debug("intervals for", at, legendRefTicks, "(list of minima)")

        // the unique-d array will serve as a todolist with lastCursor and k
        // won't use keys(map) because of _non_numeric_ entry
        let uniqueVals = {}
        for (let k in workingVals) {
          if (! uniqueVals[workingVals[k]]) {
            uniqueVals[workingVals[k]] = 1
          }
        }
        var sortedDistinctVals = Object.keys(uniqueVals).sort(function(a,b){return Number(a)-Number(b)})

        var nTicks = legendRefTicks.length

        var lastCursor = 0

        // create ticks objects with retrieved full info
        for (var l in legendRefTicks) {
          l = Number(l)

          let lowThres = Number(legendRefTicks[l])
          let hiThres = null

          if (l < nTicks-1) {
            hiThres = Number(legendRefTicks[l+1])
          }
          else if (binningMode == 'samepop') {
            hiThres = Infinity
          }
          else {
            // in 'samerange' mode
            hiThres = lastUpperBound
          }

          var newTick = {
            'labl':'',
            'fullLabl':'',
            'nids':[],
            'range':[lowThres, hiThres]
          }

          if (TW.conf.debug.logFacets)  console.debug("...new interval:",[lowThres, hiThres])

          // 1) union of idmaps
          for (var k = lastCursor ; k <= nDistinctVals ; k++) {
            var val = Number(sortedDistinctVals[k])

            if (val == '_non_numeric_') {
              continue
            }
            // FIXME why still NaN sometimes ?
            // NB: however skipping them is enough for work
            else if (isNaN(val)) {
              // console.debug('skipped undetected NaN ? attribute, lastCursor, k, sortedDistinctVals[k], nodes:', at, lastCursor, k, val, valuesIdx[cat][at].map[sortedDistinctVals[k]])
              continue
            }

            // for debug
            // console.debug('lastCursor, k, val', lastCursor, k, val)

            if (val < lowThres) {
                console.error("mixup !!", val, lowThres, at)
            }
            else if ((val >= lowThres) && (val < hiThres)) {
              if (!valuesIdx[cat][at].map[val]) {
                console.error("unscanned val2ids mapping", val, at)
              }
              else {
                // eg bin2ids map for 2 <= val < 3
                //    will be U(val2ids maps for 2, 2.1, 2.2,...,2.9)
                for (var j in valuesIdx[cat][at].map[val]) {
                  newTick.nids.push(valuesIdx[cat][at].map[val][j])
                }
              }
            }
            // we're over the interval upper bound
            else if (val >= hiThres) {

              // console.log("over hiThres", val, hiThres)

              // normal case
              if (binningMode != 'samerange' || l != nTicks-1 ) {
                // console.log("...moving on to next interval")

                // we just need to remember where we were for next interval
                lastCursor = k
                break
              }

              // samerange && last interval case: inclusive last interval upper bound
              else {
                // console.warn("last interval for samepop")

                for (var j in valuesIdx[cat][at].map[val]) {
                  newTick.nids.push(valuesIdx[cat][at].map[val][j])
                }
              }

            }
          }

          // create label
          // round %.3f for display
          var labLowThres = Math.round(lowThres*1000)/1000
          var labHiThres = ''
          var bracket = '['

          if (l < nTicks-1) {
            labHiThres = Math.round(hiThres*1000)/1000
          }
          // last bound is +Inf if samepop
          else if (binningMode == 'samepop') {
            labHiThres = '+ ∞'
          }
          else if (binningMode == 'samerange') {
            labHiThres = Math.round(hiThres*1000)/1000
            bracket = ']'
          }

          newTick.labl = `[<span title="${lowThres}">${labLowThres}</span> ; <span title="${hiThres}">${labHiThres}</span>${bracket} (${newTick.nids.length})`
          // newTick.fullLabl = `${cat}||${at}||[${lowThres} ; ${hiThres}${bracket} (${newTick.nids.length})`

          // faceting: save these bins as the cluster index (even if empty)
          facetIdx[cat][at].invIdx.push(newTick)
        }

        // finally add the 'trash' category with any non_numeric vals
        facetIdx[cat][at].invIdx.push({
          'labl':'_non_numeric_',
          'fullLabl':'`${cat}||${at}||_non_numeric_',
          'nids': valuesIdx[cat][at].map['_non_numeric_'],
        })
      }

      // store this attribute's metadata
      facetIdx[cat][at].meta.dataType = dataType

      // POSS: here we could distinguish more precise attr types
      //       numeric continuous vs. discrete etc.
      //       cf. doc/developer_manual.md autodiagnose remark
    }

    // 'clust_default' is an alias to the user-defined default clustering
    if (TW.conf.nodeClusAtt != undefined
        && facetIdx[cat][TW.conf.nodeClusAtt]   // <= if found in data
        && !facetIdx[cat]['clust_default'] // <= and if an attr named 'clust_default' was not already in data
      ) {
      facetIdx[cat]['clust_default'] = facetIdx[cat][TW.conf.nodeClusAtt]
    }

  }

  if (TW.conf.debug.logFacets) {
    var classvalues_fin = performance.now()
    console.log('end TW.Facets, own time:', classvalues_fin-classvalues_deb)
  }

  return facetIdx
}


// Level-00
// for {1,2}partite graphs
function dictfyGexf( gexf , categories ){

    if (TW.conf.debug.logParsers)
      console.log("ParseCustom gexf 2nd loop, main data extraction, with categories", categories)


    // var catDict = {'terms':"0"}

    var catDict = {}
    var catCount = {}
    for(var i in categories)  catDict[categories[i]] = i;

    var edges={}, nodes={}, nodesByType={}

    var declaredAtts = gexfCheckAttributesMap(gexf)
    var nodesAttributes = declaredAtts.nodeAttrs
    // var edgesAttributes = declaredAtts.eAttrs

    // NB nodesByType lists arrays of ids per nodetype
    // (equivalent to TW.partialGraph.graph.getNodesByType but on full nodeset)
    for(var i in categories)  {
      nodesByType[i] = []


      // without  a group "others" -------------------
      catDict[categories[i]] = i

      // POSS subCats for cat "others" if open types mapped to n types
      //
      // ----------------------- with a group "others"
      // let subCats = categories[i].split(/\//g)
      // for (var j in subCats) {
      //   catDict[subCats[j]] = i
      // }
      // ---------------------- /with a group "others"

    }


    var elsNodes = gexf.getElementsByTagName('nodes') // The list of xml nodes 'nodes' (plural)
    TW.labels = [];

    // vars for stats => used in a posteriori normalization
    let minNodeSize = Infinity
    let maxNodeSize = 0

    // debug: for local stats
    // let allSizes = []
    // let sumSizes = 0
    // let sizeStats = {'mean':null, 'median':null, 'max':0, 'min':1000000000}

    // if scanAttributes, we'll also use:
    var tmpVals = {}        // to build inverted index attval => nodes
                            // (to inventory subclasses for a given attr)
                            //   if < maxDiscreteValues: keep all in legend
                            //   else:  show intervals in legend

    // tmpVals structure
    // -----------------
    // {
    //   nodecat0: {
    //     betweeness: {
    //       map: {
    //         val0: [nodeid_a, nodeid_b...],
    //         val1: [nodeid_c, nodeid_d...],...
    //       }
    //       vals: {vstr:[], vnum:[val0, val1,...]}
    //     },
    //     ...
    //   }
    // }

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

            }
            // fallback
            else {
              size = 1
              console.log(`node without size: ${id} <= 1`);
            }// [ / get Size ]

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
            for(var k=0; k<attvalueNodes.length; k++){
                var attvalueNode = attvalueNodes[k];
                var attr = attvalueNode.getAttribute('for');
                var val = attvalueNode.getAttribute('value');

                if(! isUndef(nodesAttributes[attr])) {
                  atts[nodesAttributes[attr].title]=val
                }
                else atts[attr]=val;
            }
            node.attributes = atts;

            let node_cat = ""

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

            // user-indicated default => copy for old default accessors
            if (node.attributes[TW.conf.nodeClusAtt]) {
              node.attributes['clust_default'] = node.attributes[TW.conf.nodeClusAtt]
            }

            // save record
            nodes[node.id] = node
            // console.log("catDict", catDict)
            // console.log("node.type", node.type)
            if (!nodesByType[catDict[node.type]]) {
              console.warn("unrecognized type:", node.type)
            }
            else {
              nodesByType[catDict[node.type]].push(node.id)
            }

            if(parseFloat(node.size) < minNodeSize)
                minNodeSize= parseFloat(node.size);

            if(parseFloat(node.size) > maxNodeSize)
                maxNodeSize= parseFloat(node.size);

            // console.debug("node.attributes", node.attributes)
            // creating a faceted index from node.attributes
            if (TW.conf.scanAttributes) {

              tmpVals = updateValueFacets(tmpVals, node)
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


    // clusters and other facets => type => name => [{label,val/range,nodeids}]
    if (TW.conf.scanAttributes) {
      TW.Facets = facetsBinning(tmpVals)
    }

    // linear rescale node sizes
    if (!isUndef(TW.conf.desirableNodeSizeMin) && !isUndef(TW.conf.desirableNodeSizeMax)) {
      let desiSizeRange = TW.conf.desirableNodeSizeMax-TW.conf.desirableNodeSizeMin
      let realSizeRange = maxNodeSize - minNodeSize

      // all nodes have same size
      if (realSizeRange == 0) {
        for(var nid in nodes){
          nodes[nid].size  = TW.conf.desirableNodeSizeMin
        }
      }
      // normal case => rescaling
      else {
        for(var nid in nodes){
            nodes[nid].size = parseInt(1000 * desiSizeRange * (parseFloat(nodes[nid].size) - minNodeSize) / realSizeRange + TW.conf.desirableNodeSizeMin) / 1000

          // console.log("new size", nid, nodes[nid].size)
        }
      }
    }

    // looping source edges to conforming edge
    // then updateRelations
    var edgeId = 0;
    var edgesNodes = gexf.getElementsByTagName('edges');

    for(i=0; i<edgesNodes.length; i++) {
        var edgesNode = edgesNodes[i];
        var edgeNodes = edgesNode.getElementsByTagName('edge');

        if (TW.conf.debug.logParsers)
          console.log("edgeNodes.length", edgeNodes.length)

        for(j=0; j<edgeNodes.length; j++) {
            var edgeNode = edgeNodes[j];
            var source = edgeNode.getAttribute('source')
            var target = edgeNode.getAttribute('target')
            var type = edgeNode.getAttribute('type');//line or curve

            if (/;/.test(source)) {
              console.warn (`edge source id has ";" ${source}` )
            }
            if (/;/.test(target)) {
              console.warn (`edge target id has ";" ${target}` )
            }

            var indice=source+";"+target;

            var edge = {
                id: indice,
                source: source,
                target: target,
                type : (type) ? type : TW.conf.sigmaJsDrawingProperties['defaultEdgeType'],
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


              // boost crossrels edges: off (we do it in source app)
              // if (edge.categ == "XR")   edge.weight *= 10

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
    resDict.byType = nodesByType;
    return resDict;
}



// To denote the edge type (Term=Term, Doc=Doc, Doc=Term...)
//                             00         11        XR
function findEdgeType(nodes, srcId, tgtId) {
  let srcType=nodes[srcId].type;
  let tgtType=nodes[tgtId].type;
  let strKey = ''
  if (srcType != tgtType) {
    strKey = "XR"
  }
  else {
    // ex: "00" <=> edge from nodetype 0 to nodetype 0
    //     "11" <=> edge from nodetype 1 to nodetype 1
    strKey = String(TW.catDict[srcType]).repeat(2)
  }
  return strKey
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


// To fill the reverse map: values => nodeids of a given type
function updateValueFacets(facetIdx, aNode, optionalFilter) {

  if (!facetIdx[aNode.type])      facetIdx[aNode.type]={}
  for (var at in aNode.attributes) {

    // we're not interested in node type/category at this point
    if (at == 'category')
      continue

    // attribute filter  undef or str: acceptedAttrName
    if (isUndef(optionalFilter) || at == optionalFilter) {
      let val = aNode.attributes[at]

      if (!facetIdx[aNode.type][at])  facetIdx[aNode.type][at]={'vals':{'vstr':[], 'vnum':[]},'map':{}}

      // shortcut
      var indx = facetIdx[aNode.type][at]

      // determine observed type of this single value
      let castVal = Number(val)

      // this discovered datatype will be a condition (no bins if not mostly numeric)
      let dtype = ''
      if (isNaN(castVal)) {
        dtype = 'vstr'
      }
      else {
        dtype = 'vnum'
        val = castVal           // we keep it as number
      }

      if (!indx.map[val]) indx.map[val] = []

      indx.vals[dtype].push(val)              // for ordered scale
      indx.map[val].push(aNode.id)            // inverted index


      // POSSIBLE with the discovered datatype
      //  => it would also allow to index text values (eg country, affiliation, etc.)
      //     with the strategy "most frequent distinct values" + "others"
      //     which would be useful (eg country, affiliation, etc.) !!!

    }
  }
  return facetIdx

}


// Level-00
function scanJSON( data ) {

    var categoriesDict={};
    var nodes = data.nodes;

    for(var i in nodes) {
        let ntype = nodes[i].type;
        if(ntype) {
          if (!categoriesDict[ntype])    categoriesDict[ntype] = 0
          categoriesDict[ntype]++;
        }
    }

    return categoriesDict
}

// Level-00
// for {1,2}partite graphs
function dictfyJSON( data , categories ) {

    if (TW.conf.debug.logParsers)
      console.log("ParseCustom json 2nd loop, main data extraction, with categories", categories)

    var catDict = {}
    var catCount = {}

    var edges={}, nodes={}, nodesByType={}

    // NB nodesByType lists arrays of ids per nodetype
    // (equivalent to TW.partialGraph.graph.getNodesByType but on full nodeset)
    for(var i in categories)  {
      nodesByType[i] = []

      // without  a group "others" -------------------
      catDict[categories[i]] = i

      // POSS subCats for cat "others" if open types mapped to n types
      //
      // ----------------------- with a group "others"
      // let subCats = categories[i].split(/\//g)
      // for (var j in subCats) {
      //   catDict[subCats[j]] = i
      // }
      // ---------------------- /with a group "others"
    }

    // normalization, same as parseGexf
    let minNodeSize = Infinity
    let maxNodeSize = 0

    // if scanAttributes, we'll also use:
    var tmpVals = {}

    for(var nid in data.nodes) {
        let n = data.nodes[nid];

        let node = {}

        node.id = (n.id) ? n.id : nid ; // use the key if no id
        node.label = (n.label)? n.label : ("node_"+node.id) ;
        node.size = (n.size)? n.size : 3 ;
        node.type = (n.type)? n.type : "Document" ;
        node.x = (n.x)? n.x : 100-Math.random()*200;
        node.y = (n.y)? n.y : 100-Math.random()*200;
        node.color = (n.color)? n.color : "#FFFFFF" ;
        if(n.shape) node.shape = n.shape;
        if(n.attributes) node.attributes = n.attributes
        else             node.attributes = {}
        node.type = (n.type)? n.type : categories[0] ;

        // any content to display on side panel (eg: comex v-card)
        node.htmlCont = n.content || '';

        // 2x use-case-specific attributes (comex)
        node.CC = n.CC || '';
        node.ACR = n.ACR || '';

        // TODO make a [weight, term_occ] and [type, category] as members of a
        //      class param: lists of alternate names for important attributes
        //      alt_attribute_string => get()+transform_values() (here and gexf)

        // alternate name: weight
        if (n.weight && !n.size) {
          node.size = n.weight
        }

        // alternate name: term_occ ==> zipfean nodes ==> log transform to keep label size range readable yet significant
        if (n.term_occ && !n.size) {
          node.size = Math.log(1+Number(n.term_occ))
        }

        if(parseFloat(node.size) < minNodeSize)
            minNodeSize= parseFloat(node.size);

        if(parseFloat(node.size) > maxNodeSize)
            maxNodeSize= parseFloat(node.size);

        if (!catCount[node.type]) catCount[node.type] = 0
        catCount[node.type]++;

        // record
        nodes[node.id] = node;

        if (!nodesByType[catDict[node.type]]) {
          console.warn("unrecognized type:", node.type)
        }
        else {
          nodesByType[catDict[node.type]].push(node.id)
        }

        // creating a faceted index from node.attributes
        if (TW.conf.scanAttributes) {
          tmpVals = updateValueFacets(tmpVals, node)
        }
    }

    // test: json with string facet (eg lab affiliation in comex)
    // console.log(tmpVals['Document'])

    if (TW.conf.scanAttributes) {
      TW.Facets = facetsBinning (tmpVals)
    }

    // linear rescale node sizes like dictfyGexf
    if (!isUndef(TW.conf.desirableNodeSizeMin) && !isUndef(TW.conf.desirableNodeSizeMax)) {
      let desiSizeRange = TW.conf.desirableNodeSizeMax-TW.conf.desirableNodeSizeMin
      let realSizeRange = maxNodeSize - minNodeSize

      if (realSizeRange == 0) {
        for(var nid in nodes){
          nodes[nid].size  = TW.conf.desirableNodeSizeMin
        }
      }
      // normal case => rescaling
      else {
        for(var nid in nodes){
            nodes[nid].size = parseInt(1000 * desiSizeRange * (nodes[nid].size - minNodeSize) / realSizeRange + TW.conf.desirableNodeSizeMin) / 1000

          // console.log("new size", nid, nodes[nid].size)
        }
      }
    }

    // £TODO this could be a call to clusterColoring()
    TW.gui.colorList.sort(function(){ return Math.random()-0.5; });
    for (var i in nodes ){
        if (nodes[i].color=="#FFFFFF") {
            var attval = ( isUndef(nodes[i].attributes) || isUndef(nodes[i].attributes["clust_default"]) )? 0 : nodes[i].attributes["clust_default"] ;
            nodes[i].color = TW.gui.colorList[ attval ]
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

          // save edge "type" in categ property
          // ----------------------------------
          edge.categ = typestring
          TW.Relations = updateRelations( TW.Relations,
                                          typestring,
                                          source, target )

          // boost crossrels edges: off (we do it in source app)
          // if (edge.categ == "XR")   edge.weight *= 10

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
    resDict.byType = nodesByType;
    resDict.edges = edges;

    return resDict;
}
