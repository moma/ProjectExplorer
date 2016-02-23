<?php
    
    try {
        header('Content-Type: application/json');

        if ($_POST) {
            $source = ( ($_POST['source'])? $_POST['source'] : "" );
            $suggestion = ( ($_POST['data'])? $_POST['data'] : "" );
            $date = ( ($_POST['date'])? $_POST['date'] : "" );
            $sql_insert = 'INSERT into terms (source, suggestion, time) values ( :source, :suggestion, :date) ; ';
            $base = new PDO("sqlite:crowdsourcing.db");
            $query = $base->prepare($sql_insert);
            $query->bindParam(':source', $source, PDO::PARAM_STR);
            $query->bindParam(':suggestion', $suggestion, PDO::PARAM_STR);
            $query->bindParam(':date', $date, PDO::PARAM_STR);
            $query->execute() ;
            $base = null;
            echo json_encode( [ $suggestion , "OK"] );
        } else {
            echo json_encode( [ "OK"] );
        }
    }
        
    catch(Exception $e) {
        echo 'Message: ' .$e->getMessage();
    }

?>
