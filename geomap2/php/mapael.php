<?php

header('Content-Type: application/json');
/*
 geomap/php/mapael.php?db=["data/nci/graph.db"]&query=["biomass","fuel","cooperatives","energy use","energy poverty","wind power","clean energy","social business","remote areas","Solar","battery","kerosene lanterns","retailers","lamps","energy production","distribution","grid electricity"]
 */

/*
http://localhost/adasd/geomap2/php/mapael.php?db="php/community.db"&query=["all"]
http://localhost/adasd/geomap2/?db="php/community.db"&query=["all"]
*/
include('parameters_details.php');
include('countries_iso3166.php');


$sql="";
$table="scholars";
$column="norm_country";
$query = str_replace( '__and__', '&', $_GET["query"] );
$query = str_replace( 'D::', '', $query );
$elems = json_decode($query);

$unique_id = "";
$scholar_array = array();



$singularnick= "scholar";
$pluralnick = "scholars";

$selectiveQuery=true;
if(count($elems)==1){
    foreach ($elems as $e){
        if($e=="all") {
            $selectiveQuery=false;
            break;
        }

        if($e=="unique_id") {
            $unique_id = $_GET["unique_id"];

            if($unique_id) {
                $sql = "SELECT keywords_ids FROM scholars where unique_id='" . $unique_id . "'";
                #pt($sql);
                foreach ($base->query($sql) as $row) {
                    $keywords_ids = split(',', $row['keywords_ids']);
                    $scholar_array = array();
                    foreach ($keywords_ids as $keywords_id) {
                        $sql2 = "SELECT * FROM scholars2terms where term_id=" . trim($keywords_id);
                        
                        foreach ($base->query($sql2) as $row) {
                            $sql3 = "SELECT id FROM scholars where term_id=" . trim($keywords_id);
                            $scholar_array[$row['scholar']] = 1;
                        }
                    }
                }                

                $elems = null;
                $elems = array();
                foreach($scholar_array as $key=>$value){
                    
                    array_push($elems, utf8_decode($key));
                }
            }
            break;
        }
    }
}



$norm_country = array();

