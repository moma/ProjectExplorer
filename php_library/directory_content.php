<?php
// calcul les différents profils à partir d'une requete
// sort un $content


echo '
    <body>';
include ("analytics.php");
echo '
    <div class="container">

        <!-- Directory listing -->
        <div class="hero-unit">
   ';


$imsize = 150;

$content='';


// prepare the list of scholars' institutions
// (used for "Institutions by alphabetical order" section)
$additional_insts_ids=array();

// ajout des scholars

$loop = 0;

// NB this array was prepared in print_directory or print_scholar_directory


foreach ($scholars as $scholar) {

    $scholar['position'] = weedout_alt_nulls($scholar['position']) ;

    // debug
    // var_dump($scholar);

    if ($loop % 100){
        set_time_limit(20);
    }
    $loop+=1;
    $content.= '<div class="row">
                <div class="span12">
                    <div class="row">
                        <div class="span9" align="justify">';
    $content .= '<div>';

    // remote pictures url 'http://some.org/path/blabla.png'
    //            or local '/data/shared_user_img/blabla.png'
    if ($scholar['pic_src'] != null) {
        $pic_src = $scholar['pic_src'] ;
        if ($_SERVER['REQUEST_SCHEME'] == 'https') {
            $pic_src = preg_replace('/^http:/i', 'https:', $pic_src) ;
        }
        $content .= '<img style="margin: 7px 10px 10px 0px" src="'. $pic_src . '" width="' . $imsize . 'px" align="left">';
    }
    else {
        if (count($scholars) < 2000) {
            $im_id = floor(rand(0, 11));
            $content .= '<img style="margin: 7px 10px 10px 0px" src="static/img/' . $im_id . '.png" width="' . $imsize . 'px" align="left">';
        }
    }

    $content .= '<h2 >' . $scholar['title'] . ' ' . $scholar['first_name'] . ' ' . $scholar['mid_initial'] . ' ' . $scholar['last_name'] .
            ' <small> - ' . $scholar['country'] . '</small></h2>';


    if (($scholar['position'] != null)||count($scholar['labs'])||count($scholar['institutions'])) {
       $content .= '<dl>';
    }

    if ($scholar['position'] != null) {
        $content .= '<dt>' . $scholar['position'] . '</dt>';
    }
    $lab = '';

    // new way: list of org.label values
    if (count($scholar['labs'])) {
        $labs_html = implode(
                    '<br>',
                    array_map(
                        "clean_exp",
                        array_map("esc_html",
                            array_map(
                                "weedout_alt_nulls",
                                $scholar['labs']
                            )
                        )
                    )
                );
        $content .= '<dd class="labs-of-scholar">' ;
        $content .= $labs_html ;
        $content .= '</dd> ';

        # we don't need to recount the organisations globally,
        # because we already have $lab_counts (per id)
    }

    // new way: list of org.label values
    if (count($scholar['institutions'])) {
        $institutions_html = implode(
                    '<br>',
                    array_map(
                        "clean_exp",
                        array_map("esc_html",
                            $scholar['institutions']
                        )
                    )
                );

        $content .= '<dd class="institutions-of-scholar">' ;
        $content .= $institutions_html ;
        $content .= '</dd> ';

        # here also we already have $insts_counts (per id)
    }


    // POSS: url of lab as link, if filled in DB

    if (($scholar['position'] != null)
        ||count($scholar['labs'])
        ||count($scholar['institutions'])
        ) {
       $content .= '</dl>';
    }


    $content .= '</div>';


    if ($scholar['interests'] != null) {

        $htmlsafe_interests = str_replace('%%%', '<br/>',
                                htmlspecialchars($scholar['interests'],
                                                 ENT_HTML5, 'UTF-8')
                              );
        $content .= '<div>';
        $content .= '<h4>Research</h4>';
        $content .= '<p>' . $htmlsafe_interests . '</p>';
        $content .= '</div>';
    }

    $content .= '</div>';


    if ($scholar['keywords'] != null) {
        $content .= '<div class="span3" align="left">';

        if ($scholar['keywords'] != null){
                 $content .= '<i class="icon-tags"></i> ' . clean_exp($scholar['keywords']). '.<br/><br/>';
        }
        $content .= '</div>';
    }
$content .= '</div>';

    $content .= '</div>';
    $content .= '</div>';

    $content .= '
<center><img src="static/img/bar.png"></center>';
    $content .= '<br/>';
    $content .= '<br/>';
    // fin du profil
}

// if (strcmp(substr($lab_query, 0,2),'OR')==0){
//     $lab_query=substr($lab_query,2);
// }

// if (strcmp(substr($orga_query, 0,2),'OR')==0){
//     $orga_query=substr($orga_query,2);
// }



//////////////////////////
// liste des labs ////////
//////////////////////////


// NB this could also be retrieved in the first query (on scholars, with dedup)
//    (ideally test speed and chose)


// all lab orgids except _NULL
$lab_ids = array_filter(array_keys($lab_counts));
sort($lab_ids);

// all lab infos to retrieve
$labs = array();

// paging
$step = 2000;
$n_steps = ceil(count($lab_ids)/$step);

