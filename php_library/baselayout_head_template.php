<?php

$html_declaration = '<!DOCTYPE html5>
<html lang="fr-FR">
';

$html_head_inner = '
  <meta charset="utf-8">
  <!-- ## CSS ## -->
  <link type=text/css rel=stylesheet href="/static/css/bootstrap.min.css">
  <link type=text/css rel=stylesheet href="/static/js/jquery-ui-1.12.1/jquery-ui.min.css">
  <link type=text/css rel=stylesheet href="/static/js/realperson/jquery.realperson.css">
  <link type=text/css rel=stylesheet href="/static/css/whoswho.css">
  <link type=text/css rel=stylesheet href="/static/css/comex_user.css">
  <link type=text/css rel=stylesheet href="/static/css/comex.css">
  <link type=text/css rel=stylesheet href="/static/css/bootstrap_directory.css">
  <link type=text/css rel=stylesheet href="/static/css/topbar_bootstrap_retrocompatibility.css">

  <!-- ## fonts ## -->
  <link type="text/css" href="https://fonts.googleapis.com/css?family=Ubuntu" rel="stylesheet">
  <link type="text/css" href="https://fonts.googleapis.com/css?family=Droid%20Sans" rel="stylesheet">

  <!-- ## JS ## -->

  <!--   libs   -->
  <script type="text/javascript" src="/static/js/jquery/jquery-3.1.1.min.js"></script>
  <script type="text/javascript" src="/static/js/jquery-ui-1.12.1/jquery-ui.min.js"></script>
  <!--   for topbar search/refine   -->
  <script type="text/javascript" src="/static/js/utils.js"></script>
  <script type="text/javascript" src="/static/js/misc/underscore.min.js"></script>
  <script type="text/javascript" src="/static/js/jquery/jquery.highlight-3.js"></script>
  <script type="text/javascript" src="/static/js/whoswho.js"></script>
  <script type="text/javascript" src="static/js/highcharts-5.0.js"></script>
  <!-- realperson
       factorized here in base layout because menubar login has captcha -->
  <!-- realperson salt:
       possible to change it and send it each time with makeSalt-->
  <script type="text/javascript">$.salt = \'verylonverylongverylonverylongverylonverylong\'</script>
  <script type="text/javascript" src="/static/js/realperson/jquery.plugin.min.js"></script>
  <!-- for some reason jquery.realperson.min.js reacts differently to salt than jquery.realperson.js -->
  <script type="text/javascript" src="/static/js/realperson/jquery.realperson.js"></script>
  <!-- /realperson -->


  <!--  NB our js will be at the end -->

  <!-- ## Piwik ## -->
  <script type="text/javascript">
    var _paq = _paq || [];
    _paq.push(["trackPageView"]);
    _paq.push(["enableLinkTracking"]);
    (function() {
      var u="//piwik.iscpif.fr/";
      _paq.push(["setTrackerUrl", u+"piwik.php"]);
      _paq.push(["setSiteId", "4"]);
      var d=document, g=d.createElement("script"), s=d.getElementsByTagName("script")[0];
      g.type="text/javascript"; g.async=true; g.defer=true; g.src=u+"piwik.js"; s.parentNode.insertBefore(g,s);
    })();
  </script>
  <noscript><p><img src="//piwik.iscpif.fr/piwik.php?idsite=4" style="border:0;" alt="" /></p></noscript>
  <!-- End Piwik Code -->


  <!--  for title and stuff -->

  <title>Community explorer: Complex Systems Scholars</title>
  <meta name="description" content="Community Explorer Scholar User Profile">
  <meta name="keywords" content="complex systems, community, user profile">


  <!-- here possible highcharts block include -->
';


?>
