<?php

$content .='<br/>

<br/>
<br/>';

$has_acro = false;

foreach ($labs as $lab) {
    if ($loop % 100){
        set_time_limit(20);
    }
    $loop+=1;

    if ($lab['name'] == '_NULL') {
        continue;
    }

    $content.= '<div class="row org-row">
                <div class="span12">
                    <div class="row">
                        <div class="span10" align="justify">';
    $content .= '<div>';

    $content .= '<h2 >';
    $www = org_info_to_search_link($lab);
    $content .= '<a href="'.$www.'"><i class="icon-search"></i></a>&nbsp;';

    if (strlen($lab['acronym'])){
        $has_acro = true;
        $content.= $lab['acronym'];
    }
    // one of either acro or name should always be non null
    else {
        $content .= $lab['name'];
    }

    if ($lab['locname'] != null) {
        $content.=' <span style="color:grey"><small> - ' . $lab['locname'] . '</small></span>';
    }

    if (array_key_exists('lab_code', $lab) && strlen($lab['lab_code'])) {
        $content .= '&nbsp;&nbsp;<small>['.$lab['lab_code'].']</small>';
    }


    $content.="</h2>";

    // var_dump($lab);

    // if acro, full name is below title
    if ($has_acro && $lab['name']) {
        $content .= '<dl><dd>'.$lab['name'].'</dd></dl>';
    }

    $www = '';
    if (array_key_exists('homepage', $lab) && strlen($lab['homepage'])) {
        $www = homepage_to_alink($lab['homepage']);
        $content .= '<dl><dd><i class="icon-home"></i>'.$www.'</dd></dl>';
    }

    $content .= '</div>';
    $content .= '</div>';


    // LABS MORE INFOS: admin (ie contact person),
    //                  keywords (not used but POSS if orgs_kwid map)
    $n_related_insts = count($lab['related_insts']);
    $has_admin = array_key_exists('admin', $lab) && strlen($lab['admin']);
    $has_kws = array_key_exists('keywords', $lab) && strlen($lab['keywords']);
    if ($n_related_insts || $has_admin || $has_kws) {
        $content .= '<div class="span2" align="justify">';
        if ($has_kws) {
            $content .= '<i class="icon-tags"></i> ' . $lab['keywords'] . '<br/><br/>';
        }
        if ($has_admin) {
                $content .= '<address><i class="icon-info-sign"></i> Administrative contact:<br>' . $lab['admin'] . '<br></address>';
        }

        if ($n_related_insts) {
            $content .= '<h4 title="Frequently related institutions">Institutions:</h4>';
            $content .= '<dl style="margin-top:5px;">';

            // $content .= "<p>".$n_related_insts."</p>";

            foreach ($lab['related_insts'] as $rel_inst_id) {
                $content .= '<dd class="parent-org"><a href="#org-'.$rel_inst_id.'">';
                $rel_inst_info = $institutions[$rel_inst_id];

                $has_acro = false ;
                if (strlen($rel_inst_info['acronym'])) {
                    $content .= $rel_inst_info['acronym'];
                    $has_acro = true ;
                } else {
                    $content .= $rel_inst_info['name'];
                }
                $content .= '</a>';
                if (strlen($rel_inst_info['locname'])) {
                    $content .= "<span class='rel-inst-locname'> - ".$rel_inst_info['locname']."</span>";
                }
                // $content .= var_dump($rel_inst_info);
                $content .= "</dd>";

                // $content .= '<dd class="parent-org">' . ['label'] . '</dd> ';
            }

            $content .= '</dl>';
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
