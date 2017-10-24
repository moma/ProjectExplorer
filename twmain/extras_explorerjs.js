/*
 * Customize as you want ;)
 */

// = = = = = = = = = = = [ Clusters Plugin ] = = = = = = = = = = = //

// settings to function name
TW.gui.colorFuns = {
  'heatmap': "heatmapColoring",
  'gradient': "gradientColoring",
  'cluster': "clusterColoring"
}

// sigma has dynamic attributes.. the functions below return their resp. getters
TW.sigmaAttributes = {
  'auto-degree' :    function(sigInst) { return function(nd) {return sigInst.graph.degree(nd.id)}},
  'auto-outdegree' : function(sigInst) { return function(nd) {return sigInst.graph.degree(nd.id, 'out')}},
  'auto-indegree' :  function(sigInst) { return function(nd) {return sigInst.graph.degree(nd.id, 'in')}},
  'auto-size' :    function() { return function(nd) {return nd.size}}
}


// update the Auto-Facets
//     (bins over dynamic sigma attributes like degree,
//      available since we initialized the sigma instance)
function updateDynamicFacets(optionalFilter) {
    let autoVals = {}
    for (var icat in TW.categories) {
      if (TW.SystemState().activetypes[icat]) {
        let nodecat = TW.categories[icat]
        autoVals[nodecat] = {}
        for (var autoAttr in TW.sigmaAttributes) {
          if (!optionalFilter || autoAttr == optionalFilter) {
            autoVals[nodecat][autoAttr] = {'map':{},'vals':{'vstr':[],'vnum':[]}}
            let getVal = TW.sigmaAttributes[autoAttr](TW.partialGraph)
            for (var nid of TW.ByType[icat]) {
              let nd = TW.partialGraph.graph.nodes(nid)
              if (nd && !nd.hidden) {
                let val = getVal(TW.partialGraph.graph.nodes(nid))
                if (! (val in autoVals[nodecat][autoAttr].map))
                  // a list of nids for each distinct values
                  autoVals[nodecat][autoAttr].map[val] = []
                autoVals[nodecat][autoAttr].map[val].push(nid)
                autoVals[nodecat][autoAttr].vals.vnum.push(val)
              }
            }
          }
        }
      }
    }

    // console.log("reparse dynamic attr, raw result", autoVals)
    let autoFacets = facetsBinning(autoVals)
    // console.log("reparse dynamic attr, binned result", autoFacets)

    // merge them into clusters
    //  - new popu counts for ticks and new labels (to update in menus+legend)
    //  - but preserve last color (for stability with previous view)
    for (var nodecat in autoFacets) {

      if (!TW.Facets[nodecat])  TW.Facets[nodecat] = {}

      for (var facet in autoFacets[nodecat]) {
        // first time: simple copy
        if (   !TW.Facets[nodecat][facet]
            || !TW.Facets[nodecat][facet].invIdx
            || !TW.Facets[nodecat][facet].invIdx.length ) {
          TW.Facets[nodecat][facet] = autoFacets[nodecat][facet]
        }
        // otherwise recycle old legend entries
        // (inheriting last colors feels coherent between views meso<=>macro)
        else {
          let last_colors = []
          for (var i_prev in TW.Facets[nodecat][facet].invIdx) {
            last_colors.push(TW.Facets[nodecat][facet].invIdx[i_prev].col)
          }

          // new legend entries allow
          for (var i_new in autoFacets[nodecat][facet].invIdx) {
            TW.Facets[nodecat][facet].invIdx[i_new] = autoFacets[nodecat][facet].invIdx[i_new]

            // skipped iff new nb of bins (which will trigger recoloring anyway)
            if (last_colors[i_new]) {
              TW.Facets[nodecat][facet].invIdx[i_new].col = last_colors[i_new]
            }
          }

        }
      }
    }
}

// Execution:    changeGraphAppearanceByFacets( true )
// It reads scanned node-attributes and prepared legends in TW.Facets
//  to add the button in the html with the sigmaUtils.gradientColoring(x) listener.
function changeGraphAppearanceByFacets(actypes) {
    if(!TW.conf.colorByAtt) return;

    if (!actypes)            actypes = getActivetypesNames()

    let currentNbNodes = {}
    for (var k in actypes) {
      currentNbNodes[actypes[k]] = TW.partialGraph.graph.getNodesByType(TW.catDict[actypes[k]]).length
    }

    // create colormenu and 1st default entry
    var color_menu_info = '<li><a href="#" onclick="graphResetAllColors() ; TW.partialGraph.refresh()">By Default</a></li>';

    if( $( "#colorgraph-menu" ).length>0 ) {
      for (var k in actypes) {
        let ty = actypes[k]

        // heading by type iff more than one type
        if (actypes.length > 1)
          color_menu_info += `<li class="pseudo-optgroup">${ty}</li>`

        for (var attTitle in TW.Facets[ty]) {
          let nbDomain = currentNbNodes[ty]

          // attribute counts: nb of classes
          // POSS here distinguish [ty][attTitle].classes.length and ranges.length
          let nbOutput = TW.Facets[ty][attTitle].invIdx.length

          if (nbOutput) {
            let lastClass = TW.Facets[ty][attTitle].invIdx[nbOutput-1]
            if (lastClass.labl && /^_non_numeric_/.test(lastClass.labl) && lastClass.nids) {
              if (lastClass.nids.length) {
                nbDomain -= lastClass.nids.length
              }
              else {
                nbOutput -= 1
              }
            }
          }

          // note any previous louvains
          if (attTitle == 'clust_louvain')  gotPreviousLouvain = true

          // coloring function
          let colMethod = getColorFunction(attTitle)

          // family label :)
          var attLabel ;
          if (TW.facetOptions[attTitle] && TW.facetOptions[attTitle]['legend']) {
            attLabel = TW.facetOptions[attTitle]['legend']
          }
          else attLabel = attTitle

          color_menu_info += `
            <li><a href="#" onclick='${colMethod}("${attTitle}",["${ty}"])'>
                By ${attLabel} (${nbOutput} | ${nbDomain})
            </a></li>
            `

          // for ex country with 26 classes on 75 nodes:
          //
          //  <a href="#" onclick="clusterColoring('country',['Scholars'])">
          //    By Country (26 | 75)
          //  </a>
          //

        }

        // if had not been already done, louvain added manually
        if (!TW.Facets[ty]['clust_louvain']) {
          color_menu_info += `<li><a href="#" onclick='clusterColoring("clust_louvain",["${ty}"])'>By Louvain clustering ( <span id="louvainN">?</span> | ${currentNbNodes[ty]})</a></li>`
        }

      }

      // for debug
      // console.warn('color_menu_info', color_menu_info)

      $("#colorgraph-menu").html(color_menu_info)
    }

    // Legend slots were prepared in TW.Facets
}

