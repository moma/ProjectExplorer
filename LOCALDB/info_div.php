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

    echodump("columns to index",$idxcolsbytype);

    include('csv_indexation.php');

    // DO THE INDEXATION
    // we use cache if memcached is present (and if we indexed the csv already)
    // $can_use_cache = False

    // £TODO use memcached or something to store a serialized version of csv_search_base
    // + add all (sem+soc) columns for the index to work !!
    $csv_search_base = parse_and_index_csv($project_root.$graphdb, $idxcolsbytype, ";", '"');

    $base = $csv_search_base[0];
    $postings = $csv_search_base[1];

    echodump("postings", $postings);
    echodump("base", $base);

    // DO THE SEARCH

    $searchcols = json_decode($_GET['searchin']);

    // a - split the query
    $qtokens = preg_split('/\W/', $_GET["query"]);

    // b - compute tfidfs
    $tfs_per_tok_and_doc = array();
    $dfs_per_tok = array();


    // for each token
    for ($k=0 ; $k < count($qtokens) ; $k) {

      $tok = $qtokens[$k];

      $tfs_per_tok_and_doc[$tok] = array();

      for ($l=0 ; $l < count($searchcols) ; $l++) {

        $searchable = $postings[$_GET['type']][$searchcols[$l]];
        echodump("searchable", $searchable);

        //
        // if (array_key_exists($tok, $searchable)) {
        //   for ($m ; $m < count($searchable[$tok]) ; $m++) {
        //     $doc_id = $searchable[$tok][$m];
        //
        //     // freq of token per doc
        //     if (array_key_exists($doc_id, $tfs_per_tok_and_doc[$tok])) {
        //       $tfs_per_tok_and_doc[$tok][$doc_id]++;
        //     }
        //     else {
        //       $tfs_per_tok_and_doc[$tok][$doc_id] = 1;
        //     }
        //
        //     // global doc freqs
        //     if (array_key_exists($tok, $dfs_per_tok)) {
        //       $dfs_per_tok[$tok]++;
        //     }
        //     else {
        //       $dfs_per_tok[$tok] = 1;
        //     }
        //   }
        // }

      }
      // $qtokens[k];
    }

    // c - score per doc
    //
    // $nbdoc = count($base);
    // for ($i=0; $i < $nbdoc; $i++) {
    // }
    // dfs = array();





    // DISPLAY THE RESULTS
    // function displayDoc($docId, $score, $base) {
    //
    //   // POSS score should have a data-score attribute
    //   $output ="<li title='".$score."'>";
    //
    //   $output.="<p><b>".$base[$docId]['title']."</b></p>"
    //   $output.="<p>".$base[$docId]['author']." [".$base[$docId]['pubdate']."], <i>(".$base[$docId]['journal'].")</i></p>";
    //   $output.="<p>".$base[$docId]['keywords']."</p>";
    //
    //   $output.="</li>";
    //
    //   return $output
    // }




  }
}




?>
