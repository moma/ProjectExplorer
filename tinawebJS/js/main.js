//  === monitor windows resize === //
var counterrrr=0;
$( window ).resize(function() {
  counterrrr++;
  $("#log").html("redimension nro: "+counterrrr);
  sigmaLimits();
});//  === / monitor windows resize === //


//  === [what to do at start] === //
if (mainfile) {
	listGexfs();
	if(!isUndef(getUrlParam.file)){
	    $.doTimeout(30,function (){
    		parse(getUrlParam.file);
    		nb_cats = scanCategories();  
    		pr("nb_cats: "+nb_cats);
    		listGexfs();    		
            graphtype=(nb_cats==1)?"mono":"bi";
    		bringTheNoise(getUrlParam.file,graphtype);
    		
    		$.doTimeout(30,function (){
    		    if(!isUndef(gexfDict[getUrlParam.file])){
    		        $("#currentGraph").html(gexfDict[getUrlParam.file]);
    		    } else $("#currentGraph").html(getUrlParam.file);
    		    scanDataFolder();
    		});            
	    });
	} else {
	    window.location.href=window.location.origin+window.location.pathname+"?file="+mainfile;
	}
} else {

    if(isUndef(getUrlParam.nodeidparam)) {
        pr("doing something 'cause i'm a doer"); mainfile=true;
	    bringTheNoise("data/pkmn_types.gexf","mono");
    } else {

	    if(getUrlParam.nodeidparam.indexOf("__")===-1){
    		//gexfPath = "php/bridgeClientServer_filter.php?query="+getUrlParam.nodeidparam;
    		pr("not implemented yet");
	    } else {
    		param=getUrlParam.nodeidparam;
            pr(param)
            bringTheNoise(param,"unique_id");
	    }
    }
}//  === [ / what to do at start ] === //


//just CSS
function sigmaLimits(){
    pr("\t*** sigmaLimits()")
    
    pw=$('#sigma-example').width();
    ph=$('#sigma-example').height();    
    pr("\t\tprevsigma:("+pw+","+ph+")");
    
    sidebar=$('#leftcolumn').width();
    anchototal=$('#fixedtop').width();
    altototal=$('#leftcolumn').height();
    altofixtop=$('#fixedtop').height()
    altodeftop=$('#defaultop').height()
    $('#sigma-example').width(anchototal-sidebar);
    $('#sigma-example').height(altototal-altofixtop-altodeftop-4);
    
    pw=$('#sigma-example').width();
    ph=$('#sigma-example').height();
    pr("\t\tnowsigma:("+pw+","+ph+")");
}

