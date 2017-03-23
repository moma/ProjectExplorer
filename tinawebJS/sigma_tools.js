// (transitional package): sigmaTools for functions we had in sam's customized sigma v.1 under sigma.tools

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

    return stools
})(sigmaTools);
