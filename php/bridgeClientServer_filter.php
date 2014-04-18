<?php

#header("Content-Type:application/json");

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


function objectToArray($d) {
    if (is_object($d)) {
        // Gets the properties of the given object
        // with get_object_vars function
        $d = get_object_vars($d);
    }

    if (is_array($d)) {

        // Return array converted to object
        // Using __FUNCTION__ (Magic constant)
        // for recursive call
        ///
        return array_map(__FUNCTION__, $d);
    } else {
        // Return array
        return $d;
    }
}

//phpinfo();
/*$gexf = '<?xml version="1.0" encoding="UTF-8"?>';*/
$query = str_replace( '_char_', '#', $_GET["query"] );
$data = json_decode($query);
$data = objectToArray($data);
$iterations = $_GET['it'];

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

$f = ""; // requête

if ($keywords) {
    if (sizeof($keywords) > 0) {
        $f .= 'AND ';
    }

    foreach ($keywords as $kw) {
        $words = explode(',', $kw);
        $i = 0;
        foreach ($words as $word) {
            $word = sanitize_input(trim(strtolower($word)));
            if ($word == "")
                continue;
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
        $country = sanitize_input(trim($country));
        if ($country == "")
            continue;
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
        if ($lab == "")
            continue;
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
            if ($word == "")
                continue;
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

        if ($org == "")
            continue;

        $f .= 'affiliation LIKE upper("%' . strtoupper($org) . '%") OR affiliation2 LIKE upper("%' . strtoupper($org) . '%") ';
        //'affiliation LIKE "%' . $org . '% OR affiliation2 LIKE "%' . $org . '%"';
        $i++;
    }
    $f .= "  ";
}


//echo(substr($f, 0,3));
// liste des chercheurs
if (substr($f, 0, 3) == 'AND') {
    $f = substr($f, 3, -1);
}

if (strlen($f) > 0) {
    $sql = "SELECT * FROM scholars where " . " " . $f;
} else {
    $sql = "SELECT * FROM scholars";
}

#echo $sql;
include("curlGET.php");
$url="http://localhost:8080/getJSON?query=".urlencode($sql)."&it=".$iterations;
#echo $url;

$res=remote_get_contents($url);
if(isset($_GET['callback'])) echo $_GET['callback'].'('.$res.')';
else echo $res;


?>