for($i = 0; $i < $n_steps; $i++) {
    $batch = array_slice($lab_ids, $step * $i, $step);
    $ids_str = implode(',', $batch);

    // print_r("<br>step: ".$i." / ids_str".$ids_str."<br>");

    // normal query would be enough for everything except parent org
    // POSS page the request in nb of ids >= mysql technical limit for IN
    // $sql = 'SELECT * FROM orgs WHERE orgid IN ('.$ids_str.')'; // ORDER BY name, acro' ;

    // variant query with parent org
    // unique org1 (=> unique pairs (sch_org => sch_org2)
    //              => org2 info)
    //
    // it's much longer in code but fast because of indexes
    //
    // a POSS alternative would be to
    //        create an org_org table
    //        at record time
    //
    $sql = <<< LABSQLEXTENDED
    SELECT orgs.*,
           GROUP_CONCAT( tgt_orgid ORDER BY tgt_freq DESC )
            AS related_insts
    FROM orgs
    LEFT JOIN (
        SELECT sch_org.orgid AS src_orgid,
              sch_org2.orgid AS tgt_orgid,
              count(*) AS tgt_freq
        FROM sch_org
        LEFT JOIN sch_org AS sch_org2
            ON sch_org.uid = sch_org2.uid
        JOIN orgs AS orgs2
            ON sch_org2.orgid = orgs2.orgid
        WHERE orgs2.class = 'inst'
        AND  sch_org.orgid != sch_org2.orgid
        GROUP BY sch_org.orgid, sch_org2.orgid
        ) AS lab_relationship_to_inst_via_scholars ON src_orgid = orgs.orgid
    WHERE orgs.orgid IN ( {$ids_str} )
    AND orgs.name != '_NULL'
    GROUP BY orgs.orgid
    ORDER BY orgs.name, orgs.acro
LABSQLEXTENDED;

    // print_r($sql);

    foreach ($base->query($sql) as $row) {
        $info = array();
        $info['unique_id'] = $row['orgid'];

        // print_r($row);
        // print_r("<br/>");

        $info['name'] = $row['name'];

        $info['acronym'] = $row['acro'] ?? '';
        $info['homepage'] = $row['url'] ?? '';
        $info['lab_code'] = $row['lab_code'] ?? '';
        $info['locname'] = $row['locname'] ?? '';     // ex: 'Barcelona, Spain'
                                                      //     'London, UK'
                                                      //     'UK'

        // keywords : POSS with an org <=> keywords map
        // cf. doc/data_mining_exemples/correlated_kws.sql
        // $info['keywords'] = $row['keywords'];

        // most frequent parent orgs (max = 3)
        $related_insts_ids = array_slice(explode(',', $row['related_insts'] ?? ""),0,3) ;
        $info['related_insts'] = array_filter($related_insts_ids);

        // also add them to orga_list
        $additional_insts_ids[] = $related_insts_ids;

        $info['admin'] = ucwords($row['contact_name'] ?? '');
        if ($row['contact_email']) {
            $safe_contact_email = safe_email($row['contact_email']);
            $info['admin'] .= '<br><span class=code>'.$safe_contact_email.'</span>';
        }
        // print_r($info);
        $labs[$row['orgid']] = $info;

        // finished batch
    }
    // finished all labs
}


//
// print_r("all labs here:");
// print_r($labs);


/////////////////////////////////////////////////////////////
/// liste des organismes / affiliations institutionnelles ///
/////////////////////////////////////////////////////////////

// all direct institutions' orgids except ''
$inst_ids = array_filter(array_keys($inst_counts));

// any other institutions we want
// $insts_ids[] = $additional_insts_ids;
sort($inst_ids);
$insts_ids = array_unique($insts_ids);

// all org with infos to retrieve
$organiz = array();

// debug
// $content .= var_dump($inst_ids) ;

foreach ($inst_ids as $inst_id) {
    $sql = "SELECT * FROM orgs WHERE orgid='" . $inst_id. "'";

    foreach ($base->query($sql) as $row) {
        $info = array();
        $info['unique_id'] = $inst_id;
        $info['name'] = $row['name'];

        $info['acronym'] = $row['acro'] ?? '';
        $info['homepage'] = $row['url'] ?? '';
        $info['inst_type'] = $row['inst_type'] ?? '';
        $info['locname'] = $row['locname'] ?? '';     // ex: 'Barcelona, Spain'
                                                      //     'London, UK'
                                                      //     'UK'


        // TODO RESTORE keywords and contact
        // $info['keywords'] = $row['keywords'];
        // $info['admin'] = $row['admin'];
        $organiz[$inst_id] = $info;
    }
}



///////////////////////////////////////////////////////////////
/// affichage des organismes petite échelle: labos, équipes ///
///////////////////////////////////////////////////////////////

$content .='<br/> <A NAME="labs"> </A>
<h1>Labs by alphabetical order</h1>
<p><i>List of teams or labs mentioned by the scholars</i></p>';

include('labs_list.php');


/////////////////////////////////////////////////////////////////
/// affichage des organismes / affiliations institutionnelles ///
/////////////////////////////////////////////////////////////////
$content .= '<br/> <A NAME="orga"> </A>
<h1>Institutions by alphabetical order</h1>
<br/>
<p><i>List of institutions to which scholars are affiliated</i></p>';
include('orga_list.php');


?>
