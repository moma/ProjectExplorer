// Crowdsourcing module
// ====================

// Our module_name is simultaneously 3 things: 
//   - a DivsFlag for settings_explorerjs
//   - our current dir for this module's files (and this init.js)
//   - the class of module's html elements
module_name="crowdsourcingTerms"

// ---- INIT main part -------- (listing all things to load)

// basic modal
loadCSS(module_name+"/crowdTerms.css")
loadJS(module_name+"/modal.js") ;

// histogram
loadJS(module_name+"/dygraph/dygraph.combined.js") ;
loadCSS(module_name+"/dygraph/gallery.css") ;
loadCSS(module_name+"/dygraph/textarea.css") ;

console.log("OK LOADED " + module_name) ;
