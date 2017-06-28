<?php
// manage the dynamical additional information in the left panel.
ini_set('display_errors',1);
ini_set('display_startup_errors',1);
error_reporting(-1);



// DISPLAY THE RESULTS
function displayDoc($docId, $score, $base) {

  $output = "";

  // POSS score should have a data-score attribute
  $output = "<li class='searchhit' title='".$score."'>";

  // shortcut to doc
  $doc = $base[$docId];

  // £TODO new concept: use searchhit-templates
  $has_template = False ;
  if ($has_template) {

  }
  else {
    // fallback "universal" values
    $title = try_attrs_until_you_find($doc, ['title', 'tit', 't']);
    $source = try_attrs_until_you_find($doc, ['source', 'journal', 'j']);
    $keywords = try_attrs_until_you_find($doc, ['keywords', 'keyword', 'kw']);
    $author = try_attrs_until_you_find($doc, ['authors', 'author', 'auth', 'au']);
    $doccontent = try_attrs_until_you_find($doc, ['text', 'txt', 'abstract', 'content']);

    $date = try_attrs_until_you_find($doc, ['pubdate', 'publication_year', 'date']);

    // detailed dates, gargantext-compatible
    $month = try_attrs_until_you_find($doc, ['publication_month']);
    $day = try_attrs_until_you_find($doc, ['publication_day']);
    if ($month) {       $date .= "/".$month;
      if ($day) {         $date .= "/".$day;  } }

    // "universal" template
    $output.="<p><b>$title</b> by <span class='author'>$author</span>, <i>$source</i> [$date]</p>";
    if (strlen($keywords)) {
      $output.="<p><b>keywords:</b> $keywords</p>";
    }
    $output.="<p><span class='hit-text'>$doccontent</span></p>";
  }

  $output.="</li>";

  return $output;
}


function try_attrs_until_you_find($doc_obj, $attr_names_array) {
  $found_value = "";
  for ($k = 0 ; $k < count($attr_names_array) ; $k++) {
    $key = $attr_names_array[$k];
    if (array_key_exists($key, $doc_obj)) {
      $found_value = $doc_obj[$key] ;
      break ;
    }
  }
  return $found_value ;
}



$htmlout = "<ul class=infoitems>\n";
$nb_displayed = 0;
foreach ($sims as $doc => $freq) {
  // doc limit
  if ($nb_displayed > $max_item_displayed - 1) {
    break;
  }

  $rowid = ltrim($doc, 'd');
  $thisdoc = displayDoc($rowid, $freq, $base);
  // echodump("doc", $thisdoc);
  $htmlout .= $thisdoc."\n";

  // doc limit
  $nb_displayed++;
}
$htmlout .= "</ul>\n";

echo '<br/><h4><font color="#0000FF"> Full text of top '.$max_item_displayed."/".count($sims).' related publications:</font></h4>'.$htmlout;

// to see the entire results array:
// --------------------------------
// echodump("sims", $sims);

?>
