<?php
// manage the dynamical additional information in the left panel.
ini_set('display_errors',1);
ini_set('display_startup_errors',1);
error_reporting(-1);

// relative path to dirname "/line"
$project_root = "../";

// exemple call:
// http://blabla/LOCALDB/info_div.php?type=semantic&bi=0&query=[%22Monte%20Carlo%22]&gexf=%22line/AXA/RiskV2PageRank1000.gexf%22&index=ISItermsAxa_2015

include('parameters_details.php');

$max_item_displayed=6;

if ($_GET['dbtype'] == "sql") {
  $base = new PDO("sqlite:".$project_root.$graphdb);
  include('default_div.php');
}

else {
  // to index: the "searchable columns"
  if (! array_key_exists('toindex', $_GET)) {
    echo('<br> info_div.php (csv mode): please provide columns to index <br>');
  }
  else {
    $idxcolsbytype = json_decode($_GET['toindex']);

    // echodump("columns to index",$idxcolsbytype);

    include('csv_indexation.php');

    // DO THE INDEXATION
    // we use cache if memcached is present (and if we indexed the csv already)
    // $can_use_cache = False

    // £TODO use memcached or something to store a serialized version of csv_search_base
    // + add all (sem+soc) columns for the index to work !!
    $csv_search_base = parse_and_index_csv($project_root.$graphdb, $idxcolsbytype, ";", '"');

    $base = $csv_search_base[0];
    $postings = $csv_search_base[1];

    // echodump("postings", $postings);
    // echodump("base", $base);

    // DO THE SEARCH

    $searchcols = json_decode($_GET['searchin']);

    // a - split the query
    $qtokens = preg_split('/\W/', $_GET["query"]);

    // b - compute freq similarity per doc
    $sims = array();

    // for each token
    for ($k=0 ; $k < count($qtokens) ; $k++) {

      $tok = $qtokens[$k];

      if (! strlen($tok)) {
        continue;
      }

      // echodump("tok", $tok);
      // echodump("searchcols", $searchcols);

      $tfs_per_tok_and_doc[$tok] = array();

      for ($l=0 ; $l < count($searchcols) ; $l++) {

        // set of values we could find a match in
        $searchable = $postings[$_GET['type']][$searchcols[$l]];

        if (array_key_exists($tok, $searchable)) {

          // matches
          $matching_docs = $searchable[$tok];

          foreach ($matching_docs as $doc_id => $freq) {

            // echodump("tok freq in this doc", $freq);

            // cumulated freq of tokens per doc
            if (array_key_exists($doc_id, $sims)) {
              $sims[$doc_id]++;
            }
            else {
              $sims[$doc_id] = 1;
            }
          }
        }

      }
    }

    // c - sorted score per doc
    //
    arsort($sims);
    // echodump("sims", $sims);

    // DISPLAY THE RESULTS
    function displayDoc($docId, $score, $base) {

      $output = "";

      // POSS score should have a data-score attribute
      $output = "<li title='".$score."'>";

      $output.="<p><b>".$base[$docId]['title']."</b></p>";
      $output.="<p>".$base[$docId]['author']." [".$base[$docId]['pubdate']."], <i>(".$base[$docId]['journal'].")</i></p>";
      $output.="<p>".$base[$docId]['keywords']."</p>";
      $output.="<p>".$base[$docId]['text']."</p>";
      $output.="</li>";


      return $output;
    }

    $htmlout = "<ul>\n";
    foreach ($sims as $doc => $freq) {
      $rowid = ltrim($doc, 'd');
      $thisdoc = displayDoc($rowid, $freq, $base);
      echodump("doc", $thisdoc);
      $htmlout .= $thisdoc;
    }
    $htmlout = "</ul>\n";

    echo '<br/><h4><font color="#0000FF"> Full text of top '.count($sims).' related publications:</font></h4>'.$htmlout;

  }
}




?>
