
/* ---------------------------------------------------------------- */
/* -----------  search histogram (à mettre dans main) ------------- */
/* ---------------------------------------------------------------- */


// labels of map terms... 
var Label2ID = {} ;

// ...initialized from TW.Nodes (nodes' info sorted by id)
for (id in TW.Nodes) {
    // console.log("label: " + TW.Nodes[id].label) ;
    // console.log("id: " + id) ;
    Label2ID[TW.Nodes[id].label] = id ;
}


//method for calling the ISC-API and get pubs-distribution of the suggested term
function search_proposed_terms_and_draw( the_queries ) {
    // console.log("search_proposed_terms_and_draw:\n"
    //            +"i'm searching:\n"
    //            +JSON.stringify(the_queries)) ;
    
    $("#search_histogram").html("Searching for matching twitter data...")
    
    var args = {
        // the_queries is an array of str
        "q": the_queries,
        "since": 1989,
        "until": 2013
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
    
    console.log('/////////\nFUN additionalSearchBehavior' + '\nselectedNodeIds:' +JSON.stringify(selectedNodeIds) ) ;
    
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
        console.log('\n\n\n<---!--->\nselectedLabels' + JSON.stringify(selectedLabels))
        
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
    console.log('=== GRAPH PREPARATION ===') ;
    
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


/* ---------------------------------------------------------------- */
/* -----------  crowdsourcing proprement dit ---------------------- */
/* ---------------------------------------------------------------- */


/* 3 possible events affect crowdsourcing */

// catch noAutocomplete event when Tinaweb ui.autocomplete becomes empty
$("#searchinput").on("tw:noAutocomplete", function(e) {
    // when there is no corresponding term
    // the user gains the right to suggest it
    $('#savesuggestion').prop('disabled', false) ;
});

// catch gotAutocomplete event when Tinaweb ui.autocomplete is full
$("#searchinput").on("tw:gotAutocomplete", function(e) {
    $('#savesuggestion').prop('disabled', true) ;
});


// eraseNodeSet event when Tinawab had an empty search or unclick
$("#searchinput").on("tw:eraseNodeSet", function(e) {
    clean_crowdsourcingzone() ;
});

// emptyNodeSet event when Tinawab had a search but with no matches
$("#searchinput").on("tw:emptyNodeSet", function(e) {
    
    $('#savesuggestion').prop('disabled', false) ;
    // when query has no match
    if (e.nodeIds == null || e.nodeIds.length == 0) {
        // activate save suggestion button
        // (if subchain was in no autocomplete term, it's already on)
        $('#savesuggestion').prop('disabled', false) ;

        // save_suggestions
        $("#crowdsourcing_answer").html("<p>The topic <i>\"" + e.q + "\"</i> is not in the map.</p> <p>(You can click the grey <span class=\"glyphicon glyphicon-save\"></span> button to propose it as a suggestion.)</p>") ;
        
        // $("#searchinput").val() = query ;
    }
});

$("#savesuggestion").click(function(){
    var query = $("#searchinput").val()
    if (typeof query != "string" || !query.length) {
        query = TW.lastQuery ;
    }
    query = $.trim( query.toLowerCase() ) ;
    save_suggestions(query) ;
})

function save_suggestions(term) {
    var info = {
        "source": window.location.href,
        "data" : term,
        "date" : (new Date()).toISOString(),
        "geo" : "ip and geoloc"
    }
    
    // sqlite columns in table 'terms'
    // 0|source|CHAR(250)|0||0
    // 1|suggestion|CHAR(250)|0||0
    // 2|time|CHAR(30)|0||0
    // 3|space|CHAR(100)|0||0
    // 4|new|INTEGER|0||0
    
    // console.log( "SAVE INFO:" + info )
    $.ajax({
        type: "POST",
        url: "crowdsourcingTerms/db/s.php",
        // cache:false,
        // contentType: "application/json",
        data: info,
        dataType: "json",
        success : function(data, textStatus, jqXHR) {
            console.log( "SUCCESS" )
            console.log( data )
            //$("#sendcrowds").html(D["#sendcrowds"]["thanks"][LA]) //showing message
            $("#crowdsourcing_answer").html("<p><b>Thank you !</b><br/>(<i>\"" + term + "\"</i> was saved as a suggestion)</p>") ;
            
            // show "saved" icon
            $("#saveicon").removeClass("glyphicon-save");
            $("#saveicon").addClass("glyphicon-saved");
            
            // reset state after 3 secs
            setTimeout(function() {
                clean_crowdsourcingzone() ;
                
                // if we want to reset the input value too
                // $("#proposed_terms").val('') ;
            }, 3000);
        },

        error: function(exception) { 
            console.log(exception)
            console.log("exception!:"+exception.status)
        }

    })
}


function clean_crowdsourcingzone() {
    $("#crowdsourcing_answer").html('') ;
    $("#saveicon").removeClass("glyphicon-saved");
    $("#saveicon").addClass("glyphicon-save");
    $('#savesuggestion').prop('disabled', true) ;
}


//~ function get_already_suggested_terms() {
//~ $("#sendcrowds").html("...")
    //~ $.ajax({
        //~ type: "POST",
        //~ url: "crowdsourcingTerms/db/s.php",
        //~ // cache:false,
        //~ // contentType: "application/json",
        //~ data: info,
        //~ dataType: "json",
        //~ success : function(data, textStatus, jqXHR) {
            //~ console.log( "SUCCESS" )
            //~ console.log( data )
            //~ setTimeout(function(){
                //~ //$("#sendcrowds").html(D["#sendcrowds"]["thanks"][LA]) //showing message
                //~ setTimeout(function(){
                    //~ clean_crowdsourcingzone()
                //~ }, 3000);
            //~ }, 1000);
        //~ },
//~ 
        //~ error: function(exception) { 
            //~ console.log(exception)
            //~ console.log("exception!:"+exception.status)
        //~ }
//~ 
    //~ })
//~ }
