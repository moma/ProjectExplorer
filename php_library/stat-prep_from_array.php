<?php
;
/*
 * Pre compute some element for statistics
 * and open the template in the editor.
 */



// paramters : threshold to display orgs (labs / institutions) diagrams
$MIN_DISTINCT_LABS = 5 ;
$MIN_DISTINCT_INSTS = 4 ;


$country_list = array();
$position_list = array();
$title_list = array();
$labs_list = array();
$insts_list = array();

$other_country = 0;
$other_title = 0;
$other_position = 0;
$other_labs = 0;
$other_insts = 0;
$missing_country = 0;
$missing_title = 0;
$missing_position = 0;
$missing_labs = 0;
$missing_insts = 0;
// données des pays
foreach ($scholars as $row) {

    if (strlen(trim($row["country"]))>1){
    if (array_key_exists($row["country"], $country_list)) {
        $country_list[$row["country"]]+=1;
    } else {
        $country_list[$row["country"]] = 1;
    }
    }
    // traitement des postes
    // TODO supprimer, l'essentiel est fait/à faire en amont à l'enregistrement
    $position = strtolower(trim($row["position"]));
    if (strcmp($position, "prof.") == 0) {
        $position = "";
    } elseif (strcmp($position, "prof") == 0) {
        $position = "";
    } elseif (strcmp($position, "ph.d. student") == 0) {
        $position = "phd student";
    } elseif (strcmp($position, "directeur de recherche") == 0) {
        $position = "research director";
    } elseif (strcmp($position, "dr") == 0) {
        $position = "research director";
    } elseif (strcmp($position, "research professor") == 0) {
        $position = "professor";
    } elseif (strcmp($position, "dr.") == 0) {
        $position = "research director";
    } elseif (strcmp($position, "research scientist") == 0) {
        $position = "researcher";
    } elseif (strcmp($position, "research fellow") == 0) {
        $position = "researcher";
    } elseif (strcmp($position, "phd candidate") == 0) {
        $position = "phd student";
    } elseif (strcmp($position, "ph.d student") == 0) {
        $position = "phd student";
    } elseif (strcmp($position, "research engineer") == 0) {
        $position = "engineer";
    } elseif (strcmp($position, "postdoc") == 0) {
        $position = "post-doc";
    } elseif (strcmp($position, "phd") == 0) {
        $position = "phd student";
    } elseif (strcmp($position, "assoc. prof.") == 0) {
        $position = "associate professor";
    } elseif (strcmp($position, "senior scientist") == 0) {
        $position = "senior researcher";
    }

    if (strcmp($position, "") == 0) {
        $missing_position+=1;
    } elseif (array_key_exists($position, $position_list)) {
        $position_list[$position]+=1;
    } else {
        $position_list[$position] = 1;
    }

    /// traitement des titles
    $title = trim($row["title"]);
    if (strcmp($title, "") == 0) {
        $missing_title+=1;
    } else {
        if (strcmp(substr($title, -1), ".") != 0) {
            $title.=".";
        }
        // TODO supprimer, l'essentiel est fait/à faire en amont à l'enregistrement
        if (strcmp($title, "Dr.") == 0) {
            $title = "PhD.";
        } elseif (strcmp(str_replace (' ','',str_replace ('.','', strtolower($title))), "phd") == 0) {
            $title = "PhD.";
        } elseif (strcmp(str_replace (' ','',str_replace ('.','', strtolower($title))), "profdr") == 0) {
            $title = "Prof. Dr.";
        } elseif (strcmp(str_replace (' ','',str_replace ('.','', strtolower($title))), "drhabil") == 0) {
            $title = "Dr. Habil.";
        } elseif (strcmp($title, "M.") == 0) {
            $title = "Mr.";
        } elseif (strcmp($title, "Professor.") == 0) {
            $title = "Prof.";
        }

        if (array_key_exists($title, $title_list)) {
            $title_list[$title]+=1;
        } else {
            $title_list[$title] = 1;
        }
    }

    // split et recensement des organismes de rattachement

    // 1- labos
    foreach ($row['labs'] as $lab) {
        $lab = trim($lab);
        // POSS ideally restore NON NULL labs
        //      but some users never provided any
        if (strcmp($lab, "") == 0 || preg_match('/^_NULL/', $lab)) {
            $missing_labs+=1;
        }
        else {
            // >> $labs_list counts
            if (array_key_exists($lab, $labs_list)) {
                $labs_list[$lab]+=1;
            } else {
                $labs_list[$lab] = 1;
            }
        }
    }
    // 2 - same for institutions
    foreach ($row['institutions'] as $inst) {
        $inst = trim($inst);
        if (strcmp($inst, "") == 0 || preg_match('/^_NULL/', $inst)) {
            $missing_insts+=1;
        }
        else {
            // >> $insts_list counts
            if (array_key_exists($inst, $insts_list)) {
                $insts_list[$inst]+=1;
            } else {
                $insts_list[$inst] = 1;
            }
        }
    }
}



