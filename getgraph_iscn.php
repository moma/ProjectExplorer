<?php
//header ("Content-Type:text/xml");  

/*
 * Génère le gexf des scholars de l'ISCN à partir de la base sqlite
 */
$dbname='community.db';
$min_num_friends=0;
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

//phpinfo();
$gexf = '<?xml version="1.0" encoding="UTF-8"?>';
//echo $_GET['query']."<br/>";
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

$base = new PDO("sqlite:" . $dbname);

$sql = "SELECT * FROM scholars where " . " " . 'tags LIKE upper("%' . strtoupper('#iscn') . '%") ';

#echo "login: ".$login.";";
$scholars = array();
$scholars_colors = array(); // pour dire s'il y a des jobs postés sur ce scholar
$terms_colors = array();// pour dire s'il y a des jobs postés sur ce term

#echo $sql . ";<br/>";
#print_r($data);
#echo "END;";
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
        $info['job_market']=$row['job_market'];        
        $info['login']=$row['login'];
	$scholars[$row['unique_id']] = $info;
}
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
