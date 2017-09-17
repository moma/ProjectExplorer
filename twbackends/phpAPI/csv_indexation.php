<?php

// parse_and_index_csv: index a subset of csv columns for search
// --------------------------------------------------------------
// returns the full csv array (the documents base)
//     AND a list of postings (the search index)
//
//  The documents-base gets a [{1 obj per row: 1 property per column}] structure
//
//  exemple of the documents base structure:
//  -------
//  {
//     "title": "A three-dimensional photoelastic method for analysis of differential-contraction stresses",
//     "source": "Experimental Mechanics",
//     "publication_year": "1963",
//     "publication_month": "01",
//     "publication_day": "01",
//     "abstract": "Abstract: The property of homogeneous and isotropic
//                  contraction accompanying the slow polymerization
//                  of a photoelastic epoxy resin is utilized to produce
//                  a photoelastic model of the same size and shape,
//                  at the elevated cure temperature, as the container
//                  in which it was cast. (...).",
//     "authors": "Robert C. Sampson"
// },
// {
//     "title": "Use of subjective information in estimation of aquifer parameters",
//     "source": "Water Resources Research",
//     "publication_year": "1972",
//     "publication_month": "01",
//     "publication_day": "01",
//     "abstract": "In the calibration of aquifer models, the desire for
//                  an automated adjustment process is sometimes
//                  in conflict with the need for subjective intervention
//                  during the calibration process. (...)",
//     "authors": "R. E. Lovell, L. Duckstein, C. C. Kisiel"
// },
// {
//     "title": "Man-machine interactive transit system planning",
//     "source": "Socio-Economic Planning Sciences",
//     "publication_year": "1972",
//     "publication_month": "01",
//     "publication_day": "01",
//     "abstract": "The problem of finding the best fixed routes for node
//                  oriented transit systems is used for an initial
//                  implementation and evaluation of a man-machine
//                  interactive problem solving system. (...)",
//     "authors": "Matthias H. Rapp"
// },
//
//
//  The postings have the form: $nodetype => $col => $tok => $docid => $occs
//
//
//
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

                // basic tokenisation on unicode punctuation and separators
                // cf http://unicode.org/reports/tr18/#General_Category_Property
                $tokens = preg_split("/[\p{Z}\p{P}\p{C}]+/u", $line_fields[$c]);

                // for debug
                // echo("indexing column:".$colname." under type:".$ndtypeid.'<br>');
                // var_dump($tokens);

                foreach($tokens as $tok) {

                  $tok = strtolower($tok);

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
  // post-treatment: cumulative number of docs by token
  $df = array() ;
  for ($ndtypeid = 0 ; $ndtypeid < $GLOBALS["ntypes"] ; $ndtypeid++) {
    if (array_key_exists($ndtypeid, $postings)) {
      foreach ($postings[$ndtypeid] as $col => $occs_matrix) {
        foreach ($occs_matrix as $tok => $doc_occs) {
          if (array_key_exists($tok, $df)) {
            $df[$tok] += count($doc_occs);
          }
          else {
            $df[$tok]  = count($doc_occs);
          }
        }
      }
    }
  }

  $logtotaldocs = log($rowid + 1);
  $idfvals = array();
  foreach ($df as $tok => $df_tok) {
    $idfvals[$tok] = $logtotaldocs - log($df_tok);
  }

  return array($base, $postings, $idfvals);
}


?>
