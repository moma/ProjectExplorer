<?php

class scanTree {

    public $root;
    public $dbs = array();

    public function __construct($rootpath = "") {
        $this->root = $rootpath;
    }

    public function getDirectoryTree($dir) {
        $folder = array();
        $dbs = array();
        $gexfs = array();
        $dataFolder = $this->root . $dir;
        $files = scandir($dataFolder);
        foreach ($files as $f) {
            if ($f != "." and $f != ".." and $f[strlen($f) - 1] != "~") {
                if (is_dir($dataFolder . "/" . $f)) {
                    //pr("Dir: ".$f);
                    $subfolder = $f;
                    $this->getDirectoryTree($dir . "/" . $subfolder);
                } else {
                    //pr("File: ".$f);
                    if ((strpos($f, '.db')) or (strpos($f, '.sqlite')) or (strpos($f, '.sqlite3')))
                        array_push($dbs, $dir."/".$f);
                    //$dir . "/" . 
                }
            }
        }
        array_push($this->dbs, $dbs);
    }

}

?>
