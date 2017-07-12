<?php
include('tools.php');
include('parameters_details.php');

$base = new PDO("sqlite:" .$mainpath.$graphdb);


$output = "<ul>"; // string sent to the javascript for display


$type = $_GET["ndtype"];
$query = str_replace( '__and__', '&', $_GET["query"] );
$terms_of_query=json_decode($_GET["query"]);
$elems = json_decode($query);

// nombre d'item dans les tables
$sql='SELECT COUNT(*) FROM ISIABSTRACT';
foreach ($base->query($sql) as $row) {
  $table_size=$row['COUNT(*)'];
}

// the table used as search perimeter is from db.json conf
$table = $my_conf["node".$ntid][$dbtype]['qtable'] ;

// values for CortextDB that seem to never change: /!\ hardcoded here /!\
// the column accessors
$column = "data";
$id = "id";

// the output tables
$author_table = "ISIAUTHOR";
$titles_table = "ISITITLE";

$factor=10;// factor for normalisation of stars
$restriction='';


$sql = 'SELECT count(*),'.$id.'
FROM '.$table.' where (';
        foreach($elems as $elem){
                $sql.=' '.$column.'="'.$elem.'" OR ';
        }
#$querynotparsed=$sql;#####
        $sql = substr($sql, 0, -3);
        $sql = str_replace( ' & ', '" OR '.$column.'="', $sql );

        $sql.=')'.$restriction.'
GROUP BY '.$id.'
ORDER BY count('.$id.') DESC
LIMIT 1000';
#$queryparsed=$sql;#####

$wos_ids = array();
$sum=0;

//The final query!
// array of all relevant documents with score

foreach ($base->query($sql) as $row) {
        // on pondère le score par le nombre de termes mentionnés par l'article

        //$num_rows = $result->numRows();
        $wos_ids[$row[$id]] = $row["count(*)"];
        $sum = $row["count(*)"] +$sum;
}


//arsort($wos_ids);

$number_doc=ceil(count($wos_ids)/3);
$count=0;
foreach ($wos_ids as $id => $score) {
  if ($count<200){
    // retrieve publication year
    $sql = 'SELECT data FROM ISIpubdate WHERE id='.$id;
    foreach ($base->query($sql) as $row) {
      $pubdate=$row['data'];
    }

    // to filter under some conditions
    $to_display=true;
    if ($to_display){
      $count+=1;
      $output.="<li title='".$score."'>";
      $output.=imagestar($score,$factor,'./').' ';
      $sql = "SELECT data FROM $titles_table WHERE id=".$id." group by data";

      foreach ($base->query($sql) as $row) {
        $output.='<a href="default_doc_details.php?gexf='.urlencode($gexf).'&type='.urlencode($_GET["type"]).'&query='.urlencode($query).'&id='.$id.'">'.$row['data']." </a> ";
        $external_link="<a href=http://scholar.google.com/scholar?q=".urlencode('"'.$row['data'].'"')." target=blank>".' <img width=20px src="img/gs.png"></a>';
      }

  // get the authors
      $sql = "SELECT data FROM $author_table WHERE id=".$id;
      foreach ($base->query($sql) as $row) {
        $output.=strtoupper($row['data']).', ';
      }

      $output.=$external_link."</li><br>";
    }

  }else{
    continue;
  }
}

$output= '<h3>'.$count.' items related to: '.implode(' OR ', $elems).'</h3>'.$output;



echo $output;

?>
