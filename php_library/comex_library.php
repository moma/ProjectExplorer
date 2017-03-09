<?php

/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

function clean_exp($string){
    // enlève les comma trainantes
    if (strcmp(substr(trim($string),-1),',')==0){
        return substr(trim($string),0,-1);
    }else{
        return $string;
    }
}

function esc_html($string){
    return htmlspecialchars($string,ENT_HTML5, 'UTF-8') ;
}

// -----------------------------8<------------------
// to clean alternative null values during DB transition
// TODO remove when DB finalized and refilled by returning users

// NB The only fields which can have it are lab name and sch position
// (both become mandatory but may not be filled for legacy users)
function weedout_alt_nulls($a_db_string) {
    if (preg_match ('/^_NULL/', $a_db_string)) {
        return null;
    }
    else {
        return $a_db_string;
    }
}
// -----------------------------8<------------------


// NB actually (2016-12) this is unused TODO use !!!
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
