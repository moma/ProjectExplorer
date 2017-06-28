// Crowdsourcing module
// ====================
// Allows suggestions from search box

// Our module_name is simultaneously 3 things:
//   - a DivsFlag for settings_explorerjs
//   - our current dir for this module's files (and this init.js)
//   - the class of module's html elements
module_name="crowdsourcingModule"
module_dir=TW.conf.paths.modules+'/'+module_name

// ---- INIT main part -------- (listing all things to load)

loadCSS(module_dir+"/crowdTerms.css")
loadJS(module_dir+"/suggest.js") ;



console.log("OK LOADED " + module_name) ;
