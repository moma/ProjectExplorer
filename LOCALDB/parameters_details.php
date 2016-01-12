<?php


$gexf_db = array();

# $gexf_db["data/terrorism/terrorism_bi.gexf"] = "data/terrorism/data.db";

# $gexf_db["data/ClimateChange/ClimateChangeV1.gexf"] = "data/ClimateChange/wosclimatechange-61715-1-wosclimatechange-db(2).db";
$gexf_db["data/ClimateChange/Maps_S_800.gexf"] = "data/ClimateChange/wos_climate-change_title_2014-2015.db";

$gexf_db["data/AXA/EditedJan20151980 nodes V2 PageRank.gexf"] = "data/AXA/data.db";
$gexf_db["data/AXA/RiskV2PageRank.gexf"] = "data/AXA/data.db";
$gexf_db["data/AXA/RiskV2PageRank5000.gexf"] = "data/AXA/data.db";

$gexf= str_replace('"','',$_GET["gexf"]);

$mainpath=dirname(getcwd())."/";
$graphdb = $gexf_db[$gexf];


?>