function getColorFunction(attTitle) {
  // coloringFunction name as str
  var colMethod

  // read from user settings
  if (TW.facetOptions[attTitle] && TW.facetOptions[attTitle]['col']) {
    colMethod = TW.gui.colorFuns[TW.facetOptions[attTitle]['col']]
  }

  // fallback guess-values
  if (! colMethod) {
    if(attTitle.indexOf("clust")>-1||attTitle.indexOf("class")>-1) {
      // for classes and clusters
      colMethod = "clusterColoring"
    }
    else {
      colMethod = "gradientColoring"
    }
  }

  return colMethod
}

// @cb: optional callback
function RunLouvain(cb) {

  var node_realdata = []
  var nodesV = getVisibleNodes()
  for(var n in nodesV)
    node_realdata.push( nodesV[n].id )

  var edge_realdata = []
  var edgesV = getVisibleEdges()
  for(var e in edgesV) {
    var st = edgesV[e].id.split(";")
    var info = {
        "source":st[0],
        "target":st[1],
        "weight":edgesV[e].weight
    }
    edge_realdata.push(info)
  }
    var community = jLouvain().nodes(node_realdata).edges(edge_realdata);
    var results = community();

    var louvainValNids = {}

    for(var i in results) {
      let n = TW.partialGraph.graph.nodes(i) // <= new way: like all other colors
      if (n && !n.hidden) {
        n.attributes["clust_louvain"] = results[i]
      }

      // also create legend's facets
      louvainValNids = updateValueFacets(louvainValNids, n, "clust_louvain")
    }

    let nClasses = 0
    for (let typ in louvainValNids)  {
      let reinvIdx = louvainValNids[typ]["clust_louvain"]['map']

      // init a new legend in TW.Facets
      TW.Facets[typ]['clust_louvain'] = {'meta':{}, 'invIdx':[]}

      for (let entry in reinvIdx) {
        let len = reinvIdx[entry].length
        if (len) {
          TW.Facets[typ]['clust_louvain'].invIdx.push({
            'labl': `cluster n°${entry} (${len})`,
            'fullLabl': `${typ}||Louvain||${entry} (${len})`,
            'nids': reinvIdx[entry],
            'val': entry
          })
          nClasses ++
        }
      }
    }

    // finally update the html menu
    let menu = document.getElementById('louvainN')
    if (menu) {
      menu.innerHTML = nClasses
    }

    if (! TW.facetOptions['clust_louvain']) {
      TW.facetOptions['clust_louvain'] = {'col': 'cluster'}
    }

    // update state and menu
    TW.SystemState().LouvainFait = true
    changeGraphAppearanceByFacets()

    // callback
    if (cb && typeof cb == 'function') {
      cb()
    }
}



// Highlights nodes with given value using id map
// previously: highlighted nodes with given value using loop on node values
function SomeEffect( ValueclassCode ) {
    // console.debug("highlighting:", ValueclassCode )

    cancelSelection(false, {"norender": true})

    TW.gui.selectionActive = true

    var nodes_2_colour = {};
    var edges_2_colour = {};


    // ex: ISItermsriskV2_140 & ISItermsriskV2_140::clust_default::7
    //       vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv          vvvvv      v
    //                     type                      Cluster key  class iClu
    //                                                (family)   (array index)
    var raw = ValueclassCode.split("::")
    var nodeType=raw[0],
        cluType=raw[1],
        iClu=Number(raw[2]);

    // we have our precomputed idmaps for nodes_2_colour => full selection
    // /!\ nodeset can be quite big

    // we still filter it due to Level or sliders filters
    filteredNodes = TW.Facets[nodeType][cluType].invIdx[iClu].nids.filter(
      function(nid){
        let n = TW.partialGraph.graph.nodes(nid)
        return Boolean(n && !n.hidden)
      }
    )

    if (filteredNodes.length) {
      TW.instance.selNgn.MultipleSelection2(
        {nodes: filteredNodes}
      )
    }
    else {
      cancelSelection()
    }
    // TW.partialGraph.refresh()
}

// some colorings cases also modify size and label
function graphResetLabelsAndSizes(){
  for(let nid in TW.Nodes) {
    let n = TW.partialGraph.graph.nodes(nid)
    if (n) {
      n.label = TW.Nodes[n.id].label
      n.size = TW.Nodes[n.id].size
    }
  }
}

function graphResetAllColors() {
  graphResetLabelsAndSizes()
  TW.gui.handpickedcolorsReset()
  updateColorsLegend()
}

// removes selectively for an array of nodetypes
function clearColorLegend (forTypes) {
  for (var ty of forTypes) {
    let legTy = document.getElementById("legend-for-"+TW.catDict[ty])
    if (legTy)
      legTy.remove()
  }
}


