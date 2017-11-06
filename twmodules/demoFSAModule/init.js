// Exploration Demo module
// =======================
// Runs an automated scenario to explore the graph

// Our module_name is simultaneously 3 things:
//   - a DivsFlag for settings_explorerjs
//   - our current dir for this module's files (and this init.js)
//   - the class of module's html elements
module_name="demoFSAModule"
module_dir=TW.conf.paths.modules+'/'+module_name

// create an exposed namespace
demoFSA = {}

// ---- INIT main part -------- (listing all things to load)

// // our demo settings (allowed actions ?)
// loadJS(module_dir+"/demoSettings.js") ;

// our demo controller
loadJS(module_dir+"/demoController.js") ;

console.log("OK LOADED " + module_name) ;
