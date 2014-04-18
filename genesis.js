
function pr(msg){
	console.log(msg);
}

var counter=0;

$( window ).resize(function() {
  counter++;
  $("#log").html("redimension numero: "+counter);
});

