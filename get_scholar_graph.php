<?php
//header ("Content-Type:text/xml");  

/*
 * Génère le gexf des scholars à partir de la base sqlite
 */
include ("parametres.php");
include ("normalize.php");
//include("../common/library/fonctions_php.php");


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


$scholars = array();
$scholars_colors = array(); // pour dire s'il y a des jobs postés sur ce scholar
$terms_colors = array();// pour dire s'il y a des jobs postés sur ce term



//phpinfo();
$gexf = '<?xml version="1.0" encoding="UTF-8"?>';
//echo $_GET['query']."<br/>";
$login = $_GET['login'];

$base = new PDO("sqlite:" . $dbname);


if ($login) {
    if (sizeof($login) > 0) {
// liste des chercheurs
        $sql = "SELECT keywords_ids FROM scholars where unique_id='" . $login . "'";
        #pt($sql);
        foreach ($base->query($sql) as $row) {
            $keywords_ids = split(',', $row['keywords_ids']);
            $scholar_array = array();
            foreach ($keywords_ids as $keywords_id) {
                $sql2 = "SELECT * FROM scholars2terms where term_id=" . trim($keywords_id);
                #pt($sql2);
                foreach ($base->query($sql2) as $row) {
                    $scholar_array[$row['scholar']] = 1;
                }
            }
        }
        $scholar_list = array_keys($scholar_array);
        foreach ($scholar_list as $scholar_id) {
            $sql = "SELECT * FROM scholars where unique_id='" . $scholar_id . "'";
            foreach ($base->query($sql) as $row) {
                $info = array();
                $info['unique_id'] = $row['unique_id'];
                $info['photo_url'] = $row['photo_url'];
                $info['first_name'] = $row['first_name'];
                $info['initials'] = $row['initials'];
                $info['last_name'] = $row['last_name'];
                $info['nb_keywords'] = $row['nb_keywords'];
                $info['css_voter'] = $row['css_voter'];
                $info['css_member'] = $row['css_member'];
                $info['keywords_ids'] = explode(',', $row['keywords_ids']);
                $info['keywords'] = $row['keywords'];
                //$info['status'] =  $row['status'];
                $info['country'] = $row['country'];
                $info['homepage'] = $row['homepage'];
                $info['lab'] = $row['lab'];
                $info['affiliation'] = $row['affiliation'];
                $info['lab2'] = $row['lab2'];
                $info['affiliation2'] = $row['affiliation2'];
                $info['homepage'] = $row['homepage'];
                $info['title'] = $row['title'];
                $info['position'] = $row['position'];
                $info['job_market'] = $row['job_market'];
                $info['login'] = $row['login'];
                //print_r($row);
                $scholars[$row['unique_id']] = $info;
            }
        }                
    }     
}


////////////

///////////////

// génère le gexf
include('gexf_generator.php');




function pt($string){
    echo $string.'<br/>';
}
function jaccard($occ1,$occ2,$cooc){   
    if (($occ1==0)||($occ2==0)){
        return 0;        
    }else{
        return ($cooc*$cooc/($occ1*$occ2));        
    }
}
    
function scholarlink($term_occurrences,$scholars1_nb_keywords,$scholars2nb_keywords){
    if (($term_occurrences>0)&&($scholars1_nb_keywords>0)&&($scholars2_nb_keywords>0)){
        return 1/log($term_occurrences)*1/log($scholars1_nb_keywords)*1/$scholars2_nb_keywords;    
    }else {
        return 0;
    }
    
    }                      

?>
