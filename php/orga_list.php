<?php

$content .='<br/>

<br/>
<br/>';

$orga_count = 0;
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

        $content .= '<h2 >' . $orga['name'];
        if ($orga['acronym'] != null) {
            $content.=' (' . $orga['acronym'] . ')';
        }
        $content.=' <small> - ' . $orga['country'] . '</small></h2>';


        $www = '';
        if (substr($orga['homepage'], 0, 3) === 'www') {
            $www.=' <a href=' . trim(str_replace('&', ' and ', 'http://' . $orga['homepage'])) . ' target=blank > ' . trim(str_replace('&', ' and ', 'http://' . $orga['homepage'])) . '  </a ><br/>';
        } elseif (substr($orga['homepage'], 0, 4) === 'http') {
            $www.=' <a href=' . trim(str_replace('&', ' and ', $orga['homepage'])) . ' target=blank > ' . trim(str_replace('&', ' and ', $orga['homepage'])) . ' </a ><br/>';
        }

        if (strcmp($www, '') != 0) {
            $content .= '<dl><dd><i class="icon-home"></i>' . $www . '</dd></dl> ';
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

        if (($orga['keywords'] != null) || ($orga['address'] != null) || ($orga['phone'] != null)) {
            $content .= '<div class="span3" align="justify">';

            if ($orga['keywords'] != null) {

                $content .= '<i class="icon-tags"></i> ' . $orga['keywords'] . '<br/><br/>';
            }



            if ($orga['admin'] != null) {
                $content .= '<address><i class="icon-info-sign"></i> Administrative contact: ' . ucwords($orga['admin']) . '<br/></address>';
            }
            if (trim($orga['street']) != null) {
                $address = $orga['street'] . ', ' . $orga['city'] . ', ' . $orga['postal_code'] 
                . ', ' . $orga['state']. ', ' . $orga['country'];
                $address = str_replace(", , , , ", ", ", $address);                
                $address = str_replace(", , , ", ", ", $address);                
                $address = str_replace(", , ", ", ", $address);
                
                $content .= '<address><i class="icon-envelope"></i> ' . $address . '<br/></address>';
            }


            if (($orga['phone'] != null) || ($orga['fax'] != null)) {
                $content .= '<address><strong>Phone</strong>: ' . $orga['phone'] . '<br/>';
                if ($orga['fax'] != null) {
                    $content .='<strong>Fax</strong>: ' . $orga['fax'] . '<br/>';
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
}
?>
