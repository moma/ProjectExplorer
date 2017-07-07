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
$ntypes = 2;         // max node types

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
$conf = read_conf($mainpath.$project_menu_path, $ntypes);

// =======================================
// echodump("== READ CONF ==<br>", $conf);
// =======================================

$gexf= str_replace('"','',$_GET["gexf"]);
$ndtype = $_GET["type"];
$ntid = null;
$my_conf = null;

// legacy types => generic types with 0 as default
if ($ndtype == 'social')   {  $ntid = 1;  }
else                       {  $ntid = 0;  }

// echodump("params: node type id", $ntid);

if (! $conf[$gexf][$ntid]['active']) {
  errmsg("not active", "your graph ($gexf)");
  exit(1);
}
else {
  $my_conf = $conf[$gexf];
  $graphdb = $my_conf[$ntid]['dir'].'/'.$my_conf[$ntid]['reldbfile'];
}

// echodump("params: reldb", $graphdb);

?>
