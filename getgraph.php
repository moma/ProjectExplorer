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

//echo 'data '.$data;

//echo json_decode('{ countries: [ "France" ]}');

//$json = '{"a":1,"b":2,"c":3,"d":4,"e":5}';
//pt($json);
//pt(json_decode($json));
//exit();
//$data = json_decode('', true);
//print_r($data);
$categorya = $data["categorya"];
$categoryb = $data["categoryb"];
$countries = $data["countries"];
$keywords = $data["keywords"];
$laboratories = $data["laboratories"];
$organizations = $data["organizations"];
$tags = $data["tags"];

$f = "";// requête
if ($keywords) {
	if (sizeof($keywords) > 0) {
		$f .= 'AND ';
	}

	foreach ($keywords as $kw) {
		$words = explode(',', $kw);
		$i = 0;
		foreach ($words as $word) {
			$word = sanitize_input(trim(strtolower($word)));
			if ($word == "") continue;
			if ($i > 0)
				$f .= " OR ";
			$f .= 'keywords LIKE upper("%' . strtoupper($word) . '%") ';
			$i++;
		}
	}
	$f .= "  ";
}
if ($countries) {

	if (sizeof($countries) > 0) {
		$f .= 'AND ';
	}

	$i = 0;
	foreach ($countries as $country) {
		//$country = sanitize_input(trim(strtolower($country)));
                $country = sanitize_input(trim($country ));
		if ($country == "") continue;
		if ($i > 0)
			$f .= " OR ";
		$f .= 'country = "' . $country . '" ';
		$i++;
	}
	$f .= "  ";
}
if ($laboratories) {

	if (sizeof($laboratories) > 0) {
		$f .= 'AND ';
	}

	$i = 0;
	foreach ($laboratories as $lab) {
		$lab = sanitize_input(trim(strtolower($lab)));
		if ($lab == "") continue;
		if ($i > 0)
			$f .= " OR ";
		$f .= 'lab LIKE upper("%' . strtoupper($lab) . '%") ';
		$i++;
	}
	$f .= "  ";
}

if ($tags) {
	if (sizeof($tags) > 0) {
		$f .= 'AND ';
	}

	foreach ($tags as $kw) {
		$words = explode(',', $kw);
		$i = 0;
		foreach ($words as $word) {
			$word = sanitize_input(trim(strtolower($word)));
			if ($word == "") continue;
			if ($i > 0)
				$f .= " OR ";
			$f .= 'tags LIKE upper("%' . strtoupper($word) . '%") ';
			$i++;
		}
	}
	$f .= "  ";	
}

if ($organizations) {

	if (sizeof($organizations) > 0) {
		$f .= 'AND ';
	}

	$i = 0;
	foreach ($organizations as $org) {
		$org = sanitize_input(trim(strtolower($org)));
		
		if ($org == "") continue;

		$f .= 'affiliation LIKE upper("%' . strtoupper($org) . '%") OR affiliation2 LIKE upper("%' . strtoupper($org) . '%") ';
                //'affiliation LIKE "%' . $org . '% OR affiliation2 LIKE "%' . $org . '%"';
		$i++;
	}
	$f .= "  ";
}


$base = new PDO("sqlite:" . $dbname);



//echo(substr($f, 0,3));
// liste des chercheurs
if (substr($f, 0,3)=='AND'){
    $f=substr($f,3,-1);
}
        
if (strlen($f)>0){
$sql = "SELECT * FROM scholars where " . " " . $f;
}else{
    $sql = "SELECT * FROM scholars";
}

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
