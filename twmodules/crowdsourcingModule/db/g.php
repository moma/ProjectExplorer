<?php

        try {
                print "<style>";
                print "table, th, td {";
                print "   border: 1px solid black;";
                print "}";
                print "</style>";
                //first pass just gets the column names
                print '<table>';
                $con = new PDO("sqlite:crowdsourcing.db");
                $sql_select = 'SELECT * FROM terms ORDER BY rowid DESC';
                $result = $con->query($sql_select);
                //return only the first row (we only need field names)
                $row = $result->fetch(PDO::FETCH_ASSOC);
                print " <tr> \n";
                foreach ($row as $field => $value){
                        print " <th>$field</th> \n";
                } // end foreach
                print " </tr> \n";
                //second query gets the data
                $data = $con->query($sql_select);
                $data->setFetchMode(PDO::FETCH_ASSOC);
                foreach($data as $row){
                        print " <tr> \n";
                        foreach ($row as $name=>$value){
                                print " <td>$value</td> \n";
                        } // end field loop
                        print " </tr> \n";
                } // end record loop
                print "</table> \n";
        } catch(PDOException $e) {
                echo 'ERROR: ' . $e->getMessage();
        } // end try


        // // header('Content-Type: application/json');
        // $sql_select = 'SELECT * FROM terms ORDER BY rowid DESC';
        // // echo "$sql_select";
        // $base = new PDO("sqlite:crowdsourcing.db");
        // $results = display_data( $base->query($sql_select) );
        // // $results = array();
        // // foreach ($base->query($sql_select) as $row) {
        // //         array_push($results, $row);
        // // }
        // // $base = null;

        // echo $results;


?>
