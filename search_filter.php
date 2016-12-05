<?php

/*
 * Génère le gexf des scholars à partir de la base mysql
 */
include("parametres.php");
//include("../common/library/fonctions_php.php");
include("normalize.php");


$base = new PDO($dsn, $user, $pass, $opt);

$category = trim(strtolower($_GET['category']));
$term =  trim(strtolower($_GET['term']));
$q = "%".sanitize_input($term)."%";

$cat = '';
$query = '';
if ($category == 'country' || $category == 'countries') {
  $cat = "country";
  $query = 'LIKE upper(\''.strtoupper($q).'\')';
} elseif ($category == 'organization' || $category == 'organizations') {

  // POSSIBLE: `concat(institution, ", ", IFNULL(team_lab, ""))``
  //           (change in $cat here and in print_directory args downstream)
  $cat = 'institution';
  $query = 'LIKE upper(\''.strtoupper($q).'\')';
} elseif ($category == 'keyword' || $category == 'keywords') {
  $cat = "keywords";
  $query = 'LIKE upper(\''.strtoupper($q).'\')';
} elseif ($category == 'tag' || $category == 'tags') {
  $cat = "tags";
  $query = 'LIKE upper(\''.strtoupper($q).'\')';
} elseif ($category == 'labs' || $category == 'laboratories' || $category == 'laboratory') {
  $cat = "team_lab";
  $query = 'LIKE upper(\''.strtoupper($q).'\')';
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

$req = "SELECT ".$cat." AS clef, count(".$cat.") AS value FROM comex_registrations WHERE ".$cat." ".$query." GROUP BY ".$cat." ORDER BY value DESC";
// echo $req;
$results = array();
$i = 0;
foreach ($base->query($req) as $row) {
  $nb = $row['value'];
  if ($cat == "keywords" || $cat == "tags") {
    //echo "in keywords\n";
     $words = explode(",", $row["clef"]);
    foreach ($words as $word) {

    $pos = strpos($word,$term);
    if($pos === false) {
      continue;
    }
    //echo "match found\n";
        //  echo "(".$value." contains ".$term." ?)";
        if (filter_word($word)) {
          if (array_key_exists($word, $results)) {
              $results[ $word ] += intval($nb);
          } else {
              $results[ $word ] = intval($nb);
          }
        }
    }
  } else {
    $word = $row["clef"];
     if ($cat == "country") {
        $word = normalize_country($word);
    }

    if (filter_word($word)) {
        if (array_key_exists($word, $results)) {
            $results[ $word ] += intval($nb);
        } else {
            $results[ $word ] = intval($nb);
        }
    }
   }
}

$nbresults = sizeof($results);
$results = array_slice($results,0,20);
$nbresults2 = sizeof($results);
$completion = array(
   "results" => array()
);


foreach($results as $key => $value) {
     array_push($completion["results"], array(
        'id' => $key,
        'label' => $key,
       // 'value' => $value,
       'score' => $value,

     // F*** it, I'll put the meta data here...
       'category' => $cat,
          "term" => $term,
   "size" => $nbresults2,
   "total" => $nbresults,
   "remaining" => ($nbresults - $nbresults2)
      ));
}
$i = 0;

echo json_encode($completion);
?>
