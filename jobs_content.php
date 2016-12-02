<?php
// calcul les différents profils à partir d'une requete
// sort un $content 


echo '    
    <body>';
include ("analytics.php");
echo '        <script type="text/javascript" src="js/whoswho.js"></script>
    <div class="container-fluid">
        
        <!-- Main hero unit for a primary marketing message or call to action -->
        <div class="hero-unit">
   ';


$imsize = 150;

$content='';
        



$lab_list=array();
$orga_list=array();

$loop=0; //nombre de boucles
// ajout des scholars

foreach ($jobs as $job) {
    if ($loop % 100){
        set_time_limit(20);
    }
    $loop+=1;
    $content.= '<div class="row">
                <div class="span12">                    
                    <div class="row">           
                        <div class="span9" align="justify">';
    $content .= '<div>';


    $content .= '<h2 >'. ucfirst($job['title']) .
            ' <small> - ' .$job['position'] . '</small></h2>';


    if (($job['country'] != null)||($job['lab'] != null)||($job['affiliation'] != null)) {
       $content .= '<dl>';
    }
    
    if ($job['country'] != null) {
  
    $content .= '<dt>Location: '. '</dt>';
    $content .= '<dd><strong>Country:</strong> ' .  $job['country'] . '</dd>';
    }
    $affiliation = '';
    if ($job['lab'] != null) {
        $content .= '<dd><strong>' . clean_exp('Lab:</strong> '.$job['lab']) . '</dd> ';        
        $lab_list[]=$job['lab'];
    }
    if ($job['organization'] != null) {
        $content .= '<dd><strong>' . clean_exp('Organization:</strong> '.$job['organization']) . '</dd> ';        
        $orga_list[]=$job['organization'];
        
        //echo $job['affiliation'].'<br/>';

        //$lab_query.='OR name="'.$job['affiliation'].'" ';
    }
    if (($job['organization'] != null) | ($job['lab'] != null)) {
        $content .= '<dd>' . clean_exp($affiliation) . '</dd> ';
    }


    $affiliation2 = '';
             

    if ((strcmp($affiliation2, '') != 0) | (strcmp($affiliation, '') != 0)) {
        $content .= '<br/>';
    }

    $www = '';
    if (substr($job['url'], 0, 3) === 'www') {
        $www.=' <a href=' . trim(str_replace('&', ' and ', 'http://' . $job['url'])) . ' target=blank > Link to job offer </a ><br/>';
    } elseif (substr($job['url'], 0, 4) === 'http') {
        $www.=' <a href=' . trim(str_replace('&', ' and ', $job['url'])) . ' target=blank > Link to job offer </a ><br/>';
    }

    if (strcmp($www, '') != 0) {
        $content .= '<dd><i class="icon-home"></i>' . $www . '</dd> ';
    }

  
   if (($job['position'] != null)||($job['lab'] != null)||($job['affiliation'] != null)) {
       $content .= '</dl>';
    }
    

    $content .= '</div>';
 

    $content .= '</div>';

    if (($job['keywords'] != null) || ($job['address'] != null) || ($job['phone'] != null)) {
        $content .= '<div class="span3" align="justify">';
        
        if ($job['keywords'] != null){
                 $content .= '<i class="icon-tags"></i> ' . clean_exp($job['keywords']). '.<br/><br/>';  
        }
          
        if ($job['deadline'] != null) {
            $content .= '<address><i class="icon-calendar"></i><br/> <strong>Deadline: </strong>' . $job['deadline'] . '<br/>';
            
            if ($job['start_date'] != null) {
            $content .= '</i><strong>Start date:</strong> ' . $job['start_date'] . '<br/>';
        }
        $content .= '</address>';
        }
        
        


        if ($job['phone'] != null) {
            $content .= '<address><strong>Phone</strong>: '.$job['phone'] . '<br/>';
            if ($job['mobile'] != null) {
                $content .='<strong>Mobile</strong>: '.$job['mobile']. '<br/>';
            }
            if ($job['fax'] != null) {
                $content .='<strong>Fax</strong>: '.$job['fax'] . '<br/>';
            }            
        }

        $content .= '</div>';
    }   
$content .= '</div>';

    $content .= '</div>';
    $content .= '</div>';
    
    $content .= '
<center><img src="img/bar.png"></center>';
    $content .= '<br/>';
    $content .= '<br/>';
    // fin du profil
}


if (strcmp(substr($lab_query, 0,2),'OR')==0){
    $lab_query=substr($lab_query,2);
}

if (strcmp(substr($orga_query, 0,2),'OR')==0){
    $orga_query=substr($orga_query,2);
}

//////////////////////////
// liste des labs ////////
//////////////////////////
$labs = array();
sort($lab_list);
foreach ($lab_list as $name) {
    if ((trim($name)) != NULL) {
        $sql = "SELECT * FROM labs where name='" . $name . "' OR acronym='" . $name . "'";
        foreach ($base->query($sql) as $row) {
            $info = array();
            $info['unique_id'] = $row['id'];
            $info['name'] = $row['name'];
            $info['acronym'] = $row['acronym'];
            $info['url'] = $row['url'];
            $info['keywords'] = $row['keywords'];
            $info['country'] = $row['country'];
            $info['address'] = $row['address'];
            $info['organization'] = $row['organization'];
            $info['organization2'] = $row['organization2'];
            $orga_list[] = $row['organization'];
            $orga_list[] = $row['organization2'];
            $info['object'] = $row['object'];
            $info['methods'] = $row['methods'];
            $info['director'] = $row['director'];
            $info['admin'] = $row['admin'];
            $info['phone'] = $row['phone'];
            $info['fax'] = $row['fax'];
            $info['login'] = $row['login'];
            $labs[$row['id']] = $info;
        }
    }
}





//////////////////////////
// liste des organizations ////////
//////////////////////////
$organiz = array();
sort($orga_list);
foreach ($orga_list as $name) {
    if ((trim($name))!=NULL){
    $sql = "SELECT * FROM organizations where name='" . $name. "' OR acronym='".$name."'";

    $temp=true;
    foreach ($base->query($sql) as $row) {
        if ($temp){
        $info = array();
        $info['unique_id'] = $row['id'];
        $info['name'] = $row['name'];
        $info['acronym'] = $row['acronym'];
        $info['url'] = $row['url'];
        $info['keywords'] = $row['keywords'];
        $info['country'] = $row['country'];
        $info['street'] = $row['street'];
        $info['city'] = $row['city'];
        $info['state'] = $row['state'];
        $info['postal_code'] = $row['postal_code'];
        $info['fields'] = $row['fields'];
        $info['admin'] = $row['admin'];
        $info['phone'] = $row['phone'];
        $info['fax'] = $row['fax'];
        $info['login'] = $row['login'];
        $organiz[$row['id']] = $info;
        $temp=false;        
        }
    }        
    }

}




///////Ajout des labs
$content .= '<br/> <A NAME="labs"> </A>
<h1>Labs by alphabetical order</h1>
<p><i>List of labs where there is a job opening</i></p>';
include('labs_list.php');


//////////////////////////
// liste des orga ////////
//////////////////////////
$content .= '<br/> <A NAME="orga"> </A>
<h1>Organizations by alphabetical order</h1>
<br/>
<p><i>List of organizations  where there is a job opening</i></p>';
include('orga_list.php');

/// ajout des organisations

    //    $query = "CREATE TABLE organizations (id integer,name text,acronym text,url text,
    //keywords text,country text,street text,city text,state text,postal_code text,fields text, director text,
    //admin text, phone text,fax text,login text)";


?>
