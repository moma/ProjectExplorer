<?php

/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

$a="UMR 1091 INRA/AgroParisTech Environnement et Grandes Cultures, ";

function clean_exp($string){
    // enlève les comma trainantes
    if (strcmp(substr(trim($string),-1),',')==0){
        return substr(trim($string),0,-1);
    }else{
        return $string;
    }
}

function get_value($cle_value,$table='data',$cle='cle',$valeur='valeur'){    
// renvoie la valeur correspondant à la clé $cle dans la table data
   
$sql = 'SELECT '.$valeur.' from '.$table.' WHERE '.$cle.'="'.trim($cle_value).'"';
$resultat=mysql_query($sql);
    while ($ligne=mysql_fetch_array($resultat)) {
        $out=$ligne[$valeur];
        }
return $out;
}   
?>
