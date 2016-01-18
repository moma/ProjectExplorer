<?php

        header('Content-Type: application/json');

        if ($_POST) {
                $source = ( ($_POST['source'])? $_POST['source'] : "" );
                $suggestion = ( ($_POST['data'])? $_POST['data'] : "" );
                $date = ( ($_POST['date'])? $_POST['date'] : "" );
                $geo = ( ($_POST['geo'])? $_POST['geo'] : "" );
                $new_ = ( ($_POST['new'])? $_POST['new'] : -1 )-2;
                $sql_insert = 'INSERT into terms values ( "'.$source.'" , "'.$suggestion.'" , "'.$date.'" , "'.$geo.'" , '.$new_.' )';
                $base = new PDO("sqlite:crowdsourcing.db");
                $base->exec($sql_insert);
                $base = null;
                echo json_encode( [ $suggestion , "OK"] );
        } else {
                echo json_encode( [ "OK"] );
        }

?>