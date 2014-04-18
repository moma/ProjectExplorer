<?php
// manage the dynamical additional information in the left panel.
include('parameters_details.php');

// info_div should extract the info from *data.db
// if the rock proj has this in rule, we'll remove this "exception"
$isAdeme=$_SERVER["SCRIPT_FILENAME"];
//if (strpos($isAdeme, 'ademe') !== false) $base = new PDO("sqlite:" .$mainpath.$datadb);
//else $base = new PDO("sqlite:" .$mainpath.$graphdb);
$base = new PDO("sqlite:" .$mainpath.$graphdb);

include('default_div.php');
?>
