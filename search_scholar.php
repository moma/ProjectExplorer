<?php

/*
 * Génère le gexf des scholars à partir de la base sqlite
 */
include("php_library/parametres.php");
include("php_library/normalize.php");


// ===================== SQL connect =====================
$base = new PDO($dsn, $user, $pass, $opt);
// ==================== /SQL connect =====================



// ==================== new retrieval ======================
$login = trim(strtolower($_GET['login']));
$q = "%".sanitize_input($login)."%";

$query = 'concat(first_name, " ", IFNULL(concat(middle_name, " "),""), last_name) LIKE "%'.$q.'%"';

$status_constraint = "(record_status = 'active' OR (record_status = 'legacy' AND valid_date >= NOW()))";

$req = "SELECT luid, first_name, middle_name, last_name FROM scholars WHERE ".$query." AND ".$status_constraint." GROUP BY luid";
// echo "req: ".$req.";";
$results = array();
$i = 0;
$res = $base->query($req);

$completion = array(
   "results" => array(),
   "query" => $login
);

foreach($res as $row) {
     array_push($completion["results"], array(
        'id' => $row["luid"],
        'term' => $login,
        'firstname' => $row["first_name"],
        'lastname' => $row["last_name"],
      ));
}
// ==================== /new retrieval =====================


echo json_encode($completion);
?>
