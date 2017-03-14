<?php
;
/*
 * Pre compute some element for statistics
 * and open the template in the editor.
 */


// parameters : threshold to display orgs (labs / institutions) diagrams
$MIN_DISTINCT_LABS = 1 ;
$MIN_DISTINCT_LABS_SCHOLARS_SHARE = .25;

$MIN_DISTINCT_INSTS = 1 ;
$MIN_DISTINCT_INSTS_SCHOLARS_SHARE = .20;

// always the same colors for "others" and "missing" categories
$COLOR_OTHERS="grey";
$COLOR_MISSING="darkgrey";

// all the other available color-scheme
$COLOR_SCHEME = '["#4572A7", "#AA4643", "#89A54E", "#80699B", "#3D96AE",
"#DB843D", "#92A8CD", "#A47D7C", "#B5CA92"]';



// main vars
$country_list = array();
$position_list = array();
$title_list = array();
// not needed already factorized in lab_counts, inst_counts
// $labs_list = array();
// $insts_list = array();

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
}



asort($country_list);
asort($position_list);
asort($title_list);
asort($lab_counts);
asort($inst_counts);



// TODO factorize all this

// we are creating highcharts' arguments for pie chart
// eg position_data: data: [["senior researcher",11],["assistant professor",23],["lecturer",25],["engineer",26],["associate professor",28],["student",28],["post-doc",48],["professor",51],["phd student",53],["research director",64],["researcher",68],["Missing data",467],["Others",210]]

// NB escaping: no need to do htmlspeciazlchars($key, ENT_HTML5 | ENT_QUOTES, 'UTF-8'); because the target language is js (doesn't need html entities)

// données des pays
$country_data = "data: [";
foreach ($country_list as $key => $value) {

        $thresh = min(9, count($country_list) / 10);
        if ($value > $thresh) {
            $country_data.='["' . addslashes($key) . '",' . $value . '],';
        } else {
            $other_country+=$value;
        }

}
//if (false) {
if ($missing_country>0){
    $country_data.='{"name":"Missing data", "y":'. $missing_country . ', "color":"'.$COLOR_MISSING.'"},';
}
if ($other_country>0){
    $country_data.='{"name":"Others", "y":'. $other_country . ', "color":"'.$COLOR_OTHERS.'"}';
} else {
    $country_data = substr($country_data, 0, -1);
}

$country_data.=']';




// données des position
$position_data = "data: [";
foreach ($position_list as $key => $value) {
    $thresh = min(9, count($position_list) / 10);
    if ($value > $thresh) {
        $position_data.='["' . addslashes($key) . '",' . $value . '],';
    } else {
        $other_position+=$value;
    }
}
//
//if (false) {
if ($missing_position>0){
    $position_data.='{"name":"Missing data", "y":'. $missing_position . ', "color":"'.$COLOR_MISSING.'"},';
}
if ($other_position>0){
    $position_data.='{"name":"Others", "y":'. $other_position . ', "color":"'.$COLOR_OTHERS.'"}';
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
    $title_data.='{"name":"Missing data", "y":'. $missing_title . ', "color":"'.$COLOR_MISSING.'"},';
}
if ($other_title>0){
    $title_data.='{"name":"Others", "y":'. $other_title . ', "color":"'.$COLOR_OTHERS.'"}';
} else {
    $title_data = substr($title_data, 0, -1);
}
$title_data.=']';


// données des institutions/affiliations
$labs_data = "data: [";
$n_labs = count($lab_counts);
$n_shown_labs = 0 ;
$tot_shown_labs = 0;
$labs_total_responses = 0;
foreach ($lab_counts as $key => $value) {
        // $key is the orgid, but we need the name
        $label = $org_id_to_label[$key];
        $thresh = min(9, $n_labs / 15);

        if (!$label || $label == "_NULL") {
            $missing_labs += $value;
        }
        elseif ($value > $thresh) {
            $labs_data.='["' . addslashes($label) . '",' . $value . '],';
            $n_shown_labs += 1;
            $tot_shown_labs += $value;
        } else {
            $other_labs+=$value;
        }

        # doesn't include missing, but we can compare to n_scholars to know
        $labs_total_responses += $value;

}
if ($missing_labs>0){
    $labs_data.='{"name":"Missing data", "y":'. $missing_labs . ', "color":"'.$COLOR_MISSING.'"},';
}
if ($other_labs>0){
    $labs_data.='{"name":"Others", "y":'. $other_labs . ', "color":"'.$COLOR_OTHERS.'"}';
} else {
    $labs_data = substr($labs_data, 0, -1);
}

