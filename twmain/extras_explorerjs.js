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

// Execution:    changeGraphAppearanceByFacets( true )
// It reads scanned node-attributes and prepared legends in TW.Clusters
//  to add the button in the html with the sigmaUtils.gradientColoring(x) listener.
function changeGraphAppearanceByFacets(actypes) {
    if(!TW.conf.colorByAtt) return;

    if (!actypes)            actypes = getActivetypesNames()

    let currentNbNodes = TW.partialGraph.graph.nNodes()

    // create colormenu and 1st default entry
    var color_menu_info = '<li><a href="#" onclick="TW.gui.handpickedcolor = false ; graphResetLabelsAndSizes() ; TW.partialGraph.refresh()">By Default</a></li>';

    if( $( "#colorgraph-menu" ).length>0 ) {
      for (var tid in actypes) {
        let ty = actypes[tid]

        // each facet family or clustering type was already prepared
        for (var attTitle in TW.Clusters[ty]) {

          // attribute counts: nb of classes
          // POSS here distinguish [ty][attTitle].classes.length and ranges.length
          var attNbClasses = TW.Clusters[ty][attTitle].invIdx.length
          var attNbNodes = currentNbNodes

          if (attNbClasses) {
            let lastClass = TW.Clusters[ty][attTitle].invIdx[attNbClasses-1]
            if (lastClass.labl && lastClass.labl == '_non_numeric_' && lastClass.nids) {
              if (lastClass.nids.length) {
                attNbNodes -= lastClass.nids.length
              }
              else {
                attNbClasses -= 1
              }
            }
          }

          // coloringFunction
          var colMethod

          // read from user settings
          if (TW.conf.facetOptions[attTitle] && TW.conf.facetOptions[attTitle]['col']) {
            colMethod = TW.gui.colorFuns[TW.conf.facetOptions[attTitle]['col']]
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

          // family label :)
          var attLabel ;
          if (attTitle == 'clust_louvain') {
            attLabel = 'Groupes de voisins, méthode de Louvain'
          }
          else if (TW.conf.facetOptions[attTitle] && TW.conf.facetOptions[attTitle]['menutransl']) {
            attLabel = TW.conf.facetOptions[attTitle]['menutransl']
          }
          else attLabel = attTitle

          color_menu_info += `<li><a href="#" onclick='${colMethod}("${attTitle}")'>By ${attLabel} (${attNbClasses} | ${attNbNodes})</a></li>`
        }

        // POSS add cumulated degree via TW.partialGraph.graph.degree(nid)
      }

      // we also add clust_louvain in all cases
      color_menu_info += `<li><a href="#" onclick='clusterColoring("clust_louvain")'>By Louvain clustering ( <span id="louvainN">?</span> | ${currentNbNodes})</a></li>`

      // for debug
      // console.warn('color_menu_info', color_menu_info)

      $("#colorgraph-menu").html(color_menu_info)
    }

    // Legend slots were prepared in TW.Clusters

}

function RunLouvain() {

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
      if (n) {
        n.attributes["clust_louvain"] = results[i]
      }

      // also create legend's facets
      louvainValNids = updateValueFacets(louvainValNids, n, "clust_louvain")
    }

    let nClasses = 0
    for (let typ in louvainValNids)  {
      let reinvIdx = louvainValNids[typ]["clust_louvain"]['map']

      // init a new legend in TW.Clusters
      TW.Clusters[typ]['clust_louvain'] = {'meta':{}, 'invIdx':[]}

      for (let entry in reinvIdx) {
        let len = reinvIdx[entry].length
        if (len) {
          TW.Clusters[typ]['clust_louvain'].invIdx.push({
            'labl': `${entry} (${len})`,
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

    if (! TW.conf.facetOptions['clust_louvain']) {
      TW.conf.facetOptions['clust_louvain'] = {'col': 'cluster'}
    }
    // NB the LouvainFait flag is updated by caller fun
}



// Highlights nodes with given value using id map
// previously: highlighted nodes with given value using loop on node values
function SomeEffect( ValueclassCode ) {
    // console.debug("highlighting:", ValueclassCode )

    deselectNodes(TW.SystemState())

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


    var activetypesKey = getActivetypesKey()

    // we have our precomputed idmaps for nodes_2_colour => full selection
    // /!\ nodeset can be quite big
    TW.instance.selNgn.MultipleSelection2(
      {nodes: TW.Clusters[nodeType][cluType].invIdx[iClu].nids}
    )
    TW.partialGraph.refresh()
}

// some colorings cases also modify size and label
function graphResetLabelsAndSizes(){
  for(let j in TW.nodeIds){
    let n = TW.partialGraph.graph.nodes(TW.nodeIds[j])
    if (n) {
      n.label = TW.Nodes[n.id].label
      n.size = TW.Nodes[n.id].size
    }
  }
  set_ClustersLegend()
}

// @daclass: the name of a numeric/categorical attribute from node.attributes
// @groupingTicks: an optional threshold's array expressing ranges with their low/up bounds label and ref to matchin nodeIds
function set_ClustersLegend ( daclass, groupedByTicks ) {
    $("#legend-for-clusters").removeClass( "my-legend" )
    $("#legend-for-clusters").html("")
    if(daclass==null) return;

    var actypes = getActivetypesNames()

    // we have no specifications yet for colors (and legends) on multiple types
    if (actypes.length > 1) {
      console.warn("colors by bins will only color nodes of type 0")
    }
    // current display among TW.categories (ex: 'terms')
    var curType = actypes[0]

    // all infos in a bin array
    var legendInfo = []

    // sample node color
    var ClustNB_CurrentColor = {}

    // passed as arg   or  prepared in parseCustom
    if (!groupedByTicks && (!TW.Clusters[curType] || !TW.Clusters[curType][daclass])) {
      console.warn(`no class bins for ${daclass}, displaying no legend`)

      $("#legend-for-clusters").hide()
    }
    else {
      var LegendDiv = ""
      LegendDiv += `    <div class="legend-title">${daclass}</div>`
      LegendDiv += '    <div class="legend-scale">'
      LegendDiv += '      <ul class="legend-labels">'

      var legendInfo = groupedByTicks || TW.Clusters[curType][daclass].invIdx

      // valueclasses (values or intervals or classes) are already sorted in TW.Clusters
      for (var l in legendInfo) {

        // get a sample node color for each bin/class
        var nMatchedNodes = legendInfo[l]['nids'].length

        let theColor = legendInfo[l].col || "#111"   // black if empty

        // create the legend item
        var preparedLabel = legendInfo[l]['labl']

        if (preparedLabel == '_non_numeric_') {
          if (!nMatchedNodes) {
            continue                // we skip "trash" category if empty
          }
          else {
            preparedLabel = "not numeric"
          }
        }

        // we add a title to cluster classes by ranking their nodes and taking k best labels
        if (TW.conf.facetOptions[daclass] && TW.conf.facetOptions[daclass].col == 'cluster' && getActivetypesKey() != "0|1" ) {

          // let t0 = performance.now()

          let titles = []
          let theRankingAttr = TW.conf.facetOptions[daclass].titlingMetric
          let maxLen = TW.conf.facetOptions[daclass].titlingNTerms || 2

          // custom accessor (user settings or by default)
          let getVal
          if(theRankingAttr) {
            getVal = function(node) {return node.attributes[theRankingAttr]}
          }
          else {
            // default ranking: by size
            getVal = function(node) {return node.size}
          }

          for (let j in legendInfo[l]['nids']) {
            let n = TW.partialGraph.graph.nodes(legendInfo[l]['nids'][j])

            let theRankingVal = getVal(n)

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

          // adding those k best titles to the legend
          preparedLabel += " ["+titles.map(function(x){return x.key}).join('/')+"...]"

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

      $("#legend-for-clusters").addClass( "my-legend" );
      $("#legend-for-clusters").html( LegendDiv )
      $("#legend-for-clusters").show()
    }
}

// = = = = = = = = = = = [ / Clusters Plugin ] = = = = = = = = = = = //


// getTopPapersCurrentTypes:
//    recursive caller of topPapers (makes it work for both types)

// idea:
//  function myCaller(n) {
//    if (n == 1)
//      myFetcher('START', 'hello', displayFun)
//    else if (n == 2)
//      myFetcher('START', 'hello', function(aStr) {myFetcher(aStr, "world", displayFun)})
//   }

function getTopPapers(){
  // waiting image
  let image='<img style="display:block; margin: 0px auto;" src="twlibs/img/loader.gif"></img>';
  $("#topPapers").html(image);

  // swNodetypes <=> active types expressed as "semantic" and "social"
  // ------------------------------------------------------------------
  // according to directives types should only be called type 0 or 1
  // but in the case of topPapers this "legacy" form is good sense
  // and it is used elsewhere (external APIs and DBs)
  var swNodetypes = getActivetypesNames().map(function(t){return swActual(t)})

  let sels = TW.SystemState().selectionNids

  // traditional case run once and display
  if (swNodetypes.length == 1) {
    topPapersFetcher(swNodetypes[0], getNodeLabels(sels))
  }
  // if both types we call 2 nested times
  else {
    // prepare: sort selections' labels as query words by swtype
    var qWordsbySwType = {'semantic': [], 'social': []}
    for (var swtype in swNodetypes) {
      qWordsbySwType[swtype] = []
    }
    for (var j in sels) {
      let n = TW.Nodes[sels[j]]
      qWordsbySwType[swActual(n.type)].push(n.label)
    }

    // do the first then the nested call
    topPapersFetcher(
      swNodetypes[0],
      qWordsbySwType[swNodetypes[0]],
      `<h2>${swNodetypes[0]}</h2>`,
      function(enrichedHtml) {
        topPapersFetcher(
          swNodetypes[1],
          qWordsbySwType[swNodetypes[1]],
          enrichedHtml+`<p class=centered>---</p><h2>${swNodetypes[1]}</h2>`,
          displayTopPapers
        )
      }
    )
  }
}


// consult search API or DB data of TW.conf.relatedDocsType
// for a given "legacy" type ("semantic" or "social")

// args:
//  - using qWords array as a search engine query
//  - and enriching the corresponding matches' HTML
//  - cbNext is a partial function to handle the follow-up
//    (just pass it resHTML, to continue enriching or display)
//
function topPapersFetcher(swType, qWords, priorHtml, cbNext){

  if (isUndef(priorHtml))    priorHtml = ''
  if (isUndef(cbNext))       cbNext = displayTopPapers

  // introducing the modern node type thanks to updated db.json specs
  let nodetype = (swType == 'semantic') ? 0 : 1

  let stockErrMsg = `<p class="micromessage">
    Your settings for relatedDocsType are set on ${TW.conf.relatedDocsType}
    API but it couldn't be connected to.</p>`

  if (TW.conf.relatedDocsType == "api") {
    stockErrMsg += `<p class="micromessage">Check if it is running and
    accessible:<br><span class=code>${TW.conf.relatedDocsAPI}</span></p>`
  }

  let resHTML = ''

  let apiurl = TW.conf.relatedDocsAPIS[TW.conf.relatedDocsType]

  if (! apiurl) {
    apiurl = TW.conf.relatedDocsAPI
  }

  if (TW.conf.relatedDocsType == "twitter") {
    let joinedQ = qWords.map(function(w){return'('+w+')'}).join(' AND ')
    $.ajax({
        type: 'GET',
        url: apiurl,
        data: {'query': joinedQ},
        contentType: "application/json",
        success : function(data){
            if (data.length) {
              for (var k in data) {
                let tweetJson = data[k]
                resHTML += renderTweet(tweetJson)
              }
            }
            else {
              resHTML += `<p class="micromessage centered">The query
                         <span class=code>${joinedQ}</span> delivers
                         no results on Twitter.</p>`
            }
            cbNext(priorHtml + resHTML)
        },
        error: function(){
          console.log(`Not found: relatedDocs for ${apiurl}`)
          cbNext(priorHtml + stockErrMsg)
        }
    });
  }
  else if (TW.conf.relatedDocsType == "LocalDB") {
    let thisRelDocsConf = TW.gmenuInfos[TW.File][nodetype]
    if (!thisRelDocsConf) {
      resHTML =
        `<p>Your settings for relatedDocsType are set on a local database,
            but your servermenu file does not provide any information about
            the CSV or DB table to query for related documents
            (on nodetype ${nodetype}: ${swType})</p>`
            cbNext(priorHtml + resHTML)
            return
    }
    else {
      // /!\ documentation and specification needed for the php use cases /!\
      let joinedQ = JSON.stringify(qWords).split('&').join('__and__');
      // cf. the php code for these url args:
      //   - type: the node type (social/semantic)
      //   - dbtype: 'sql' (classic sqlite like wos)
      //          or 'csv' (like gargantext exports)

      // POSS object + join.map(join)
      let urlParams = "type="+swType+"&query="+joinedQ+"&gexf="+TW.File+"&n="+TW.conf.relatedDocsMax+"&dbtype="+thisRelDocsConf.reldbtype

      if (thisRelDocsConf.reldbtype == "CortextDB") {
        var qIndex = thisRelDocsConf.reldbtable    // a table
        urlParams += `&index=${qIndex}`
      }
      else {
        // a list of csv columns to search in
        // ex: for semantic nodes matching we look in 'title', 'keywords' cols
        //     for social nodes matching we look in 'authors' col... etc.
        let joinedSearchCols = JSON.stringify(thisRelDocsConf.reldbqcols)
        urlParams += `&searchin=${joinedSearchCols}`

        // HIGHER LEVEL SCOPE (whole indexation directive) WILL BE MOVED TO PHP
        let allCols = {}

        if (TW.gmenuInfos[TW.File][0])
          allCols.semantic = TW.gmenuInfos[TW.File][0].reldbqcols

        if (TW.gmenuInfos[TW.File][1])
          allCols.social = TW.gmenuInfos[TW.File][1].reldbqcols

        let joinedAllCols = JSON.stringify(allCols)
        urlParams += `&toindex=${joinedAllCols}`
        // POSS use a direct access from php to db.json to avoid toindex
      }

      $.ajax({
          type: 'GET',
          url: apiurl + '/info_div.php',
          data: urlParams,
          success : function(data){
              console.log(`relatedDocs: ${apiurl}/info_div.php?${urlParams}`);
              resHTML = data
              cbNext(priorHtml + resHTML)
          },
          error: function(){
            console.log(`Not found: relatedDocs for ${apiurl}`)
            cbNext(priorHtml + stockErrMsg)
          }
      });
    }
  }
}

function displayTopPapers(enrichedHtml) {
  $("#topPapers").html(enrichedHtml);
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
            || tgt.id == 'topPapers'
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
        image_normal = tweet["user"]["profile_image_url"]
        image_bigger = tweet["user"]["profile_image_url"].replace("_normal","_bigger")
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

function getTips(){
    param='';

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

    $("#tab-container").hide();
    $("#tab-container-top").hide();
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
        if(n[pfx+'size'] > (TW.customSettings.labelThreshold / 3)) {
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


// Settings edition
// =================


// creates a list of <options> for all present attributes
// (or a sublist on a meta.dataType condition
//  NB condition on dataType could be on an extended meta "attrType"
//     cf. doc/developer_manual.md autodiagnose remark)
function fillAttrsInForm(menuId, optionalAttTypeConstraint) {
  var actypes = getActivetypesNames()
  for (let tid in actypes) {
    let ty = actypes[tid]

    let elChooser = document.getElementById(menuId)

    // remove the possible previous options from possible previous graphs
    while (elChooser.lastChild) {
      elChooser.removeChild(elChooser.lastChild)
    }

    // each facet family or clustering type was already prepared
    for (let att in TW.Clusters[ty]) {
      if (!optionalAttTypeConstraint
           || (   TW.Clusters[ty][att].meta.dataType
               && TW.Clusters[ty][att].meta.dataType == optionalAttTypeConstraint)) {
        let opt = document.createElement('option')
        opt.value = att
        opt.innerText = att
        elChooser.appendChild(opt)
      }
    }
  }
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
  // for titling subquestion open
  conditiOpen('choose-titling-div', 'attr-col',['cluster'])

  // for the implication [cluster => binmode off]
  let elColQ = document.getElementById('attr-col')
  let elBinmodeQ = document.getElementById('attr-binmode')
  if (elColQ.value == 'cluster') {
    elBinmodeQ.value = "off"
    elBinmodeQ.disabled = true
    document.getElementById("attr-nbins-div").style.display = 'none'
  }
  else {
    elBinmodeQ.disabled = false
  }
}


function showAttrConf() {
  let attrTitle = this.value
  let settings = TW.conf.facetOptions[attrTitle]
  if (settings) {
    document.getElementById('attr-col').value = settings.col || 'gradient'
    document.getElementById('attr-binmode').value = settings.binmode || 'off'
    document.getElementById('attr-translation').value = settings.menutransl || attrTitle
    if(settings.n) {
      document.getElementById('attr-nbins-div').style.display = 'block'
      document.getElementById('attr-nbins').value = settings.n || 5
    }
    if(settings.col == 'cluster') {
      document.getElementById('choose-titling-div').style.display = 'block'
      document.getElementById('attr-titling-metric').value = settings.titlingMetric || ''
      document.getElementById('attr-titling-n').value = settings.titlingNTerms || 1

      // no sense to ordinally bin clusters
      document.getElementById('attr-binmode').value = "off"
      document.getElementById('attr-binmode').disabled = true
    }
  }
}


// writes new attribute configuration from user form, recreates facet bins AND runs the new color
// processing time: ~~ 1.5 ms for 100 nodes
function newAttrConfAndColor() {
  let attrTitle = document.getElementById('choose-attr').value

  // read values from GUI
  TW.conf.facetOptions[attrTitle] = {
     'col': document.getElementById('attr-col').value,
     'binmode': document.getElementById('attr-binmode').value,
     'n': document.getElementById('attr-nbins').value,
     'menutransl': document.getElementById('attr-translation').value,

     // only for clusterings (ie currently <=> (col == "cluster"))
     'titlingMetric': document.getElementById('attr-titling-metric').value,
     'titlingNTerms': document.getElementById('attr-titling-n').value || 1
  }

  // find the corresponding types
  let relevantTypes = {}
  for (let ty in TW.Clusters) {
    if (TW.Clusters[ty][attrTitle]) {
      relevantTypes[ty] = true
    }
  }

  // reparse values (avoids keeping them in RAM since parseCustom)
  tmpVals = {}
  for (let nid in TW.Nodes) {
    let n = TW.Nodes[nid]
    if (relevantTypes[n.type]) {
      tmpVals = updateValueFacets(tmpVals, n, attrTitle)
    }
  }

  let newClustering = facetsBinning (tmpVals)

  // write result to global TW.Clusters
  for (let ty in newClustering) {
    TW.Clusters[ty][attrTitle] = newClustering[ty][attrTitle]
  }

  // console.log("reparse raw result", tmpVals)
  // console.log("reparse binned result", newClustering)

  // update the GUI menu
  changeGraphAppearanceByFacets()

  // run the new color
  let colMethod = TW.gui.colorFuns[TW.conf.facetOptions[attrTitle]['col']]
  window[colMethod](attrTitle)
}
