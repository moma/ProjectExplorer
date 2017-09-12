/* ---------------------------------------------------------------- */
/* ---------------------  search histogram  ----------------------- */
/* ---------------------------------------------------------------- */

var hg

// constant values of total docs per year, for normalization
var wosYearTotals = {
            "1989" : 844637,
            "1990" : 869102,
            "1991" : 888910,
            "1992" : 910093,
            "1993" : 950933,
            "1994" : 997942,
            "1995" : 1057663,
            "1996" : 1094382,
            "1997" : 1119934,
            "1998" : 1123011,
            "1999" : 1151948,
            "2000" : 1171575,
            "2001" : 1158603,
            "2002" : 1205361,
            "2003" : 1243327,
            "2004" : 1326740,
            "2005" : 1389262,
            "2006" : 1460333,
            "2007" : 1539399,
            "2008" : 1630036,
            "2009" : 1704451,
            "2010" : 1753796,
            "2011" : 1809678,
            "2012" : 1868251,
            "2013" : 1968250,
            "2014" : 2030613,
            "2015" : 1772592
}

var $search_histogram = $("#search_histogram")


//method for calling the ISC-API and get pubs-distribution of the suggested term
function search_proposed_terms_and_draw( the_queries ) {

    // console.log("search_proposed_terms_and_draw:\n"
    //            +"i'm searching:\n"
    //            +JSON.stringify(the_queries)) ;

    $search_histogram.html("Searching for matching WOS data...")

    var args = {
        // the_queries is an array of str
        "q": the_queries,
        "since": 1990,
        "until": 2015
    }
    var docs_years = [] ;

    $search_histogram
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
                    var year = elem.key+""
                    var ndocs = elem.doc_count

                    // result is over [0;1]
                    var normalized_ndocs = ndocs / wosYearTotals[year]
                    docs_years.push( [ year , normalized_ndocs, ndocs] )
                }

                // docs_years is now an array of triples [[1989,0.001,42],[1990,0.0002,100],...]
                // console.log("docs_years",docs_years)

                // counts_by_year_array
                draw_histogram(docs_years) ;
                return true ;
            }
        },

        error: function(exception) {
            // console.log("search_proposed_terms_and_draw:exception"
            //             + JSON.stringify(exception))
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
function draw_histogram(counts_by_year_array) {

    // 1) layout for the div#search_histogram
    //    /!\ this div *needs* padding:0 /!\;
    $search_histogram.height("15em").show()

    // 2) data preparation
    //~ var years = [] ;
    //~ for (i in counts_by_year_array) {
        //~ couple = counts_by_year_array[i] ;
        //~
        //~ // x values (year as int) => Date objects
        //~ counts_by_year_array[i][0] = new Date(couple[0]) ;
    //~ }
    // console.log('=== GRAPH PREPARATION ===') ;

    var emValue = parseFloat(getComputedStyle(document.body).fontSize)

    // 3) call histogram lib
    hg = new Dygraph($search_histogram[0],
                  counts_by_year_array,
                  {
                    labels: ['year', '%', 'n'],

                    // curve  => the % (normalized) value is shown, not the abs n
                    visibility: [true, false],
                    //           ^^^    ^^^
                    //            %      n

                    drawPoints: true,
                    // pixels between labels <=> 2.5 em
                    pixelsPerLabel: 2.5 * emValue,
                    fillGraph: true,
                    animatedZoom: false,

                    // legend => selected n (instead of %) thx highlightCallback
                    highlightCallback: function(e, x, pts, row) {
                        // n has i == 2 in counts_by_year_array tuples
                        var this_n = hg.getValue(row, 2);
                        var legendDiv = document.getElementsByClassName("dygraph-legend")[0]
                        legendDiv.innerHTML = "<span style='font-weight: bold; background-color:#FFF; color:#070;'>n = " + this_n + "</span>";
                        legendDiv.style.left = 0
                        legendDiv.style.paddingLeft = "37%"
                        legendDiv.style.paddingTop = "1%"
                        legendDiv.style.display = "block"
                        legendDiv.style.background = "none"
                    }
                  });
}


function clean_histogram() {
    $("#search_histogram").html("") ;
}
