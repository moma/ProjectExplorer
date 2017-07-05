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
