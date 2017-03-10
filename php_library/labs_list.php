<?php

$content .='<br/>

<br/>
<br/>';


foreach ($labs as $lab) {
    if ($loop % 100){
        set_time_limit(20);
    }
    $loop+=1;

    if ($lab['name'] == '_NULL') {
        continue;
    }

    $content.= '<div class="row">
                <div class="span12">
                    <div class="row">
                        <div class="span9" align="justify">';
    $content .= '<div>';

    $content .= '<h2 >' . $lab['name'];
    if (strlen($lab['acronym'])){
        $content.=' (<b>'.$lab['acronym'].'</b>)';
    }
    $content.=' <small> - ' . $lab['locname'] . '</small></h2>';

    // var_dump($lab);

    $www = '';
    if (array_key_exists('homepage', $lab) && strlen($lab['homepage'])) {
        $www = homepage_to_alink($lab['homepage']);
        $content .= '<dl><dd><i class="icon-home"></i>'.$www.'</dd></dl>';
    }
    else {
        $search_elements = array();
        foreach($lab as $key => $val) {
            if ($key == 'unique_id' || $key == 'admin') {
                continue;
            }
            elseif ($key == 'related_insts' && count($lab['related_insts'])) {
                // we use only the most frequent one for search context
                $search_elements[] = $lab['related_insts'][0];
            }
            else {
                // ... and we add all other strings (name, acro, lab_code, loc)
                if ($val && strlen($val) > 2) {
                    $search_elements[] = $val;
                }
            }
        }
        // print_r($search_elements) ;
        $www = web_search(implode(', ', $search_elements));

        // print_r($www);

        $content .= '<dl><dd><a href="'.$www.'"><small>search</small></a><i class="icon-search"></i></dd></dl>';
    }

    $lab_code = '';
    if (array_key_exists('lab_code', $lab) && strlen($lab['lab_code'])) {
        $exact_search = 'https://search.iscpif.fr/?q='.urlencode('"'.$lab['lab_code'].'"');
        $content .= '<dl><dd><i class="icon-flag"></i>' ;
        $content .= '<a href="'.web_search($lab['lab_code'], true).'">';
        $content .= $lab['lab_code'].'</a></dd></dl>';
    }

    $n_related_insts = count($lab['related_insts']);
    if ($n_related_insts) {
        $content .= '<dl>
        <dt>Institutions:</dt>';

        foreach ($lab['related_insts'] as $rinstitution) {
            $content .= '<dd class="parent-org">' . $rinstitution . '</dd> ';
        }

        $content .= '</dl>';
    }

    $content .= '</div>';
    $content .= '</div>';


    // LABS MORE INFOS: admin (ie contact person),
    //                  keywords (not used but POSS if orgs_kwid map)

    $has_admin = array_key_exists('admin', $lab) && strlen($lab['admin']);
    $has_kws = array_key_exists('keywords', $lab) && strlen($lab['keywords']);
    if ($has_admin || $has_kws) {
        $content .= '<div class="span3" align="justify">';
        if ($has_kws) {
            $content .= '<i class="icon-tags"></i> ' . $lab['keywords'] . '<br/><br/>';
        }
        if ($has_admin) {
                $content .= '<address><i class="icon-info-sign"></i> Administrative contact:<br>' . $lab['admin'] . '<br></address>';
        }

        $content .= '</div>';
    }
    $content .= '</div></div></div>';

    $content .= '
<center><img src="static/img/bar.png"></center>';
    $content .= '<br/>';
    $content .= '<br/>';
    // fin du profil de labo
}
?>
