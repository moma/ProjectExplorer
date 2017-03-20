<?php

function normalize_position($value) {
   $value = trim(strtolower($value));

   // global normalization
   $value=str_replace('.','', $value);

   // phd
   $value=str_replace('professor', 'prof', $value);
   $value=str_replace('profesor', 'prof', $value);
   $value=str_replace('proffesor', 'prof', $value);

   $value=str_replace('laboratory', ' lab', $value);

   // final normalization
   $value=str_replace('phd student', 'phd', $value);

   $value=str_replace('doctor', 'dr', $value);

   // phd
   $value=str_replace('prof', 'professor', $value);

   $value=str_replace('head of lab', 'head of laboratory', $value);

   $value=str_replace('research officer', 'research assistant', $value);
   $value=str_replace('assistant researcher', 'research assistant', $value);

   // final normalization
   $value=str_replace('phd', 'phd student', $value);

   $value=str_replace('dr', 'doctor', $value);

   $value = preg_replace('/\b(\w)/e', 'strtoupper("$1")', $value);

   return $value;
}


function normalize_country($value) {
   $value = trim($value);

   // global normalization
   $value=str_replace('.','', $value);

   return $value;
}

function sanitize_input($value) {
    //$value = mysql_real_escape_string($value);

    //the use of addslashes() for string escaping in MySQL queries can lead to SQL injection
    //through the abuse of multibyte character sets. In his example he relies on addslashes()
    //to convert an invalid multibyte sequence into a valid one, which also has an embedded ' that
    //is not escaped. And in an ironic twist, the function intended to protect against SQL injection
    // is used to actually trigger it.

    // lame security
    $value=str_replace('drop','', $value);
    $value=str_replace('select','', $value);
    $value=str_replace('update','', $value);
    $value=str_replace('delete','', $value);

    $value = addcslashes($value, '%_');
    $value = trim($value);
    $value = htmlspecialchars($value);

    return $value;
}

// for html display of concatenated lists
// to make spaces insides the elements unbreakable
function split_join_keywords_for_html($str_value) {
    $arr = explode(',', $str_value);
    $mod_arr = [];

    foreach ($arr as $kw) {
        $kw = esc_html($kw);
        if (strlen(str_replace(' ', '', $kw))) {
            $mod_kw = str_replace(' ', '&nbsp;', $kw) ;
            array_push($mod_arr, $mod_kw);
        }

    }

    return join(', ', $mod_arr);
}

function shorter_html_label($label) {
    $calibre = 17;
    // shorter label via acro extraction
    // if POSSible: use orgs.toarray to avoid matching
    $matches = array();
    preg_match_all('/^([^(]+\()([^)]+)(\).*)$/U', $label, $matches);
    if (count($matches)) {
        $label = $matches[2][0];
        $lhs = substr($matches[1][0], 0, -1) ;    // rm opening paren
        $rhs = substr($matches[3][0], 1);         // rm closing paren
        $remainder = $lhs.' '.$rhs;
        if (strlen($remainder) > $calibre) {
            $remainder = substr($lhs.' '.$rhs, 0,$calibre-3).'...';
        }
        $label .= ' <span style="font-size:8px">'.$remainder.'</span>';
    }
    else {
        $label = '<span style="font-size:8px">'.substr($label, 0, $calibre.'...').'</span>';
    }
    return $label;
}

?>
