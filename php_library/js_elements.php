<?php

/*
 * A place to factorize the injected JS
 * TODO use more eg for charts
 */

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
