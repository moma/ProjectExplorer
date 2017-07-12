<?php
// manage the dynamical additional information in the left panel.
ini_set('display_errors',1);
ini_set('display_startup_errors',1);
// error_reporting(-1);

// exemple call:
// http://blabla/LOCALDB/info_div.php?type=semantic&bi=0&query=[%22Monte%20Carlo%22]&gexf=%22line/AXA/RiskV2PageRank1000.gexf%22&index=ISItermsAxa_2015

include('tools.php');
include('parameters_details.php');

if ($output_mode == "json") {
  header('Content-Type: application/json');
}

if ($dbtype == "CortextDB") {
  $base = new PDO("sqlite:".$mainpath.$graphdb);
  include('default_div.php');
}

else {
  // to index: the union of "searchable columns" qcols for all nodetypes
  $idxcolsbytype = [];
  for ($i = 0; $i < $ntypes ; $i++) {

    // if nodetype is active
    if (count($my_conf["node".$i])) {
      // ... and well-formed
      if (array_key_exists('qcols', $my_conf["node".$i][$dbtype])) {
        $idxcolsbytype[$i] = $my_conf["node".$i][$dbtype]['qcols'];
      }
      else {
        echo("<p>Your settings for relatedDocsType are set on a local database,
            but your servermenu file does not provide any information about
            the CSV or DB table to query for related documents
            (on nodetypeId ".$i.")</p>");
      }
    }
  }

  if (! $idxcolsbytype) {
    echo('<br> info_div.php (csv mode): please provide reldbqcols param in db.json <br>');
  }
  else {
    // DO THE INDEXATION (or RETRIEVE CACHED ONE)
    // we use cache if memcached is present (and if we indexed the csv already)
    include('csv_indexation.php');

    $csv_search_base = NULL;
    if(class_exists('Memcached')){
      $mcd = new Memcached;
      $mcd->addServer($memserver, $memport);

      // test if we indexed it already
      $csv_search_base_seri = $mcd->get(mem_entry_name($graphdb));

      if ($csv_search_base_seri !== False) {
        // echo("Using cached base<br>");
        $csv_search_base = json_decode($csv_search_base_seri, $assoc=true);
      }
    }

    if (! $csv_search_base) {
      // echo("Creating new base<br>");

      // indexing ----------------------------------------------------------------------
      // must know about all (sem+soc) cols typed, even if each search doesn't need them
      // echodump("filename CSV", $mainpath.$graphdb);
      $csv_search_base = parse_and_index_csv($mainpath.$graphdb,
                                             $idxcolsbytype,
                                            $csvsep, $csvquote);
      // -------------------------------------------------------------------------------

      if(class_exists('Memcached')){
        // **store** in cache for 1/2h
        $mcd->set(mem_entry_name($graphdb), json_encode($csv_search_base), 1800);
      }
    }

    $base = $csv_search_base[0];
    $postings = $csv_search_base[1];
    // echodump("postings", $postings);
    // echodump("base", $base);


    // DO THE SEARCH
    // -------------
    $searchcols = $my_conf["node".$ntid][$dbtype]['qcols'];

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
        $searchable = $postings[$ntid][$searchcols[$l]];

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

    include ('csv_div.php');

  }
}


// just to make sure we use the same conventional name at cache read/write
function mem_entry_name($graphdbname) {
  return "twbackendmem/".$graphdbname."/csv_search_base";
}




?>