// @daclass: the name of a numeric/categorical attribute from node.attributes
// @forTypes: array of which typenames are concerned
// @groupingTicks: an optional threshold's array expressing ranges with their low/up bounds label and ref to matchin nodeIds
function updateColorsLegend ( daclass, forTypes, groupedByTicks ) {

    // console.warn("making legend forTypes", forTypes)

    // shortcut to erase legends for all types
    if(daclass == null) {
      clearColorLegend(TW.categories)
      $("#legend-for-facets").html("")
    };

    // current display among TW.categories (ex: ['terms'])
    if (typeof forTypes == 'undefined' || ! forTypes.length) {
      forTypes = getActivetypesNames().filter(function(ty){
      return daclass in TW.Facets[ty]
      })
    }
    // (we ignore other types: their color legends remain the same by default)

    for (var k in forTypes) {
      let curType = forTypes[k]
      var LegendDiv = "<div id=legend-for-"+TW.catDict[curType]+" class=\"over-panels my-legend\">"

      // all infos in a bin array
      var legendInfo = []

      // sample node color
      var ClustNB_CurrentColor = {}

      // passed as arg   or  prepared in parseCustom
      if (!groupedByTicks && (!TW.Facets[curType] || !TW.Facets[curType][daclass])) {
        console.warn(`no class bins for ${curType} ${daclass}`)
      }
      else {
        let daclassLabel = daclass
        if  (TW.facetOptions
          && TW.facetOptions[daclass]
          && TW.facetOptions[daclass].legend) {
            daclassLabel = TW.facetOptions[daclass].legend
        }

        LegendDiv += `    <div class="legend-title"><small>${curType}:</small> ${daclassLabel}</div>`
        LegendDiv += '    <div class="legend-scale">'
        LegendDiv += '      <ul class="legend-labels">'

        var legendInfo = groupedByTicks || TW.Facets[curType][daclass].invIdx

        if (getColorFunction(daclass) == "clusterColoring") {
          legendInfo.sort(function(a,b) {
            return b.nids.length - a.nids.length
          })
        }

        // valueclasses (values or intervals or classes) are already sorted in TW.Facets
        for (var l in legendInfo) {
          var nMatchedNodes = legendInfo[l]['nids'].length

          // get a sample node color for each bin/class
          let theColor = legendInfo[l].col || "#777"   // grey if empty

          // create the legend item
          var preparedLabel = legendInfo[l]['labl']

          if (/^_non_numeric_/.test(preparedLabel)) {
            if (!nMatchedNodes) {
              continue                // we skip "trash" category if empty
            }
            else {
              preparedLabel = "not numeric"
            }
          }

          // we add a title to cluster classes by ranking their nodes and taking k best labels, except if type is "social"
          if (TW.facetOptions[daclass]
           && TW.facetOptions[daclass].titlingMetric
           && TW.facetOptions[daclass].titlingMetric != 'off'
           && TW.facetOptions[daclass].col == 'cluster') {

            // let t0 = performance.now()

            let titles = []
            let theRankingAttr = TW.facetOptions[daclass].titlingMetric
            let maxLen = TW.facetOptions[daclass].titlingNTerms || 2

            // custom accessor (sigma auto attr or user settings or by default)
            let getVal
            if(theRankingAttr) {
              // one of the 3 sigma dynamic attributes 'degree', etc
              if (theRankingAttr in TW.sigmaAttributes) {
                getVal = TW.sigmaAttributes[theRankingAttr](TW.partialGraph)
              }
              // a user setting for a source data attribute
              else {
                getVal = function(node) {return node.attributes[theRankingAttr]}
              }
            }
            // default ranking: by size
            else {
              getVal = function(node) {return node.size}
            }

            // our source of words (labels)
            let ndsToRetrieveNameFrom = {}

            // if node0 contains meaningful labels for titling
            // we can title node1 clusters using node0 neighborhood
            // => we'll use metric on bipartite neighborhood labels
            // POSS it could be a conf option to use another type or not
            if (curType == TW.categories[1] && TW.Relations["XR"]) {
              // transitive step from nodetype to their surrogate nodetype
              for (var i in legendInfo[l]['nids']) {
                let start_nid = legendInfo[l]['nids'][i]
                let transitiveNids = TW.Relations["XR"][start_nid]
                for (var j in transitiveNids) {
                  let nei_nid = transitiveNids[j]
                  if (!ndsToRetrieveNameFrom[nei_nid]) {
                    ndsToRetrieveNameFrom[nei_nid] = 1
                  }
                  else {
                    ndsToRetrieveNameFrom[nei_nid] += 1   // <== coef
                  }
                }
              }
            }
            // normal case => directly use metric on these nodes' labels
            else {
              for (var i in legendInfo[l]['nids']) {
                let nid = legendInfo[l]['nids'][i]
                ndsToRetrieveNameFrom[nid] = 1
              }
            }

            for (var nid in ndsToRetrieveNameFrom) {
              let n = TW.Nodes[nid]
              let coef = ndsToRetrieveNameFrom[nid]

              let theRankingVal = getVal(n) * Math.sqrt(coef)

              if (titles.length < maxLen) {
                titles.push({'key':n.label, 'val':theRankingVal})
              }
              else {
                // we keep titles sorted for this
                let lastMax = titles.slice(-1)[0].val
                if (theRankingVal > lastMax) {
                  titles.push({'key':n.label, 'val':theRankingVal})
                }
              }

              titles.sort(function(a,b) {return b.val - a.val})
              titles = titles.slice(0,maxLen)
            }

            // replacing the cluster numbers by those k best titles in the legend
            preparedLabel = "["+titles.map(function(x){return x.key}).join(' / ')+"...]" + ` (${nMatchedNodes})`

            // console.log("finding title perf", performance.now() - t0, titles)
          }

          // all-in-one argument for SomeEffect
          var valueclassId = `${curType}::${daclass}::${l}`

          var colorBg = `<span class="lgdcol" style="background:${theColor};"></span>`

          LegendDiv += `<li onclick='SomeEffect("${valueclassId}")'>`
          LegendDiv += colorBg + preparedLabel
          LegendDiv += "</li>\n"
        }
        LegendDiv += '      </ul>'
        LegendDiv += '    </div>'
        LegendDiv += '  </div>'

        let perhapsPreviousLegend = document.getElementById("legend-for-"+TW.catDict[curType])
        if (perhapsPreviousLegend) {
          perhapsPreviousLegend.outerHTML = LegendDiv
        }
        else {
          let newLegend = document.createElement('div')
          $("#legend-for-facets").prepend(newLegend)
          newLegend.outerHTML = LegendDiv
        }
      }
    }
    $("#legend-for-facets").show()
}

// = = = = = = = = = = = [ / Clusters Plugin ] = = = = = = = = = = = //


// queryForType:
//   prepare query words from "selections of a given nodetype"
function queryForType(ntypeId){
  let subSels = TW.SystemState().selectionNids.filter(function(nid) {
    return TW.catDict[TW.Nodes[nid].type] == ntypeId
  })

  let qWordsForType = []
  for (var j in subSels) {
    let n = TW.Nodes[subSels[j]]
    qWordsForType.push(n.label)
  }

  return qWordsForType
}


// consult search API or DB data
//  - for a given nodetypeId: 0 (was:"semantic") or 1 (was:"social")
//  - of the DB corresponding to chosenAPI (or default TW.conf.relatedDocsType)

