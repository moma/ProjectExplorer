<?php

/*
 * Génère le json des scholars à partir de la base mysql
 */
include("php_library/parametres.php");
include("php_library/normalize.php");


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

  // POSSIBLE: `concat(institution, ", ", IFNULL(team_lab, ""))`
  //           (change in $cat here and in print_directory args downstream)
  $cat = 'org';
  $query = 'LIKE upper(\''.strtoupper($q).'\')';
} elseif ($category == 'keyword' || $category == 'keywords') {
  $cat = "keywords_list";
  $query = 'LIKE upper(\''.strtoupper($q).'\')';
}
elseif ($category == 'tag' || $category == 'tags') {
  $cat = "hashtags_list";
  $query = 'LIKE upper(\''.strtoupper($q).'\')';
}
elseif (v == 'labs' || $category == 'laboratories' || $category == 'laboratory') {
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

// old way
// $req = "SELECT ".$cat." AS clef, count(".$cat.") AS value FROM scholars WHERE ".$cat." ".$query." GROUP BY ".$cat." ORDER BY value DESC";

// TODO differentiate req's target cols earlier: above in "if ($category == X)"
$req = <<<END_QUERY
    SELECT
        {$cat} AS clef,
        count({$cat}) AS value
    FROM (
        SELECT
            -- we create all needed cats for the outer select
            -- ==============================================
            scholars.luid,
            scholars.country,
            affiliations.org,
            affiliations.team_lab,
            GROUP_CONCAT(kwstr) AS keywords_list,
            GROUP_CONCAT(htstr) AS hashtags_list
        FROM scholars
        LEFT JOIN sch_kw
            ON sch_kw.uid = luid
        LEFT JOIN keywords
            ON sch_kw.kwid = keywords.kwid
        LEFT JOIN sch_ht
            ON sch_ht.uid = luid
        LEFT JOIN hashtags
            ON sch_ht.htid = hashtags.htid
        LEFT JOIN affiliations
            ON scholars.affiliation_id = affiliations.affid
        GROUP BY luid
        ) AS full_scholars_info
    WHERE {$cat} {$query}                          -- <== our filter
    GROUP BY $cat
    ORDER BY value DESC ;
END_QUERY;

// echo $req;
$results = array();
$i = 0;
foreach ($base->query($req) as $row) {
  $nb = $row['value'];
  if ($cat == "keywords_list" || $cat == "hashtags_list") {
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
