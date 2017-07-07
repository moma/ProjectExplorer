<?php

// default informations
$query = str_replace( '__and__', '&', $_GET["query"] );
$elems = json_decode($query);


// the table used as search perimeter is from db.json conf
$table = $my_conf[$ntid]['reldbqtable'] ;

// values for CortextDB that seem to never change: /!\ hardcoded here /!\
// the column accessors
$column = "data";
$id = "id";

// the output tables
$author_table = "ISIAUTHOR";
$titles_table = "ISITITLE";

$factor=10;// factor for normalisation of stars
$restriction='';


$sql="";
//////////
if (count($elems)==1){// un seul mot est sélectionné, on compte les mots multiples
	$sql = 'SELECT count(*),'.$id.'
	FROM '.$table.' where (';
        	foreach($elems as $elem){
              	$sql.=' '.$column.'="'.$elem.'" OR ';
        	}
	#$querynotparsed=$sql;#####
    $sql = substr($sql, 0, -3);
    $sql = str_replace( ' & ', '" OR '.$column.'="', $sql );
    $sql.=' COLLATE NOCASE ) '.$restriction.'
	GROUP BY '.$id.'
	ORDER BY count('.$id.') DESC
	LIMIT 1000';
}else{// on compte une seule fois un mot dans un article
	$factor=ceil(count($elems)/5); //les scores sont moins haut
	$sql='';
	foreach($elems as $elem){
            // echo("elem: ".$elem."<br/>");
          	$sql.=' '.$column.'="'.$elem.'" OR ';
        }
    $sql=substr($sql, 0, -3);
    $sql='SELECT count(*),id,data FROM (SELECT *
	FROM '.$table.' where ('.$sql.' COLLATE NOCASE )'.$restriction.'
	 group by id,data) GROUP BY '.$id.'
	ORDER BY count('.$id.') DESC
	LIMIT 1000';

}

$wos_ids = array();
$sum=0;

// echo "<br>";
// echo "$sql";
// echo "<br>";


//The final query!
// array of all relevant documents with score

foreach ($base->query($sql) as $row) {
        // on pondère le score par le nombre de termes mentionnés par l'article

        //$num_rows = $result->numRows();
        $wos_ids[$row[$id]] = $row["count(*)"];
        $sum = $row["count(*)"] +$sum;
}


// /// nombre de document associés $related
$total_count=0;
$count_max=500;
$number_doc=count($wos_ids);
$count=0;

$all_terms_from_selected_projects=array();// list of terms for the top 6 project selected

$htmlout = "";
$jsonhits = array();

// to filter under some conditions
$to_display=true;
foreach ($wos_ids as $id => $score) {
	if ($total_count<$count_max) {
		// retrieve publication year

		if ($to_display){
			$total_count+=1;

			if ($count<=$max_item_displayed){
				$count+=1;

				$sql = 'SELECT data FROM '.$titles_table.' WHERE id='.$id.' group by data';

				foreach ($base->query($sql) as $row) {
					$external_link="<a href=http://google.com/webhp?#q=".urlencode('"'.$row['data'].'"')." target=blank>".' <img width=15px src="'.$our_libs_root.'/img/google.png"></a>';

          $link = 'JavaScript:newPopup(\''.$our_php_root.'/default_doc_details.php?gexf='.urlencode($gexf).'&index='.$table.'&query='.urlencode($query).'&type='.urlencode($_GET['type']).'&id='.$id.'	\')';

          if ($output_mode == "html") {
            $htmlout.="<li title='".$score."'>";
            $htmlout.=$external_link.imagestar($score,$factor,$our_libs_root).' ';
            $htmlout.="<a href=\"$link\">".$row['data']." </a> ";
          }
          else {
            $jsonhit = array(
              'score' => $score,
              'tit' => $row['data'],
              'link' => $link
            );
          }
        }

				// get the authors
				$sql = 'SELECT data FROM '.$author_table.' WHERE id='.$id;
				foreach ($base->query($sql) as $row) {
          if ($output_mode == "html") {
            $htmlout.=($row['data']).', ';
          }
          else {
            $jsonhit['au'] = $row['data'];
          }
				}


        if ($output_mode == "html") {
          $htmlout = rtrim($htmlout, ", ");
          $htmlout.="</li><br>";
        }
        else {
          array_push($jsonhits, $jsonhit);
        }

			}
		}

	} else{
		break;
	}
}

$htmlout .= "</ul>"; #####


   // calculate binomial coefficient
 function binomial_coeff($n, $k) {

      $j = $res = 1;

      if($k < 0 || $k > $n)
         return 0;
      if(($n - $k) < $k)
         $k = $n - $k;

      while($j <= $k) {
         $res *= $n--;
         $res /= $j++;
      }

      return $res;

   }


if ($output_mode == 'html') {
  if($max_item_displayed>$total_count) $max_item_displayed=$total_count;
  // echo $news;
  echo '<h4><font color="#0000FF"> Full text of top '.$max_item_displayed.'/'.$total_count.' related publications:</font></h4>';
  echo $htmlout;
}
else {
  echo json_encode(array(
    'hits' => $jsonhits,
    'nhits' => $max_item_displayed
  ));
}

//pt - 301 ; 15.30
?>
