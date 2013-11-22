/*
 * Customize as you want ;)
 */


function getTopPapers(type){
    if(getAdditionalInfo){
        params=[];
        for(var i in selections){
            params.push(Nodes[i].label);
        }
        jsonparams=JSON.stringify(params);
        //jsonparams = jsonparams.replaceAll("&","__and__");
        jsonparams = jsonparams.split('&').join('__and__');
        $.ajax({
            type: 'GET',
            url: 'php/info_div.php',
            data: "type="+type+"&query="+jsonparams,
            //contentType: "application/json",
            //dataType: 'json',
            success : function(data){ 
                $("#topPapers").html(data);
            },
            error: function(){ 
                pr('Page Not found: updateLeftPanel_uni()');
            }
        });
    }
}


function getTips(){
    text = 
        "<br>"+
        "Basic Interactions:"+
        "<ul>"+
        "<li>Click on a node to select/unselect and get its information. In case of multiple selection, the button unselect clears all selections.</li>"+
        "<li>The switch button switch allows to change the view type.</li>"+
        "</ul>"+
        "<br>"+
        "Graph manipulation:"+
        "<ul>"+
        "<li>Link and node sizes indicate their strength.</li>"+
        "<li>To fold/unfold the graph (keep only strong links or weak links), use the 'edges filter' sliders.</li>"+
        "<li>To select a more of less specific area of the graph, use the 'nodes filter' slider.</li>"+
        "</ul>"+
        "<br>"+
        "Micro/Macro view:"+
        "<ul>"+
        "<li>To explore the neighborhood of a selection, either double click on the selected nodes, either click on the macro/meso level button. Zoom out in meso view return to macro view.</li>"+
        "<li>Click on the 'all nodes' tab below to view the full clickable list of nodes.</li>"+
        "</ul>";
    return text;
}

//ADEME examples:

function getChatFrame() {    
    content = '<div id="showChat" onclick="showhideChat();"><a href="#" id="aShowChat"> </a></div>';
    content += '<iframe src="'+ircUrl+'"'
    content += 'width="400" height="300"></iframe>';    
    $("#rightcolumn").html(content);
}

function showhideChat(){
    
    cg = document.getElementById("rightcolumn");
    if(cg){
        if(cg.style.right=="-400px"){
            cg.style.right="0px";
        }
        else cg.style.right="-400px";
    }
}