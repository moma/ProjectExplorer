<?php

/*
 * Common utility functions
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



// prepend scheme to homepage
// NB well-formedness not tested, should be done before recording

function homepage_to_alink($somelinkstr) {
    $www = '';
    if (substr($somelinkstr, 0, 3) === 'www') {
        $www = ' <a href="'.trim('http://'.$somelinkstr).'" target=blank >' ;
        $www .= $somelinkstr ;
        $www .= '</a ><br/>';
    }
    elseif (substr($somelinkstr, 0, 4) === 'http') {
        $www =' <a href="'.$somelinkstr.'" target=blank > ' ;
        $www .= $somelinkstr ;
        $www .= '</a ><br/>';
    }
    return $www ;
}

// search on ISCPIF's local search engine
function web_search($a_query_string, $exact=false) {
    if ($exact) {
        $a_query_string = '"'.$a_query_string.'"' ;
    }
    return 'https://search.iscpif.fr/?q='.urlencode($a_query_string);
}

function org_info_to_search_link ($org_info) {
    $search_elements = array();
    foreach($org_info as $key => $val) {
        if ($key == 'unique_id' || $key == 'admin') {
            continue;
        }
        elseif ($key == 'related_insts' && count($org_info['related_insts'])) {
            // we use only the most frequent one for search context
            $search_elements[] = $org_info['related_insts'][0];
        }
        else {
            // ... and we add all other strings (name, acro, lab_code, loc)
            if ($val && strlen($val) > 3) {
                $search_elements[] = $val;
            }
        }
    }
    // print_r($search_elements) ;
    $www = web_search(implode(', ', $search_elements));
    return $www;
}


// replace '@' and dots to avoid the email being harvested by robots/spiders
function safe_email($email_str) {
    return preg_replace(
            '/\./', '[dot]',
            preg_replace(
                '/@/', '[at]',
                $email_str
            )
          );
}

?>
