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

  $output.="<p><b>".$base[$docId]['title']."</b> by <span class='author'>".$base[$docId]['author']."</span> [".$base[$docId]['pubdate']."], <i>".$base[$docId]['journal']."</i></p>";
  $output.="<p><b>keywords:</b> ".$base[$docId]['keywords']."</p>";
  $output.="<p><span class='hit-text'>".$base[$docId]['text']."</span></p>";
  $output.="</li>";

  return $output;
}





$htmlout = "<ul class=infoitems>\n";
$nb_displayed = 0;
foreach ($sims as $doc => $freq) {
  // doc limit
  if ($nb_displayed > $max_item_displayed) {
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


?>
