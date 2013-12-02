/*
 * Customize as you want ;)
 */

function selectionToMap(){
    pr("Salut monde!");
}

function getTopPapers(type){
    if(getAdditionalInfo){
        params=[];
        for(var i in selections){
            params.push(Nodes[i].label);
        }
        jsonparams=JSON.stringify(params);
        //jsonparams = jsonparams.replaceAll("&","__and__");
        jsonparams = jsonparams.split('&').join('__and__');
        folderID=dataFolderTree["gexf_idfolder"][decodeURIComponent(getUrlParam.file)];
        dbsRaw = dataFolderTree["folders"][folderID];
        var dbsPaths;
        for(var i in dbsRaw){
            dbs = dbsRaw[i]["dbs"];
            dbsPaths=[]
            for(var j in dbs){
                dbsPaths.push(i+"/"+dbs[j]);
            }
            dbsPaths=JSON.stringify(dbsPaths);
            //pr(dbsPaths);
            break;
        }
        $.ajax({
            type: 'GET',
            url: twjs+'php/info_div.php',
            data: "type="+type+"&query="+jsonparams+"&dbs="+dbsPaths,
            //contentType: "application/json",
            //dataType: 'json',
            success : function(data){ 
                //pr(twjs+'php/info_div.php?'+"type="+type+"&query="+jsonparams+"&dbs="+dbsPaths);
                $("#topPapers").html(data);
            },
            error: function(){ 
                pr('Page Not found: updateLeftPanel_uni()');
            }
        });
    }
}

//For UNI-PARTITE
function updateLeftPanel_uni(){//Uni-partite graph
    pr("\t ** in updateLeftPanel_uni() ** ");
    var names='';
    var information='';
    
    counter=0;
    names+='<div id="selectionsBox">';
    names += '<h4>';
    for(var i in selections){
        if(counter==4){
            names += '<h4>[...]</h4>';
            break;
        }
        names += Nodes[i].label+', ';
        counter++;
    }
    names += '</h4>';
    names=names.replace(", </h4>","</h4>");
    names=names.replace(", <h4>","<h4>");
    names+='</div>';
    
    
    minFont=12;
    //maxFont=(minFont+oposMAX)-1;  
    maxFont=20;
    
    getTopPapers("semantic");
    
    js2='\');"';
    information += '<br><h4>Information:</h4>';
    information += '<ul>';
            
    for(var i in selections){
        information += '<div id="opossitesBox">';
        information += '<li><b>' + Nodes[i].label.toUpperCase() + '</b></li>';
        //for(var j in Nodes[i].attributes){
//            if(Nodes[i].attributes[j].attr=="period"||
//                Nodes[i].attributes[j].attr=="cluster_label" 
//                    )
                information += 
                '<li><b>Topic' + 
                '</b>:&nbsp;'+Nodes[i].attributes["cluster_label"]+'</li>';

                information += '<a href="https://www.google.com/#q='+Nodes[i].label+'"  target=blank>'+'www</a>';
        //}
        information += '</div>';            
        information += '</ul><br>';
    }
    
    
    $("#names").html(names); //Information extracted, just added
    $("#information").html(information); //Information extracted, just added
    $("#tips").html("");
    $("#topPapers").show();
    /***** The animation *****/
    _cG = $("#leftcolumn");
    _cG.animate({
        "left" : "0px"
    }, function() {
        $("#aUnfold").attr("class","leftarrow");
        $("#zonecentre").css({
            left: _cG.width() + "px"
        });
    });
}

//FOR UNI-PARTITE
function selectionUni(currentNode){
    pr("in selectionUni");
    if(checkBox==false && cursor_size==0) {
        highlightSelectedNodes(false);
        opossites = [];
        selections = [];
        partialGraph.refresh();
    }   
    
    if((typeof selections[currentNode.id])=="undefined"){
        selections[currentNode.id] = 1;
        currentNode.active=true;
    }
    else {
        delete selections[currentNode.id];               
        currentNode.active=false;
    }
    //highlightOpossites(nodes1[currentNode.id].neighbours);
//        currentNode.color = currentNode.attr['true_color'];
//        currentNode.attr['grey'] = 0;
//        
//
   

    partialGraph.zoomTo(partialGraph._core.width / 2, partialGraph._core.height / 2, 0.8);
    partialGraph.refresh();
}

