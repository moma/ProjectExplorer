
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



// Crowdsourcing terms open
//      When click in "Proposez nouveaux mots" 
//      and then building the autocomplete data
// Input: Label2ID
// Output: ExtraWords
$("#openthemodal").click(function(){
    $("#crowdsourcing_modal").modal("show")
    
    // this gives data to jquery autocomplete
    $( "#proposed_terms" ).autocomplete({
        source: Object.keys(Label2ID)
    });
})


// autocomplete the user input
$("#proposed_terms").keypress(function(e) {
    if(e.keyCode == 13) { //if press enter then:
        e.preventDefault();
        $("#search_proposed_terms").click();
        $(this).autocomplete('close');
    }
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
                draw_histogram(docs_years, "crowdsourcing_histogram") ;
            }
        },

        error: function(exception) { 
            console.log("exception!:"+exception.status)
            $("#wos_chart").prepend(msg)
        }
    })
}

// input value retrieval/handling
$("#search_proposed_terms").click(function() {
    
    clean_crowdsourcingform()
    
    if($("#proposed_terms").val()=="")
        return false;
    
    var msg = "" ;
    var query = $("#proposed_terms").val()
    query = $.trim( query.toLowerCase() )
    console.log('===\nyour query was: "'+query+'"');
    if( Label2ID[query] ) {
        // query : IF in the Map !!!
        //    -> GO to ISC-API
        // 
        $("#crowdsourcing_answer").prepend("<h3 class='modal-title'>The term <i>" + query + "</i> already exists in the map</h3>") ;
        $("#crowdsourcing_histogram").width(500) ;
        $("#crowdsourcing_histogram").height(300) ;
        // search it and draw it
        search_proposed_terms_and_draw ( [query] ) ;
    }
    else {
        // send ajax DB post
        
        $("#crowdsourcing_answer").html(
            "<h3 class='modal-title'>The term <i>" + query + "</i> is not in the map yet.</h3>"
            + '<center><button style="position: relative; bottom: 0;" id="savesuggestion" class="btn btn-xl btn-info ">Save the suggestion !</button></center>'
        ) ;
    }
});


$("#savesuggestion").click(function(){
    save_suggestions(query) ;
    $("#crowdsourcing_answer").prepend("<h3 class='modal-title'>Saved suggested term: <i>" + query + "</i></h3>") ;
})

function save_suggestions(term) {
    var info = {
        "source": window.location.href,
        "data" : term,
        "date" : (new Date()).toISOString(),
        "geo" : "ip and geoloc"
    }
    console.log( "SAVE INFO:" + info )
    console.log(" - - -  - -")
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
            setTimeout(function(){
                //$("#sendcrowds").html(D["#sendcrowds"]["thanks"][LA]) //showing message
                setTimeout(function(){
                    clean_crowdsourcingform()
                }, 3000);
            }, 1000);
        },

        error: function(exception) { 
            console.log(exception)
            console.log("exception!:"+exception.status)
        }

    })
}


function clean_crowdsourcingform() {
    $("#crowdsourcing_answer").html("") ;
    $("#crowdsourcing_histogram").html("") ;
    $("#crowdsourcing_histogram").width(0) ;
    $("#crowdsourcing_histogram").height(0) ;
}

function get_already_suggested_terms() {
$("#sendcrowds").html("...")
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
            setTimeout(function(){
                //$("#sendcrowds").html(D["#sendcrowds"]["thanks"][LA]) //showing message
                setTimeout(function(){
                    clean_crowdsourcingform()
                }, 3000);
            }, 1000);
        },

        error: function(exception) { 
            console.log(exception)
            console.log("exception!:"+exception.status)
        }

    })
}

// sqlite columns in table 'terms'
// 0|source|CHAR(250)|0||0
// 1|suggestion|CHAR(250)|0||0
// 2|time|CHAR(30)|0||0
// 3|space|CHAR(100)|0||0
// 4|new|INTEGER|0||0


// use dygraph lib to draw in the modal
function draw_histogram(counts_by_year_array, div_id) {
    var years = [] ;
    for (i in counts_by_year_array) {
        couple = counts_by_year_array[i] ;
        
        // x values (year as int) => Date objects
        counts_by_year_array[i][0] = new Date(couple[0]) ;
    }
    console.log('=== GRAPH PREPARATION ===') ;
    new Dygraph(document.getElementById(div_id),
                  counts_by_year_array,
                  {
                    labels: ['x', 'occurrences']
                  });
}
