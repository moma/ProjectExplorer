<?php

/* liste de parametres */

$min_num_friends=0;// nombre minimal de voisin que doit avoir un scholar pour être affiché
// $compress='No';

/* parametres externes: nom de l'hôte SQL*/
$params = parse_ini_file("parametres_comex.ini");

/* tout pour le MySQL */
$host =  $params['SQL_HOST'];
$db   = 'comex_shared';
$user = 'root';
$pass = 'very-safe-pass';
$charset = 'utf8';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$opt = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];
?>
