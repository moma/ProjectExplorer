<?php
// calcul les différents profils à partir d'une requete
// sort un $content


echo '
    <body>';
include ("analytics.php");
echo '
    <div class="container">

        <!-- Main hero unit for a primary marketing message or call to action -->
        <div class="hero-unit">
   ';


$imsize = 150;

$content='';




$lab_list=array();
// $orga_list=array();       // TODO restore separate organizations (right now duplicate with labs)

// ajout des scholars

$loop = 0;

// NB this array was prepared in print_directory or print_scholar_directory
foreach ($scholars as $scholar) {

    // -----------------------------8<------------------
    // alternative null values during DB transition
    // TODO remove when DB finalized and refilled by returning users
    if (preg_match ('/^ *_NULL *$/', $scholar['position'])) {
        $scholar['position'] = null ;
    }
    if (preg_match ('/^ *_NULL *$/', $scholar['affiliation'])) {
        $scholar['affiliation'] = null ;
    }

    error_log('aff:/'.$scholar['affiliation'].'/');
    // -----------------------------8<------------------

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


    // TODO restore lab // affiliation difference
    // if (($scholar['position'] != null)||($scholar['lab'] != null)||($scholar['affiliation'] != null)) {
    if (($scholar['position'] != null)||($scholar['affiliation'] != null)) {
       $content .= '<dl>';
    }

    if ($scholar['position'] != null) {
        $content .= '<dt>' . $scholar['position'] . '</dt>';
    }
    $affiliation = '';

    // TODO restore lab vs org ---------------------------------------------8<-----------
    // new way: already merged in data retrieval in print_*
    if ($scholar['affiliation'] != null) {
        $affiliation = $scholar['affiliation'];
        $lab_list[]=$scholar['affiliation_id'];
        $content .= '<dd>' . clean_exp($affiliation) . '</dd> ';
    }

    // OLD WAY
    // if ($scholar['lab'] != null) {
    //     $affiliation.=$scholar['lab'] . ', ';
    //     $lab_list[]=$scholar['lab'];
    // }
    // if ($scholar['affiliation'] != null) {
    //     $affiliation.=$scholar['affiliation'];
    //     $orga_list[]=$scholar['affiliation'];
    //
    //     //echo $scholar['affiliation'].'<br/>';
    //
    //     //$lab_query.='OR name="'.$scholar['affiliation'].'" ';
    // }
    // if (($scholar['affiliation'] != null) | ($scholar['lab'] != null)) {
    //     $content .= '<dd>' . clean_exp($affiliation) . '</dd> ';
    // }
    // TODO restore lab vs org ---------------------------------------------8<-----------


    // $affiliation2 = '';
    // if ($scholar['lab2'] != null) {
    //     $affiliation2.=$scholar['lab2'] . ', ';
    //     $lab_list[]=$scholar['lab2'];
    // }
    // if ($scholar['affiliation2'] != null) {
    //     $affiliation2.=$scholar['affiliation2'];
    //     $orga_list[]=$scholar['affiliation2'];
    //     //echo $scholar['affiliation2'].'<br/>';
    // }
    // if (($scholar['affiliation2'] != null) | ($scholar['lab2'] != null)) {
    //     $content .= '<dd><i>Second affiliation: </i>' . clean_exp($affiliation2) . '</dd>';
    // }
    //
    // if ((strcmp($affiliation2, '') != 0) | (strcmp($affiliation, '') != 0)) {
    //     $content .= '<br/>';
    // }

    // $www = '';
    // if (substr($scholar['homepage'], 0, 3) === 'www') {
    //     $www.=' <a href=' . trim(str_replace('&', ' and ', 'http://' . $scholar['homepage'])) . ' target=blank > ' . trim(str_replace('&', ' and ', 'http://' . $scholar['homepage'])) . '  </a ><br/>';
    // } elseif (substr($scholar['homepage'], 0, 4) === 'http') {
    //     $www.=' <a href=' . trim(str_replace('&', ' and ', $scholar['homepage'])) . ' target=blank > ' . trim(str_replace('&', ' and ', $scholar['homepage'])) . ' </a ><br/>';
    // }
    //
    // if (strcmp($www, '') != 0) {
    //     $content .= '<dd><i class="icon-home"></i>' . $www . '</dd> ';
    // }
    //
    // if ($scholar['css_member'] === 'Yes') {
    //     if ($scholar['css_voter'] === 'Yes') {
    //         $content .= '<dd><i class="icon-user"></i> CSS Voting Member</dd> ';
    //     } else {
    //         $content .= '<dd><i class="icon-user"></i> CSS Member</dd> ';
    //     }
    // }

   //TODO restore difference lab // affiliation
    // if (($scholar['position'] != null)||($scholar['lab'] != null)||($scholar['affiliation'] != null)) {
    if (($scholar['position'] != null)||($scholar['affiliation'] != null)) {
       $content .= '</dl>';
    }


    $content .= '</div>';


    if ($scholar['interests'] != null) {
        $content .= '<div>';
        $content .= '<h4>Research</h4>';
        $content .= '<p>' . str_replace('%%%', '<br/>', $scholar['interests']) . '</p>';
        $content .= '</div>';
    }

    $content .= '</div>';


    if ($scholar['keywords'] != null) {
    // TODO change strategy : add email, check if we want to keep phone
    // if (($scholar['keywords'] != null) || ($scholar['address'] != null) || ($scholar['phone'] != null)) {
        $content .= '<div class="span3" align="justify">';

        if ($scholar['keywords'] != null){
                 $content .= '<i class="icon-tags"></i> ' . clean_exp($scholar['keywords']). '.<br/><br/>';
        }

        // if ($scholar['address'] != null) {
        //     $content .= '<address><i class="icon-envelope"></i> ' . $scholar['address'] . '<br/>' . $scholar['city'] . '<br/>' . $scholar['postal_code'] . '<br/></address>';
        // }
        //
        //
        // if ($scholar['phone'] != null) {
        //     $content .= '<address><strong>Phone</strong>: '.$scholar['phone'] . '<br/>';
        //     if ($scholar['mobile'] != null) {
        //         $content .='<strong>Mobile</strong>: '.$scholar['mobile']. '<br/>';
        //     }
        //     if ($scholar['fax'] != null) {
        //         $content .='<strong>Fax</strong>: '.$scholar['fax'] . '<br/>';
        //     }
        // }

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
$labs = array();
sort($lab_list);

foreach ($lab_list as $affid) {
    // debug
    // var_dump($affid);

    // old way
    // $sql = 'SELECT * FROM affiliations where team_lab="' . $name . '" OR acronym="' . $name . '"';
    $sql = 'SELECT * FROM affiliations WHERE affid=' . $affid ;
    //echo $sql.'<br/>';
    foreach ($base->query($sql) as $row) {
        $info = array();
        $info['unique_id'] = $row['affid'];
        $info['name'] = $row['team_lab'];
        $info['organization'] = $row['org'];

        // TODO RESTORE more lab-related infos
        //              (here and its effects in labs_list.php)


        $info['acronym'] = $row['acronym'] ?? '';
        $info['homepage'] = $row['homepage'] ?? '';
        $info['country'] = $row['country'] ?? '';



        // $info['keywords'] = $row['keywords'];
        // $info['address'] = $row['address'];
        // $info['organization2'] = $row['organization2'];
        // $orga_list[] = $row['organization'];
        // $orga_list[] = $row['organization2'];
        // $info['object'] = $row['object'];
        // $info['methods'] = $row['methods'];
        // $info['director'] = $row['director'];
        // $info['admin'] = $row['admin'];
        // $info['phone'] = $row['phone'];
        // $info['fax'] = $row['fax'];
        // $info['login'] = $row['login'];
        //print_r($info);
        $labs[$row['affid']] = $info;
    }
}

// print_r($labs);



//////////////////////////
// liste des organizations ////////
//////////////////////////

// debug
// $content .= var_dump($orga_list) ;
//
// $organiz = array();
// sort($orga_list);
// foreach ($orga_list as $name) {
//     if ((trim($name))!=NULL){
//     $sql = "SELECT * FROM affiliations WHERE org='" . $name. "'";
//
//     $temp=true;
//     foreach ($base->query($sql) as $row) {
//         if ($temp){
//         $info = array();
//         $info['unique_id'] = $row['affid'];
//         $info['name'] = $row['org'];
//         // TODO RESTORE
//         // $info['acronym'] = $row['acronym'];
//         // $info['homepage'] = $row['homepage'];
//         // $info['keywords'] = $row['keywords'];
//         // $info['country'] = $row['country'];
//         // $info['street'] = $row['street'];
//         // $info['city'] = $row['city'];
//         // $info['state'] = $row['state'];
//         // $info['postal_code'] = $row['postal_code'];
//         // $info['fields'] = $row['fields'];
//         // $info['admin'] = $row['admin'];
//         // $info['phone'] = $row['phone'];
//         // $info['fax'] = $row['fax'];
//         // $info['login'] = $row['login'];
//         $organiz[$row['affid']] = $info;
//         $temp=false;
//         }
//     }
//     }
//
// }
//



///////Ajout des labs
$content .='<br/> <A NAME="labs"> </A>
<h1>Labs by alphabetical order</h1>
<p><i>List of labs to which scholars are affiliated</i></p>';

// TODO RESTORE
include('labs_list.php');


// // TODO change strategy: now commented because is fully duplicate of labs_list
//////////////////////////
// liste des orga ////////
//////////////////////////
// $content .= '<br/> <A NAME="orga"> </A>
// <h1>Organizations by alphabetical order</h1>
// <br/>
// <p><i>List of organizations to which scholars are affiliated</i></p>';
// include('orga_list.php');

/// ajout des organisations

    //    $query = "CREATE TABLE organizations (id integer,name text,acronym text,homepage text,
    //keywords text,country text,street text,city text,state text,postal_code text,fields text, director text,
    //admin text, phone text,fax text,login text)";


?>
