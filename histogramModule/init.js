// Histogram module
// =================
// Presents a histogram from WOS API

// Our module_name is simultaneously 3 things: 
//   - a DivsFlag for settings_explorerjs
//   - our current dir for this module's files (and this init.js)
//   - the class of module's html elements
module_name="histogramModule"
// ---- INIT main part -------- (listing all things to load)

// our histogram wrapper styles
loadCSS(module_name+"/histogram.css") ;

// our histogram controller
loadJS(module_name+"/wosHistogram.js") ;

// dygraph library
// loadCSS(module_name+"/dygraph/gallery.css") ;
loadCSS(module_name+"/dygraph/textarea.css") ;
loadJS(module_name+"/dygraph/dygraph.combined.js") ;


console.log("OK LOADED " + module_name) ;
