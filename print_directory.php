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

        <!-- Le styles -->
        <link type="text/css" href="http://fonts.googleapis.com/css?family=Ubuntu" rel="stylesheet">
        <link type="text/css" href="static/css/bootstrap_directory.css" rel="stylesheet">
        <link type="text/css" href="static/css/brownian-motion/jquery-ui-1.8.16.custom.css" rel="stylesheet">
        <link type="text/css" href="static/css/whoswho.css" rel="stylesheet">

        <!-- TODO test if each is really needed -->
        <!-- TODO upgrade versions as per comments -->
        <script type="text/javascript" src="static/js/jquery/jquery-1.7.min.js"></script>
        <script type="text/javascript" src="static/js/jquery-ui-1.8.16.custom.min.js"></script>
        <!-- upgraded available files
            <script type="text/javascript" src="static/js/jquery/jquery-3.1.1.min.js"></script>
            <script type="text/javascript" src="static/js/jquery-ui-1.12.1/jquery-ui.min.js"></script>
        -->
        <script type="text/javascript" src="static/js/jquery-ui-1.8.16.custom.min.js"></script>
        <script type="text/javascript" src="static/js/bootstrap/bootstrap-dropdown-fade.js"></script>
        <script type="text/javascript" src="static/js/misc/underscore.min.js"></script>
        <script type="text/javascript" src="static/js/jquery/jquery.highlight-3.js"></script>
        <script type="text/javascript" src="static/js/misc/json2.js"></script>
        <script type="text/javascript" src="static/js/utils.js"></script>

        <script type="text/javascript" src="static/js/highcharts-2.2/js/highcharts.js"></script>
        <script type="text/javascript" src="static/js/highcharts-2.2/modules/exporting.js"></script>

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


// echo '<p style="color:white">params:  $categorya =====> '. var_dump($categorya) ."<p>";
// echo '<p style="color:white">params:  $categoryb =====> '. var_dump($categoryb)."<p>";
// echo '<p style="color:white">params:  $countries =====> '. var_dump($countries) ."<p>";
// echo '<p style="color:white">params:  $keywords =====> '. var_dump($keywords) ."<p>";
// echo '<p style="color:white">params:  $laboratories =====> '. var_dump($laboratories) ."<p>";
// echo '<p style="color:white">params:  $organizations =====> '. var_dump($organizations) ."<p>";
// echo '<p style="color:white">params:  $tags =====> '. var_dump($tags) ."<p>";

$query_details='<ul>';

$f = "";// requête
$labfilter='';
if ($tags) {
    // debug
    // echo '<p style="color:white">MATCHING ON tags<p>';

    if (sizeof($tags) > 0) {
        $f .= 'AND (';
    }
        $query_details.='<li><strong>Community tags: </strong>';
    foreach ($tags as $kw) {
        $words = explode(',', $kw);
        $i = 0;
        foreach ($words as $word) {
            $word = sanitize_input(trim(strtolower($word)));
            if ($word == "") continue;
            if ($i > 0)
                $f .= " OR ";
            $f .= 'tags LIKE "%' . $word . '%" ';
                        $query_details.=$word.', ';
            $i++;
        }
    }
    $f .= ") ";
}

if ($keywords) {
    // debug
    // echo '<p style="color:white">MATCHING ON keywords<p>';

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
            $f .= 'keywords_list LIKE "%' . $word . '%" ';
            $i++;
        }
    }
    $f .= ")  ";
}
if ($countries) {
    // debug
    // echo '<p style="color:white">MATCHING ON countries<p>';

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
    // debug
    // echo '<p style="color:white">MATCHING ON labs<p>';
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
        $f .= 'team_lab LIKE "%' . $lab . '%" ';
                $query_details.=$lab.', ';
        $i++;
    }
    $f .= ")  ";
}

if ($organizations) {
    // debug
    // echo '<p style="color:white">MATCHING ON organizations<p>';

    if (sizeof($organizations) > 0) {
        $f .= 'AND (';
    }
        $query_details.='<li><strong>In the organization named : </strong>';
    $i = 0;
    foreach ($organizations as $org) {
        // echo '<p style="color:white">========> org =====> '. $org ."<p>";
        $org = sanitize_input(trim(strtolower($org)));

        if ($org == "") continue;
                $query_details.=$org.', ';
        $f .= 'org LIKE "%' . $org . '%" ';
                //'affiliation LIKE "%' . $org . '% OR affiliation2 LIKE "%' . $org . '%"';
        $i++;
    }
    $f .= ")  ";
}

$query_details.='</ul>';

$base = new PDO($dsn, $user, $pass, $opt);
$termsMatrix = array(); // liste des termes présents chez les scholars avec leurs cooc avec les autres termes
$scholarsMatrix = array(); // liste des scholars avec leurs cooc avec les autres termes
$scholarsIncluded = 0;

// liste des chercheurs
if (substr($f, 0,3)=='AND'){
    $f=substr($f,3,-1);
}
if (substr($labfilter, 0,3)=='AND'){
    $labfilter=substr($labfilter,3,-1);
}

$imsize = 150;

$content='';

