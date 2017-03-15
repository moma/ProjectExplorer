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

    $content .= '<h2 >';
    $www = org_info_to_search_link($lab);
    $content .= '<a href="'.$www.'"><i class="icon-search"></i></a>&nbsp;';
    $content .= $lab['name'];
    if (strlen($lab['acronym'])){
        $content.=' (<b>'.$lab['acronym'].'</b>)';
    }

    if ($lab['locname'] != null) {
        $content.=' <span style="color:grey"><small> - ' . $lab['locname'] . '<small></span>';
    }

    $content.="</h2>";

    // var_dump($lab);

    $www = '';
    if (array_key_exists('homepage', $lab) && strlen($lab['homepage'])) {
        $www = homepage_to_alink($lab['homepage']);
        $content .= '<dl><dd><i class="icon-home"></i>'.$www.'</dd></dl>';
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
        $content .= '<br><h4 title="Frequently related institutions">Institutions:</h4>';
        $content .= '<ul>';

        // $content .= "<p>".$n_related_insts."</p>";

        foreach ($lab['related_insts'] as $rel_inst_id) {
            $content .= '<li class="parent-org"><a href="#org-'.$rel_inst_id.'">';
            $rel_inst_info = $organiz[$rel_inst_id];

            $has_acro = false ;
            if (strlen($rel_inst_info['acronym'])) {
                $content .= $rel_inst_info['acronym'];
                $has_acro = true ;
            } else {
                $content .= $rel_inst_info['name'];
            }
            $content .= '</a>';

            $content .= "</li>";

            // $content .= '<dd class="parent-org">' . ['label'] . '</dd> ';
        }

        $content .= '</ul>';
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
