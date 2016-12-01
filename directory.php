<?php 

include ("parametres.php");

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
    </head>
    <body>
        <script type="text/javascript" src="js/whoswho.js"></script>
    <div class="container-fluid">
        
        <!-- Main hero unit for a primary marketing message or call to action -->
        <div class="hero-unit">
            ';


$base = new PDO("sqlite:" . $dbname);
$termsMatrix = array(); // liste des termes présents chez les scholars avec leurs cooc avec les autres termes
$scholarsMatrix = array(); // liste des scholars avec leurs cooc avec les autres termes
$scholarsIncluded = 0;

//This directory presents the profiles of scholars and organizations in
//the field of Complex Systems edited by the Complex Systems Registry.
//It is supported by the <i>Complex Systems
//Society</i> (<a href="http://cssociety.org">http://cssociety.org</a>) and the
//<i>Complex Systems Institute of Paris Ile-de-France</i> (<a href="http://iscpif.fr">http://iscpif.fr</a>). 
//Its aims are to foster interactions 
//between protagonists in the fields of Complex Systems science and Complexity
//science,   as well as  to increase their visibility at the international scale.

$filters="";

// liste des chercheurs
$sql = "SELECT * FROM scholars ".$filters.' ORDER BY last_name';
$scholars = array();
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

// liste des labs
$sql = "SELECT * FROM labs ".$filters.' ORDER BY organization,name';;

$labs = array();
foreach ($base->query($sql) as $row) {
    $info = array();
    $info['unique_id'] = $row['id'];
    $info['name'] = $row['name'];
    $info['acronym'] = $row['acronym'];
    $info['homepage'] = $row['homepage'];
    $info['keywords'] = $row['keywords'];
    $info['country'] = $row['country'];
    $info['address'] = $row['address'];  
    $info['organization'] = $row['organization'];
    $info['organization2'] = $row['organization2'];
    $info['object'] = $row['object'];
    $info['methods'] = $row['methods'];
    $info['director'] = $row['director'];
    $info['admin'] = $row['admin'];
    $info['phone'] = $row['phone'];
    $info['fax'] = $row['fax'];
    $info['login'] = $row['login'];    
    $labs[$row['id']] = $info;
}



$imsize = 150;

