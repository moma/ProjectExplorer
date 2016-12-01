<?php

$content .='<br/>

<br/>
<br/>';


foreach ($labs as $lab) {
    if ($loop % 100){
        set_time_limit(20);
    }
    $loop+=1;
    $content.= '<div class="row">
                <div class="span12">                    
                    <div class="row">           
                        <div class="span9" align="justify">';
    $content .= '<div>';
    
    $content .= '<h2 >' . $lab['name'];
    if ($lab['acronym'] != null){
        $content.=' ('.$lab['acronym'].')';
    } 
    $content.=' <small> - ' . $lab['country'] . '</small></h2>';


    $www = '';
    if (substr($lab['homepage'], 0, 3) === 'www') {
        $www.=' <a href=' . trim(str_replace('&', ' and ', 'http://' . $lab['homepage'])) . ' target=blank > ' . trim(str_replace('&', ' and ', 'http://' . $lab['homepage'])) . '  </a ><br/>';
    } elseif (substr($lab['homepage'], 0, 4) === 'http') {
        $www.=' <a href=' . trim(str_replace('&', ' and ', $lab['homepage'])) . ' target=blank > ' . trim(str_replace('&', ' and ', $lab['homepage'])) . ' </a ><br/>';
    }

    if (strcmp($www, '') != 0) {
        $content .= '<dl><dd><i class="icon-home"></i>' . $www . '</dd></dl> ';
    }
    
    if ($lab['organization'] != null) {
        $content .= '<dl>
        <dt>Institutions:</dt>';
    }


    if (($lab['organization'] != null)) {
        $content .= '<dd>' . $lab['organization'] . '</dd> ';
    }
    if (($lab['organization2'] != null)) {
        $content .= '<dd>' . $lab['organization2'] . '</dd> ';
    }

    if (($lab['organization2'] != null) || ($lab['organization2'] != null)) {
        $content .= '<br/>';
    }



    if ($lab['organization'] != null) {
        $content .= '</dl>';
    }

    $content .= '</div>';


    if ((trim($lab['object']) != null) || ($lab['methods'] != null)) {
        $content .= '<div><p>';
        if (trim($lab['methods']) != null) {
            $content .= '<b>Methods: </b> ' . str_replace('%%%', ', ',clean_exp($lab['methods'])) . '<br/><br/>';
        }

        if (trim($lab['object']) != null) {
            $content .= '<b>Objects: </b> ' .str_replace('%%%', ', ',clean_exp($lab['object'])) . '<br/><br/>';
        }
        $content .= '</p></div>';
    }
    if ($lab['director'] != null) {
        $content .= '<div>';
        $content .= $content .= '<i class="icon-user"></i>  ' . $lab['director'] . '<br/><br/>';
        $content .= '</div>';
    }
    $content .= '</div>';

    if (($lab['keywords'] != null) || ($lab['address'] != null) || ($lab['phone'] != null)) {
        $content .= '<div class="span3" align="justify">';

        if ($lab['keywords'] != null) {

            $content .= '<i class="icon-tags"></i> ' . $lab['keywords'] . '<br/><br/>';
        }



        if ($lab['admin'] != null) {
            $content .= '<address><i class="icon-info-sign"></i> Administrative contact: ' . ucwords($lab['admin']) . '<br/></address>';
        }
        if ($lab['address'] != null) {
            $content .= '<address><i class="icon-envelope"></i> ' . $lab['address'] . '<br/></address>';
        }


        if (($lab['phone'] != null)||($lab['fax'] != null)) {
            $content .= '<address><strong>Phone</strong>: '.$lab['phone'] . '<br/>';
            if ($lab['fax'] != null) {
                $content .='<strong>Fax</strong>: '.$lab['fax'] . '<br/>';
            }            
        }

        $content .= '</div>';
    }

$content .= '</div>';

    $content .= '</div>';
    $content .= '</div>';
    
    $content .= '
<center><img src="img/bar.png"></center>';
    $content .= '<br/>';
    $content .= '<br/>';
    // fin du profil
}
?>