if($selectiveQuery){
    $countries_temp=array();
    foreach($elems as $e){
        $sql="SELECT ".$column." FROM ".$table." where id=".$e;
        if($unique_id!="")
            $sql="SELECT ".$column." FROM ".$table." where unique_id=\"".$e."\"";
        

        foreach ($base->query($sql) as $row) {
            
            if($countries_temp[$row[$column]]) $countries_temp[$row[$column]]+=1;
            else $countries_temp[$row[$column]]=1;
        }
    }
    arsort($countries_temp);

    foreach ($countries_temp as $key => $value) {
        $code = strtoupper($key);        
        if($CC[$code]){
            $tempcount = 0;
            if ($norm_country[$code]) {
                $norm_country[$code]["value"]+=$value;
                $norm_country[$code]["tooltip"]["content"] = "" ;
            } else {
                $info = array();
                $info["code"] = $code;
                $info["value"] = $value;
                $info["attrs"] = array();
                $info["attrs"]["href"] = "";
                $info["tooltip"] = array();
                $info["tooltip"]["content"] = "";
                $norm_country[$code] = $info;
            }
        }
    }
    $country_divisor=getDivisors($mainpath,$db,$table,$column);
    foreach ($norm_country as $key => $value){            
        if($CC[$key]){
            $finalval=$value["value"]/($country_divisor[$key]+1);
            $info = array();
            $info["code"] = $key;
            $info["value"] = $value["value"];
            $info["floatval"] = $finalval;
            $info["attrs"] = array();
            $info["attrs"]["href"] = "#";
            $info["tooltip"] = array();
            $info["tooltip"]["content"] = "";
            $norm_country[$key] = $info;
        }
    }
    
    $maxzeros=0;
    foreach ($norm_country as $key => $value) {    
        $dafloat="".$value["floatval"];
        $aaa=explode(".", $dafloat);
        $right=$aaa[1];
        $thesize=count($right)+1;

        $zerosCount=0;
        foreach (range(0, $thesize) as $i) {
            if($right[$i]=="0") $zerosCount+=1;
        }
        if($zerosCount>$maxzeros)$maxzeros=$zerosCount;
    }
    $maxzeros+=3;//more zeros, more precision!
    
    $mult=pow(10,$maxzeros);
    $minF=100000.0;
    $maxF=0.0;
    foreach ($norm_country as $key => $value){

            $realOCC=$value["value"];
            $floatVal=$value["floatval"];
            $fakeOCC=ceil($floatVal*$mult);
            $percentage=round(($floatVal*100),2);
            $info = array();
            $info["code"] = $key;
            $info["realValue"] = $realOCC;
            $info["percentage"] = $percentage;
            $info["value"] = $fakeOCC;
            $info["attrs"] = array();
            $info["attrs"]["href"] = "#";
            $info["tooltip"] = array();
            //$info["tooltip"]["content"] = "<span style='font-weight:bold;'>" . $CC[$key] . "</span><br/>" . $realOCC.'  '.$pluralnick.' ('.$info["percentage"].'%)';
            $norm_country[$key] = $info;
            
            if($percentage>$maxF) $maxF=$percentage;
            if($percentage<$minF) $minF=$percentage;
    }
    $fmin=$minF;
    $fmax=100.000000;
    //    pr($fmin);
    //    pr($fmax);
    //    pr($minF);
    //    pr($maxF);
    //    pr("-----");
    //    pr((($fmax-$fmin)/($maxF-$minF))."*");
    //    pr("-----");
    $constant=(($fmax-$fmin)/($maxF));
    foreach ($norm_country as $key => $value){
        $old=$value["percentage"];
        $new=$old*$constant;# da formula!
        $norm_country[$key]["percentage"]=round($new,2);
        $norm_country[$key]["tooltip"]["content"]= "<span style='font-weight:bold;'>" . $CC[$key] . "</span><br/>" . $value["realValue"].'  '.$pluralnick.' ('.round($new,2).'%)';
        //pr($value["code"].": ".$value["realValue"].", ".$value["percentage"].", div:".($country_divisor[$key]+1));
    }
} else {

    //    $column="data";
    $sql = "select count(*),data from ISIkeyword GROUP BY data ORDER BY count(*) DESC";
    $sql = "select count(*),".$column." from scholars GROUP BY country ORDER BY count(*) DESC";

    ////}
    ////$sql="select count(*),data from ISIC1Country GROUP BY data ORDER BY count(*) DESC";//ademe
    //
    foreach ($base->query($sql) as $row) {
        $code = strtoupper($row[$column]);
        $tempcount = 0;
        if ($norm_country[$code]) {
            $norm_country[$code]["value"]+=$row["count(*)"];
            $norm_country[$code]["tooltip"]["content"] = "<span style='font-weight:bold;'>" . $CC[$code] . "</span><br/>" . $norm_country[$code]["value"].' '.$pluralnick;
        } else {
            $info = array();
            $info["code"] = $code;
            $info["value"] = $row["count(*)"];
            $info["attrs"] = array();
            $info["attrs"]["href"] = "#";
            $info["tooltip"] = array();
            $info["tooltip"]["content"] = "<span style='font-weight:bold;'>" . $CC[$code] . "</span><br/>" . $row["count(*)"].' '.$pluralnick;
            $norm_country[$code] = $info;
        }
    }
}

$occToCC = array();
foreach ($norm_country as $c) {
    if (!$occToCC[$c["value"]]) {
        $occToCC[$c["value"]] = array();
    }
    array_push($occToCC[$c["value"]], $c["code"]);
}




krsort($occToCC);
$countries_occ_DESC = array();
foreach ($occToCC as $key => $value) {
    $info = array();
    $info["occ"] = $key;
    $info["countries"] = $value;
    $info["color"] = "";
    array_push($countries_occ_DESC, $info);
}
$min=$countries_occ_DESC[count($countries_occ_DESC)-1]["occ"];
$max=$countries_occ_DESC[0]["occ"];