function bringTheNoise(pathfile,type){
    //    $('.modal').modal('show');

    //  === get width and height   === //
    sigmaLimits();
    
    //  === sigma canvas resize  with previous values === //
    partialGraph = sigma.init(document.getElementById('sigma-example'))
    .drawingProperties(sigmaJsDrawingProperties)
    .graphProperties(sigmaJsGraphProperties)
    .mouseProperties(sigmaJsMouseProperties);
    

    //  ===  resize topbar and tweakbar  === //
    var body=document.getElementsByTagName('body')[0];
    body.style.paddingTop="41px";


    $("#changetype").click(function(){
    	pr("")
    	pr(" ############  changeTYPE click");
		printStates()

        changeType();


		printStates()
    	pr(" ############  / changeTYPE click");
    	pr("")
    });


    $("#changelevel").click(function(){
    	pr("")
    	pr(" ############  changeLEVEL click");
    	printStates()

        changeLevel();

        printStates()
    	pr(" ############  / changeLEVEL click");
    	pr("")
    });

    //  ===  un/hide leftpanel  === //
    $("#aUnfold").click(function(e) {
        //SHOW leftcolumn
        sidebar = $("#leftcolumn");
        fullwidth=$('#fixedtop').width();
        e.preventDefault();
        // $("#wrapper").toggleClass("active");
        if(parseFloat(sidebar.css("right"))<0){            
            $("#aUnfold").attr("class","rightarrow"); 
            sidebar.animate({
                "right" : sidebar.width()+"px"
            }, { duration: 400, queue: false }); 

            $("#ctlzoom").animate({
                    "right": (sidebar.width()+10)+"px"
            }, { duration: 400, queue: false }); 
               
            // $('#sigma-example').width(fullwidth-sidebar.width());
            $('#sigma-example').animate({
                    "width": fullwidth-sidebar.width()+"px"
            }, { duration: 400, queue: false }); 
            setTimeout(function() {
                  partialGraph.resize();
                  partialGraph.refresh();
            }, 400);
        } 
        else {
            //HIDE leftcolumn
            $("#aUnfold").attr("class","leftarrow");
            sidebar.animate({
                "right" : "-" + sidebar.width() + "px"
            }, { duration: 400, queue: false });

            $("#ctlzoom").animate({
                    "right": "0px"
            }, { duration: 400, queue: false }); 

                // $('#sigma-example').width(fullwidth);
            $('#sigma-example').animate({
                    "width": fullwidth+"px"
            },{ duration: 400, queue: false });
            setTimeout(function() {
                  partialGraph.resize();
                  partialGraph.refresh();
            }, 400);
            
        }   
    });

    //  === start minimap library... currently off  === //
    startMiniMap();

    var deftoph=$("#defaultop").height();
    var refh=$("#fixedtop").height();
    pr("deftoph:"+deftoph+" vs refh: "+refh)
    if(deftoph>(refh*2)) window.location.reload();

    console.log("parsing...");    
    // < === EXTRACTING DATA === >
    if(mainfile) {
        pr("mainfile: "+mainfile)
	    parse(decodeURIComponent(pathfile));
	    if(type=="mono") {
    		onepartiteExtract(); 
    		$("#left").hide();
	    } else if(type=="bi")  fullExtract(); 

        partialGraph.zoomTo(partialGraph._core.width / 2, partialGraph._core.height / 2, 0.8).draw(2,2,2);
        theListeners(); 

    } else {
	    if(type=="unique_id") {
		    pr("bring the noise, case: unique_id");
            pr(getClientTime()+" : DataExt Ini");
    		$.ajax({
    		    type: 'GET',
    		    url: bridge["forNormalQuery"],
    		    data: "unique_id="+pathfile+"&it="+iterationsFA2,
    		    contentType: "application/json",
    		    dataType: 'jsonp',
    		    async: true,
    		    success : function(data){
                            if(!isUndef(getUrlParam.seed))seed=getUrlParam.seed;
    			            extractFromJson(data,seed);
                            pr(getClientTime()+" : DataExt Fin");
        // < === DATA EXTRACTED!! === >

                            if(fa2enabled==="off") $("#edgesButton").hide();
                            // updateEdgeFilter("social");
                            // updateNodeFilter("social");
                            pushSWClick("social");

        // < === ASYNCHRONOUS FA2.JS === >
                            pr(getClientTime()+" : Ini FA2");
                            var ForceAtlas2 = new Worker("FA2.js");
                            ForceAtlas2.postMessage({ 
                                "nodes": partialGraph._core.graph.nodes,
                                "edges": partialGraph._core.graph.edges,
                                "it":iterationsFA2
                            });
                            ForceAtlas2.addEventListener('message', function(e) {
                                iterations=e.data.it;
                                nds=e.data.nodes;
                                for(var n in nds){
                                    id=nds[n].id;
                                    x=nds[n].x
                                    y=nds[n].y
                                    partialGraph._core.graph.nodes[n].x=x;
                                    partialGraph._core.graph.nodes[n].y=y;
                                    partialGraph._core.graph.nodesIndex[id].x=x
                                    partialGraph._core.graph.nodesIndex[id].y=y
                                    Nodes[id].x=x;
                                    Nodes[id].y=y;
                                }
                                pr("\ttotalIterations: "+iterations)
                                pr(getClientTime()+" : Fin FA2");
                                console.log("Parsing and FA2 complete.");
        // < === ASYNCHRONOUS FA2.JS DONE!! === >

                                // // leftPanel("close");
                                // $("#closemodal").click();//modal.hide doesnt work :c
                                // //    startForceAtlas2(partialGraph._core.graph);r(

                                // cancelSelection(false);        
                                // $("#tips").html(getTips());
                                // //$('#sigma-example').css('background-color','white');
                                // $("#category-B").hide();
                                // $("#labelchange").hide();
                                // $("#availableView").hide(); 
                                // showMeSomeLabels(6);
                                // initializeMap();
                                // updateMap();
                                // updateDownNodeEvent(false);
                                // partialGraph.zoomTo(partialGraph._core.width / 2, partialGraph._core.height / 2, 0.8).draw(2,2,2);
                                theListeners(); 
                            }); 
    		    },
    		    error: function(){ 
    		        pr("Page Not found. parseCustom, inside the IF");
    		    }
    		});
	    }
    }  
}