// args:
//  - qWords:         the search query as array of strings
//  - nodetypeId:     the queried nodetype
//  - chosenAPI:      the API "switch" dbtype ('twitter'||'csv'||'CortextDB')
//  - tgtDivId:       the div #id to update
function getTopPapers(qWords, nodetypeId, chosenAPI, tgtDivId) {

  // waiting image
  let image='<img style="display:block; margin: 0px auto;" src="twlibs/img/loader.gif"></img>';
  document.getElementById(tgtDivId).innerHTML = image

  // args and defaults
  if (! chosenAPI)      chosenAPI = TW.conf.relatedDocsType

  let apiurl = TW.conf.relatedDocsAPIS[chosenAPI]

  if (! apiurl) {
    apiurl = TW.conf.relatedDocsAPI
  }

  let cbDisplay = function(jsonData) {
    // console.log("cbDisplay", jsonData)
    return displayTopPapers(jsonData, nodetypeId, chosenAPI, tgtDivId)
  }

  let stockErrMsg = `
  <p class="micromessage">The API ${chosenAPI} couldn't be connected to.</p>
  <p class="micromessage">The queried route found in TW.conf was: <span class=code>${apiurl}</span>
  <br>Check if it is running and accessible.</p>`

  let resHTML = ''

  if (chosenAPI == "twitter") {
    let joinedQ = qWords.map(function(w){return'('+w+')'}).join(' AND ')
    $.ajax({
        type: 'GET',
        url: apiurl,
        data: {'query': joinedQ},
        contentType: "application/json",
        success : function(data){
            if (data.length) {
              cbDisplay(data)
            }
            else {
              cbDisplay([{
                "error": `<p class="micromessage centered">The query
                           <span class=code>${joinedQ}</span> delivers
                           no results on Twitter.</p>`
              }])
            }
        },
        error: function(){
          console.log(`Not found: relatedDocs for ${apiurl}`)
          cbDisplay([{ "error": stockErrMsg }])
        }
    });
  }
  else {
    let thisRelDocsConf = TW.currentRelDocsDBs[nodetypeId][chosenAPI]
    // /!\ documentation and specification needed for the php use cases /!\
    let joinedQ = JSON.stringify(qWords).split('&').join('__and__');
    // cf. the php code for these url args:
    //   - type: the node type id (0 or 1)
    //   - dbtype: 'CortextDB' or 'csv' decided by php read of the same conf file
    //             (we send it as param because phpAPI supports different dbtypes)

    // POSS object + join.map(join)
    let urlParams = "ndtype="+nodetypeId+"&dbtype="+chosenAPI+"&query="+joinedQ+"&gexf="+TW.File+"&n="+TW.conf.relatedDocsMax ;

    $.ajax({
        type: 'GET',
        url: apiurl + '/info_div.php',
        data: urlParams,
        contentType: "application/json",
        success : function(data){
          cbDisplay(data.hits)
        },
        error: function(){
          console.log(`Not found: relatedDocs for ${apiurl}`)
          cbDisplay([{ "error": stockErrMsg }])
        }
    });
  }
}

// function searches for template files in that order:
//   1) project-local data/myproject/hit_templates directory
//   2) app default twlibs/default_hit_templates directory
function makeRendererFromTemplate(tmplName) {
  let tmplStr = ''
  let tmplURL
  let gotTemplate

  let defRenderer = function(jsonHit) {
    return JSON.stringify(jsonHit, null, ' ').replace(/\n/g, '<br>') + '<br>'
  }

  if (! tmplName) {
    return defRenderer
  }

  // (1)
  if (TW.Project) {
    tmplURL = TW.Project + '/hit_templates/' + tmplName + '.html' ;
    if (linkCheck(tmplURL)) {
      gotTemplate = AjaxSync({ url: tmplURL });
    }
  }
  // (2)
  if (! gotTemplate || ! gotTemplate['OK']) {
    tmplURL = TW.conf.paths.templates + '/' + tmplName + '.html'
    if (linkCheck(tmplURL)) {
      gotTemplate = AjaxSync({ url: tmplURL });
    }
  }

  if (gotTemplate && gotTemplate['OK']) {
    tmplStr = gotTemplate.data
    // we return a customized renderJsonToHtml function
    return function(jsonHit) {
      let htmlOut = tmplStr
      for (key in jsonHit) {
        // our tags look like this in the template ==> by $${author}, [$${date}]
        let reKey = new RegExp('\\$\\$\\{'+key+'\\}', 'g')
        // we replace them by value
        htmlOut = htmlOut.replace(reKey, jsonHit[key])
      }

      // we also replace any not found keys by 'N/A'
      let reKeyAll = new RegExp('\\$\\$\\{[^\\}]+\\}', 'g')
      htmlOut = htmlOut.replace(reKeyAll, "N/A")

      return htmlOut
    }
  }
  else {
    console.error(`couldn't find template ${tmplName} at ${tmplURL},
                   using raw hits display`)
    return defRenderer
  }
}

function displayTopPapers(jsonHits, ndtypeId, chosenAPI, targetDiv) {

  // console.log('jsonHits', jsonHits)

  let resHTML = '<ul class="infoitems">'
  let toHtmlFun = function(){}

  if (chosenAPI == 'twitter') {
    toHtmlFun = renderTweet
  }
  else if (chosenAPI == "CortextDB" || chosenAPI == "csv") {
    let thisRelDocsConf = TW.currentRelDocsDBs[ndtypeId][chosenAPI]
    if (thisRelDocsConf && thisRelDocsConf.template) {
      toHtmlFun = makeRendererFromTemplate(thisRelDocsConf.template)
    }
    else {
      console.warn(`no rendering template found in ${TW.conf.paths.sourceMenu} for this source ${TW.File}...`)

      // try the universal template
      toHtmlFun = makeRendererFromTemplate("universal")
    }
  }

  for (var k in jsonHits) {
    let hitJson = jsonHits[k]
    if (hitJson.error) {
      resHTML += hitJson.error
    }
    else {
      resHTML += toHtmlFun(hitJson)
    }
  }

  resHTML += '</ul>'

  // effect the changes in topPapers
  document.getElementById(targetDiv).innerHTML = resHTML
}

function newPopup(url) {
	popupWindow = window.open(url,'popUpWindow','height=700,width=800,left=10,top=10,resizable=yes,scrollbars=yes,toolbar=no,menubar=no,location=no,directories=no,status=no')
}

function clickInsideTweet(e, tweetSrcUrl) {
    e.preventDefault()
    var tgt = e.target
    let max = 5
    if (tgt.tagName.toLowerCase() == "a") {
      window.open(tgt.href, "Link in tweet")
    }
    else {
      while (tgt = tgt.parentElement) {
        if (tgt.tagName.toLowerCase() == "a"
            || tgt.classList.contains('Tweet')
            || tgt.id == 'sidebar'
            || max <= 0) {
          break
        }
        else {
          max--
        }
      }
      if (tgt.tagName.toLowerCase() == "a") {
        window.open(tgt.href, "Parent Link in tweet")
      }
      else {
        window.open(tweetSrcUrl, "Source Tweet")
      }
    }
}

