
var ExtraWords = {} ;
var Label2ID = {};  // initialize from TW.Nodes ?

// Crowdsourcing terms open
//      When click in "Proposez nouveaux mots" 
//      and then building the autocomplete data
// Input: Label2ID
// Output: ExtraWords
$("#openthemodal").click(function(){
    $("#crowdsourcing_modal").modal("show")
    if( Object.keys(ExtraWords).length >0 )
        return true;
    // first time
    $.ajax({
        type: "GET",
        url: module_name+"/temp_autocomplete/keywords.txt", // (miam - map)
        dataType: "text",
        success: function(data) {
            var wordlist = data.split("\n");
            for(var i in wordlist) {
                if (wordlist[i] && wordlist[i].length) {
                    var normalize_word = wordlist[i].toLowerCase()
                    if( !Label2ID[normalize_word] )
                        ExtraWords[normalize_word] = true
                }
            }
            delete wordlist;
            // console.log("ExtraWords"+JSON.stringify(ExtraWords))
            
            $( "#proposed_terms" ).autocomplete({
                source: Object.keys(ExtraWords) //building the autocomplete
            });
        },
        error: function(xhr, ajaxOptions, thrownError) {
            console.log("Status: " + xhr.status + "     Error: " + thrownError);
        }
    });
})


// input with autocomplete
$("#proposed_terms").keypress(function(e) {
    if(e.keyCode == 13) { //if press enter then:
        e.preventDefault();
        $("#search_proposed_terms").click();
        $(this).autocomplete('close');
    }
})
