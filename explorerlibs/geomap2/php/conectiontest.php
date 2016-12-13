<?php
// Common parameters for all function proposing insight into the corpora
header('Content-Type: application/json');

ini_set('display_errors', 'On');
error_reporting(E_ALL);

$mainpath=dirname(dirname(getcwd()))."/"; // -> /var/www/ademe/data/
$db=json_decode($_GET["db"]);


$dbname="";
foreach($db as $d){
    if (strpos($d, 'graph.db') !== false){
        $db=$d;
        break;
    } 
}
if($mainpath=="//") $mainpath="";
if ( is_array($db) ) $db = $db[0];


echo "[$mainpath] this is the mainpath\n";
echo "[$db] this is the db\n";
echo "sqlite:" .$mainpath.$db."\n";

echo "sqlite:" ."../../community.db";

//$dbname=$db[0];//getDB($mainpath);//'homework-20750-1-homework-db.db';;
$base = new PDO("sqlite:" .$db);

echo "succeed\n";

$max_item_displayed=6;


?>
