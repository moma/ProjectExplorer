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


// 2 lists for all the scholars' affiliations
// (used for "Lab's by alphabetical order" section)
$all_labs_list=array();
$all_orga_list=array();

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

    // new way: list of org.tostring values
    if (count($scholar['labs'])) {
        $labs_html = implode(
                    '<br>',
                    array_map(
                        clean_exp,
                        array_map(esc_html,
                            array_map(
                                weedout_alt_nulls,
                                $scholar['labs']
                            )
                        )
                    )
                );
        $content .= '<dd class="labs-of-scholar">' ;
        $content .= $labs_html ;
        $content .= '</dd> ';

        // FIXME HERE AND BELOW IN all_orga_list
        // 1 use stat-prep_from_array.$labs_list which is already created before
        // 2 use ID instead of tostring

        foreach ($scholar['labs'] as $lab) {
            $all_labs_list[]=$lab;
        }
    }

    // new way: list of org.tostring values
    if (count($scholar['institutions'])) {
        $institutions_html = implode(
                    '<br>',
                    array_map(
                        clean_exp,
                        array_map(esc_html,
                            $scholar['institutions']
                        )
                    )
                );

        $content .= '<dd class="institutions-of-scholar">' ;
        $content .= $institutions_html ;
        $content .= '</dd> ';

        // foreach ($scholar['insts'] as $inst) {
        //     $all_orga_list[]=$inst;
        // }
    }


    // POSS: url of lab as link, if filled in DB

    if (($scholar['position'] != null)
        ||count($scholar['lab'])
        ||count($scholar['affiliation'])
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
    // TODO change strategy : add email, check if we want to keep phone
    // if (($scholar['keywords'] != null) || ($scholar['address'] != null) || ($scholar['phone'] != null)) {
        $content .= '<div class="span3" align="left">';

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


// £TODO_ORGS needs FIXME about the ids or removal

// $labs = array();
// sort($all_labs_list);
//
// foreach ($all_labs_list as $affid) {
//     // debug
//     // var_dump($affid);
//
//     // old way
//     // $sql = 'SELECT * FROM affiliations where team_lab="' . $name . '" OR acronym="' . $name . '"';
//     $sql = 'SELECT * FROM affiliations WHERE affid=' . $affid ;
//     //echo $sql.'<br/>';
//     foreach ($base->query($sql) as $row) {
//         $info = array();
//         $info['unique_id'] = $row['affid'];
//         $info['name'] = $row['team_lab'];
//         $info['organization'] = $row['org'];
//
//         // TODO RESTORE more lab-related infos
//         //              (here and its effects in labs_list.php)
//
//
//         $info['acronym'] = $row['acronym'] ?? '';
//         $info['homepage'] = $row['homepage'] ?? '';
//         $info['country'] = $row['country'] ?? '';
//
//
//
//         // $info['keywords'] = $row['keywords'];
//         // $info['address'] = $row['address'];
//         // $info['organization2'] = $row['organization2'];
//         // $all_orga_list[] = $row['organization'];
//         // $all_orga_list[] = $row['organization2'];
//         // $info['object'] = $row['object'];
//         // $info['methods'] = $row['methods'];
//         // $info['director'] = $row['director'];
//         // $info['admin'] = $row['admin'];
//         // $info['phone'] = $row['phone'];
//         // $info['fax'] = $row['fax'];
//         // $info['login'] = $row['login'];
//         //print_r($info);
//         $labs[$row['affid']] = $info;
//     }
// }

// print_r($labs);



//////////////////////////
// liste des organizations ////////
//////////////////////////

// debug
// $content .= var_dump($all_orga_list) ;
//
// $organiz = array();
// sort($all_orga_list);
// foreach ($all_orga_list as $name) {
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
// include('labs_list.php');


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
