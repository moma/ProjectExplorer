<?php

#header('Content-type: application/json')
include("curlGET.php");
#http://tina.iscpif.fr/explorerjs/php/bridgePyJava.php?unique_id=Carla__Taramasco&it=10
$unique_id = $_GET['unique_id'];
$iterations = $_GET['it'];

$url="http://localhost:8080/getJSON?unique_id=".$unique_id."&it=".$iterations;
$res=remote_get_contents($url);


if(isset($_GET['callback'])) echo $_GET['callback'].'('.$res.')';
else echo $res;
#$object = json_decode($res);
?>
