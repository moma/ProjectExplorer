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
$gexf_db["data/gargistex/model_calibration.gexf"] = "data/gargistex/model_calibration.csv";

// $gexf_db["data/ProgrammeDesCandidats.gexf"] = "foobar";

$gexf= str_replace('"','',$_GET["gexf"]);

// default path to ProjectExplorer root
// (where data directory and db.json file reside)
$mainpath=dirname(getcwd())."/../";

$graphdb = $gexf_db[$gexf];


// for csv parsing
$csvsep = "\t";
$csvquote = '"';

// for csv caching (optional)
$memserver = 'localhost';
$memport = 11211;

// number of docs to display setting
$max_item_displayed = 7;

// echodump("graphdb", $graphdb);

function echodump($title, $anyObj) {
  echo "<br>".$title.": ";
  echo (json_encode($anyObj, JSON_PRETTY_PRINT));
  echo "<br>";
}

?>
