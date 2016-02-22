/* ---------------------------------------------------------------- */
/* ---------------------  crowdsourcingTerms  --------------------- */
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
        url: "crowdsourcingModule/db/s.php",
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
        //~ url: "crowdsourcingModule/db/s.php",
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
