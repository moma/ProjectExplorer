<?php


# loading an associated db for a given gexf as relatedDocs php API
$gexf_db = array();

# £££TODO read the db.json
$gexf_db["data/ClimateChange/Maps_S_800.gexf"] = "data/ClimateChange/wos_climate-change_title_2014-2015.db";
$gexf_db["data/AXA/RiskV2PageRank1000.gexf"] = "data/AXA/data.db";
$gexf_db["data/AXA/RiskV2PageRank2500.gexf"] = "data/AXA/data.db";
$gexf_db["data/AXA/RiskV2PageRank5000.gexf"] = "data/AXA/data.db";
$gexf_db["data/test/mini_for_csv.gexf"] = "data/test/mini_for_csv.csv";
$gexf_db["data/gargistex/shale_and_ice.gexf"] = "data/gargistex/shale_and_ice.csv";

// $gexf_db["data/ProgrammeDesCandidats.gexf"] = "foobar";

$gexf= str_replace('"','',$_GET["gexf"]);

$mainpath=dirname(getcwd())."/";
$graphdb = $gexf_db[$gexf];

$csvsep = "\t";
$csvquote = '"';

// number of docs to display setting
$max_item_displayed = 7;

// echodump("graphdb", $graphdb);

function echodump($title, $anyObj) {
  echo "<br>".$title.": ";
  echo (json_encode($anyObj, JSON_PRETTY_PRINT));
  echo "<br>";
}

?>
