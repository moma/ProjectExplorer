<?php

/*
 * A place to factorize the injected JS
 * TODO use more eg for charts
 */


// to autoselect current whoswho filters
// NB: uses global value $data
$auto_popfilters_snippet = '<script type="text/javascript">' ;
if (isset($data) && $data) {
    foreach ($data as $filter => $array_vals) {
        foreach ($array_vals as $val) {
            $auto_popfilters_snippet .= '
            whoswho.popfilter("'.$filter.'", {"prefill":"'.$val.'"});
            ';
        }
    }
}
$auto_popfilters_snippet .= '</script>';


// exemple snippet this one is to use in html context
$rm_ads_snippet = <<< ENDHTML
<script type="text/javascript">
  document.addEventListener("DOMContentLoaded", function(event) {
      setTimeout( function() {
          var ads = document.getElementsByClassName("highcharts-credits")
          for (var ad of ads) {
              ad.style.WebkitTransition = 'opacity 1s';
              ad.style.MozTransition = 'opacity 1s';
              ad.style.opacity = 0;
              setTimeout (function() {
                  ad.innerHTML = ""
              }, 1000)
          }
      }, 5000)
  })
</script>
ENDHTML;

?>
