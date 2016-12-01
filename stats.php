<?php
include ('parametres.php');
include ('normalize.php');
$sql = 'SELECT * FROM scholars ';


$base = new PDO('sqlite:' . $dbname);
include ('stat-prep.php');

echo '
    <!DOCTYPE HTML>
<html>
	<head>
		<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
		<script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js"></script>
		<script type="text/javascript">
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
			name: "Browser share",';	
                echo $country_data;
		echo '}]
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
			name: "Browser share",';	
                echo $position_data;
		echo '}]
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
			name: "Browser share",';	
                echo $title_data;
		echo '}]
	});



});





</script>
     	<script type="text/javascript">
		  var _gaq = _gaq || [];
		  _gaq.push([\'_setAccount\', \'UA-30062222-1\']);
		  _gaq.push([\'_setDomainName\', \'communityexplorer.org\']);
		  _gaq.push([\'_trackPageview\']);

		  (function() {
		    var ga = document.createElement(\'script\'); ga.type = \'text/javascript\'; ga.async = true;
		    ga.src = (\'https:\' == document.location.protocol ? \'https://ssl\' : \'http://www\') + \'.google-analytics.com/ga.js\';
		    var s = document.getElementsByTagName(\'script\')[0]; s.parentNode.insertBefore(ga, s);
		  })();
		</script>
	</head>

	<body>
<script type="text/javascript" src="Highcharts-2.2.0/js/highcharts.js"></script>
<script type="text/javascript" src="Highcharts-2.2.0/js/modules/exporting.js"></script>

<div id="country" style="width: 800px; height: 400px; margin: 0 auto"></div>
<div id="title" style="width: 800px; height: 400px; margin: 0 auto"></div>
<div id="position" style="width: 800px; height: 400px; margin: 0 auto"></div>
	</body>
</html>
";
';

?>
