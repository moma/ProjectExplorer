<?php
include ("php_library/comex_library.php");
include ("php_library/parametres.php");
include ("php_library/normalize.php");

$meta = '<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <title>Complex Systems Scholars</title>
        <meta name="description" content="">
        <meta name="author" content="">

        <!-- Le styles -->
        <link type="text/css" href="https://fonts.googleapis.com/css?family=Droid%20Sans" rel="stylesheet">
        <link type="text/css" href="https://fonts.googleapis.com/css?family=Ubuntu" rel="stylesheet">
        <link type="text/css" href="static/css/whoswho.css" rel="stylesheet">
        <link type="text/css" href="static/css/comex.css" rel="stylesheet">
        <link type="text/css" href="static/css/bootstrap_directory.css" rel="stylesheet">

        <!-- ## fonts ## -->
        <link type="text/css" href="https://fonts.googleapis.com/css?family=Ubuntu" rel="stylesheet">
        <link type="text/css" href="https://fonts.googleapis.com/css?family=Droid%20Sans" rel="stylesheet">

        <!-- updated versions as of 2016-2017 -->
        <script type="text/javascript" src="static/js/jquery/jquery-3.1.1.min.js"></script>
        <script type="text/javascript" src="static/js/jquery-ui-1.12.1/jquery-ui.min.js"></script>
        <script type="text/javascript" src="static/js/highcharts-5.0.js"></script>

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

// REST query params
$categorya = $data["categorya"] ?? [];
$categoryb = $data["categoryb"] ?? [];
$countries = $data["countries"] ?? [];
$keywords = $data["keywords"] ?? [];
$laboratories = $data["laboratories"] ?? [];
$organizations = $data["organizations"] ?? [];
$tags = $data["tags"] ?? [];


// echo '<p style="color:grey">params:  $categorya =====> "'. implode($categorya) .'"</p>';
// echo '<p style="color:grey">params:  $categoryb =====> "'. implode($categoryb) .'"</p>';
// echo '<p style="color:grey">params:  $countries =====> "'. implode($countries) .'"</p>';
// echo '<p style="color:grey">params:  $keywords =====> "'. implode($keywords) .'"</p>';
// echo '<p style="color:grey">params:  $laboratories =====> "'. implode($laboratories) .'"</p>';
// echo '<p style="color:grey">params:  $organizations =====> "'. implode($organizations) .'"</p>';
// echo '<p style="color:grey">params:  $tags =====> "'. implode($tags) .'"</p>';

$query_details='<ul>';

$f = "";// requête
$labfilter='';


// NB hashtags and keywords were additionally split on ',' before being transformed into constraints... we keep this mechanism here but fixed (in legacy version the $i used only in inner loop so 'OR' was missing)
//    (1st array level: several inputs)
//    (2nd array level: several words in one input)
//    constraints <=> each elt of the 2nd level
if ($tags) {
    // debug
    // echo '<p style="color:white">MATCHING ON tags<p>';

    if (sizeof($tags) > 0) {
        $f .= 'AND (';
    }
    $query_details.='<li><strong>Community tags: </strong>';

    $exploded_hts = [];
    foreach ($tags as $ht) {
        $subwords = explode(',', $ht);
        foreach ($subwords as $subword) {
            $subword = sanitize_input(trim(strtolower($subword)));
            if ($subword == "") continue;
            else array_push($exploded_hts, $subword);
        }
    }

    $i = 0;
    foreach($exploded_hts as $clean_subword) {
        $query_details.=$clean_subword.', ';
        if ($i > 0)
            $f .= " OR ";
        $f .= 'hashtags_list LIKE "%' . $clean_subword . '%" ';
        $i++;
    }
    $f .= ")  ";
}

if ($keywords) {
    // debug
    // echo '<p style="color:white">MATCHING ON keywords<p>';
    if (sizeof($keywords) > 0) {
        $f .= 'AND (';
    }
    $query_details.='<li><strong>Working on: </strong>';

    $exploded_kws = [];
    foreach ($keywords as $kw) {
        $subwords = explode(',', $kw);
        foreach ($subwords as $subword) {
            $subword = sanitize_input(trim(strtolower($subword)));
            if ($subword == "") continue;
            else array_push($exploded_kws, $subword);
        }
    }

    $i = 0;
    foreach($exploded_kws as $clean_subword) {
        $query_details.=$clean_subword.', ';
        if ($i > 0)
            $f .= " OR ";
        $f .= 'keywords_list LIKE "%' . $clean_subword . '%" ';
        $i++;
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
        $f .= 'labs_list LIKE "%' . $lab . '%" ';
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
        if ($i > 0)
            $f .= " OR ";
        $f .= 'insts_list LIKE "%' . $org . '%" ';
        $query_details.=$org.', ';
        $i++;
    }
    $f .= ")  ";
}

$query_details.='</ul>';

