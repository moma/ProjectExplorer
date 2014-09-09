
function doSomething(){
    setTimeout(function() {
        
        clickRandomNode();        
        setTimeout(function() {
            changeButton("active_tags.png");
            changeToMacro("semantic");
        },3250);
        
    },1800);
    //
    //$("#semantic").click();
    //clickRandomNode();
    
}

function applyPause(){
    setTimeout(function() {alert('hello');},2250);
}

function clickRandomNode(){    
    nodes = partialGraph._core.graph.nodes.filter(function (n){
        return !n['hidden'];
    });
    min = 0;
    max = nodes.length;
    generatedNumber = Math.floor(Math.random() * (max - min) + min);
    pr(generatedNumber);
    pr(nodes[generatedNumber]);
    getOpossitesNodes(nodes[generatedNumber], true);
    updateLeftPanel();
    if(is_empty(selections)==true){  
                $("#names").html(""); //Information extracted, just added
                $("#opossiteNodes").html(""); //Information extracted, just added
                $("#information").html("");
                changeButton("unselectNodes");
                cancelSelection(false);
    }
    else { 
                greyEverything();
                for(var i in selections){
                    markAsSelected(i,true);
                }
                changeButton("selectNode");
    }
    overNodes=true;        
    partialGraph.draw();
    
}