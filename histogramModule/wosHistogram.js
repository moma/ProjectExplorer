/* ---------------------------------------------------------------- */
/* ---------------------  search histogram  ----------------------- */
/* ---------------------------------------------------------------- */


//method for calling the ISC-API and get pubs-distribution of the suggested term
function search_proposed_terms_and_draw( the_queries ) {
    // console.log("search_proposed_terms_and_draw:\n"
    //            +"i'm searching:\n"
    //            +JSON.stringify(the_queries)) ;

    $("#search_histogram").html("Searching for matching WOS data...")

    var args = {
        // the_queries is an array of str
        "q": the_queries,
        "since": 1989,
        "until": 2015
    }
    var docs_years = [] ;

    $("#search_histogram")
        .html('<p class="micromessage">Waiting for histogram data</p>')

    $.ajax({
        type: "GET",
        url: 'https://api.iscpif.fr/1/wos/search/histogram.json',
        data: args,
        dataType: "json",
        success : function(data, textStatus, jqXHR) {
            // ES aggs response, for example
            // data = {"took":91,"total":121673,"aggs":{"publicationCount":{"buckets":[{"key":1989,"doc_count":880},{"key":1990,"doc_count":1088},...,{"key":2012,"doc_count":9543},{"key":2013,"doc_count":8832}]}},"hits":{"total":121673,"max_score":0,"hits":[]}}

            // console.log(">> incoming api data <<")
            // console.log(data)

            if(data.total==0) {
                return false;
            }
            else {
                for(var i in data.aggs.publicationCount.buckets) {
                    var elem = data.aggs.publicationCount.buckets[i]
                    docs_years.push( [ elem.key+"" , elem.doc_count] )
                }

                // counts_by_year_array
                draw_histogram(docs_years, "search_histogram") ;
                return true ;
            }
        },

        error: function(exception) {
            console.log("search_proposed_terms_and_draw:exception"
                        + JSON.stringify(exception))
            $("#search_histogram")
                .html('<p class="micromessage">'
                     +'<b>No histogram</b>: too many nodes selected</b>'
                     +'</p>')
        }
    })
}

// gotNodeSet event when Tinawab did main search behavior (select nodes)
$("#searchinput").on("tw:gotNodeSet", function(e) {
    // console.log("event 'nodes' --> the event's nodes: " + JSON.stringify(e.nodeIds)) ;
    clean_histogram() ;

    // now we may want to do other things (draw histogram, suggest term)
    newnodesHistogramBehavior(e.nodeIds, e.q) ;
});


// eraseNodeSet event when Tinawab canceled the previous selections
$("#searchinput").on("tw:eraseNodeSet", function(e) {
    // console.log("event 'erase'") ;
    clean_histogram() ;
});

// emptyNodeSet event when Tinaweb search found nothing
$("#searchinput").on("tw:emptyNodeSet", function(e) {
    clean_histogram() ;
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
function draw_histogram(counts_by_year_array, div_id) {

    // 1) layout for the div#search_histogram
    //    /!\ this div *needs* padding:0 /!\;
    $("#"+div_id).height("15em") ;

    // 2) data preparation
    //~ var years = [] ;
    //~ for (i in counts_by_year_array) {
        //~ couple = counts_by_year_array[i] ;
        //~
        //~ // x values (year as int) => Date objects
        //~ counts_by_year_array[i][0] = new Date(couple[0]) ;
    //~ }
    // console.log('=== GRAPH PREPARATION ===') ;

    // 3) call histogram lib
    new Dygraph(document.getElementById(div_id),
                  counts_by_year_array,
                  {
                    labels: ['year', 'n'],
                    pixelsPerLabel: 25 ,
                    drawPoints: true,
                    fillGraph: true
                  });
}


function clean_histogram() {
    $("#search_histogram").html("") ;
}
