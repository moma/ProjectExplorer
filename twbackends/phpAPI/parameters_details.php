<?php


// GLOBAL PARAMS
// -------------
// 0 - output mode: 'json' or 'html'
//  > json is for new use cases where styling is applied via template import in the js
//  > html is the classical use where data is styled in this php scripts
$output_mode = "json";

// 1 - relative urls
$our_php_root="twbackends/phpAPI";        // our php scripts relative URL
$our_libs_root="twbackends/phpAPI";       // for our few icons and jquery-ui
                                          // POSS could be merged with our_php_root


// 2 - paths
$mainpath=dirname(dirname(getcwd()))."/"; // default fs path to ProjectExplorer root
                                          // (where data dir and db.json file reside)

$project_menu_path = "db.json";

// 3 - others
$ntypes = 2;  // max node types   (node0 & node1)

// accepted entries in db.json -> source -> reldbs -> dbtype
$supported_dbtypes = ['csv', 'CortextDB'];

// number of docs to display setting
$max_item_displayed = 7;

// for csv parsing
$csvsep = "\t";
$csvquote = '"';

// for csv caching (optional)
$memserver = 'localhost';
$memport = 11211;


// CONFIGURATION PARAMS
// --------------------
// parse db.json project menu and create a conf by file
$conf = read_conf($mainpath.$project_menu_path, $ntypes, $supported_dbtypes);

// =======================================
// echodump("== READ CONF ==<br>", $conf);
// =======================================

$gexf= str_replace('"','',$_GET["gexf"]);
$ntid = $_GET["ndtype"];
$dbtype = $_GET["dbtype"];
$ndtype = null;
$my_conf = null;

// new types => legacy types (with semantic as default)
if ($ntid == 0)   {  $ndtype = 'social' ;   }
else              {  $ndtype = 'semantic';  }

// echodump("params: node type id", $ntid);

if (! count($conf[$gexf]['node'.$ntid])) {
  errmsg("has no php reldbs configured for nodetype $ntid", "your graph ($gexf)");
  exit(1);
}
else if (! array_key_exists($dbtype, $conf[$gexf]['node'.$ntid])) {
  errmsg("reldbs isn't configured for nodes of type $ntid and dbtype $dbtype", "your graph ($gexf)");
  exit(1);
}
else if (! array_key_exists('file', $conf[$gexf]['node'.$ntid][$dbtype])) {
  errmsg("reldb has no DB file for nodes of type $ntid and dbtype $dbtype", "your graph ($gexf)");
  exit(1);
}
else {
  $my_conf = $conf[$gexf];
  $graphdb = $my_conf['node'.$ntid][$dbtype]['file'];
}

// echodump("params: reldb", $graphdb);

?>
