

$(document).ready(function () {
    partialGraph = sigma.init(document.getElementById('sigma-example'))
    .drawingProperties(sigmaJsDrawingProperties)
    .graphProperties(sigmaJsGraphProperties)
    .mouseProperties(sigmaJsMouseProperties);
    partialGraph.type="social";
    
    startMiniMap();
    
    console.log("parsing...");     
    if(parse()){
        //If false, it'll trigger the actions inside the "else" from "parse()"        
        //If true, user has clicked MAP from topbar...
        updateEdgeFilter("social");
        updateNodeFilter("social");
        pushSWClick("social");
        cancelSelection(false);
        console.log("Parsing complete.");     
        partialGraph.zoomTo(partialGraph._core.width / 2, partialGraph._core.height / 2, 0.8).draw();
        partialGraph.startForceAtlas2();   
        startEnviroment(); 
    }
});
