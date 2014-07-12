$("#zoomSlider").slider({
	orientation: "vertical",
	value: 10,
	min: 0,
	max: 100,
	range: "min",
	step: 1,
	slide: function( event, ui ) {
		console.log("ui.value : "+ui.value)
	}
});