$colors = array();
include_once("ColourGradient.php");
$nbSteps=count($countries_occ_DESC)-1;
$instance = new ColorGenerator($nbSteps);
$instance->getColours();
$colors=$instance->thecolors;

foreach ($countries_occ_DESC as $key => $value) {
    if ($key < count($colors)) {
        $countries_occ_DESC[$key]["color"] = $colors[min(count($colors), $key)];
    } else $countries_occ_DESC[$key]["color"] = $colors[count($colors) - 1];
}

$temp = $countries_occ_DESC;

$theslices = array();
$thedata = array();
foreach ($temp as $key => $value) {
    $info = array();
    $info["min"] = $value["occ"];
    $info["max"] = $value["occ"]+1;
    $info["attrs"] = array();
    $info["attrs"]["fill"] = "#".$value["color"];
    $info["label"] = "[".$value["color"]."]  Papers: ".$value["occ"];
    array_push($theslices, $info);

    $temp2 = $value["countries"];
    foreach ($temp2 as $j) {
        if ($j != "") {
            $moreinfo = array();
            $moreinfo["value"] = $value["occ"];
            $moreinfo["attr"] = array();
            $moreinfo["attr"]["href"] = "#";
            $moreinfo["tooltip"] = array();
            if($selectiveQuery){
                if($norm_country[$j]["realValue"]==1){
                    $moreinfo["tooltip"]["content"] = "<span style='font-weight:bold;'>" . $CC[$j] . "</span><br/>" . $norm_country[$j]["realValue"]. ' '.$pluralnick.' ('.$norm_country[$j]["percentage"].'%)';
                } else {
                    $moreinfo["tooltip"]["content"] = "<span style='font-weight:bold;'>" . $CC[$j] . "</span><br/>" . $norm_country[$j]["realValue"]. ' '.$pluralnick.' ('.$norm_country[$j]["percentage"].'%)';
                }                    
            } else {
                $moreinfo["tooltip"]["content"] = "<span style='font-weight:bold;'>" . $CC[$j] . "</span><br/>" . $value["occ"]. ' '.$pluralnick;
            }
            $thedata[$j] = $moreinfo;
        }
    }
}


$info = array();
$info["min"] = 0;
$info["max"] = 1;
$info["attrs"] = array();
$info["attrs"]["fill"] = "#FFFFFF";
$info["label"] = "[WHITE]  Papers: 0";
array_push($theslices, $info);

$finalarray=array();
$finalarray["areas"]=$thedata;
$finalarray["slices"]=$theslices;

if($selectiveQuery){
    $minInt=100000;
    $maxInt=0;
    $minFloat=100000.0;
    $maxFloat=0.0;
    foreach ($norm_country as $key => $value) {
        if($value["realValue"]>$maxInt) $maxInt=$value["realValue"];
        if($value["realValue"]<$minInt) $minInt=$value["realValue"];
        if($value["percentage"]>$maxFloat) $maxFloat=$value["percentage"];
        if($value["percentage"]<$minFloat) $minFloat=$value["percentage"];
    }
    $min=$minInt." (".$minFloat."%)";
    $max=$maxInt." (".$maxFloat."%)";
}
$finalarray["min"]=$min;
$finalarray["max"]=$max;

echo json_encode($finalarray);
//revert

function getDivisors($mainpath,$dbnam,$table,$column){    
    include('countries_iso3166.php');
    $conn = new PDO("sqlite:" .$mainpath.$dbnam);
    $sql = "select count(*),".$column." from ".$table." GROUP BY ".$column." ORDER BY count(*) DESC";
    $country_divisor=array();
    foreach ($conn->query($sql) as $row) {
        $code = strtoupper($row[$column]);
        if($CC[$code]){
            $tempcount = 0;
            if ($country_divisor[$code]) {
                $country_divisor[$code]+=$row["count(*)"];
            } else {
                $country_divisor[$code] = $row["count(*)"];
            }
        }
    }
    return $country_divisor;
}

function pr($msg) {
    echo $msg . "\n";
}

?>
