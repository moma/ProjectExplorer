<?php
// Common parameters for all function proposing insight into the corpora
//$mainpath=dirname(dirname(getcwd()))."/data/"; // -> /var/www/ademe/data/
//$dbname=getDB($mainpath);//'homework-20750-1-homework-db.db';
//$base = new PDO("sqlite:" .$mainpath.$dbname);
//$max_item_displayed=6;

$dbs= $_GET["dbs"];//I receive the databases as json!
$dbs = json_decode($dbs);
$graphdb="";//$dbs[0];// data/pathtodb/the.db
$datadb="";//$dbs[0];// data/pathtodb/the.db
foreach($dbs as $db){
    if (strpos($db, 'graph.db') !== false){
        $graphdb=$db;
    } 
    if (strpos($db, 'data.db') !== false){
        $datadb=$db;
    }
}
//var_dump($dbs);

$mainpath=dirname(dirname(getcwd()))."/"; // -> /var/www/ademe/data/pathtodatabase/and.db
////getDB($mainpath);//'homework-20750-1-homework-db.db';
$max_item_displayed=6;

/*
 * This function gets the first db name in the data folder
 * IT'S NOT SCALABLE! (If you want to use several db's)
 */
function getDB ($directory)  {
    //$results = array();
    $result = "";
    $handler = opendir($directory);
    while ($file = readdir($handler)) {
      if ($file != "." && $file != ".." 
              && 
        ((strpos($file,'.db~'))==false && (strpos($file,'.db'))==true )
              || 
        ((strpos($file,'.sqlite~'))==false && (strpos($file,'.sqlite'))==true)
      ) {
            //$results[] = $file;
            $result = $file;
            break;
      }
    }
    closedir($handler);
    //return $results;
    return $result;
}

?>