asort($country_list);
asort($position_list);
asort($title_list);
asort($labs_list);
asort($insts_list);



// TODO factorize all this

// NB escaping: no need to do htmlspeciazlchars($key, ENT_HTML5 | ENT_QUOTES, 'UTF-8'); because the target language is js (doesn't need html entities)

// données des pays
$country_data = "data: [";
foreach ($country_list as $key => $value) {

        $key = addslashes($key);

        if ($value > min(9, count($country_list) / 10)) {
            $country_data.='["' . $key . '",' . $value . '],';
        } else {
            $other_country+=$value;
        }

}
//if (false) {
if ($missing_country>0){
    $country_data.='["Missing data",' . $missing_country . '],';
}
if ($other_country>0){
    $country_data.='["Others",' . $other_country . ']';
} else {
    $country_data = substr($country_data, 0, -1);
}

$country_data.=']';




// données des position
$position_data = "data: [";
foreach ($position_list as $key => $value) {
    $key = addslashes($key);
    if ($value > min(9, count($position_list) / 10)) {
        $position_data.='["' . $key . '",' . $value . '],';
    } else {
        $other_position+=$value;
    }
}
//
//if (false) {
if ($missing_position>0){
    $position_data.='["Missing data",' . $missing_position . '],';
}
if ($other_position>0){
    $position_data.='["Others",' . $other_position . ']';
} else {
    $position_data = substr($position_data, 0, -1);
}
$position_data.=']';

// données des title
$title_data = "data: [";
foreach ($title_list as $key => $value) {
    $key = addslashes($key);
    if ($value > 3) {
        $title_data.='["' . $key . '",' . $value . '],';
    } else {
        $other_title+=$value;
    }
}
//if (false) {
if ($missing_title>0){
    $title_data.='["Missing data",' . $missing_title . '],';
}
if ($other_title>0){
    $title_data.='["Others",' . $other_title . ']';
} else {
    $title_data = substr($title_data, 0, -1);
}
$title_data.=']';


// données des institutions/affiliations
$labs_data = "data: [";
$n_labs = count($labs_list);
$n_shown_labs = 0 ;
foreach ($labs_list as $key => $value) {

        $key = addslashes($key);
        if ($value > min(9, $n_labs / 15)) {
            $labs_data.='["' . $key . '",' . $value . '],';
            $n_shown_labs += 1;
        } else {
            $other_labs+=$value;
        }

}
if ($missing_labs>0){
    $labs_data.='["Missing data",' . $missing_labs . '],';
}
if ($other_labs>0){
    $labs_data.='["Others",' . $other_labs . ']';
} else {
    $labs_data = substr($labs_data, 0, -1);
}

$labs_data.=']';


$insts_data = "data: [";
$n_insts = count($insts_list);
$n_shown_insts = 0 ;
foreach ($insts_list as $key => $value) {

        $key = addslashes($key);
        if ($value > min(9, $n_insts / 15)) {
            $insts_data.='["' . $key . '",' . $value . '],';
            $n_shown_insts += 1;
        } else {
            $other_insts+=$value;
        }

}
if ($missing_insts>0){
    $insts_data.='["Missing data",' . $missing_insts . '],';
}
if ($other_labs>0){
    $insts_data.='["Others",' . $other_insts . ']';
} else {
    // removes the last ',' from line 257 or 264
    $insts_data = substr($insts_data, 0, -1);
}

$insts_data.=']';



