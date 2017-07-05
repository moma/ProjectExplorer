<?php


// GLOBAL PARAMS
// -------------
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
// reading db.json associations
//    source graph file <=> (db, dbtype, cols) as relatedDocs php API
$project_menu_fh = fopen($mainpath.$project_menu_path, "r");
$json_st = '';
while (!feof($project_menu_fh)) {
  $json_st .= fgets($project_menu_fh);
}
fclose($project_menu_fh);

$project_menu = json_decode($json_st);

// echodump("== db.json menu ==", $project_menu);

// parse db.json project menu and create a conf by file
$conf = array();
foreach ($project_menu as $project_dir => $dir_items){
  // NB access by obj property (and not array key)
  if (! property_exists($dir_items, 'graphs')) {
    error_log("tw/phpAPI skip error: conf file ($project_menu_path)
               has no 'graphs' entry for project '$project_dir' !");
    continue;
  }
  foreach ($dir_items->graphs as $graph_file => $graph_conf){

    // echodump("== $graph_file ==", $graph_conf);

    $gpath = $project_dir.'/'.$graph_file;

    // NB a graph conf can now have different settings for each nodetype
    // node0 <=> classic type 'semantic'
    // node1 <=> classic type 'social'

    $conf[$gpath] = array($ntypes);

    for ($i = 0 ; $i < $ntypes ; $i++) {
      // check node0, node1, etc to see if they at least have a reldbfile
      if (! property_exists($graph_conf, 'node'.$i)
          || ! property_exists($graph_conf->{'node'.$i}, 'reldbfile') ) {
        $conf[$gpath][$i] = array('active' => false);
        continue;
      }
      else {
        // we have a file for this type: copy entire conf
        $conf[$gpath][$i] = (array)$graph_conf->{'node'.$i};

        $conf[$gpath][$i]['active'] = true;
        $conf[$gpath][$i]['dir'] = $project_dir;
      }
      // POSS here info on higher level may be propagated for lower ones
      //     (ex: if dbtype is on the project level, its value should count
      //          for each source file in the project unless overridden)
    }
  }
}

// =======================================
// echodump("== READ CONF ==<br>", $conf);
// =======================================

$gexf= str_replace('"','',$_GET["gexf"]);
$ndtype = $_GET["type"];
$ntid = null;
$my_conf = null;

// legacy types => generic types
if ($ndtype == 'semantic') {  $ntid = 0;  }
else                       {  $ntid = 1;  }

if (! $conf[$gexf][$ntid]['active']) {
  echo("The relatedDocs configuration for your graph ($gexf) isn't active
  (please read 00.DOCUMENTATION/A-Introduction/servermenu_config.md).<br>");
  exit(1);
}
else {
  $my_conf = $conf[$gexf][$ntid];
  $graphdb = $my_conf['dir'].'/'.$my_conf['reldbfile'];
}

// echodump("params: reldb", $graphdb);
// echodump("params: node type id", $ntid);



// echodump("graphdb", $graphdb);


?>