// debug SQL filters
// print_r("query filters: ". $f);

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

// these stats are useful BOTH in stat-prep and directory_content
// => should be prepared right now (the label mapping contain all orgs ie both labs and institutions)
$lab_counts = array();
$inst_counts = array();
$org_id_to_label = array();


// MAIN HTML CONTENT
$content='';

// error_log("=======> WHERE filters {$f}");

// filtered query
if (strlen($f)>0) {
    $filter = "WHERE {$f}";
}
// unfiltered query
else {
    $filter = "";
}

// about the query stucture cf. doc/cascade_full_scholar_info.sql
$sql = <<< END_QUERY
SELECT * FROM (
    SELECT
        scholars_orgs_and_keywords.*,
        GROUP_CONCAT(htstr) AS hashtags_list
    FROM (
        SELECT
            scholars_and_orgs.*,
            GROUP_CONCAT(kwstr) AS keywords_list,
            COUNT(keywords.kwid) AS keywords_nb
        FROM (
            SELECT
                scholars_and_labs.*,
                GROUP_CONCAT(insts.orgid SEPARATOR ',') AS insts_ids,
                GROUP_CONCAT(insts.label SEPARATOR '%%%') AS insts_list

                FROM (
                    SELECT
                        scholars.*,
                        GROUP_CONCAT(labs.orgid SEPARATOR ',') AS labs_ids,
                        GROUP_CONCAT(labs.label SEPARATOR '%%%') AS labs_list
                    FROM scholars
                LEFT JOIN sch_org AS map_labs
                        ON map_labs.uid = luid
                    LEFT JOIN (
                        SELECT * FROM orgs WHERE class='lab'
                    ) AS labs
                        ON map_labs.orgid = labs.orgid
                    WHERE (record_status = 'active'
                            OR (record_status = 'legacy' AND valid_date >= NOW()))
                    GROUP BY luid
                    ) AS scholars_and_labs
                LEFT JOIN sch_org AS map_insts
                    ON map_insts.uid = luid
                LEFT JOIN (
                    SELECT * FROM orgs WHERE class='inst'
                ) AS insts
                    ON map_insts.orgid = insts.orgid

                GROUP BY luid
        ) AS scholars_and_orgs

        LEFT JOIN sch_kw
            ON sch_kw.uid = scholars_and_orgs.luid
        LEFT JOIN keywords
            ON sch_kw.kwid = keywords.kwid
        GROUP BY luid

    ) AS scholars_orgs_and_keywords
    LEFT JOIN sch_ht
        ON sch_ht.uid = luid
    LEFT JOIN hashtags
        ON sch_ht.htid = hashtags.htid
    GROUP BY luid
) AS full_scholars_info
    {$filter}
END_QUERY;

// debug
// echo '<p style="color:grey;">query:<br>'. $sql ."<p>";

// liste des chercheurs
$scholars = array();

//$query = "SELECT * FROM scholars";
foreach ($base->query($sql) as $row) {

    $info = array();
    $info['unique_id'] = $row['luid'];
    $info['doors_uid'] = $row['doors_uid'];
    $info['first_name'] = $row['first_name'];
    $info['mid_initial'] = (strlen($row['middle_name']) ? substr($row['middle_name'],0,1)."." : "");
    $info['last_name'] = $row['last_name'];
    $info['initials'] = $row['initials'];

    // retrieved from secondary table and GROUP_CONCATenated
    // $info['keywords_ids'] = explode(',', $row['keywords_ids']);
    $info['nb_keywords'] = $row['keywords_nb'];
    $info['keywords'] = split_join_keywords_for_html($row['keywords_list']);


    // $info['status'] = $row['status'];
    $info['record_status'] = $row['record_status'];  // TODO use this one

    $info['country'] = $row['country'];
    $info['homepage'] = $row['home_url'];

    // recreated arrays
    $info['labs'] = explode('%%%', $row['labs_list'] ?? "") ;
    $info['institutions'] = explode('%%%', $row['insts_list'] ?? "") ;

    $info['labs_ids'] = explode(',', $row['labs_ids'] ?? "") ;
    $info['insts_ids'] = explode(',', $row['insts_ids'] ?? "") ;


    $info['title'] = $row['hon_title'];
    $info['position'] = $row['position'];
    $info['pic_src'] = $row['pic_fname'] ? '/data/shared_user_img/'.$row['pic_fname'] : $row['pic_url']  ;
    $info['interests'] = $row['interests_text'];

    // $info['address'] = $row['address'];
    // $info['city'] = $row['city'];
    // $info['postal_code'] = $row['postal_code'];
    // $info['phone'] = $row['phone'];
    // $info['mobile'] = $row['mobile'];
    // $info['fax'] = $row['fax'];
    // $info['affiliation_acronym'] = $row['affiliation_acronym'];
    $scholars[$row['luid']] = $info;

    // we prepare the agregated lab stats in this loop too
    foreach ( array(
                array('labs','labs_ids', &$lab_counts),
                array('institutions','insts_ids', &$inst_counts)
              ) as $cat) {

        // var_dump($cat);

        $namekey = $cat[0];
        $idkey = $cat[1];
        $counthash_ref = &$cat[2];

        // £TODO_ORGS we'll need a missing_labs

        $j = -1 ;
        foreach ($info[$idkey] as $org_id) {

            $j++;
            $org_label = $info[$namekey][$j];
            $org_label = trim($org_label);

            if (strcmp($org_label, "") == 0) {
                $org_label = null;
            } else {
                $org_label = weedout_alt_nulls($org_label);
            }

            // all non-values are there as null
            $org_id_to_label[$org_id] = $org_label;


            if (array_key_exists($org_id, $counthash_ref)) {
                $counthash_ref[$org_id]+=1;
            } else {
                $counthash_ref[$org_id] = 1;
            }
        }
    }
}

