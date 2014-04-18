<?php
;
/*
 * Pre compute some element for statistics
 * and open the template in the editor.
 */

$country_list = array();
$position_list = array();
$title_list = array();
$organizations_list = array();

$other_country = 0;
$other_title = 0;
$other_position = 0;
$other_organization = 0;
$missing_country = 0;
$missing_title = 0;
$missing_position = 0;
$missing_organization = 0;
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
    
    // traitement des organismes de rattachement
    $affiliation = trim($row["affiliation"]);
    
    if (strcmp($affiliation, "") == 0) {
        $missing_affiliation+=1;
    } else {        

        if (array_key_exists($affiliation, $organizations_list)) {
            $organizations_list[$affiliation]+=1;
        } else {
            $organizations_list[$affiliation] = 1;
           
        }
    }
    $affiliation2 = trim($row["affiliation2"]);
    
    if (strcmp($affiliation2, "") == 0) {
        $missing_affiliation+=1;
    } else {        

        if (array_key_exists($affiliation2, $organizations_list)) {
            $organizations_list[$affiliation2]+=1;
        } else {
            $organizations_list[$affiliation2] = 1;
           
        }
    }
    
}



asort($country_list);
asort($position_list);
asort($title_list);
asort($organizations_list);


// données des pays
$country_data = "data: [";
foreach ($country_list as $key => $value) {

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


$stats = '<script type="text/javascript">
var country;
var position;
var title;
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

        titre= new Highcharts.Chart({
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
			name: "Titles",' . $title_data
        . '}]
	});

        organization= new Highcharts.Chart({
		chart: {
			renderTo: "organizations",
			plotBackgroundColor: null,
			plotBorderWidth: null,
			plotShadow: false
		},
		title: {
			text: "Affiliations"
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
			name: "Affiliations",' . $organizations_data
        . '}]
	});


});








</script>';
?>