$labs_data.=']';


// $share_of_shown_labs = sprintf("%.6f", $tot_shown_labs/$labs_total_responses);
$share_of_shown_labs = sprintf("%.6f", $tot_shown_labs/count($scholars));

$insts_data = "data: [";
$n_insts = count($inst_counts);
$n_shown_insts = 0 ;
$tot_shown_insts = 0;
$insts_total_responses = 0;
foreach ($inst_counts as $key => $value) {
        $label = $org_id_to_label[$key];
        $thresh = min(9, $n_insts / 15);

        if (!$label) {
            $missing_insts += $value;
        }
        elseif ($value > $thresh) {
            $insts_data.='["' . addslashes($label) . '",' . $value . '],';
            $n_shown_insts += 1;
            $tot_shown_insts += $value;
        } else {
            $other_insts+=$value;
        }

        $insts_total_responses+=$value;

}
if ($missing_insts>0){
    $insts_data.='{"name":"Missing data", "y":'. $missing_insts . ', "color":"'.$COLOR_MISSING.'"},';
}
if ($other_labs>0){
    $insts_data.='{"name":"Others", "y":'. $other_insts . ', "color":"'.$COLOR_OTHERS.'"}';
} else {
    // removes the last ',' from line 257 or 264
    $insts_data = substr($insts_data, 0, -1);
}

$insts_data.=']';

// $share_of_shown_insts = sprintf("%.6f", $tot_shown_insts/$insts_total_responses);
$share_of_shown_insts = sprintf("%.6f", $tot_shown_insts/count($scholars));

// print_r("shown_insts_total % ".$share_of_shown_insts);

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
			plotShadow: false,
            colors: '.$COLOR_SCHEME.'
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
			plotShadow: false,
            colors: '.$COLOR_SCHEME.'
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
			plotShadow: false,
            colors: '.$COLOR_SCHEME.'
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

    var MIN_DISTINCT_LABS = parseInt('.$MIN_DISTINCT_LABS.')
    var MIN_DISTINCT_LABS_SCHOLARS_SHARE = parseFloat('.$MIN_DISTINCT_LABS_SCHOLARS_SHARE.')

    if (
        parseInt('.$n_shown_labs.') >= MIN_DISTINCT_LABS
        && parseFloat('.$share_of_shown_labs.') >= MIN_DISTINCT_LABS_SCHOLARS_SHARE
        ) {

        labs= new Highcharts.Chart({
    		chart: {
    			renderTo: "labs_div",
    			plotBackgroundColor: null,
    			plotBorderWidth: null,
    			plotShadow: false,
                colors: '.$COLOR_SCHEME.'
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

    var MIN_DISTINCT_INSTS = parseInt('.$MIN_DISTINCT_INSTS.')
    var MIN_DISTINCT_INSTS_SCHOLARS_SHARE = parseFloat('.$MIN_DISTINCT_INSTS_SCHOLARS_SHARE.')

    if ( parseInt('.$n_shown_insts.') >= MIN_DISTINCT_INSTS
            && parseFloat('.$share_of_shown_insts.') >= MIN_DISTINCT_INSTS_SCHOLARS_SHARE
            ) {

        insts= new Highcharts.Chart({
    		chart: {
    			renderTo: "insts_div",
    			plotBackgroundColor: null,
    			plotBorderWidth: null,
    			plotShadow: false,
                colors: '.$COLOR_SCHEME.'
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
