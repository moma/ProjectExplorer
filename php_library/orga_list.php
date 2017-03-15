<?php



$content .='<br/>

<br/>
<br/>';

$orga_count = 0;

// debug
$content .= var_dump($organiz) ;

foreach ($organiz as $orga) {

    if ($loop % 100){
        set_time_limit(20);
    }
    $loop+=1;
    if ($orga['name'] != null) {
        $orga_count+=1;
        $content.= '<div class="row">
                <div class="span12">
                    <div class="row">
                        <div class="span9" align="justify">';
        $content .= '<div>';

        // unique anchor
        $content .= '<a name="org-'.$orga['unique_id'].'"></a>';


        // title
        $content .= '<h2>' ;
        $has_acro = false ;
        if (strlen($orga['acronym'])) {
            $content .= $orga['acronym'];
            $has_acro = true ;
        }
        if ($orga['name']) {
            if ($has_acro)   $content .= ' <small>(';
            $content .= $orga['name'];
            if ($has_acro)   $content .= ')</small>';
        }

        if ($orga['locname'] != null) {
            $content.=' <small> - ' . $orga['locname'] . '</small>';
        }

    $www = org_info_to_search_link($orga);
    $content .= '<a href="'.$www.'"><i class="icon-search"></i></a>';

    $content.="</h2>";

        $www = '';
        if (array_key_exists('homepage', $lab) && strlen($lab['homepage'])) {
            $www = homepage_to_alink($lab['homepage']);

            $content .= '<dl><dd><span class="glyphicon glyphicon-home"></span>'.$www.'</dd></dl>';
        }


        $content .= '</div>';


        if ((trim($orga['fields']) != null)) {
            $content .= '<div><p>';
            //echo $orga['fields'].'<br/>';
            $fields=trim(str_replace('Other','',clean_exp($orga['fields'])));

            if (strcmp(',', substr($fields,-1,1))==0){
                $fields=substr($fields,0,-1);
            }
            $fields=str_replace('%%%', ', ',$fields);
            $content .= '<i>Fields: </i> ' . str_replace(", , ", ", ", $fields). '.<br/><br/>';

            $content .= '</p></div>';
        }
        $content .= '</div>';

        if (($orga['keywords'] != null) || ($orga['admin'] != null)) {
            $content .= '<div class="span3" align="justify">';

            if ($orga['keywords'] != null) {

                $content .= '<i class="icon-tags"></i> ' . $orga['keywords'] . '<br/><br/>';
            }

            if ($orga['admin'] != null) {
                $content .= '<address><i class="icon-info-sign"></i> Administrative contact: ' . ucwords($orga['admin']) . '<br/></address>';
            }
            $content .= '</div>';
        }

        $content .= '</div>';

        $content .= '</div>';
        $content .= '</div>';

        $content .= '
<center><img src="static/img/bar.png"></center>';
        $content .= '<br/>';
        $content .= '<br/>';
        // fin du profil
    }
}
?>
