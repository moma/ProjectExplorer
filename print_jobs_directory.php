<?php
// affiche la liste de jobs correspondant à une requête

include ("parametres.php");
include ("normalize.php");
include ("comex_library.php");
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

$data = json_decode($_GET['query']);

function objectToArray($d) {
		if (is_object($d)) {
			// Gets the properties of the given object
			// with get_object_vars function
			$d = get_object_vars($d);
		}
 
		if (is_array($d)) {
			/*
			* Return array converted to object
			* Using __FUNCTION__ (Magic constant)
			* for recursive call
			*/
			return array_map(__FUNCTION__, $d);
		}
		else {
			// Return array
			return $d;
		}
	}

$data = objectToArray($data);

$categorya = $data["categorya"];
$categoryb = $data["categoryb"];
$countries = $data["countries"];
$keywords = $data["keywords"];
$laboratories = $data["laboratories"];
$organizations = $data["organizations"];
$tags = $data["tags"];

$query_details='<ul>';

$f = "";// requête
$labfilter='';


if ($keywords) {
	if (sizeof($keywords) > 0) {
		$f .= 'AND (';
	}
        $query_details.='<li><strong>Working on: </strong>';
	foreach ($keywords as $kw) {
		$words = explode(',', $kw);
		$i = 0;
		foreach ($words as $word) {
			$word = sanitize_input(trim(strtolower($word)));
			if ($word == "") continue;
                        $query_details.=$word.', ';
			if ($i > 0)                            
				$f .= " OR ";
			$f .= 'keywords LIKE "%' . $word . '%" ';
			$i++;
		}
	}
	$f .= ")  ";	
}
if ($countries) {

	if (sizeof($countries) > 0) {
		$f .= 'AND (';
	}
        $query_details.='<li><strong>In the following country: </strong>';
	$i = 0;
	foreach ($countries as $country) {
		//$country = sanitize_input(trim(strtolower($country)));
                $country = sanitize_input(trim($country ));
		if ($country == "") continue;
		if ($i > 0)
			$f .= " OR ";
		$f .= 'country = "' . $country . '" ';                
                $query_details.=$country.', '; 
		$i++;
	}
	$f .= ")  ";
}
if ($laboratories) {

	if (sizeof($laboratories) > 0) {
		$f .= 'AND (';
	}
        $query_details.='<li><strong>In the lab named : </strong>';
	$i = 0;
	foreach ($laboratories as $lab) {
		$lab = sanitize_input(trim(strtolower($lab)));
		if ($lab == "") continue;
		if ($i > 0)
			$f .= " OR ";
		$f .= 'lab LIKE "%' . $lab . '%" ';
                $query_details.=$lab.', '; 
		$i++;
	}
	$f .= ")  ";        
}

if ($organizations) {

	if (sizeof($organizations) > 0) {
		$f .= 'AND (';
	}
        $query_details.='<li><strong>In the organization named : </strong>';
	$i = 0;
	foreach ($organizations as $org) {
		$org = sanitize_input(trim(strtolower($org)));
		
		if ($org == "") continue;
                $query_details.=$org.', '; 
		$f .= 'affiliation LIKE "%' . $org . '%" OR affiliation2 LIKE "%' . $org . '%" ';                
                //'affiliation LIKE "%' . $org . '% OR affiliation2 LIKE "%' . $org . '%"';
		$i++;
	}
	$f .= ")  ";	
}

$query_details.='</ul>';

$base = new PDO("sqlite:" . $dbname);

// liste des jobs
if (substr($f, 0,3)=='AND'){
    $f=substr($f,3,-1);
}
if (substr($labfilter, 0,3)=='AND'){
    $labfilter=substr($labfilter,3,-1);
}

$imsize = 150;

$content='';
        
if (strlen($f)>0){
$sql = "SELECT * FROM jobs where " . " " . $f.' ORDER BY position';
}else{
    $sql = "SELECT * FROM jobs ORDER BY position";
}


// liste des jobs
$jobs= array();


foreach ($base->query($sql) as $row) {

    $info = array();
    $info['id'] = $row['id'];
    $info['title'] = $row['title'];
    $info['position'] = $row['position'];
    $info['country'] = $row['country'];
    $info['lab'] = $row['lab'];
    $info['organization'] = $row['organization'];
    $info['keywords'] = $row['keywords'];
    $info['url'] = $row['url'];
    $info['deadline'] = $row['deadline'];    
    $info['start_date'] = $row['start_date'];
    $info['login'] = $row['login'];        
    $jobs[$row['id']] = $info;
}

/// stats
//$base = new PDO('sqlite:' . $dbname);
include ('jobs_stat-prep_from_array.php');///



include ("jobs_content.php");

// liste des chercheurs



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
<h1>Jobs openings <br/><small>  in complex systems and complexity science</small></h1>
<br/>
<br/>
<p>
This directory presents the <a href="#scholars">'.  count($jobs).' jobs openings</a> in <a href="#labs">'
.  count($labs).' labs</a> and <a href="#orga">'.$orga_count.' organizations</a> in
the field of Complex Systems';
if (strlen(trim($query_details))>3){
$header .= ': </p>'.$query_details;    
}else{
    $header .='.</p> ';
}
$header .='
<br/>
<p>On the complex systems registry, you can 
<a href="http://main.csregistry.org/jobs-submission">submit new job openings</a> or <a href="http://main.csregistry.org/jobmarket">announce that you will be looking for a job
in the next 12 months.</a></p>
<br/>
<h2>Global statistics</h2>
<div id="country" style="width: 800px; height: 300px; margin: 0 auto"></div>
<div id="position" style="width: 800px; height: 300px; margin: 0 auto"></div>


<br/>
<br/> <A NAME="scholars"> </A>
<h2>Jobs sorted by position</h2>
<br/>
<br/>
</div>
</div>';

echo $meta.' '.$stats.'</head>';
echo $header;
echo $content;



?>