// TODO separate this Highcharts js to factorize and expose as functions
//      (or replace it by D3 and also separate)
$stats = '<script type="text/javascript">
var country;
var position;
var title;
var organization;
$(document).ready(function() {
	country= new Highcharts.Chart({
		chart: {
			renderTo: "country",
			plotBackgroundColor: null,
			plotBorderWidth: null,
			plotShadow: false
		},
		title: {
			text: "Countries"
		},
		tooltip: {
			formatter: function() {
				return "<b>"+ this.point.name +"</b>: "+ Math.floor(10*this.percentage)/10 +" %";
			}
		},
		plotOptions: {
			pie: {
				allowPointSelect: true,
				cursor: "pointer",
				dataLabels: {
					enabled: true,
					color: "#000000",
					connectorColor: "#000000",
					formatter: function() {
						return "<b>"+ this.point.name +"</b>: "+ Math.floor(10*this.percentage)/10 +" %";
					}
				}
			}
		},
		series: [{
			type: "pie",
			name: "Countries",' .
        $country_data .
        '}]
	});

	position= new Highcharts.Chart({
		chart: {
			renderTo: "position",
			plotBackgroundColor: null,
			plotBorderWidth: null,
			plotShadow: false
		},
		title: {
			text: "Position of scholars"
		},
		tooltip: {
			formatter: function() {
				return "<b>"+ this.point.name +"</b>: "+ Math.floor(10*this.percentage)/10 +" %";
			}
		},
		plotOptions: {
			pie: {
				allowPointSelect: true,
				cursor: "pointer",
				dataLabels: {
					enabled: true,
					color: "#000000",
					connectorColor: "#000000",
					formatter: function() {
						return "<b>"+ this.point.name +"</b>: "+ Math.floor(10*this.percentage)/10 +" %";
					}
				}
			}
		},
		series: [{
			type: "pie",
			name: "Position",' . $position_data .
        '}]
	});

        title= new Highcharts.Chart({
		chart: {
			renderTo: "title",
			plotBackgroundColor: null,
			plotBorderWidth: null,
			plotShadow: false
		},
		title: {
			text: "Title of scholars"
		},
		tooltip: {
			formatter: function() {
				return "<b>"+ this.point.name +"</b>: "+ Math.floor(10*this.percentage)/10 +" %";
			}
		},
		plotOptions: {
			pie: {
				allowPointSelect: true,
				cursor: "pointer",
				dataLabels: {
					enabled: true,
					color: "#000000",
					connectorColor: "#000000",
					formatter: function() {
						return "<b>"+ this.point.name +"</b>: "+ Math.floor(10*this.percentage)/10 +" %";
					}
				}
			}
		},
		series: [{
			type: "pie",
			name: "Titles",' . $title_data .
         '}]
	});

    if (parseInt('.$n_shown_labs.') >= parseInt('.$MIN_DISTINCT_LABS.')) {

        labs= new Highcharts.Chart({
    		chart: {
    			renderTo: "labs_div",
    			plotBackgroundColor: null,
    			plotBorderWidth: null,
    			plotShadow: false
    		},
    		title: {
    			text: "Laboratories affiliations"
    		},
    		tooltip: {
    			formatter: function() {
    				return "<b>"+ this.point.name +"</b>: "+ Math.floor(10*this.percentage)/10 +" %";
    			}
    		},
    		plotOptions: {
    			pie: {
    				allowPointSelect: true,
    				cursor: "pointer",
    				dataLabels: {
    					enabled: true,
    					color: "#000000",
    					connectorColor: "#000000",
    					formatter: function() {
    						return "<b>"+ this.point.name +"</b>: "+ Math.floor(10*this.percentage)/10 +" %";
    					}
    				}
    			}
    		},
    		series: [{
    			type: "pie",
    			name: "Lab Affiliations",' . $labs_data . '}]
    	});
    }
    else {
        document.getElementById("labs_div").style.display = "none"
    }

    if (parseInt('.$n_shown_insts.') >= parseInt('.$MIN_DISTINCT_INSTS.')) {

        insts= new Highcharts.Chart({
    		chart: {
    			renderTo: "insts_div",
    			plotBackgroundColor: null,
    			plotBorderWidth: null,
    			plotShadow: false
    		},
    		title: {
    			text: "Institutional affiliations"
    		},
    		tooltip: {
    			formatter: function() {
    				return "<b>"+ this.point.name +"</b>: "+ Math.floor(10*this.percentage)/10 +" %";
    			}
    		},
    		plotOptions: {
    			pie: {
    				allowPointSelect: true,
    				cursor: "pointer",
    				dataLabels: {
    					enabled: true,
    					color: "#000000",
    					connectorColor: "#000000",
    					formatter: function() {
    						return "<b>"+ this.point.name +"</b>: "+ Math.floor(10*this.percentage)/10 +" %";
    					}
    				}
    			}
    		},
    		series: [{
    			type: "pie",
    			name: "Institutional Affiliations",' . $insts_data . '}]
    	});
    }
    else {
        document.getElementById("insts_div").style.display = "none"
    }


});








</script>';
?>
