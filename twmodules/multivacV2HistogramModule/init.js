// Histogram module
// =================
// Presents a histogram from https://api.iscpif.fr (v2 endpoints)

// Our module_name is simultaneously 3 things:
//   - a DivsFlag for settings_explorerjs
//   - our current dir for this module's files (and this init.js)
//   - the class of module's html elements
module_name="multivacV2HistogramModule"
module_dir=TW.conf.paths.modules+'/'+module_name

// create an exposed namespace
mvacV2Hg = {}

// ---- INIT main part -------- (listing all things to load)

// our histogram wrapper styles
loadCSS(module_dir+"/histogram.css") ;

// our histogram settings
loadJS(module_dir+"/multivacV2Settings.js") ;

// our histogram controller
loadJS(module_dir+"/multivacV2Histogram.js") ;

// dygraph library
// loadCSS(module_name+"/dygraph/gallery.css") ;
loadCSS(module_dir+"/dygraph/textarea.css") ;
loadJS(module_dir+"/dygraph/dygraph.combined.js") ;


console.log("OK LOADED " + module_name) ;