$content='';
// ajout des scholars
foreach ($scholars as $scholar) {

    $content.= '<div class="row">
                <div class="span12">                    
                    <div class="row">           
                        <div class="span9" align="justify">';
    $content .= '<div>';
    if ($scholar['photo_url'] != null) {
        $content .= '<img style="margin: 7px 10px 10px 0px" src="http://main.csregistry.org/' . $scholar['photo_url'] . '" width="' . $imsize . 'px" align="left">';
    }

    $content .= '<h2 >' . $scholar['title'] . ' ' . $scholar['first_name'] . ' ' . $scholar['initials'] . ' ' . $scholar['last_name'] .
            ' <small> - ' . $scholar['country'] . '</small></h2>';


    if (($scholar['position'] != null)||($scholar['lab'] != null)||($scholar['affiliation'] != null)) {
       $content .= '<dl>';
    }
    
    if ($scholar['position'] != null) {
  
    $content .= '<dt>' . $scholar['position'] . '</dt>';
    }
    $affiliation = '';
    if ($scholar['lab'] != null) {
        $affiliation.=$scholar['lab'] . ',';
    }
    if ($scholar['affiliation'] != null) {
        $affiliation.=$scholar['affiliation'];
    }
    if (($scholar['affiliation'] != null) | ($scholar['lab'] != null)) {
        $content .= '<dd>' . $affiliation . '</dd> ';
    }


    $affiliation2 = '';
    if ($scholar['lab2'] != null) {
        $affiliation2.=$scholar['lab2'] . ',';
    }
    if ($scholar['affiliation2'] != null) {
        $affiliation2.=$scholar['affiliation2'];
    }
    if (($scholar['affiliation2'] != null) | ($scholar['lab2'] != null)) {
        $content .= '<dd><i>Second affiliation: </i>' . $affiliation2 . '</dd>';
    }

    if ((strcmp($affiliation2, '') != 0) | (strcmp($affiliation, '') != 0)) {
        $content .= '<br/>';
    }

    $www = '';
    if (substr($scholar['homepage'], 0, 3) === 'www') {
        $www.=' <a href=' . trim(str_replace('&', ' and ', 'http://' . $scholar['homepage'])) . ' target=blank > ' . trim(str_replace('&', ' and ', 'http://' . $scholar['homepage'])) . '  </a ><br/>';
    } elseif (substr($scholar['homepage'], 0, 4) === 'http') {
        $www.=' <a href=' . trim(str_replace('&', ' and ', $scholar['homepage'])) . ' target=blank > ' . trim(str_replace('&', ' and ', $scholar['homepage'])) . ' </a ><br/>';
    }

    if (strcmp($www, '') != 0) {
        $content .= '<dd><i class="icon-home"></i>' . $www . '</dd> ';
    }

    if ($scholar['css_member'] === 'Yes') {
        if ($scholar['css_voter'] === 'Yes') {
            $content .= '<dd><i class="icon-user"></i> CSS Member premium</dd> ';
        } else {
            $content .= '<dd><i class="icon-user"></i> CSS Member</dd> ';
        }
        $scholar_desc.='<b>CSS Member </b>';
    }

   if (($scholar['position'] != null)||($scholar['lab'] != null)||($scholar['affiliation'] != null)) {
       $content .= '</dl>';
    }
    

    $content .= '</div>';


    if ($scholar['interests'] != null) {
        $content .= '<div>';
        $content .= '<h4>Research</h4>';
        $content .= '<p>' . $scholar['interests'] . '</p>';
        $content .= '</div>';
    }

    $content .= '</div>';

    if (($scholar['keywords'] != null) || ($scholar['address'] != null) || ($scholar['phone'] != null)) {
        $content .= '<div class="span3" align="justify">';
        
        if ($scholar['keywords'] != null){
                 $content .= '<i class="icon-tags"></i> ' . $scholar['keywords']. '<br/><br/>';
        }
            
        if ($scholar['address'] != null) {
            $content .= '<address><i class="icon-envelope"></i> ' . $scholar['address'] . '<br/>' . $scholar['city'] . '<br/>' . $scholar['postal_code'] . '<br/></address>';
        }


        if ($scholar['phone'] != null) {
            $content .= '<address><strong>Phone</strong>: '.$scholar['phone'] . '<br/>';
            if ($scholar['mobile'] != null) {
                $content .='<strong>Mobile</strong>: '.$scholar['mobile']. '<br/>';
            }
            if ($scholar['fax'] != null) {
                $content .='<strong>Fax</strong>: '.$scholar['fax'] . '<br/>';
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

///////Ajout des labs
$content .='<br/>
<br/> <A NAME="labs"> </A>
<h1>Labs by alphabetical order</h1>
<br/>
<br/>';


foreach ($labs as $lab) {

    $content.= '<div class="row">
                <div class="span12">                    
                    <div class="row">           
                        <div class="span9" align="justify">';
    $content .= '<div>';
    
    $content .= '<h2 >' . $lab['name'];
    if ($lab['acronym'] != null){
        $content.=' ('.$lab['acronym'].')';
    } 
    $content.=' <small> - ' . $lab['country'] . '</small></h2>';


    $www = '';
    if (substr($lab['homepage'], 0, 3) === 'www') {
        $www.=' <a href=' . trim(str_replace('&', ' and ', 'http://' . $lab['homepage'])) . ' target=blank > ' . trim(str_replace('&', ' and ', 'http://' . $lab['homepage'])) . '  </a ><br/>';
    } elseif (substr($lab['homepage'], 0, 4) === 'http') {
        $www.=' <a href=' . trim(str_replace('&', ' and ', $lab['homepage'])) . ' target=blank > ' . trim(str_replace('&', ' and ', $lab['homepage'])) . ' </a ><br/>';
    }

    if (strcmp($www, '') != 0) {
        $content .= '<dl><dd><i class="icon-home"></i>' . $www . '</dd></dl> ';
    }
    
    if ($lab['organization'] != null) {
        $content .= '<dl>
        <dt>Institutions:</dt>';
    }


    if (($lab['organization'] != null)) {
        $content .= '<dd>' . $lab['organization'] . '</dd> ';
    }
    if (($lab['organization2'] != null)) {
        $content .= '<dd>' . $lab['organization2'] . '</dd> ';
    }

    if (($lab['organization2'] != null) || ($lab['organization2'] != null)) {
        $content .= '<br/>';
    }



    if ($lab['organization'] != null) {
        $content .= '</dl>';
    }

    $content .= '</div>';


    if ((trim($lab['object']) != null) || ($lab['methods'] != null)) {
        $content .= '<div><p>';
        if (trim($lab['methods']) != null) {
            $content .= '<b>Methods: </b> ' . clean_exp($lab['methods']) . '<br/><br/>';
        }

        if (trim($lab['object']) != null) {
            $content .= '<b>Objects: </b> ' . clean_exp($lab['object']) . '<br/><br/>';
        }
        $content .= '</p></div>';
    }
    if ($lab['director'] != null) {
        $content .= '<div>';
        $content .= $content .= '<i class="icon-user"></i>  ' . $lab['director'] . '<br/><br/>';
        $content .= '</div>';
    }
    $content .= '</div>';

    if (($lab['keywords'] != null) || ($lab['address'] != null) || ($lab['phone'] != null)) {
        $content .= '<div class="span3" align="justify">';

        if ($lab['keywords'] != null) {

            $content .= '<i class="icon-tags"></i> ' . $lab['keywords'] . '<br/><br/>';
        }



        if ($lab['admin'] != null) {
            $content .= '<address><i class="icon-info-sign"></i> Administrative contact: ' . ucwords($lab['admin']) . '<br/></address>';
        }
        if ($lab['address'] != null) {
            $content .= '<address><i class="icon-envelope"></i> ' . $lab['address'] . '<br/></address>';
        }


        if (($lab['phone'] != null)||($lab['fax'] != null)) {
            $content .= '<address><strong>Phone</strong>: '.$lab['phone'] . '<br/>';
            if ($lab['fax'] != null) {
                $content .='<strong>Fax</strong>: '.$lab['fax'] . '<br/>';
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
    <div class="span13" align="justify">
<img src="img/RegistryBanner.png" align="center">
<br/><br/>
<h1>Complex Systems Scholars</h1>
<br/>
<br/>
<p>
This directory presents the profiles of <a href="#scholars">'.  count($scholars).' scholars</a> and <a href="#labs">'.  count($labs).' labs</a> in
the field of Complex Systems.
 
Its aims are to foster interactions 
between protagonists in the fields of Complex Systems science and Complexity
science,   as well as  to increase their visibility at the international scale.
    
<ul>
<li><b><i>This directory is open</i></b>. Anybody can have her profile included
provided it is related to Complex Systems science and Complexity science. Personal data are given on a
voluntary basis and people are responsible for the validity and integrity of their data. To add your profile in this directory
visite the <a href="http://main.csregistry.org/tiki-index.php?page=whoswhodata">complex systems registry</a>.
<li><i><b>This directory is browsable online</b> on the website of the complex systems society :</i> http://csbrowser.cssociety.org
</ul> 
</p>

<p>
This directory is edited by the Complex Systems Registry. This initiative is supported by the <i>Complex Systems
Society</i> (<a href="http://cssociety.org">http://cssociety.org</a>).
</p>
<br/>
<p>Contributions and ideas are welcome to improve this directory. Please feedback at :<br/>
<a href="http://css.csregistry.org/whoswho+feedback">http://css.csregistry.org/whoswho+feedback</a></p>
<br/>
<br/>
<br/> <A NAME="scholars"> </A>
<h2>Scholars by alphabetical order</h2>
<br/>
<br/>
</div>
</div>';


echo $meta;
echo $header;
echo $content;

function clean_exp($string){
    // enlève les comma trainantes
    if (strcmp(substr(trim($string),strlen($string)-1,strlen($string)),',')==0){
        return substr(trim($string),0,  strlen($string)-1);
    }else{
        return $string;
    }
}
?>