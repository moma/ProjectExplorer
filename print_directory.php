<?php
include ("php_library/comex_library.php");
include ("php_library/parametres.php");
include ("php_library/normalize.php");
include ("php_library/baselayout_head_template.php");
include ("php_library/baselayout_topbar_template.php");
include ("php_library/baselayout_tail_template.php");

$meta = $html_head_inner;

$data = json_decode($_GET['query']);

// print_r('query here<br>');
// print_r($data);
// print_r('/query here<br>');

// this one after we got query data
include ("php_library/js_elements.php");



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
    $query_details.='<li class="small-item"><strong>Community tags: </strong>';

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
    $query_details .= "</li>";
}

if ($keywords) {
    // debug
    // echo '<p style="color:white">MATCHING ON keywords<p>';
    if (sizeof($keywords) > 0) {
        $f .= 'AND (';
    }
    $query_details.='<li class="small-item"><strong>Working on: </strong>';

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

    $query_details .= "</li>";
}


if ($countries) {
    // debug
    // echo '<p style="color:white">MATCHING ON countries<p>';

    if (sizeof($countries) > 0) {
        $f .= 'AND (';
    }
        $query_details.='<li class="small-item"><strong>In the following country: </strong>';
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
    $query_details .= "</li>";
}

if ($laboratories) {
    // debug
    // echo '<p style="color:white">MATCHING ON labs<p>';
    if (sizeof($laboratories) > 0) {
        $f .= 'AND (';
    }
        $query_details.='<li class="small-item"><strong>In the lab named : </strong>';
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
    $query_details .= "</li>";
}

if ($organizations) {
    // debug
    // echo '<p style="color:white">MATCHING ON organizations<p>';

    if (sizeof($organizations) > 0) {
        $f .= 'AND (';
    }
        $query_details.='<li class="small-item"><strong>In the organization named : </strong>';
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
    $query_details .= "</li>";
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
    $info['first_name'] = esc_html($row['first_name']);
    $info['mid_initial'] = (strlen($row['middle_name']) ? substr($row['middle_name'],0,1)."." : "");
    $info['last_name'] = esc_html($row['last_name']);
    $info['initials'] = esc_html($row['initials']);

    // retrieved from secondary table and GROUP_CONCATenated
    // $info['keywords_ids'] = explode(',', $row['keywords_ids']);
    $info['nb_keywords'] = $row['keywords_nb'];
    $info['keywords'] = split_join_keywords_for_html($row['keywords_list']);


    // $info['status'] = $row['status'];
    $info['record_status'] = $row['record_status'];  // TODO use this one

    $info['country'] = esc_html($row['country']);
    $info['homepage'] = $row['home_url'];

    // recreated arrays
    $info['labs'] = array_map("esc_html",
                        explode('%%%', $row['labs_list'] ?? "")
                        ) ;
    $info['institutions'] = array_map("esc_html",
                        explode('%%%', $row['insts_list'] ?? "")
                        ) ;
    $info['labs_ids'] = explode(',', $row['labs_ids'] ?? "") ;
    $info['insts_ids'] = explode(',', $row['insts_ids'] ?? "") ;

    $info['title'] = esc_html($row['hon_title']);
    $info['position'] = esc_html($row['position']);
    $info['pic_src'] = $row['pic_fname'] ? '/data/shared_user_img/'.$row['pic_fname'] : $row['pic_url']  ;
    $info['interests'] = str_replace('%%%', '<br/>',
                        esc_html($row['interests_text'])
                      );

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

            // all non-values are there as null => the key becomes ""
            // (useful for missing labs)
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
// var_dump($org_id_to_label) ;

// creates js for stats visualisations and counts (we re-use the orgs counts)
include ("php_library/stat-prep_from_array.php");

// debug
// $content .= var_dump($scholars) ;

// creates listing
include ("php_library/directory_content.php");


//////// Header
$header = '
<div class="row" id="welcome">
    <div class="span12" align="justify">
        <br/>
        <h2 class="oldstyle maintitle">Complex Systems Scholars</h2>
        <br/>

        <div class="mini-hero">
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
<li class="small-item"><b><i>This directory is open</i></b>. Anybody can have her profile included
provided it is related to Complex Systems science and Complexity science. Personal data are given on a
voluntary basis and people are responsible for the validity and integrity of their data.</li>
<li class="small-item">This directory is edited by the ISCPIF. This initiative is supported by the <i>Complex Systems
Society</i> (<a href="http://cssociety.org">http://cssociety.org</a>).
Contributions and ideas are welcome to improve this directory.
<a href="mailto:sysop AT iscpif.fr">Please feedback</a></li>
</ul>

</div>
<br/>
<h2 class="oldstyle">Global statistics</h2>
<div id="country" style="width: 800px; height: 300px; margin: 0 auto"></div>
<div id="title" style="width: 800px; height: 300px; margin: 0 auto"></div>
<div id="position" style="width: 800px; height: 300px; margin: 0 auto"></div>

<!-- these two are displayed only if the distribution has
     at least 3 big groups (cf. n_shown in stats-prep) -->
<div id="labs_div" style="width: 800px; height: 300px; margin: 0 auto"></div>
<div id="insts_div" style="width: 800px; height: 300px; margin: 0 auto"></div>


<br/>
<br/> <A NAME="scholars"> </A>
<h2 class="oldstyle">Scholars by alphabetical order</h2>
<br/>
<br/>
</div>
</div>';

echo $html_declaration;
echo '<head>';
echo $meta;
echo $stats;
echo '</head>';
echo '<body>';
echo $doors_connect_params;
echo $topbar;
echo '<div class="container full-directory">';
// echo '<div class="hero-unit">';
echo $header;
echo '';
echo $content;
echo $footer;
// echo '</div>';
echo '</div>';
echo $html_tail_imports;
echo $rm_ads_snippet;
echo $auto_popfilters_snippet;
echo '</body>
</html>';
exit(0);


?>