// both our stats have been filled
// var_dump($lab_counts) ;
// var_dump($inst_counts) ;

// creates js for stats visualisations and counts (we re-use the orgs counts)
include ("php_library/stat-prep_from_array.php");

// debug
// $content .= var_dump($scholars) ;

// creates listing
include ("php_library/directory_content.php");



$content .= '</div>';
$content .= '</div>
            <footer style="color:white">
                <!-- This directory is maintained by the <a href="http://cssociety.org" target="blank">Complex Systems Society</a>
                     and the <a href="http://iscpif.fr" target="blank">Complex Systems Institute of Paris Ile-de-France</a>.<br/>-->
                <center>
                    <a href="/about.html"><span class="glyphicon glyphicon-question-sign"></span> About</a> -
                    <!-- <a href="http://moma.csregistry.org/feedback" target="BLANK"><span class="glyphicon glyphicon-repeat"></span> Feedback</a> - -->
                    <a href="/about/privacy"> <span class="glyphicon glyphicon-list-alt"></span> Privacy</a>
                    <br>
                      Directory maintained by the <a href="http://iscpif.fr/" target="blank">Complex Systems Institute of Paris Ile-de-France</a> (<a href="http://www.cnrs.fr/fr/recherche/index.htm" target="_BLANK">CNRS</a> UPS 3611) in partnership with the <a href="http://cssociety.org/" target="blank"> Complex Systems Society</a>.
                    <br>

                    <a href="http://iscpif.fr/">
                      <img src="/static/img/logo_m_bleu-header.png" title="Institut des Systèmes Complexes de Paris Ile-de-France"
                         style="border: none; margin: 3px 0 -6px 0; height:30px;">
                    </a>
                    &nbsp;&nbsp;
                    <a href="http://cssociety.org/" target="_BLANK">
                      <img src="/static/img/logo_cssociety_no_legend.png" alt="http://cssociety.org"
                           style="border: none; margin: 3px 0 -6px 0; height:30px;"
                           title="Complex systems society">
                    </a>
                    &nbsp;&nbsp;
                    <a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/3.0/" target="blank">
                      <img alt="Creative Commons License" style="border: none; margin: 3px 0 -6px 0; height:30px;" src="/static/img/cc.png">
                    </a>
                    &nbsp;&nbsp;
                    <a href="http://www.cnrs.fr/" target="blank">
                      <img alt="CNRS" style="border: none; margin: 3px 0 -6px 0; height:30px;" src="/static/img/logo_cnrs.png">
                    </a>
                    <!-- <a href="http://moma.csregistry.org/" target="_BLANK"> MOMA</a> -  -->
                </center>
                <p>&nbsp;</p>
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
This directory presents the profiles of <a href="#scholars">'.  count($scholars).' scholars</a>, <a href="#labs">'.  count($labs).' labs</a> and <a href="#orga">'.$orga_count.' organizations</a> in the field of Complex Systems';



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
<li>This directory is edited by the ISCPIF. This initiative is supported by the <i>Complex Systems
Society</i> (<a href="http://cssociety.org">http://cssociety.org</a>).
Contributions and ideas are welcome to improve this directory.
<a href="mailto:sysop AT iscpif.fr">Please feedback</a></p>
</ul>
</p>

<br/>
<br/>
<h2>Global statistics</h2>
<div id="country" style="width: 800px; height: 300px; margin: 0 auto"></div>
<div id="title" style="width: 800px; height: 300px; margin: 0 auto"></div>
<div id="position" style="width: 800px; height: 300px; margin: 0 auto"></div>

<!-- these two are displayed only if the distribution has
     at least 3 big groups (cf. n_shown in stats-prep) -->
<div id="labs_div" style="width: 800px; height: 300px; margin: 0 auto"></div>
<div id="insts_div" style="width: 800px; height: 300px; margin: 0 auto"></div>


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

exit(0)


?>
