
/* ---------------------------------------------------------------- */
/* -----------  search histogram (à mettre dans main) ------------- */
/* ---------------------------------------------------------------- */


// labels of map terms... 
var Label2ID = {} ;

// ...initialized from TW.Nodes

for (id in TW.Nodes) {
    // console.log("label: " + TW.Nodes[id].label) ;
    // console.log("id: " + id) ;
    Label2ID[TW.Nodes[id].label] = id ;
}


// TODO: use ExtraWords to know already suggested terms  
// var ExtraWords = {'a miam term': true} ;



// Crowdsourcing terms load
// => building the autocomplete data
// Input: Label2ID
// Output: ExtraWords
$( "#proposed_terms" ).autocomplete({
    source: Object.keys(Label2ID),
    
    // on response callback
    // (only if crowdsourcingTerms module)
    response: function (event, ui_response_array) {
        
        // console.log(JSON.stringify(ui_response_array)) ;
        // exemple in ui_response_array
        // {"content":
        //  [{"label":"warning system","value":"warning system"},
        //   {"label":"training programme","value":"training programme"}
        //  ]
        // }
        
        if (ui_response_array.content.length == 0) {
            
            // when there is no corresponding term
            // the user gains the right to suggest it
            $('#savesuggestion').prop('disabled', false) ;
        }
        else {
            $('#savesuggestion').prop('disabled', true) ;
        }
    },
});


// autocomplete the user input
$("#proposed_terms").keypress(function(e) {
    
    clean_histogram() ;
    
    if(e.keyCode == 13) { //if press enter then:
        e.preventDefault();
        $("#search_proposed_terms").click();
        $(this).autocomplete('close');
    }
    
    // (only if crowdsourcingTerms module)
    clean_crowdsourcingform();
})

//method for calling the ISC-API and get pubs-distribution of the suggested term
function search_proposed_terms_and_draw( the_query ) {
    // alert("i'm searching:\n"+JSON.stringify(the_query)) ;
    
    var args = {
        // query is an array of str
        "q": the_query,
        "since": 1989,
        "until": 2013
    }
    var docs_years = [] ;



    $.ajax({
        type: "GET",
        url: 'https://api.iscpif.fr/1/wos/search/histogram.json',
        data: args,
        dataType: "json",
        success : function(data, textStatus, jqXHR) {
            // ES aggs response, for example 
            // data = {"took":91,"total":121673,"aggs":{"publicationCount":{"buckets":[{"key":1989,"doc_count":880},{"key":1990,"doc_count":1088},...,{"key":2012,"doc_count":9543},{"key":2013,"doc_count":8832}]}},"hits":{"total":121673,"max_score":0,"hits":[]}}
            
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
            }
        },

        error: function(exception) { 
            console.log("exception!:"+exception.status)
            $("#search_histogram").prepend(msg)
        }
    })
}

// input value retrieval/handling
$("#search_proposed_terms").click(function() {
    
    clean_crowdsourcingform() ;
    
    if($("#proposed_terms").val()=="")
        return false;
    
    // var msg = "" ;
    var query = $("#proposed_terms").val()
    query = $.trim( query.toLowerCase() )
    console.log('===\nyour query was: "'+query+'"');
    if( Label2ID[query] ) {
        // query : IF in the Map !!!
        //    -> GO to ISC-API (search it and draw it)
        search_proposed_terms_and_draw ( [query] ) ;
    }
    else {
        // activate save suggestion button
        // (if subchain was in no autocomplete term, it's already on)
        $('#savesuggestion').prop('disabled', false) ;
        
        // save_suggestions
        $("#crowdsourcing_answer").html("<p>This topic (<i>\"" + query + "\"</i> isn't in the maps. You can click the grey button to propose it as a suggestion.</p>") ;
    }
    
    $("#proposed_terms").autocomplete('close');
});


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


$("#savesuggestion").click(function(){
    var query = $("#proposed_terms").val()
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
            $("#crowdsourcing_answer").html("<p><b>Thank you !</b><br/>(<i>\"" + term + "\"</i> was saved in database)</p>") ;
            
            // show "saved" icon
            $("#saveicon").removeClass("glyphicon-save");
            $("#saveicon").addClass("glyphicon-saved");
            
            // reset state after 3 secs
            setTimeout(function() {
                clean_crowdsourcingform() ;
                
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


function clean_crowdsourcingform() {
    $("#crowdsourcing_answer").html('') ;
    $("#saveicon").removeClass("glyphicon-saved");
    $("#saveicon").addClass("glyphicon-save");
    $('#savesuggestion').prop('disabled', true) ;
}


// non utilisé si termes depuis map
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
                    //~ clean_crowdsourcingform()
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

// sqlite columns in table 'terms'
// 0|source|CHAR(250)|0||0
// 1|suggestion|CHAR(250)|0||0
// 2|time|CHAR(30)|0||0
// 3|space|CHAR(100)|0||0
// 4|new|INTEGER|0||0
