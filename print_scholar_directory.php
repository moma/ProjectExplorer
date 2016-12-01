<?php
include ("comex_library.php");
include ("parametres.php");
include ("normalize.php");
//include("../common/library/fonctions_php.php");

$meta = '<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <title>Complex Systems Scholars</title>
        <meta name="description" content="">
        <meta name="author" content="">
        <!-- Le HTML5 shim, for IE6-8 support of HTML elements -->
        <!--[if lt IE 9]>
		<script src="http://html5shim.googlecode.com/svn/trunk/html5.js"></script>
		<![endif]-->
        <!-- Le styles -->
        <link href="css/bootstrap_directory.css" rel="stylesheet">
        <link type="text/css" href="css/brownian-motion/jquery-ui-1.8.16.custom.css">
        <link href="http://fonts.googleapis.com/css?family=Ubuntu" rel="stylesheet" type="text/css">
        <script type="text/javascript" src="js/jquery/jquery-1.7.min.js"></script>
        <script type="text/javascript" src="js/jquery-ui/jquery-ui-1.8.16.custom.min.js"></script>
        <script type="text/javascript" src="js/bootstrap/bootstrap-dropdown-fade.js"></script>
        <script type="text/javascript" src="js/misc/underscore.min.js"></script>
        <script type="text/javascript" src="js/jquery/jquery.highlight-3.js"></script>
        <script type="text/javascript" src="js/misc/json2.js"></script>
        <script type="text/javascript" src="js/utils.js"></script>
         <script type="text/javascript" src="Highcharts-2.2.0/js/highcharts.js"></script>
        <script type="text/javascript" src="Highcharts-2.2.0/js/modules/exporting.js"></script>

        <script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js"></script>

        <link href="css/whoswho.css" rel="stylesheet" type="text/css">
        <link rel="shortcut icon" href="images/favicon.ico">
        <link rel="apple-touch-icon" href="images/apple-touch-icon.png">
        <link rel="apple-touch-icon" sizes="72x72" href="images/apple-touch-icon-72x72.png">
        <link rel="apple-touch-icon" sizes="114x114" href="images/apple-touch-icon-114x114.png">
                <script type="text/javascript">
          var _gaq = _gaq || [];
          _gaq.push([\'_setAccount\', \'UA-30062222-1\']);
          _gaq.push([\'_setDomainName\', \'communityexplorer.org\']);
          _gaq.push([\'_trackPageview\']);

          (function() {
            var ga = document.createElement(\'script\'); ga.type = \'text/javascript\'; ga.async = true;
            ga.src = (\'https:\' == document.location.protocol ? \'https://ssl\' : \'http://www\') + \'.google-analytics.com/ga.js\';
            var s = document.getElementsByTagName(\'script\')[0]; s.parentNode.insertBefore(ga, s);
          })();
        </script>
            ';

define('_is_utf8_split', 5000);

function is_utf8($string) {
   
    // From http://w3.org/International/questions/qa-forms-utf-8.html
    return preg_match('%^(?:
          [\x09\x0A\x0D\x20-\x7E]            # ASCII
        | [\xC2-\xDF][\x80-\xBF]             # non-overlong 2-byte
        |  \xE0[\xA0-\xBF][\x80-\xBF]        # excluding overlongs
        | [\xE1-\xEC\xEE\xEF][\x80-\xBF]{2}  # straight 3-byte
        |  \xED[\x80-\x9F][\x80-\xBF]        # excluding surrogates
        |  \xF0[\x90-\xBF][\x80-\xBF]{2}     # planes 1-3
        | [\xF1-\xF3][\x80-\xBF]{3}          # planes 4-15
        |  \xF4[\x80-\x8F][\x80-\xBF]{2}     # plane 16
    )*$%xs', $string);
   
}
//phpinfo();
//echo $_GET['query']."<br/>";
$login = $_GET['query'];


$base = new PDO("sqlite:" . $dbname);

if ($login) {
    if (sizeof($login) > 0) {
// liste des chercheurs
        $sql = "SELECT keywords_ids,last_name,first_name FROM scholars where unique_id='" . $login . "'";        
        foreach ($base->query($sql) as $row) {
            $keywords_ids = split(',', $row['keywords_ids']);
            $scholar_array = array();
            $target_name=$row['first_name'].' '.$row['last_name'];
            foreach ($keywords_ids as $keywords_id) {
        
                $sql2 = "SELECT * FROM scholars2terms where term_id=" . trim($keywords_id);
                #pt($sql2);
                foreach ($base->query($sql2) as $row) {
                    if (array_key_exists($row['scholar'], $scholar_array)){
                        $scholar_array[$row['scholar']] += 1;
                    }else{
                        $scholar_array[$row['scholar']] = 1;
                    }
                    
                }
            }
        }        
        
    }     
}
 
        // les scholars sont affichés par ordre de pertinence
        arsort($scholar_array);               
   
        $scholar_id_array=array_keys($scholar_array);
// liste des chercheurs
$scholars = array();

foreach ($scholar_id_array as $scholar_id){
$sql = "SELECT * FROM scholars where unique_id='" . $scholar_id. "'";

//$query = "SELECT * FROM scholars";
foreach ($base->query($sql) as $row) {
    $info = array();
    $info['unique_id'] = $row['unique_id'];
    $info['first_name'] = $row['first_name'];
    $info['initials'] = $row['initials'];
    $info['last_name'] = $row['last_name'];
    $info['nb_keywords'] = $row['nb_keywords'];
    $info['css_voter'] = $row['css_voter'];
    $info['css_member'] = $row['css_member'];
    $info['keywords_ids'] = explode(',', $row['keywords_ids']);
    $info['keywords'] = $row['keywords'];
    $info['status'] = $row['status'];
    $info['country'] = $row['country'];
    $info['homepage'] = $row['homepage'];
    $info['lab'] = $row['lab'];
    $info['affiliation'] = $row['affiliation'];
    $info['lab2'] = $row['lab2'];
    $info['affiliation2'] = $row['affiliation2'];
    $info['homepage'] = $row['homepage'];
    $info['title'] = $row['title'];
    $info['position'] = $row['position'];
    $info['photo_url'] = $row['photo_url'];
    $info['interests'] = $row['interests'];
    $info['address'] = $row['address'];
    $info['city'] = $row['city'];
    $info['postal_code'] = $row['postal_code'];
    $info['phone'] = $row['phone'];
    $info['mobile'] = $row['mobile'];
    $info['fax'] = $row['fax'];
    $info['affiliation_acronym'] = $row['affiliation_acronym'];
    $scholars[$row['unique_id']] = $info;
}
    
}
include ('stat-prep_from_array.php');///

include ("directory_content.php");





$content .= '</div>';
$content .= '</div>
            <footer>
                GENERATED BY <a href="http://iscpif.fr"><img src="css/branding/logo-iscpif_medium.png" alt="iscpif.fr" style="border: none; margin-bottom : -6px;" title="isc-pif" /></a>-  <a href="http://sciencemapping.com" target="_BLANK">MOMA</a> - <a href="http://www.crea.polytechnique.fr/LeCREA/" target="_BLANK">CREA</a> - <a href="http://www.cnrs.fr/fr/recherche/index.htm" target="_BLANK">CNRS</a> 
            </footer>
        </div>
</body>
</html>';

//////// Header
$header = '<div class="row" id="welcome">
    <div class="span12" align="justify">
<img src="img/RegistryBanner.png" align="center">
<br/><br/>
<h1>Complex Systems Scholars</h1>
<br/>
<br/>
<p>
This directory presents scholars from the complex systems community who share interest with 
'.$target_name.': <a href="#scholars">'.  count($scholars).' scholars</a> affiliated to <a href="#labs">'
.  count($labs).' labs</a> and <a href="#orga">'.$orga_count.' organizations</a>.

Scholars have been selected from the complex systems directory when sharing common keywords with '.$target_name.'. 
    
</p>
<h4>About the complex systems directory</h4>
<p><ul>
<li><b><i>This directory is open</i></b>. Anybody can have her profile included
provided it is related to Complex Systems science and Complexity science. Personal data are given on a
voluntary basis and people are responsible for the validity and integrity of their data.
<li><i><b>This directory is browsable online</b> on the website of the complex systems society :</i> http://csbrowser.cssociety.org
<li>This directory is edited by the Complex Systems Registry. This initiative is supported by the <i>Complex Systems
Society</i> (<a href="http://cssociety.org">http://cssociety.org</a>). 
Contributions and ideas are welcome to improve this directory.
<a href="http://css.csregistry.org/whoswho+feedback">Please feedback</a></p>
</ul> 
</p>

<br/>
<br/>
<h2>Global statistics</h2>
<div id="country" style="width: 800px; height: 300px; margin: 0 auto"></div>
<div id="title" style="width: 800px; height: 300px; margin: 0 auto"></div>
<div id="position" style="width: 800px; height: 300px; margin: 0 auto"></div>


<br/>
<br/> <A NAME="scholars"> </A>
<h2>Scholars sorted by number of common keywords with '.$target_name.'</h2>
<br/>
<br/>
</div>
</div>';


echo $meta.' '.$stats.'</head>';
if (count($scholars)==0){
echo  '<h2>Sorry, '.$target_name.' did not mentioned any keywords ... we cannot process it\'s network.</h2><br/>
    If you are '.$target_name.', you can  <a href="http://main.csregistry.org/Whoswhodata"  target="_BLANK">modify your profile</a> and see your 
        network in few minutes.';
}else{
echo $header;
echo $content;
}

?>