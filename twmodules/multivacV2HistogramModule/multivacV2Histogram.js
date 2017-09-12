/* ---------------------------------------------------------------- */
/* ---------------------  search histogram  ----------------------- */
/* ---------------------------------------------------------------- */

// init and settings exposed in mvacV2Hg var
mvacV2Hg.init = (function(mvacV2Hg){

var $search_histogram = $("#search_histogram2")

var apiEndpoint = mvacV2Hg.settings.endpoint || '/pvt/politic/france/twitter/histogram'
var apiInterval = mvacV2Hg.settings.interval || 'day'

//method for calling the ISC-API and get pubs-distribution of the suggested term
function search_proposed_terms_and_draw( the_queries ) {

    console.log("search_proposed_terms_and_draw:\n"
               +"i'm searching:\n"
               +JSON.stringify(the_queries)) ;

    $search_histogram.html("Searching for matching Twitter data...")


    // the_queries is an array of str,
    // but api.iscpif.fr/v2/pub/politic/france/twitter only takes single LUCENE query
    var luc_q = the_queries.map(function (w) { return '('+w+')' }).join(" OR ")


    var args = {
        // luc_q is a str
        "q": luc_q,
        "interval": apiInterval
    }

    // no since and until unless specified in settings: we want the entire period
    if (mvacV2Hg.settings.since)     args.since = mvacV2Hg.settings.since
    if (mvacV2Hg.settings.until)     args.until = mvacV2Hg.settings.until

    // time window depending on interval
    var twindow = 7
    if (mvacV2Hg.settings.avgWindowPerInterval && mvacV2Hg.settings.avgWindowPerInterval[apiInterval]) {
      twindow = mvacV2Hg.settings.avgWindowPerInterval[apiInterval]
    }

    var docs_days = [] ;

    $search_histogram
        .html('<p class="micromessage">Waiting for histogram data</p>')

    $.ajax({
        type: "GET",
        url: 'https://api.iscpif.fr' + apiEndpoint,
        data: args,
        dataType: "json",
        success : function(data, textStatus, jqXHR) {
            // ES aggs response, for example
            // data = {"took":91,"total":121673,"aggs":{"publicationCount":{"buckets":[{"key":1989,"doc_count":880},{"key":1990,"doc_count":1088},...,{"key":2012,"doc_count":9543},{"key":2013,"doc_count":8832}]}},"hits":{"total":121673,"max_score":0,"hits":[]}}

            // console.log(">> incoming api data <<")
            // console.log(data)

            if(data.results.total==0) {
                return false;
            }
            else {
                var startRecordingFlag = false
                for(var i in data.results.hits) {
                    var elem = data.results.hits[i]
                    var day = elem.key_as_string+""
                    var ndocs = elem.doc_count

                    if (! startRecordingFlag
                      && ndocs > TW.histogramStartThreshold) {
                      startRecordingFlag = true
                    }

                    if (startRecordingFlag) {
                      docs_days.push( [ day , ndocs] )
                    }
                }

                // docs_days is now an array of couples [["2016-01-04T00:00:00.000Z",25],["2016-01-05T00:00:00.000Z",28],...]
                // console.log("docs_days",docs_days)

                // counts_by_year_array
                draw_histogram(docs_days, twindow) ;
                return true ;
            }
        },

        error: function(exception) {
            console.log("search_proposed_terms_and_draw:exception"
                        + JSON.stringify(exception))
            $search_histogram
                .html('<p class="micromessage">'
                     +'<b>No histogram</b>: too many nodes selected</b>'
                     +'</p>')
        }
    })
}

// gotNodeSet event when Tinawab did main search behavior (select nodes)
$("#searchinput").on("tw:gotNodeSet", function(e) {
    // console.warn("event 'nodes' --> the event's nodes: " + JSON.stringify(e.nodeIds)) ;
    clean_histogram() ;

    // now we may want to do other things (draw histogram, suggest term)
    newnodesHistogramBehavior(e.nodeIds, e.q) ;
});


// eraseNodeSet event when Tinawab canceled the previous selections
$("#searchinput").on("tw:eraseNodeSet", function(e) {
    // console.warn("event 'erase'") ;
    clean_histogram() ;
    $search_histogram.hide() ;
});

// emptyNodeSet event when Tinaweb search found nothing
$("#searchinput").on("tw:emptyNodeSet", function(e) {
    // console.warn("event 'not found'") ;
    clean_histogram() ;
    $search_histogram.hide() ;
});


function newnodesHistogramBehavior(selectedNodeIds, unusedQuery) {

    // console.log('FUN additionalSearchBehavior' + '\nselectedNodeIds:' +JSON.stringify(selectedNodeIds) ) ;

    if( selectedNodeIds != null && selectedNodeIds.length > 0 ) {
        // query : IF in the Map -> GO to ISC-API (search and draw it)

        var selectedLabels = [] ;
        for (i in selectedNodeIds) {
            var thisId = selectedNodeIds[i]
            if (TW.Nodes[thisId] != null) {
                selectedLabels.push(TW.Nodes[thisId].label)
            }
            else {
                console.log('ID error on TW.Nodes['+thisId+']')
            }
        }
        // console.log('\n\n\n<---!--->\nselectedLabels' + JSON.stringify(selectedLabels))

        search_proposed_terms_and_draw ( selectedLabels ) ;
    }
}


// use dygraph lib to draw below the crowdsourcing div
function draw_histogram(counts_by_days_array, cumulatedWindow) {

    // 1) layout for the div#search_histogram
    //    /!\ this div *needs* padding:0 /!\;
    $search_histogram.height("15em").show()

    // 2) data preparation
    //    (cumulated sliding window over [T-cumulatedWindow; T])
    var cumulated_res = [] ;
    for (i in counts_by_days_array) {

        var isoDate = counts_by_days_array[i][0]


        // 2016-01-04T00:00:00.000Z ~~> 2016/01/04
        var theDate = new Date(isoDate)

        var sum = 0
        var nvalues = 0
        for (var j=i; j >= Math.max(i-cumulatedWindow-1, 0); j--) {
          sum += counts_by_days_array[j][1]
          nvalues++
        }

        cumulated_res.push([theDate, sum])
    }

    // console.log('=== GRAPH PREPARATION ===') ;
    // console.log("counts_by_days_array", counts_by_days_array)
    // console.log('cumulated_res', cumulated_res) ;

    var emValue = parseFloat(getComputedStyle(document.body).fontSize)


    // 3) call histogram lib
    hg = new Dygraph($search_histogram[0],
                    cumulated_res,
                  {
                    labels: ['day', 'n'],

                    visibility: [true],
                    //           ^^^
                    //            n

                    drawPoints: true,
                    // pixels between labels <=> 1.5 em

                    axes: {
                      x: { pixelsPerLabel: 3 * emValue },
                      y: { pixelsPerLabel: 2 * emValue }
                    },

                    fillGraph: true,
                    animatedZoom: false,

                    // // legend => selected n (instead of %) thx highlightCallback
                    // highlightCallback: function(e, x, pts, row) {
                    //     // n has i == 2 in counts_by_year_array tuples
                    //     var this_n = hg.getValue(row, 2);
                    //     var legendDiv = document.getElementsByClassName("dygraph-legend")[0]
                    //     legendDiv.innerHTML = "<span style='font-weight: bold; background-color:#FFF; color:#070;'>n = " + this_n + "</span>";
                    //     legendDiv.style.left = 0
                    //     legendDiv.style.paddingLeft = "37%"
                    //     legendDiv.style.paddingTop = "1%"
                    //     legendDiv.style.display = "block"
                    //     legendDiv.style.background = "none"
                    // }
                  });
}


function clean_histogram() {
    $("#search_histogram").html("") ;
}

})(mvacV2Hg)
