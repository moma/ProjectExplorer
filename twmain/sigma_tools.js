// (transitional package): sigmaTools for functions we had in sam's customized sigma v.1 under sigma.tools
// TODO: unify with sigmaUtils or globalUtils

var sigmaTools = {};

sigmaTools = (function(stools) {

    // a simpler alternative to avoid parseCustom and prepareNodesRenderingProperties
    // temporarily after using the new gexf stock parser
    // (mostly to transform viz: attrs in real attrs)
    stools.myGexfParserReplacement = function(rawGexfNodes, rawGexfEdges) {

      // output, indexed by IDs
      var newNodes = [],
          newEdges = []

      for (var j in rawGexfNodes) {
        var rawNode = rawGexfNodes[j]
        // pre-parse node rgb color
        var rgbStr = rawNode.viz.color.match(/rgb\(([^\(]+)\)/)[1]
        var newNode = {
          id: rawNode.id,
          label: rawNode.label,
          x: rawNode.viz.position.x,
          y: rawNode.viz.position.y,
          color: rawNode.viz.color,
          size: Math.round(rawNode.viz.size*1000)/1000,
          hidden: false,
          customAttrs: {
            active: false,
            highlight: false,
            defgrey_color : "rgba("+rgbStr+",.4)"
          },
          // for metrics like centrality
          attributes: {
            'clust_default': rawNode.attributes.modularity_class
          }
        }
        newNodes[j] = newNode
      }

      for (var i in rawGexfEdges) {
        var rawEdge = rawGexfEdges[i]

        var rgbStr = sigmaTools.edgeRGB(newNodes[rawEdge.source].color, newNodes[rawEdge.target].color)
        var leColor = "rgba("+rgbStr+","+TW.conf.sigmaJsDrawingProperties.twEdgeDefaultOpacity+")"

        var newEid = rawEdge.source+";"+rawEdge.target;
        var newEdge = {
          id: newEid,
          source: rawEdge.source,
          target: rawEdge.target,
          color: leColor,
          weight: Math.round(rawEdge.weight*1000)/1000,
          customAttrs: {
            activeEdge: false,
            true_color: leColor,
            rgb: rgbStr
          }
        }

        newEdges[i] = newEdge

      }

      return {nodes: newNodes, edges: newEdges}
    };


    stools.rgbToHex = function(R, G, B) {
        return stools.toHex(R) + stools.toHex(G) + stools.toHex(B);
    };

    stools.toHex = function(n) {
        n = parseInt(n, 10);

        if (isNaN(n)) {
            return '00';
        }
        n = Math.max(0, Math.min(n, 255));
        return '0123456789ABCDEF'.charAt((n - n % 16) / 16) +
        '0123456789ABCDEF'.charAt(n % 16);
    };

    // TODO check duplicate functionalities with repaintEdges
    stools.edgeRGB = function(color_a, color_b) {

      //edge color will be the combination of the 2 node colors

      // console.log("color a", color_a)
      // console.log("color b", color_b)

      var tmp

      if(color_a.charAt(0)!="#") {
          tmp = color_a.replace(/rgba?\(/,"").replace(")","").split(",")

          // rgb array
          color_a = [parseFloat( tmp[0] ) , parseFloat( tmp[1] ) , parseFloat( tmp[2] )];
      }
      else {
        color_a = hex2rgba(color_a);
      }

      if(color_b.charAt(0)!="#") {
          tmp = color_b.replace(/rgba?\(/,"").replace(")","").split(",")
          color_b = [parseFloat( tmp[0] ) , parseFloat( tmp[1] ) , parseFloat( tmp[2] )];
      }
      else {
        color_b = hex2rgba(color_b);
      }
      var r = (color_a[0] + color_b[0]) >> 1;
      var g = (color_a[1] + color_b[1]) >> 1;
      var b = (color_a[2] + color_b[2]) >> 1;

      return [r,g,b].join(',')
    }

    return stools
})(sigmaTools);
