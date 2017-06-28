
// KEPT FOR REFERENCE, BINNING NOW PRECOMPUTED in parseCustom
// rewrite of gradientColors with binning and for attributes that can have negative float values
// /!\ age and growth_rate attributes referred to by name
function colorsRelByBins_old(daclass) {
  cancelSelection(false);

  var binColors
  var doModifyLabel = false

  TW.handpickedcolor = true

  // for debug of heatmapColoring
  var totalsPerBinMin = {}


  // should be = binColors.length
  var nTicksParam = (daclass == 'age') ? 8 : 12
  // do first loop entirely to get percentiles => bins, then modify alt_color

  // estimating ticks
  let tickThresholds = []
  let valArray = []
  for (var j=0 ; j < TW.nNodes ; j++) {
    let n = TW.partialGraph.graph.nodes(TW.nodeIds[j])

    if (
        !n.hidden
        && n.attributes
        && n.attributes.category == 'terms'
        && n.attributes[daclass] != undefined
      ) {
          valArray.push(Number(n.attributes[daclass]))
    }
  }

  var len = valArray.length

  valArray.sort(function(a, b) {return a - b;}) // important :)

  for (var l=0 ; l < nTicksParam ; l++) {
    let nthVal = Math.floor(len * l / nTicksParam)

    tickThresholds.push(valArray[nthVal])
  }

  // also always add the max+1 as last tick (excluded upper bound of last bin)
  tickThresholds.push((valArray[len-1])+1)

  console.info(`[|===|=== ${nTicksParam} color ticks ===|===|]\n`, tickThresholds)


  cancelSelection(false);

  if (daclass == 'age') {
    // 9 colors
    binColors = TW.gui.getHeatmapColors(9)
    }
    else if (daclass == 'growth_rate') {

      doModifyLabel = true

      // 12 colors
      binColors = TW.gui.getHeatmapColors(12)

    }

    // verification
    if (nTicksParam != binColors.length) {
      console.warn (`heatmapColoring setup mismatch: nTicksParam ${nTicksParam} should == nColors ${binColors.length}`)
    }


    // get the nodes
    for (var j=0 ; j < TW.nNodes ; j++) {
      let n = TW.partialGraph.graph.nodes(TW.nodeIds[j])
      if (! n.hidden
        && n.attributes
        && n.attributes.category == 'terms'
        && ! isUndef(n.attributes[daclass])
      ) {

        var valSt = n.attributes[daclass]

        var originalLabel = TW.Nodes[n.id].label
        if (doModifyLabel) {
          n.label = `(${valSt}) ${originalLabel}`
        }
        else {
          n.label = originalLabel
        }

        var theVal = parseFloat(valSt)
        var foundBin = false
        // console.log('theVal:',theVal)

        if( !isNaN(theVal) ) { //is float
          // iterate over bins
          for(var k=0 ; k < tickThresholds.length-1; k++) {
            var binMin = tickThresholds[k]
            var binMax = tickThresholds[(k+1)]
            if((theVal >= binMin) && (theVal < binMax)) {
                // TW.partialGraph._core.graph.nodesIndex[n.id].binMin = binMin
                // TW.partialGraph._core.graph.nodesIndex[n.id].color = binColors[j]

                n.binMin = binMin
                n.color = binColors[k]
                n.customAttrs.alt_color = binColors[k]
                n.customAttrs.altgrey_color = false
                foundBin = true
                // console.log(`theVal ${theVal} => found its bin ${binMin} ... ${binColors[k]}`)

                if (!totalsPerBinMin[binMin]) {
                  totalsPerBinMin[binMin] = 1
                }
                else {
                  totalsPerBinMin[binMin]++
                }
                break
            }
          }

          // case no bin after loop (perhaps more ticks than colors-1 ??)
          if (!foundBin) {
            console.warn('no bin for theVal', theVal, n.id)
            n.binMin = null
            n.color = '#000'
            n.customAttrs.alt_color = '#000'
          }
        }
        else {
          // case no val
          // console.log('no val for', n.id)
          n.binMin = null
          n.color = '#555'
          n.customAttrs.alt_color = '#555'
        }

      }
    }

    // console.debug(valArray)

    console.info('coloring distribution per tick thresholds' , totalsPerBinMin)

    // Edge precompute alt_rgb by new source-target nodes-colours combination
    repaintEdges()

    // set_ClustersLegend ( daclass )

    TW.partialGraph.render();
}
