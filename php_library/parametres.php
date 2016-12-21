<?php

/* liste de parametres */

$min_num_friends=0;// nombre minimal de voisin que doit avoir un scholar pour être affiché
// $compress='No';

/* reading external param for SQL config
   =====================================

    We attempt in order:
      1 - retrieve SQL_HOST from bash ENV (set by docker-compose or admin)
      2 - otherwise retrieve from INI file (buggy)
      3 - otherwise try 172.17.0.2 (first docker IP)

    POSSIBLE: use same behavior for the other sql vars (port, db, user & pass)
              ...but not absolutely necessary because they seldom change
*/
# 1 - ENV read
$sql_host = getenv("SQL_HOST");

# 2 - INI file read
if (empty($sql_host)) {
    // TODO debug
    $params = parse_ini_file("config/parametres_comex.ini");
    $sql_host = $params['SQL_HOST'] ;
}

# 3 - default val
if (empty($sql_host)) {
    $sql_host = "172.17.0.2" ;
}

# other sql vars
$db   = 'comex_shared';
$user = 'root';
$pass = 'very-safe-pass';
$charset = 'utf8';

/* final MySQL config: will be used for all php db connections */
$dsn = "mysql:host=$sql_host;dbname=$db;charset=$charset";
$opt = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];
?>