function theListeners(){
    pr("in THELISTENERS");
    // leftPanel("close");
    $("#closemodal").click();//modal.hide doesnt work :c
    //    startForceAtlas2(partialGraph._core.graph);r(

    cancelSelection(false);        
    $("#tips").html(getTips());
    //$('#sigma-example').css('background-color','white');
    $("#category-B").hide();
    $("#labelchange").hide();
    $("#availableView").hide(); 
    showMeSomeLabels(6);
    initializeMap();
    updateMap();
    updateDownNodeEvent(false);
    partialGraph.zoomTo(partialGraph._core.width / 2, partialGraph._core.height / 2, 0.8).draw(2,2,2);
    $("#saveAs").click(function() {
        saveGEXF();
    });
    
    //    $("#aUnfold").click(function() {        
    //        _cG = $("#leftcolumn");
    //        anchototal=$('#fixedtop').width();
    //        sidebar=_cG.width();
    //
    //        if (_cG.offset().left < 0) {
    //            _cG.animate({
    //                "left" : sidebar+"px"
    //            }, function() {
    //                $("#aUnfold").attr("class","leftarrow");                
    //                $('#sigma-example').width(anchototal-sidebar);
    //                $("#ctlzoom").css({
    //                    left: (sidebar+10)+"px"
    //                });
    //            }); 
    //        } else {
    //            _cG.animate({
    //                "left" : "-" + _cG.width() + "px"
    //            }, function() {
    //                $("#aUnfold").attr("class","rightarrow");
    //                $('#sigma-example').width(anchototal);
    //                $("#ctlzoom").css({
    //                    left: "0px"
    //                });
    //            });
    //        }
    //        return false;
    //    });
    //    
        /******************* /SEARCH ***********************/
    $.ui.autocomplete.prototype._renderItem = function(ul, item) {
        var searchVal = $("#searchinput").val();
        var desc = extractContext(item.desc, searchVal);
        return $('<li onclick=\'var s = "'+item.label+'"; search(s);$("#searchinput").val(strSearchBar);\'></li>')
        .data('item.autocomplete', item)
        .append("<a><span class=\"labelresult\">" + item.label + "</span><br ><small>" + desc + "<small></a>" )
        .appendTo(ul);
    };

    $('input#searchinput').autocomplete({
        source: function(request, response) {
            matches = [];
            var matcher = new RegExp($.ui.autocomplete.escapeRegex(request.term), "i");
            var results = $.grep(labels, function(e) {
                return matcher.test(e.label) || matcher.test(e.desc);
            });
            
            if (!results.length) {
                $("#noresults").text("Pas de résultats");
            } else {
                $("#noresults").empty();
            }
            matches = results.slice(0, maxSearchResults);
            response(matches);
            
        },
        minLength: minLengthAutoComplete
    }); 
   
    $('#searchinput').bind('autocompleteopen', function(event, ui) {
        $(this).data('is_open',true);
    });
    $('#searchinput').bind('autocompleteclose', function(event, ui) {
        $(this).data('is_open',false);
    });
    $("#searchinput").focus(function () {
        if ($(this).val() == strSearchBar) {
            $(this).val('');
        }
    });
    $("#searchinput").blur(function () {
        if ($(this).val() == '') {
            $(this).val(strSearchBar);
        }
    });
    
    $("#searchinput").keydown(function (e) {
        if (e.keyCode == 13 && $("input#searchinput").data('is_open') === true) {
            // Search has several results and you pressed ENTER
            if(!is_empty(matches)) {
                checkBox=true;
                for(j=0;j<matches.length;j++){
                    nodeFound=searchLabel(matches[j].label);
                    getOpossitesNodes(nodeFound,true); 
                }

                if(is_empty(selections)==true){  
                    $("#names").html("");
                    $("#opossiteNodes").html("");
                    $("#information").html("");
                    changeButton("unselectNodes");
                }
                else {
                    greyEverything();
                    overNodes=true;
                    for(var i in selections){
                        markAsSelected(i,true);
                    }
                    changeButton("selectNode");
                    partialGraph.draw();
                }
                checkBox=false;
                $("input#searchinput").val("");
                $("input#searchinput").autocomplete( "close" );
                //$("input#searchinput").trigger('autocompleteclose');
            }
        }
    });
    
    $("#searchinput").keyup(function (e) {
        if (e.keyCode == 13 && $("input#searchinput").data('is_open') !== true) {
            pr("search KEY UP");
            var s = $("#searchinput").val();
            $("#searchinput").val(strSearchBar);
            if(categoriesIndex.length==1) updateLeftPanel_uni();
            if(categoriesIndex.length==2) updateLeftPanel_fix();            
        }
    });
    
    $("#searchsubmit").click(function () {
        pr("searchsubmit CLICK");
        var s = $("#searchinput").val();
        search(s);
        $("#searchinput").val(strSearchBar);
    });
    /******************* /SEARCH ***********************/

    
    $("#lensButton").click(function () {
        partialGraph.position(0,0,1);
        partialGraph.zoomTo(partialGraph._core.width / 2, partialGraph._core.height / 2, 0.8);
        partialGraph.refresh();
        partialGraph.startForceAtlas2();
    });
    
    $('#sigma-example').dblclick(function(event) {
        pr("in the double click event");
        targeted = partialGraph._core.graph.nodes.filter(function(n) {
                return !!n['hover'];
            }).map(function(n) {
                return n.id;
            });
            
        if(!is_empty(targeted)) changeLevel();
        else {
            if(!is_empty(selections)){
                cancelSelection(false);                
                LevelButtonDisable(true);
            }
        }
    });
    
    
    // $("#overview")
    //    .mousemove(onOverviewMove)
    //    .mousedown(startMove)
    //    .mouseup(endMove)
    //    .mouseout(endMove)
    //    .mousewheel(onGraphScroll);
    
    $("#sigma-example")
    .mousemove(function(){
        if(!isUndef(partialGraph)) {
            if(cursor_size>0) trackMouse();
        }
    })
    .contextmenu(function(){
        return false;
    });
    //    .mousemove(onOverviewMove)
    //    .mousedown(startMove)
    //    .mouseup(endMove)
    //    .mouseout(endMove)
    //    .mousewheel(onGraphScroll); -> it doesn't answer!
    
    $(document).keydown(function(e) {
        if( e.shiftKey || e.which==16 ) {
        	shift_key=true;
        	partialGraph.draw();
        }
    });

    $(document).keyup(function(e) {
        if(e.shiftKey || e.which==16) {
        	shift_key=false;
        	partialGraph.draw();
        	trackMouse();
        }
    });


    $("#zoomSlider").slider({
        orientation: "vertical",
        value: partialGraph.position().ratio,
        min: sigmaJsMouseProperties.minRatio,
        max: sigmaJsMouseProperties.maxRatio,
        range: "min",
        step: 0.1,
        slide: function( event, ui ) {
        	pr("*******lalala***********")
        	pr(partialGraph.position().ratio)
        	pr(sigmaJsMouseProperties.minRatio)
        	pr(sigmaJsMouseProperties.maxRatio)
            partialGraph.zoomTo(
                partialGraph._core.width / 2, 
                partialGraph._core.height / 2, 
                ui.value);
        }
    });

    
    $("#zoomPlusButton").click(function () {
        partialGraph.zoomTo(partialGraph._core.width / 2, partialGraph._core.height / 2, partialGraph._core.mousecaptor.ratio * 1.5);
        $("#zoomSlider").slider("value",partialGraph.position().ratio);
        return false;
    });
    $("#zoomMinusButton").click(function () {
        partialGraph.zoomTo(partialGraph._core.width / 2, partialGraph._core.height / 2, partialGraph._core.mousecaptor.ratio * 0.5);
        $("#zoomSlider").slider("value",partialGraph.position().ratio);
        return false;
    });
    
    $("#edgesButton").click(function () {
        if(fa2enabled===false){
            edgesTF=true;
            fa2enabled=true;
        }
        if(edgesTF==false){
            partialGraph.stopForceAtlas2();
            partialGraph.draw();
            edgesTF=true;
        }
        else {
            partialGraph.startForceAtlas2();
            edgesTF=false;
        }
    });
    
    $("#sliderANodeWeight").freshslider({
        range: true,
        step:1,
        value:[10, 60],
        onchange:function(low, high){
            console.log(low, high);
        }
    });
    $("#sliderAEdgeWeight").freshslider({
        range: true,
        step:1,
        value:[10, 100],
        onchange:function(low, high){
            console.log(low, high);
        }
    });
    $("#sliderANodeSize").freshslider({
        step:1,
        value:10,
        onchange:function(value){
            console.log(value);
        }
    });
    
    $("#sliderBNodeWeight").freshslider({
        range: true,
        step:1,
        value:[20, 60],
        onchange:function(low, high){
            console.log(low, high);
        }
    });
    $("#sliderBEdgeWeight").freshslider({
        range: true,
        step:1,
        value:[20, 100],
        onchange:function(low, high){
            console.log(low, high);
        }
    });
    $("#sliderBNodeSize").freshslider({
        step:1,
        value:20,
        onchange:function(value){
            console.log(value);
        }
    });
    $("#unranged-value").freshslider({
        step: 1,
        min:cursor_size_min,
        max:cursor_size_max,
        value:cursor_size,
        onchange:function(value){
            // console.log("en cursorsize: "+value);
            cursor_size=value;
            if(cursor_size==0) partialGraph.draw();
        }
    });



    //    $("#sliderSelectionZone").slider({
    //        value: cursor_size,
    //        min: parseFloat(cursor_size_min),
    //        max: parseFloat(cursor_size_max),
    //        animate: true,
    //        change: function(event, ui) {
    //            cursor_size= ui.value;
    //            //if(cursor_size==0) updateDownNodeEvent(false);
    //            //else updateDownNodeEvent(true); 
    //        //return callSlider("#sliderSelectionZone", "selectionRadius");
    //        }
    //    });


    //   
    //    $("#sliderANodeSize").slider({
    //        value: 1,
    //        min: 1,
    //        max: 25,
    //        animate: true,
    //        slide: function(event, ui) {
    //            $.doTimeout(100,function (){
    //                partialGraph.iterNodes(function (n) {
    //                    pr();
    //                    if(Nodes[n.id].type==catSoc) {
    //                        n.size = parseFloat(Nodes[n.id].size) + parseFloat((ui.value-1))*0.3;
    //                    }
    //                });
    //                partialGraph.draw();
    //            });
    //        }
    //    });
    //    $("#sliderBNodeSize").slider({
    //        value: 1,
    //        min: 1,
    //        max: 25,
    //        animate: true,
    //        slide: function(event, ui) {
    //            $.doTimeout(100,function (){
    //                partialGraph.iterNodes(function (n) {
    //                    if(Nodes[n.id].type==catSem) {
    //                        n.size = parseFloat(Nodes[n.id].size) + parseFloat((ui.value-1))*0.3;
    //                    }
    //                });
    //                partialGraph.draw();
    //            });
    //        }
    //    });
    //    $("#sliderSelectionZone").slider({
    //        value: cursor_size,
    //        min: parseFloat(cursor_size_min),
    //        max: parseFloat(cursor_size_max),
    //        animate: true,
    //        change: function(event, ui) {
    //            cursor_size= ui.value;
    //            //if(cursor_size==0) updateDownNodeEvent(false);
    //            //else updateDownNodeEvent(true); 
    //        //return callSlider("#sliderSelectionZone", "selectionRadius");
    //        }
    //    });
}