// filtered query
if (strlen($f)>0) {
    $filter = "WHERE {$f}";
}
// unfiltered query
else {
    $filter = "";
}
$sql = <<< END_QUERY
SELECT * FROM
    (SELECT
        scholars.*,
        affiliations.*,
        COUNT(keywords.kwid) AS keywords_nb,
        GROUP_CONCAT(keywords.kwid) AS keywords_ids,
        GROUP_CONCAT(kwstr) AS keywords_list
    FROM scholars
    JOIN sch_kw
        ON doors_uid = uid
    JOIN keywords
        ON sch_kw.kwid = keywords.kwid
    LEFT JOIN affiliations
        ON affiliation_id = affid
    GROUP BY doors_uid) AS full_scholars_info
    {$filter}
END_QUERY;


// debug
// echo '<p style="color:white">query:'. $sql ."<p>";

// liste des chercheurs
$scholars = array();

//$query = "SELECT * FROM scholars";
foreach ($base->query($sql) as $row) {


    $info = array();
    $info['unique_id'] = $row['doors_uid'];
    $info['first_name'] = $row['first_name'];
    $info['mid_initial'] = (strlen($row['middle_name']) ? substr($row['middle_name'],0,1)."." : "");
    $info['last_name'] = $row['last_name'];
    $info['initials'] = $row['initials'];

    // retrieved from secondary table and GROUP_CONCATenated
    $info['keywords_ids'] = explode(',', $row['keywords_ids']);
    $info['nb_keywords'] = $row['keywords_nb'];
    $info['keywords'] = $row['keywords_list'];


    // $info['status'] = $row['status'];
    $info['record_status'] = $row['record_status'];  // TODO use this one

    $info['country'] = $row['country'];
    $info['homepage'] = $row['home_url'];
    $info['lab'] = $row['team_lab'];
    $info['affiliation'] = $row['org'];
    // $info['lab2'] = $row['lab2'];
    // $info['affiliation2'] = $row['affiliation2'];
    $info['title'] = $row['hon_title'];
    $info['position'] = $row['position'];
    $info['photo_url'] = $row['pic_url'];
    $info['pic_file'] = $row['pic_file'];
    $info['interests'] = $row['interests_text'];
    // $info['address'] = $row['address'];
    // $info['city'] = $row['city'];
    // $info['postal_code'] = $row['postal_code'];
    // $info['phone'] = $row['phone'];
    // $info['mobile'] = $row['mobile'];
    // $info['fax'] = $row['fax'];
    // $info['affiliation_acronym'] = $row['affiliation_acronym'];
    $scholars[$row['doors_uid']] = $info;
}
/// stats
include ('stat-prep_from_array.php');///

// debug
// $content .= var_dump($scholars) ;

include ("directory_content.php");


// liste des chercheurs



$content .= '</div>';
$content .= '</div>
            <footer>
                GENERATED BY <a href="http://iscpif.fr"><img src="static/css/branding/logo-iscpif_medium.png" alt="iscpif.fr" style="border: none; margin-bottom : -6px;" title="isc-pif" /></a>-  <a href="http://sciencemapping.com" target="_BLANK">MOMA</a> - <a href="http://www.crea.polytechnique.fr/LeCREA/" target="_BLANK">CREA</a> - <a href="http://www.cnrs.fr/fr/recherche/index.htm" target="_BLANK">CNRS</a>
            </footer>
        </div>
</body>
</html>';

//////// Header
$header = '<div class="row" id="welcome">
    <div class="span12" align="justify">
<img src="static/img/RegistryBanner.png" align="center">
<br/><br/>
<h1>Complex Systems Scholars</h1>
<br/>
<br/>
<p>
This directory presents the profiles of <a href="#scholars">'.  count($scholars).' scholars</a>, <a href="#labs">'
.  count($labs).' labs</a> and <a href="#orga">'.$orga_count.' organizations</a> in
the field of Complex Systems';
if (strlen(trim($query_details))>3){
$header .= ': </p>'.$query_details;
}else{
    $header .='.</p> ';
}
$header .='<p>Its aims are to foster interactions
between protagonists in the fields of Complex Systems science and Complexity
science,   as well as  to increase their visibility at the international scale.</p>

<ul>
<li><b><i>This directory is open</i></b>. Anybody can have her profile included
provided it is related to Complex Systems science and Complexity science. Personal data are given on a
voluntary basis and people are responsible for the validity and integrity of their data.
<li><i><b>This directory is browsable online</b> on the website of the complex systems society :</i> http://csbrowser.cssociety.org
</ul>
</p>

<p>
This directory is edited by the Complex Systems Registry. This initiative is supported by the <i>Complex Systems
Society</i> (<a href="http://cssociety.org">http://cssociety.org</a>).
</p>
<br/>
<p>Contributions and ideas are welcome to improve this directory.
<a href="http://css.csregistry.org/whoswho+feedback">Please feedback</a></p>
<br/>
<h2>Global statistics</h2>
<div id="country" style="width: 800px; height: 300px; margin: 0 auto"></div>
<div id="title" style="width: 800px; height: 300px; margin: 0 auto"></div>
<div id="position" style="width: 800px; height: 300px; margin: 0 auto"></div>


<br/>
<br/> <A NAME="scholars"> </A>
<h2>Scholars by alphabetical order</h2>
<br/>
<br/>
</div>
</div>';

echo $meta.' '.$stats.'</head>';
echo $header;
echo $content;



?>