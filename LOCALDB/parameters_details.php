<?php


# loading an associated db for a given gexf as relatedDocs php API
$gexf_db = array();

# £££TODO should be passed by param
$gexf_db["data/ClimateChange/Maps_S_800.gexf"] = "data/ClimateChange/wos_climate-change_title_2014-2015.db";
$gexf_db["data/AXA/RiskV2PageRank1000.gexf"] = "data/AXA/data.db";
$gexf_db["data/AXA/RiskV2PageRank2500.gexf"] = "data/AXA/data.db";
$gexf_db["data/AXA/RiskV2PageRank5000.gexf"] = "data/AXA/data.db";
$gexf_db["data/test/mini_for_csv.gexf"] = "data/test/mini_for_csv.tsv";


// TESTS
// for debug
echo "<br>";
var_dump($_GET);
echo "<br>---<br>";

// $gexf_db["data/ProgrammeDesCandidats.gexf"] = "foobar";

$gexf= str_replace('"','',$_GET["gexf"]);

$mainpath=dirname(getcwd())."/";
$graphdb = $gexf_db[$gexf];

echodump("graphdb", $graphdb);

function echodump($title, $anyObj) {
  echo "<br>".$title.": ";
  echo (json_encode($anyObj, JSON_PRETTY_PRINT));
  echo "<br>";
}

?>
