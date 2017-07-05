<?php

// parse_and_index_csv: index a subset of csv columns for search
// --------------------------------------------------------------
// returns the full csv array (the documents base)
//     AND a list of postings (the search index)
function parse_and_index_csv($filename, $typed_cols_to_index, $separator, $quotechar) {

  // list of csv rows
  $base = array();

  // initialize our inverted index by values
  $postings = array() ;
  foreach($typed_cols_to_index as $nodetype => $cols) {
    $postings[$nodetype] = array() ;

    // echodump("parse_and_index_csv: typed cols", $cols);

    for($i = 0; $i < count($cols) ; $i++) {
      $colname = $cols[$i.""];
      $postings[$nodetype][$colname] = array();
    }
  }

  // we'll initialize colnum => colname map from first row
  $colnames = array() ;

  $rowid = 0;
  if (($fh = fopen($filename, "r")) !== FALSE) {

    // we assume first line is titles
    $colnames = fgetcsv($fh, 20000, $separator, $quotechar);

    // we slurp and index the entire CSV
    while (($line_fields = fgetcsv($fh, 20000, $separator, $quotechar)) !== FALSE) {
        // NB 2nd arg is max length of line
        // we used here 2 * the longest we saw in the exemples
        // (change accordingly to your use cases)

        $num = count($line_fields);
        // echo "<p> $num fields in line $rowid: <br /></p>\n";

        $docid = 'd'.$rowid;

        // keep the row in "database"
        $base[$rowid] = array();
        for ($c=0; $c < $num; $c++) {

          $colname = $colnames[$c];

          // debug
          // echo "==>/".$colname."/:" . $line_fields[$c] . "<br />\n";

          // store row -> fields -> value
          $base[$rowid][$colname] = $line_fields[$c];

          // fill our search index if the type+col was asked in postings
          for ($ndtypeid = 0 ; $ndtypeid < $GLOBALS["ntypes"] ; $ndtypeid++) {
            if (array_key_exists($ndtypeid, $postings)) {
              if (array_key_exists($colname, $postings[$ndtypeid])) {
                // basic tokenisation (TODO specify tokenisation delimiters etc.)
                $tokens = preg_split("/\W/", $line_fields[$c]);

                // for debug
                // echo("indexing column:".$colname." under type:".$ndtypeid.'<br>');
                // var_dump($tokens);

                foreach($tokens as $tok) {

                  if (strlen($tok)) {

                    // POSS : stopwords could be used here
                    if (! array_key_exists($tok, $postings[$ndtypeid][$colname])) {
                      $postings[$ndtypeid][$colname][$tok] = array();
                    }
                    // in a csv, rowid is a pointer to the document
                    if (array_key_exists($docid, $postings[$ndtypeid][$colname][$tok])) {
                      // we keep the frequencies
                      $postings[$ndtypeid][$colname][$tok][$docid]++ ;
                    }
                    else {
                      $postings[$ndtypeid][$colname][$tok][$docid] = 1;
                    }
                  }
                }
              }
            }
          }
        }
      $rowid++;
    }
    fclose($fh);
  }

  return array($base, $postings);
}


?>