function formatDateLikeTwitter (aDate) {
  // partly inspired by https://github.com/hijonathan/moment.twitter/
  let msDiff = Date.now() - aDate

  let resStr = ''
  if (msDiff < 6000) {
    resStr = parseInt(msDiff/1000)+'s'
  }
  else if (msDiff < 36000) {
    resStr = parseInt(msDiff/6000)+'m'
  }
  else if (msDiff < 86400000) {
    resStr = parseInt(msDiff/36000)+'h'
  }
  else if (msDiff < 86400000) {
    resStr = parseInt(msDiff/36000)+'h'
  }
  else if (msDiff < 6048e5) {
    resStr = parseInt(msDiff/86400000)+'d'
  }
  else {
    resStr = aDate.asDate.toLocaleDateString(
                'en-US',
                { 'year': 'numeric',
                  'month': 'short',
                  'day': 'numeric' }
              )
  }
  return '&nbsp;·&nbsp;'+resStr
}

function renderTweet( tweet) {
    var tweet_links = true

    var tweetText = tweet.text

    // raw links
    tweetText = tweetText.replace(/(https?:\/\/[\w\.\/\_]+)/g, '<a href="$1">$1</a>')

    // #hashtags
    tweetText = tweetText.replace(/#(\w+)/g, '<a href="https://twitter.com/hashtag/$1">#$1</a>')

    // @users
    tweetText = tweetText.replace(/@(\w+)/g, '<a href="https://twitter.com/$1">@$1</a>')

    // date
    var tweetDate = new Date(tweet.created_at)

    var author_url = "http://twitter.com/"+tweet["user"]["screen_name"];
    var tweet_url = author_url+"/status/"+tweet["id_str"]
    var image_normal = author_url+"/profile_image?size=original";
    var image_bigger = "";
    if( tweet["user"]["profile_image_url"] ) {
        let saferUrl = tweet["user"]["profile_image_url"].replace(/^http:/, "https:")
        image_normal = saferUrl
        image_bigger = saferUrl.replace("_normal","_bigger")
    }
    var html = ""
    html += '\t\t'+ '<blockquote onclick="clickInsideTweet(event, \''+tweet_url+'\')" class="Tweet h-entry tweet subject expanded" cite="'+tweet_url+'" data-tweet-id="'+tweet["id_str"]+'" data-scribe="section:subject">' + '\n';

    html += '\t\t\t'+ '<div class="Tweet-header u-cf">' + '\n';

    html += '\t\t\t\t'+ '<div class="Tweet-brand u-floatRight">' + '\n';

    html += '\t\t\t\t'+ '<span class="Tweet-metadata dateline">' + '\n';

    html += '\t\t\t\t\t'+ '<a target="_blank" class="u-linkBlend u-url customisable-highlight long-permalink" data-datetime="'+tweetDate.toISOString()+'" data-scribe="element:full_timestamp" href="'+tweet_url+'">' + '\n';
    html += '\t\t\t\t\t\t'+ '<time class="dt-updated" datetime="'+tweetDate.toISOString()+'" title="'+tweet["created_at"]+'">'+formatDateLikeTwitter(tweetDate)+'</time>' + '\n';
    html += '\t\t\t\t\t'+ '</a>' + '\n';
    html += '\t\t\t\t'+ '</span>' + '\n';

    html += '\t\t\t\t\t'+ '<span class="u-hiddenInWideEnv">' + '\n';
    html += '\t\t\t\t\t\t'+ '<a target="_blank" href="'+tweet_url+'" data-scribe="element:logo">' + '\n';
    html += '\t\t\t\t\t\t\t'+ '<div class="Icon Icon--twitter " aria-label="" title="" role="presentation"></div>' + '\n';
    html += '\t\t\t\t\t\t'+ '</a>' + '\n';
    html += '\t\t\t\t\t'+ '</span>' + '\n';
    html += '\t\t\t\t'+ '</div>' + '\n';

    html += '\t\t\t\t'+ '<div class="Tweet-author u-textTruncate h-card p-author" data-scribe="component:author">' + '\n';
    html += '\t\t\t\t\t'+ '<a target="_blank" class="Tweet-authorLink Identity u-linkBlend" data-scribe="element:user_link" href="'+author_url+'">' + '\n';
    html += '\t\t\t\t\t\t'+ '<span class="Tweet-authorAvatar Identity-avatar">' + '\n';
    html += '\t\t\t\t\t\t\t'+ '<img class="Avatar u-photo" data-scribe="element:avatar" data-src-2x="'+image_bigger+'" src="'+image_normal+'">' + '\n';
    html += '\t\t\t\t\t\t'+ '</span>' + '\n';
    html += '\t\t\t\t\t\t'+ '<span class="Tweet-authorName Identity-name p-name customisable-highlight" data-scribe="element:name">'+tweet["user"]["name"]+'</span>' + '\n';
    html += '\t\t\t\t\t\t'+ '<span class="Tweet-authorScreenName Identity-screenName p-nickname" data-scribe="element:screen_name">@'+tweet["user"]["screen_name"]+'</span>' + '\n';

    html += '\t\t\t\t\t'+ '</a>' + '\n';
    html += '\t\t\t\t'+ '</div>' + '\n';
    html += '\t\t\t'+ '</div>' + '\n';

    html += '\t\t\t'+ '<div class="Tweet-body e-entry-content" data-scribe="component:tweet">' + '\n';

    html += '\t\t\t\t'+ '<p class="Tweet-text e-entry-title" lang="en" dir="ltr">' + tweetText + '</p>' + '\n';

    if( !isUndef(tweet["retweet_count"]) || !isUndef(tweet["favourites_count"])  ) {
        html += '\t\t\t\t'+ '<ul class="Tweet-actions" data-scribe="component:actions" role="menu" aria-label="Tweet actions">' + '\n';
        if(tweet_links) {
            html += '\t\t\t\t\t'+ '<li class="Tweet-action">' + '\n';
            html += '\t\t\t\t\t\t'+ '<a target="_blank" class="TweetAction TweetAction--reply web-intent" href="https://twitter.com/intent/tweet?in_reply_to='+tweet["id_str"]+""+'" data-scribe="element:reply">' + '\n';
            html += '\t\t\t\t\t\t\t'+ '<div class="Icon Icon--reply TweetAction-icon" aria-label="Reply" title="Reply" role="img"></div>' + '\n';
            html += '\t\t\t\t\t\t'+ '</a>' + '\n';
            html += '\t\t\t\t\t'+ '</li>' + '\n';
        }

        if(!isUndef(tweet["retweet_count"])) {
            html += '\t\t\t\t\t'+ '<li class="Tweet-action">' + '\n';
            html += '\t\t\t\t\t\t'+ '<a target="_blank" class="TweetAction TweetAction--retweet web-intent" href="https://twitter.com/intent/retweet?tweet_id='+tweet["id_str"]+'" data-scribe="element:retweet">' + '\n';
            html += '\t\t\t\t\t\t\t'+ '<div class="Icon Icon--retweet TweetAction-icon" aria-label="Retweet" title="Retweet" role="img"></div>' + '\n';
            html += '\t\t\t\t\t\t\t'+ '<span class="TweetAction-stat" data-scribe="element:retweet_count" aria-hidden="true">'+tweet["retweet_count"]+'</span>' + '\n';
            html += '\t\t\t\t\t\t\t'+ '<span class="u-hiddenVisually">'+tweet["retweet_count"]+' Retweets</span>' + '\n';
            html += '\t\t\t\t\t\t'+ '</a>' + '\n';
            html += '\t\t\t\t\t'+ '</li>' + '\n';
        }

        if(!isUndef(tweet["favourites_count"])) {
            html += '\t\t\t\t\t'+ '<li class="Tweet-action">' + '\n';
            html += '\t\t\t\t\t\t'+ '<a target="_blank" class="TweetAction TweetAction--favorite web-intent" href="https://twitter.com/intent/favorite?tweet_id='+tweet["id_str"]+'" data-scribe="element:favorite">' + '\n';
            html += '\t\t\t\t\t\t\t'+ '<div class="Icon Icon--favorite TweetAction-icon" aria-label="Favorite" title="Favorite" role="img"></div>' + '\n';
            html += '\t\t\t\t\t\t\t'+ '<span class="TweetAction-stat" data-scribe="element:favourites_count" aria-hidden="true">'+tweet["favourites_count"]+'</span>' + '\n';
            html += '\t\t\t\t\t\t\t'+ '<span class="u-hiddenVisually">'+tweet["favourites_count"]+' favorites</span>' + '\n';
            html += '\t\t\t\t\t\t'+ '</a>' + '\n';
            html += '\t\t\t\t\t'+ '</li>' + '\n';
        }

        html += '\t\t\t\t'+ '</ul>' + '\n';
    }


    html += '\t\t\t'+ '</div>' + '\n';


    html += '\t\t'+ '</blockquote>' + '\n';
    // html += '\t\t'+ '<br>' + '\n';


    return html;
}

function showStats(){
  let statsHtml = ''
  if (TW.stats.dataLoadTime) {
    statsHtml += '<h5 class=stats-title>Data loading</h5>'
    statsHtml += `<b>${parseInt(TW.stats.dataLoadTime)} ms</b>`
  }

  let statCols = ['min','median', 'mean', 'max']
  if (TW.stats.nodeSize && typeof TW.stats.nodeSize == "object") {
    let ntypes = Object.keys(TW.stats.nodeSize)
    if (ntypes.length) {
      ntypes.sort()
      statsHtml += '<h5 class=stats-title>Node sizes</h5>'
      for (var ntype in TW.stats.nodeSize) {
        statsHtml += `<b>${ntype} (${TW.stats.nodeSize[ntype].len})</b>`
        statsHtml += `<table class=stats-table>`
        for (var k in statCols) {
          let prop = statCols[k]
          statsHtml +=`<tr><td class=stats-prop>${prop}</td>`
          statsHtml += `<td>${parseInt(TW.stats.nodeSize[ntype][prop]*10000)/10000}</td></tr>`
        }
        statsHtml += `</table>`
      }
    }
  }
  if (TW.stats.edgeWeight && typeof TW.stats.edgeWeight == "object") {
    let categs = Object.keys(TW.stats.edgeWeight)
    if (categs.length) {
      statsHtml += '<h5 class=stats-title>Edge weights</h5>'
      for (var categ in TW.stats.edgeWeight) {
        statsHtml += `<b>${categ} (${TW.stats.edgeWeight[categ].len})</b>`
        statsHtml += `<table class=stats-table>`
        for (var k in statCols) {
          let prop = statCols[k]
          statsHtml +=`<tr><td class=stats-prop>${prop}</td>`
          statsHtml += `<td>${parseInt(TW.stats.edgeWeight[categ][prop]*10000)/10000}</td></tr>`
        }
        statsHtml += `</table>`
      }
    }
  }
  return statsHtml
}


function getTips(){
    text =
        "<br>"+
        "Basic Interactions:"+
        "<ul>"+
        "<li>Click on a node to select/unselect and get its information. In case of multiple selection, the button unselect clears all selections,</li>"+
        "<li> Use your mouse scroll to zoom in and out in the graph.</li>"+
        "</ul>"+
        "<br>"+
        "Graph manipulation:"+
        "<ul>"+
        "<li>Node size is proportional to the number of documents with the associated term,</li>"+
        "<li>Use the node filter to create a subgraph with nodes of a given size range (e.g. display only generic terms),</li>"+
        "<li>Link strength is proportional to the strenght of terms association,</li>"+
        "<li>Use the edge filter so create a subgraph with links in a given range (e.g. keep the strongest association).</li>"+
        "</ul>"+
        "<br>"+
        "Global/local view:"+
        "<ul>"+
        "<li>The 'change level' button allows to change between global view and node centered view,</li>"+
        "<li>To explore the neighborhood of a selection click on the 'change level' button.</li>"+
        "</ul>";
    return text;
}


// show Selector circle
// --------------------
// new sigma.js: could be replaced by default _moveHandler with bindings ?
//   => atm rewrote entire function with new values
function circleTrackMouse(e) {
    // new sigma.js 2D mouse context
    var ctx = TW.partialGraph.renderers[0].contexts.mouse;
    ctx.globalCompositeOperation = "source-over";

    // clear zone each time to prevent repeated frame artifacts
    ctx.clearRect(0, 0,
                  TW.partialGraph.renderers[0].container.offsetWidth,
                  TW.partialGraph.renderers[0].container.offsetHeight);

    // classic mousemove event or other similar non-sigma events
    x = sigma.utils.getX(e);
    y = sigma.utils.getY(e);

    // optional: make more labels appear on circle hover (/!\ costly /!\ esp. on large graphs)
    if (TW.conf.moreLabelsUnderArea) {
      // convert screen => mouse => cam
      var mouseCoords = sigma.utils.mouseCoords(e)
      var camCoords = TW.cam.cameraPosition(mouseCoords.x, mouseCoords.y)

      var exactNodeset = circleGetAreaNodes(
        camCoords.x,
        camCoords.y
      )
      // console.log("nodes under circle:", exactNodeset)

      // we'll use labelThreshold / 3 as the "boosted" cam:size threshold
      let pfx = TW.cam.readPrefix
      let toRedraw = []
      for (var k in exactNodeset) {
        let n = TW.partialGraph.graph.nodes(exactNodeset[k])
        if(!n.hidden && n[pfx+'size'] > (TW.customSettings.labelThreshold / 3)) {
          toRedraw.push(n)
        }
      }
      redrawNodesInHoverLayer(toRedraw, "hovers")
    }

    // draw the circle itself
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.fillStyle = "#71C3FF";
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(x, y, TW.gui.circleSize, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.globalAlpha = 1

}


// exact subset of nodes under circle
function circleGetAreaNodes(camX0, camY0) {

  var cursor_ray = TW.gui.circleSize * TW.cam.ratio // converting TW.gui.circleSize to cam units

  // prepare an approximate neighborhood
  var slightlyLargerNodeset = circleLocalSubset(
    camX0, camY0,
    cursor_ray
  )

  // console.log('slightlyLargerNodeset', slightlyLargerNodeset)

  var exactNodeset = []

  for(var i in slightlyLargerNodeset){
    n = slightlyLargerNodeset[i];
    if(!n.hidden){
      distance = Math.sqrt(
                  Math.pow((camX0-parseInt(n['read_cam0:x'])),2) +
                  Math.pow((camY0-parseInt(n['read_cam0:y'])),2)
      );

      // console.log('D[P0,'+n.label+'] =', distance)

      if( distance <= cursor_ray) {
        exactNodeset.push(n.id)
      }
    }
  }

  return exactNodeset
}


// returns set of nodes in the quad subzones around a square
//         that is containing the circle centered on x0, y0
// (use case: reduce number of nodes before exact check)
function circleLocalSubset(camX0, camY0 , camRay) {

  var P0 = {x:camX0, y:camY0}

  // to use quadtree.area, we consider the square
  // in which our circle is inscribed

  //                y-
  //
  //        P1 x----------x P2
  //           |          |
  // <= x-     |    P0    | 2r      x+ =>
  //           |          |
  //           x----------x
  //
  //                y+


  var P1 = {x: P0.x - camRay , y: P0.y - camRay }  // top left
  var P2 = {x: P0.x + camRay , y: P0.y - camRay }  // top right

  var areaNodes = TW.cam.quadtree.area({
                        height: 2 * camRay,
                        x1:P1.x,  y1:P1.y,
                        x2:P2.x,  y2:P2.y
                      })

  // neighborhood guaranteed a bit larger than the square
  // console.log('got ',areaNodes.length, 'nodes:', areaNodes)

  return areaNodes
}


// BASIC MODULARITY
// =================
// activateModules is for adding/removing features from TinawebJS
// each flag is simultaneously 3 things:
//   - the key of a bool config value in TW.conf.ModulesFlags (settings_explorerjs)
//   - the dirname of the submodule's files (with a mandatory init.js)
//   - the css class of all html elements added by the submodule
function activateModules() {

    // special case: can't run if explorer opened locally (loadJS cors pb)
    // ex: location == "file:///home/romain/tw/DEV_PJXP/explorerjs.html"
    if (window.location.protocol == "file:") {
      let localWarning = "localfile mode: Won't sync optional modules"

      // log additional details if present
      if (TW.conf.ModulesFlags && typeof TW.conf.ModulesFlags == "object") {
        let requestedModules = Object.keys(
          TW.conf.ModulesFlags
        ).filter(function(moduleName){return TW.conf.ModulesFlags[moduleName]})
        localWarning += " (" + requestedModules.join(",") + " => not loaded)"
      }
      console.warn(localWarning)
    }
    // normal case (all other modes)
    // -----------
    else {
      for(var key in TW.conf.ModulesFlags) {
        if(TW.conf.ModulesFlags[key]===false) {
            $("."+key).remove() ; // hide elements of module's class
        }
        else {
            // console.log("extras:activateModules: key is true: "+key)
            // load JS+CSS items corresponding to the flagname
            let my_src_dir = TW.conf.paths.modules + '/'+ key

            // synchronous ajax
            let moduleIsPresent = linkCheck(my_src_dir+"/init.js")

            if (moduleIsPresent) {
              loadJS(my_src_dir+"/init.js") ;
            }
            else {
              console.warn (`didn't find module dir ${key}`)
              $("."+key).remove()
            }
            // ex: for the flag = crowdsourcingTerms
            //     will load ==> JS    crowdsourcingTerms/init.js
            //               ==> other elements listed in init.js
            //                ├── "crowdsourcingTerms"+"/crowdTerms.css"
            //                └── "crowdsourcingTerms"+"/suggest.js"
        }
    }
  }
}


// Settings edition
// =================


// creates a list of automatic <options> for all present attributes
// (or a sublist on a meta.dataType condition
//  NB condition on dataType could be on an extended meta "attrType"
//     cf. doc/developer_manual.md autodiagnose remark)
function fillAttrsInForm(menuId, optionalAttTypeConstraint) {
  var actypes = getActivetypesNames()
  let elChooser = document.getElementById(menuId)

  // 1- remove any previous options from possible previous graphs
  let filledOptions = document.getElementById(menuId).querySelectorAll('option[data-opttype=filled]')
  for (var i = 0 ; i <= filledOptions.length - 1 ; i++) {
    elChooser.removeChild(filledOptions[i])
  }

  // 2- ls | uniq all options (no matter what active type they belong too)
  let uniqOptions = {'clust_louvain': true}
  for (let tid in actypes) {
    let ty = actypes[tid]
    for (var att in TW.Facets[ty]) {
      if (!optionalAttTypeConstraint
           || (   TW.Facets[ty][att].meta.dataType
               && TW.Facets[ty][att].meta.dataType == optionalAttTypeConstraint)) {
         uniqOptions[att] = true
       }
     }
   }

  // 3- write to DOM
  for (var att in uniqOptions) {
    // <option> creation
    // -------------------
    // each facet family or clustering type was already prepared
    let opt = document.createElement('option')
    opt.value = att
    opt.innerText = att
    opt.dataset.opttype = "filled"
    if (att in TW.facetOptions && TW.facetOptions[att].legend) {
      opt.innerText = TW.facetOptions[att].legend + " (" + att + ")"
    }
    else {
      opt.innerText = "(" + att + ")"
    }
    if (att == 'clust_louvain') {
      opt.selected = true
    }
    elChooser.appendChild(opt)
  }

  showAttrConf(null, 'clust_louvain')
}

// for optional questions:
//  ( displays subQuestion iff mainQuestion has one of the mainQOkValues )
function conditiOpen(subQId, mainQId, mainQOkValues) {
  let mainq = document.getElementById(mainQId)
  let subq  = document.getElementById(subQId)

  let triggerVal = false
  for (let i in mainQOkValues) {
    if (mainq.value == mainQOkValues[i]) {
      triggerVal = true
      break
    }
  }
  // show or not
  subq.style.display = triggerVal ? 'block' : 'none'
}

// attr-col change has complex consequences
function colChangedHandler() {
  // for the implication [cluster => grey freeze binmode off but keep it shown,
  //                        other => reactivate ]
  // (no sense to ordinally bin clusters)
  let elColQ = document.getElementById('attr-col')
  let elBinmodeQ = document.getElementById('attr-binmode')
  if (elColQ.value == 'cluster') {
    elBinmodeQ.value = "off"
    elBinmodeQ.disabled = true
    elBinmodeQ.style.backgroundColor = "#777"
  }
  else {
    elBinmodeQ.disabled = false
    elBinmodeQ.style.backgroundColor = ""
  }

  // for titling subquestion show
  conditiOpen('choose-titling-div', 'attr-col',['cluster'])

  // for nbins subquestion show
  conditiOpen('attr-nbins-div', 'attr-binmode',['samepop', 'samerange'])

}


function showAttrConf(event, optionalAttrname) {
  let attrTitle = optionalAttrname || this.value
  let settings = TW.facetOptions[attrTitle] || {}
  document.getElementById('attr-translation').value = settings.legend || attrTitle
  document.getElementById('attr-col').value = settings.col || 'gradient'
  document.getElementById('attr-binmode').value = settings.binmode || 'off'
  document.getElementById('attr-nbins').value = settings.n || TW.conf.legendsBins || 5
  document.getElementById('attr-titling-metric').value = settings.titlingMetric || 'auto-size'
  document.getElementById('attr-titling-n').value = settings.titlingNTerms || 2

  // make the binmode and titling details adapt to choosen settings.col
  colChangedHandler()
}


function newSettingsAndRun() {

  // matching: traditional vs multi
  let match_alg = document.getElementById('match-alg').value
  if (match_alg == "tradi") {
    TW.conf.sourceAPI["forNormalQuery"] = "services/api/graph"
    TW.conf.sourceAPI["forFilteredQuery"] = "services/api/graph"
  }
  else if (match_alg == "multi") {
    TW.conf.sourceAPI["forNormalQuery"] = "services/api/multimatch"
    TW.conf.sourceAPI["forFilteredQuery"] = "services/api/multimatch"
  }

  // position stability scenarios
  let scenario = document.getElementById('layout-scenario').value

  if (scenario == "allstable") {
    TW.conf.stablePositions = true
    TW.conf.independantTypes = false
    TW.conf.fa2SlowerMeso = false
    TW.FA2Params.iterationsPerRender = 12
    TW.FA2Params.slowDown = .4
  }
  else if (scenario == "indeptypes") {
    TW.conf.stablePositions = true
    TW.conf.independantTypes = true
    TW.conf.fa2SlowerMeso = false
    TW.FA2Params.iterationsPerRender = 4
  }
  else if (scenario == "indeptypes-adaptspeed") {
    TW.conf.stablePositions = true
    TW.conf.independantTypes = true
    TW.conf.fa2SlowerMeso = true
    TW.FA2Params.iterationsPerRender = 4
    TW.FA2Params.iterationsPerRender = 4
  }
  else if (scenario == "notstable") {
    TW.conf.stablePositions = false
    TW.conf.independantTypes = true
    TW.conf.fa2SlowerMeso = false
    TW.FA2Params.iterationsPerRender = 4
  }

  console.warn("TW.conf.sourceAPI[\"forFilteredQuery\"] <= ", TW.conf.sourceAPI["forFilteredQuery"])
  console.warn("TW.conf.stablePositions <= ", TW.conf.stablePositions)
  console.warn("TW.conf.independantTypes <= ", TW.conf.independantTypes)
  console.warn("TW.FA2Params.iterationsPerRender <= ", TW.FA2Params.iterationsPerRender)

  // in all cases we reload
  TW.resetGraph()
  var [inFormat, inData, mapLabel] = syncRemoteGraphData()
  mainStartGraph(inFormat, inData, TW.instance)
  writeLabel(mapLabel)
}


// writes new attribute configuration from user form, recreates facet bins AND runs the new color
// processing time: ~~ 1.5 ms for 100 nodes
function newAttrConfAndColor() {
  let attrTitle = document.getElementById('choose-attr').value

  let legendChanged = (
    (! "legend" in TW.facetOptions[attrTitle] && document.getElementById('attr-translation').value)
       ||
    (TW.facetOptions[attrTitle].legend != document.getElementById('attr-translation').value)
  )

  // read values from GUI
  TW.facetOptions[attrTitle] = {
     'col': document.getElementById('attr-col').value,
     'binmode': document.getElementById('attr-binmode').value,
     'n': document.getElementById('attr-nbins').value,
     'legend': document.getElementById('attr-translation').value,

     // only for clusterings (ie currently <=> (col == "cluster"))
     'titlingMetric': document.getElementById('attr-titling-metric').value,
     'titlingNTerms': document.getElementById('attr-titling-n').value || 2
  }

  // case where we need to update dialog displays because of new legend
  if (legendChanged) {
    fillAttrsInForm('choose-attr')
    fillAttrsInForm('attr-titling-metric', 'num')
  }

  // dynamic attribute case
  if (attrTitle in TW.sigmaAttributes) {
    updateDynamicFacets(attrTitle)        // all-in-one function
  }

  // classic data-driven attribute case
  else {

    // 1 - find the corresponding types
    let relevantTypes = {}
    for (let ty in TW.Facets) {
      if (TW.Facets[ty][attrTitle]) {
        relevantTypes[ty] = true
      }
    }

    // 2 - reparse values (avoids keeping them in RAM since parseCustom)
    tmpVals = {}
    for (let nid in TW.Nodes) {
      let n = TW.Nodes[nid]
      if (relevantTypes[n.type]) {
        tmpVals = updateValueFacets(tmpVals, n, attrTitle)
      }
    }

    let newClustering = facetsBinning (tmpVals)

    // 3 - write result to global TW.Facets
    for (let ty in newClustering) {
      TW.Facets[ty][attrTitle] = newClustering[ty][attrTitle]
    }

    // console.log("reparse raw result", tmpVals)
    // console.log("reparse binned result", newClustering)
  }

  // update the GUI menu
  changeGraphAppearanceByFacets()

  // run the new color
  let colMethod = TW.gui.colorFuns[TW.facetOptions[attrTitle]['col']]
  window[colMethod](attrTitle)
}
