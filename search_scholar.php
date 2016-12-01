<?php

/*
 * Génère le gexf des scholars à partir de la base sqlite
 */
include("parametres.php");
//include("../common/library/fonctions_php.php");
include("normalize.php");


$base = new PDO("sqlite:" . $dbname);

$category = trim(strtolower($_GET['category']));
$login = trim(strtolower($_GET['login']));
$q = "%".sanitize_input($login)."%";

//echo "category: ".$category.";";
//echo "login: ".$login.";";
//echo "q: ".$q.";";

$cat = '';
$query = '';
if ($category == 'login') {
  $cat = "unique_id";
  $query = 'unique_id LIKE upper(\''.strtoupper($q).'\')';
} elseif ($category == 'firstname') {
  $cat = "firstname";
  $query = 'first_name LIKE upper(\''.strtoupper($q).'\')';
} elseif ($category == 'lastname') {
  $cat = "lastname";
  $query = 'last_name LIKE upper(\''.strtoupper($q).'\')';
} else {
  echo ("ERROR");
  exit();
}

$filtered = array (
  "yes", "1", "0", "nvgfpmeilym", "no", "mr", "ms", "", " ", "   "
);
function filter_word($value) {
  if ($value == null) return true;
  return ! in_array(strtolower($value),$filtered); 
}

$req = "SELECT unique_id, first_name, last_name,nb_keywords FROM scholars WHERE ".$query." GROUP BY unique_id";
#echo "req: ".$req.";";
$results = array();
$i = 0;
$res = $base->query($req);

foreach ($res as $row) {
  if ($row["nb_keywords"]==0){
      $row["nb_keywords"]=' (no keyword to map)';
  }  else {
      $row["nb_keywords"]='';
  }
  array_push($results,$row);
}

$nbresults = sizeof($results);
$results = array_slice($results,0,20);
$nbresults2 = sizeof($results);
$completion = array(
   "results" => array()
);


foreach($results as $row) {
     array_push($completion["results"], array(
        'id' => $row["unique_id"],
        'term' => $login,
        'firstname' => $row["first_name"],
        'lastname' => $row["last_name"].$row["nb_keywords"],
       'score' => 1,
       
	   // F*** it, I'll put the meta data here...
       'category' => $cat,
   "size" => $nbresults2,
   "total" => $nbresults,
   "remaining" => ($nbresults - $nbresults2)
      ));
}
$i = 0;

echo json_encode($completion);
?>