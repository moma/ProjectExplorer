<?php


function echodump($title, $anyObj) {
  echo "<br>".$title.": ";
  echo (preg_replace_callback("/\n(\s*)/", function($capt){
    return('<br>'.str_repeat('&nbsp;', strlen($capt[0])));
  }, json_encode($anyObj, JSON_PRETTY_PRINT)));
  echo "<br>";
}


function errmsg($message, $context, $more = "") {
  echo "<p class='micromessage'>The relatedDocs DB conf for $context is $message
  (please read A-Introduction/servermenu_config.md).<br>$more</p>";
}

// reading db.json associations
//    source graph file <=> (db, dbtype, cols) as relatedDocs php API
function read_conf($filepath, $ntypes) {
  $project_menu_fh = fopen($filepath, "r");
  $json_st = '';
  while (!feof($project_menu_fh)) {
    $json_st .= fgets($project_menu_fh);
  }
  fclose($project_menu_fh);
  $project_menu = json_decode($json_st);

  // echodump("== db.json menu ==", $project_menu);

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
  return $conf;
}

function imagestar($score,$factor,$static_libs) {
// produit le html des images de score
  $star_image = '';
  if ($score > 1) {
    $star_image = '';
    $yellow_star = '<img src="'.$static_libs.'/img/star.gif" border="0" >';
    $grey_star = '<img src="'.$static_libs.'/img/stargrey.gif" border="0">';
    $max = 5 * $score / $factor;
    for ($s = 0; $s < 5 ; $s++) {
      if ($s < $max) {
        $star_image.=$yellow_star;
      }
      else {
        $star_image.= $grey_star;
      }
    }
  }
  return $star_image;
}

?>