//JUST ADEME
function camaraButton(){
    $("#PhotoGraph").click(function (){
        
        //canvas=partialGraph._core.domElements.nodes;
        
        
        
        var nodesCtx = partialGraph._core.domElements.nodes;
        /*
        var edgesCtx = document.getElementById("sigma_edges_1").getContext('2d');
        
        var edgesImg = edgesCtx.getImageData(0, 0, document.getElementById("sigma_edges_1").width, document.getElementById("sigma_edges_1").height)
        
        nodesCtx.putImageData(edgesImg,0,0);
        
        
        
        
        //ctx.drawImage(partialGraph._core.domElements.edges,0,0)
        //var oCanvas = ctx;  
  */
        //div = document.getElementById("sigma_nodes_1").getContext('2d');
        //ctx = div.getContext("2d");
        //oCanvas.drawImage(partialGraph._core.domElements.edges,0,0);
        Canvas2Image.saveAsPNG(nodesCtx);
        
        /*
        Canvas2Image.saveAsJPEG(oCanvas); // will prompt the user to save the image as JPEG.   
        // Only supported by Firefox.  
  
        Canvas2Image.saveAsBMP(oCanvas);  // will prompt the user to save the image as BMP.  
  
  
        // returns an <img> element containing the converted PNG image  
        var oImgPNG = Canvas2Image.saveAsPNG(oCanvas, true);     
  
        // returns an <img> element containing the converted JPEG image (Only supported by Firefox)  
        var oImgJPEG = Canvas2Image.saveAsJPEG(oCanvas, true);   
                                                         
        // returns an <img> element containing the converted BMP image  
        var oImgBMP = Canvas2Image.saveAsBMP(oCanvas, true);   
  
  
        // all the functions also takes width and height arguments.   
        // These can be used to scale the resulting image:  
  
        // saves a PNG image scaled to 100x100  
        Canvas2Image.saveAsPNG(oCanvas, false, 100, 100);  
        */
    });
}


//JUST ADEME
function getChatFrame() {    
    content = '<div id="showChat" onclick="showhideChat();"><a href="#" id="aShowChat"> </a></div>';
    content += '<iframe src="'+ircUrl+'"'
    content += 'width="400" height="300"></iframe>';    
    $("#rightcolumn").html(content);
}


//JUST ADEME
function showhideChat(){
    
    cg = document.getElementById("rightcolumn");
    if(cg){
        if(cg.style.right=="-400px"){
            cg.style.right="0px";
        }
        else cg.style.right="-400px";
    }
}


function getTips(){
    text = '<div><h1>Semantic Landscape of the Rockefeller Innovators Awards</h1><div><p>This map displays the different topics addressed in theRockefeller Innovator Awards. Nodes in the graph correspondto relevant terms which have been extracted from the proposalwith text-mining methods. Nodes are linked when some proposals make a strong relation between the corresponding terms.<br/><br/>Terms are clustered into large topics such as <i>kindergarten & education system</i> and terms belonging to the same large topicshave the same color.<br/><br/>When you clic on a node, the main topics it is linked to are displayed as well as a set of more generic and more specitif terms related to this selection.<br/></p><br/><br/><h4>TIPS</h4><p> <b>- You can search for an expression in the search bar.</b><br/><p> <b>- When a node is selected, you can clic in the side bar on its name to launch a google search on that term.</b><br/><p> <b>- Double clic on a node to get more information</b><br/><b>- Double clic an empty area to erase current selection</b></p></div><br/><center><strong><a href="geomap/index.html" target=blank>See the network world distribution</a></strong></center><br/><div id="footer"><p><i>Credits:</i> <a href="http://chavalarias.com" target="_blank"><img src="rock/user.png" width=15></a> </p></div></div>';
    return text;
}




function closeDialog () {
    $('#windowTitleDialog').modal('hide'); 
}
function okClicked () {
    //document.title = document.getElementById ("xlInput").value;
    closeDialog ();
}
