// (transitional package): sigmaTools for functions we had in sam's customized sigma v.1 under sigma.tools
// TODO: unify with sigmaUtils or globalUtils

var sigmaTools = {};

sigmaTools = (function(stools) {

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
    stools.edgeRGB = function(src_id, tgt_id) {
      //edge color will be the combination of the 2 node colors
      var a = TW.Nodes[src_id]['color'];
      var b = TW.Nodes[tgt_id]['color'];

      // console.log("color a", a)
      // console.log("color b", b)

      if(a.charAt(0)!="#") {
          tmp = a.replace("rgba(","").replace(")","").split(",")
          a = stools.rgbToHex( parseFloat( tmp[0] ) , parseFloat( tmp[1] ) , parseFloat( tmp[2] ) );
      }

      if(b.charAt(0)!="#") {
          tmp = b.replace("rgba(","").replace(")","").split(",")
          b = stools.rgbToHex( parseFloat( tmp[0] ) , parseFloat( tmp[1] ) , parseFloat( tmp[2] ) );
      }
      // console.log(source+" : "+a+"\t|\t"+target+" : "+b)
      a = hex2rga(a);
      b = hex2rga(b);
      var r = (a[0] + b[0]) >> 1;
      var g = (a[1] + b[1]) >> 1;
      var b = (a[2] + b[2]) >> 1;

      return [r,g,b].join(',')
    }

    return stools
})(sigmaTools);
