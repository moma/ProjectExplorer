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
          active: false,
          hidden: false,
          customAttrs: {
            grey: false,
            highlight: false,
            true_color: rawNode.viz.color,
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

        var rgbStr = sigmaTools.edgeRGB(rawEdge.source, rawEdge.target, newNodes)
        var leColor = "rgba("+rgbStr+","+TW.edgeDefaultOpacity+")"

        var newEid = rawEdge.source+";"+rawEdge.target;
        var newEdge = {
          id: newEid,
          source: rawEdge.source,
          target: rawEdge.target,
          color: leColor,
          weight: Math.round(rawEdge.weight*1000)/1000,
          customAttrs: {
            grey: false,
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
    stools.edgeRGB = function(src_id, tgt_id, nodeIndex) {

      if (!nodeIndex) {
        nodeIndex = TW.Nodes
      }

      if (!Object.keys(nodeIndex).length) {
        console.warn('empty nodeIndex')
      }

      // console.log('edgeRGB, src_id', src_id)
      // console.log('edgeRGB, tgt_id', tgt_id)
      //
      if (!nodeIndex[src_id] || !nodeIndex[tgt_id]) {
        return '0,0,0'
      }

      //edge color will be the combination of the 2 node colors
      var a = nodeIndex[src_id]['color'];
      var b = nodeIndex[tgt_id]['color'];
      var tmp
      // console.log("color a", a)
      // console.log("color b", b)

      if(a.charAt(0)!="#") {
          tmp = a.replace(/rgba?\(/,"").replace(")","").split(",")

          // rgb array
          a = [parseFloat( tmp[0] ) , parseFloat( tmp[1] ) , parseFloat( tmp[2] )];
      }
      else {
        a = hex2rga(a);
      }

      if(b.charAt(0)!="#") {
          tmp = b.replace(/rgba?\(/,"").replace(")","").split(",")
          b = [parseFloat( tmp[0] ) , parseFloat( tmp[1] ) , parseFloat( tmp[2] )];
      }
      else {
        b = hex2rga(b);
      }
      // console.log(source+" : "+a+"\t|\t"+target+" : "+b)

      var r = (a[0] + b[0]) >> 1;
      var g = (a[1] + b[1]) >> 1;
      var b = (a[2] + b[2]) >> 1;

      return [r,g,b].join(',')
    }

    return stools
})(sigmaTools);
