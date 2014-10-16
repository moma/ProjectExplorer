<?php
// Common parameters for all function proposing insight into the corpora
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
//$dbname=$db[0];//getDB($mainpath);//'homework-20750-1-homework-db.db';;
$base = new PDO("sqlite:" .$mainpath.$db);
$max_item_displayed=6;


?>
