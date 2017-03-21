<?php
include ("php_library/comex_library.php");
include ("php_library/js_elements.php");
include ("php_library/parametres.php");
include ("php_library/normalize.php");
include ("php_library/baselayout_head_template.php");
include ("php_library/baselayout_topbar_template.php");
include ("php_library/baselayout_tail_template.php");

$meta = $html_head_inner;

//phpinfo();
//echo $_GET['query']."<br/>";
$userid = $_GET['query'];


// get param for current user (allows customize user menus w/o looking at cookie)
$logged = $_GET['u'];


// $base = new PDO("sqlite:" . $dbname);
$base = new PDO($dsn, $user, $pass, $opt);


// liste des chercheurs
$scholars = array();

// these stats are useful BOTH in stat-prep and directory_content
// => should be prepared right now (the label mapping contain all orgs ie both labs and institutions)
$lab_counts = array();
$inst_counts = array();
$org_id_to_label = array();


if ($userid) {

    // query idea:
    // ------------
    // SELECT sch_kw.uid AS source,
    //        count(sch_kw.kwid) AS similarity,
    //        second_level.uid AS neighboor
    // FROM      sch_kw
    // LEFT JOIN sch_kw AS second_level ON sch_kw.kwid = second_level.kwid
    // WHERE sch_kw.uid = 4207
    // GROUP BY second_level.uid
    // ORDER BY count(sch_kw.kwid) DESC, second_level.uid != 4207 ASC;


    // exemple:
    // +--------+------------+-----------+
    // | source | similarity | neighboor |
    // +--------+------------+-----------+
    // |   4207 |          2 |      4207 |
    // |   4207 |          2 |      2792 |
    // |   4207 |          1 |      2732 |
    // |   4207 |          1 |      2569 |
    // |   4207 |          1 |      3128 |
    // |   4207 |          1 |      2636 |
    // |   4207 |          1 |      3488 |
    // |   4207 |          1 |      2727 |
    // |   4207 |          1 |      3604 |
    // |   4207 |          1 |      3942 |
    // |            (...)                |
    // +--------+------------+-----------+




    // re-implementation with separated matching and full retrieval
    // NB: we need the sch_kw mapping 3 times
    //        - one for the retrieval with all keywords
    //        - 2 for matching
    //            - one sch_kw for source scholar
    //            - one sch_kw for target scholar
    //  1) and matching <=> 2 x left join keywords
    //  2) full retrieval <=> full_scholars_info
    $sql = <<< HERE_QUERY
    SELECT
        matched.uid,
        matched.sim,
        full_scholars_info.*
    FROM (
        SELECT
          tgt.uid,
          count(*) AS sim
        FROM sch_kw AS src
        LEFT JOIN sch_kw AS tgt ON tgt.kwid = src.kwid
        WHERE src.uid = {$userid}
        GROUP BY src.uid, tgt.uid
        ORDER BY sim DESC, tgt.uid != src.uid ASC
    ) AS matched

    JOIN (
            ${sql_full_scholar_select}

    ) AS full_scholars_info ON luid = matched.uid;
HERE_QUERY;

    // print_r('=== print_scholar_directory query ===<br>');
    // print_r($sql);

    foreach ($base->query($sql) as $row) {
        $info = array();
        $info['unique_id'] = $row['luid'];
        $info['doors_uid'] = $row['doors_uid'];
        $info['first_name'] = esc_html($row['first_name']);
        $info['mid_initial'] = (strlen($row['middle_name']) ? substr($row['middle_name'],0,1)."." : "");
        $info['last_name'] = esc_html($row['last_name']);
        $info['initials'] = esc_html($row['initials']);

        // retrieved from secondary table and GROUP_CONCATenated
        $info['keywords_ids'] = explode(',', $row['keywords_ids']);
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
}

// if no keywords matched, the previous select is empty
if (count($scholars)==0){
    $sqlsingle = "SELECT hon_title, first_name, middle_name, last_name FROM scholars WHERE luid =".$userid ;

    $target_name = "";
    foreach ($base->query($sqlsingle) as $row) {
        $target_name = name_string(
            $row['hon_title'],
            $row['first_name'],
            $row['middle_name'],
            $row['last_name']
        );
    }
}
// otherwise we keep the query-ed user's details
else {
    $target_name = name_string(
        $scholars[$userid]['title'],
        $scholars[$userid]['first_name'],
        $scholars[$userid]['mid_initial'],
        $scholars[$userid]['last_name']
    );
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


//////// Header
$header = '<div class="row" id="welcome">
    <div class="span12" align="justify">
        <br/>
        <h2 class="oldstyle maintitle">Complex Systems Scholars</h2>
        <br/>
        <div class="mini-hero">
<p>
This directory presents the profiles of <a href="#scholars">'.  count($scholars).' scholars</a>, <a href="#labs">'.  count($labs).' labs</a> and <a href="#orga">'.$orga_count.' organizations</a> in the field of Complex Systems
<br/>
Scholars have been selected from the complex systems directory when sharing common keywords with:
<ul>
<li class="small-item"><strong>Scholar: </strong> '.$target_name.'</li>
</ul>
</p>
<h4>About the complex systems directory</h4>
<p>
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

</div>
<br/>
<h2 class="oldstyle">Global statistics</h2>


<div class="container-fluid">
    <div class="row chart-row">
        <div class="col-lg-5 col-md-5 col-sm-12">
            <div id="country" class="directory-piechart"></div>
        </div>
        <div class="col-lg-6 col-md-6 col-sm-12">
            <div id="title" class="directory-piechart"></div>
        </div>
    </div>
    <div class="row chart-row">
        <div class="col-lg-5 col-md-5 col-sm-12">
            <div id="position" class="directory-piechart"></div>
        </div>
        <div class="col-lg-6 col-md-6 col-sm-12">
            <!-- conditional display (cf. n_shown in stats-prep) -->
            <div id="insts_div" class="directory-piechart"></div>
        </div>
    </div>
    <div class="row chart-row">
        <div class="col-lg-12 col-md-12 col-sm-12">
            <!-- conditional display (idem) -->
            <div id="labs_div" class="directory-piechart"></div>
        </div>
    </div>
</div>

<br/>
<br/> <A NAME="scholars"> </A>
<h2 class="oldstyle">Scholars sorted by number of common keywords with '.$target_name.'</h2>
<br/>
<br/>
</div>
</div>';


if (count($scholars)==0){

// TODO message in modal panel
    echo  '<h2>Sorry, '.$target_name.' did not mention any keywords ... we cannot process the network.</h2><br/>
        If you are '.$target_name.', you can  <a href="/services/user/profile"  target="_BLANK">modify your profile</a> and see your
            network in few minutes.';
}else{
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
    echo '</body>
    </html>';
    exit(0);
}
exit(0);

?>
