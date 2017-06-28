// frequent commands
TW.rend.clear()
TW.rend.render()

TW.partialGraph.settings.embedObjects({prefix: 'renderer1:'})('singleHover')




    // POSS: edit config of CanvasRenderingContext2D
    // TW.rend.contexts.nodes.imageSmoothingQuality = "high"
    // TW.rend.contexts.edges.imageSmoothingQuality = "high"
    // TW.rend.contexts.labels.imageSmoothingQuality = "high"


    // cf. https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D

    TW.rend.contexts.nodes.globalCompositeOperation = "multiply"
    TW.rend.contexts.edges.globalCompositeOperation = "multiply"
    TW.rend.contexts.labels.globalCompositeOperation = "multiply"



// rendering one

var oneNode = TW.partialGraph.graph.nodes(4)

sigma.canvas.nodes.def(
  oneNode,
  TW.rend.contexts.nodes,
  TW.partialGraph.settings.embedObjects({prefix: 'cam0:'})
)

// for fixed "hoverlike" labels => override the module's sigma.canvas.labels.def with an "if" like below (or add another type)
// cf. sigmaUtils.twRender.canvas.labels
