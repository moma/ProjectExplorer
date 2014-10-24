

function calc_range(begin, end) {
  if (typeof end === "undefined") {
    end = begin; begin = 0;
  }
  var result = [], modifier = end > begin ? 1 : -1;
  for ( var i = 0; i <= Math.abs(end - begin); i++ ) {
    result.push(begin + i * modifier);
  }
  return result;
}


var lastFilter = []
    lastFilter["#sliderBNodeWeight"] = "-"
    lastFilter["#sliderAEdgeWeight"] = "-"
    lastFilter["#sliderBEdgeWeight"] = "-"


function pushFilterValue(filtername,arg){
    lastFilter[filtername] = arg;
}

var finalarray = [];
    finalarray.push(["D:01","D:02","D:03","D:04","D:05","D:06","D:07","D:08","D:09","D:10"])
    finalarray.push(["D:11","D:12","D:13","D:14","D:15","D:16","D:17","D:18","D:19","D:20"])
    finalarray.push(["D:21","D:22","D:23","D:24","D:25","D:26","D:27","D:28","D:29","D:30"])
    finalarray.push(["D:31","D:32","D:33","D:34","D:35","D:36","D:37","D:38","D:39","D:40"])
    finalarray.push(["D:41","D:42","D:43","D:44","D:45","D:46","D:47","D:48","D:49","D:50"])
    finalarray.push(["D:51","D:52","D:53","D:54","D:55","D:56","D:57","D:58","D:59","D:60"])
    finalarray.push(["D:61","D:62","D:63","D:64","D:65","D:66","D:67","D:68","D:69","D:70"])
    finalarray.push(["D:71","D:72","D:73","D:74","D:75","D:76","D:77","D:78","D:79","D:80"])
    finalarray.push(["D:81","D:82","D:83","D:84","D:85","D:86","D:87","D:88","D:89","D:90"])
    finalarray.push(["D:91","D:92","D:93","D:94","D:95","D:96","D:97","D:98","D:99","D:100"])

var steps = finalarray.length;

var sliderDivID = "#sliderBEdgeWeight";

var lastvalue=("0-"+(steps-1));

pushFilterValue( sliderDivID , "0-"+(steps-1) )

//finished
$(sliderDivID).freshslider({
    range: true,
    step: 1,
    min:0,
    bgcolor: "#FFA500" ,
    max:steps-1,
    value:[0,steps-1],
    onchange:function(low, high) {

        var filtervalue = low+"-"+high

        if(filtervalue!=lastFilter[sliderDivID]) {

            $.doTimeout(sliderDivID+"_"+lastFilter[sliderDivID]);
            
            $.doTimeout( sliderDivID+"_"+filtervalue,2000,function () {

                pr("\nprevious value "+lastvalue+" | current value "+filtervalue)

                var t0 = lastvalue.split("-")
                var mint0=parseInt(t0[0]), maxt0=parseInt(t0[1]), mint1=parseInt(low), maxt1=parseInt(high);
                var addflag = false;
                var delflag = false;

                var iterarr = []

                if(mint0!=mint1) {
                    if(mint0<mint1) {
                        delflag = true;
                        pr("cotainferior   --||>--------||   a la derecha")
                    }
                    if(mint0>mint1) {
                        addflag = true;
                        pr("cotainferior   --<||--------||   a la izquierda")
                    }
                    iterarr = calc_range(mint0,mint1).sort();
                }

                if(maxt0!=maxt1) {
                    if(maxt0<maxt1) {
                        addflag = true;
                        pr("cotasuperior   ||--------||>--   a la derecha")
                    }
                    if(maxt0>maxt1) {
                        delflag = true;
                        pr("cotasuperior   ||--------<||--   a la izquierda")
                    }
                    iterarr = calc_range(maxt0,maxt1).sort();
                }

                for( var c in iterarr ) {
                    
                    var i = iterarr[c];
                    ids = finalarray[i]

                    if(i>=low && i<=high){
                        if(addflag) {
                            pr("\tADD pos"+i+": "+ids.join())
                        }

                    } else {
                        if(delflag) {
                            pr("\tDEL pos"+i+": "+ids.join())
                        }
                    }

                }

                lastvalue = filtervalue;
            });  

            pushFilterValue( sliderDivID , filtervalue )

        }



   }

});