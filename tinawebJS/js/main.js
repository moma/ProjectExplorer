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
        pr("do nothing, 'cause don't wanna");
        // $('#mainmodal').modal('show');
        // $("#my-text-input").tokenInput("try.json");
     //    pr("doing something 'cause i'm a doer"); mainfile=true;
	    // bringTheNoise("data/pkmn_types.gexf","mono");
     //    scanCategories();
    } else {

	    if(getUrlParam.nodeidparam.indexOf("__")===-1){
    		//gexfPath = "php/bridgeClientServer_filter.php?query="+getUrlParam.nodeidparam;
            param=getUrlParam.nodeidparam;
            // pr(param)
            bringTheNoise(param,"filtermode");

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
    
    $('#modalloader').modal('show');
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


    // $("#statsicon").click(function(){
    //     $('#statsmodal').modal('show');
    // });
    

    //  === start minimap library... currently off  === //
    startMiniMap();
    

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
        // < === DATA EXTRACTION === >
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
                            pushSWClick("social");
                            pr(partialGraph._core.graph.nodes.length)
                            pr(partialGraph._core.graph.edges.length)
                            nbnodes = partialGraph._core.graph.nodes.length
                            if(nbnodes>=400 && nbnodes<1000) {
                                snbnodes = nbnodes+"";
                                cut1 = snbnodes[0];
                                cut2 = snbnodes.length;
                                pr("cut1: "+cut1)
                                pr("cut2: "+cut2)
                                iterationsFA2 = Math.round(iterationsFA2/(cut1/cut2))
                            }
                            if(nbnodes>=1000) iterationsFA2 = 150;
                            pr("iterationsFA2: "+iterationsFA2)
                            var netname = pathfile.replace(/\_/g, ' ').toUpperCase();
                            $("#network").html(netname);
        // < === ASYNCHRONOUS FA2.JS === >




                            // var vis_nds = getVisibleNodes();
                            // pr("before_change... visible nodes:")
                            // for(var i in vis_nds)
                            //     pr(vis_nds[i].id+" : "+vis_nds[i].degree)


                            // var vis_ndsIndex = {}
                            // for(var n in vis_nds)  {
                            //     id = vis_nds[n].id
                            //     vis_ndsIndex[id] = vis_nds[n]
                            //     vis_ndsIndex[id].degree = 0;
                            // }

                            // var vis_edgs = getVisibleEdges();
                            // for(var e in vis_edgs) {
                            //     e1 = vis_edgs[e]
                            //     n1 = e1.source.id
                            //     n2 = e1.target.id
                            //     vis_ndsIndex[n1]["degree"]++;
                            //     vis_ndsIndex[n2]["degree"]++;
                            // }

                            // pr("after_change... visible nodes:")
                            // for(var i in vis_ndsIndex)
                            //     pr(vis_ndsIndex[i].id+" : "+vis_ndsIndex[i].degree)





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
                                theListeners(); 
                            }); 
    		    },
    		    error: function(){ 
    		        pr("Page Not found. parseCustom, inside the IF");
    		    }
    		});
	    } else {
            if ("filtermode") {


                




            // "php/bridgeClientServer_filter.php?query="+getUrlParam.nodeidparam;
            pr("bring the noise, case: query with multiple filters");
            pr(getClientTime()+" : DataExt Ini");
            pr(bridge["forFilteredQuery"]+"?query="+getUrlParam.nodeidparam);
        // < === DATA EXTRACTION === >
            $.ajax({
                type: 'GET',
                url: bridge["forFilteredQuery"],
                data: "query="+getUrlParam.nodeidparam,
                contentType: "application/json",
                dataType: 'jsonp',
                async: true,
                success : function(data){
                            if(!isUndef(getUrlParam.seed))seed=getUrlParam.seed;
                            extractFromJson(data,seed);
                            pr(getClientTime()+" : DataExt Fin");
        // < === DATA EXTRACTED!! === >

                            if(fa2enabled==="off") $("#edgesButton").hide();
                            pushSWClick("social");
                            pr(partialGraph._core.graph.nodes.length)
                            pr(partialGraph._core.graph.edges.length)
                            nbnodes = partialGraph._core.graph.nodes.length
                            if(nbnodes>=400 && nbnodes<1000) {
                                snbnodes = nbnodes+"";
                                cut1 = snbnodes[0];
                                cut2 = snbnodes.length;
                                pr("cut1: "+cut1)
                                pr("cut2: "+cut2)
                                iterationsFA2 = Math.round(iterationsFA2/(cut1/cut2))
                            }
                            if(nbnodes>=1000) iterationsFA2 = 150;
                            pr("iterationsFA2: "+iterationsFA2)
                            var netname = pathfile.replace(/\_/g, ' ').toUpperCase();
                            $("#network").html("MultiQuery: lalala");
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
}

function theListeners(){
    pr("in THELISTENERS");
    // leftPanel("close");
    $("#closeloader").click();//modal.hide doesnt work :c
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
        $('#savemodal').modal('show');
    });
    
        /******************* /SEARCH ***********************/
    $.ui.autocomplete.prototype._renderItem = function(ul, item) {
        var searchVal = $("#searchinput").val();
        var desc = extractContext(item.desc, searchVal);
        return $('<li onclick=\'var s = "'+item.label+'"; search(s);$("#searchinput").val(strSearchBar);\'></li>')
        .data('item.autocomplete', item)
        .append("<a><span class=\"labelresult\">" + item.label + "</span></a>" )
        .appendTo(ul);
    };

    $('input#searchinput').autocomplete({
        source: function(request, response) {
            matches = [];
            var matcher = new RegExp($.ui.autocomplete.escapeRegex(request.term), "i");
            pr(labels);
            var results = $.grep(labels, function(e) {
                return matcher.test(e.label); //|| matcher.test(e.desc);
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
    
    // i've a list of coincidences and i press enter like a boss
    $("#searchinput").keydown(function (e) {
        if (e.keyCode == 13 && $("input#searchinput").data('is_open') === true) {
            // Search has several results and you pressed ENTER
            if(!is_empty(matches)) {                
                var coincidences = []
                for(j=0;j<matches.length;j++){
                	coincidences.push(matches[j].id)
                }
                pr("coincidencees: ");
                pr(coincidences);
                $.doTimeout(30,function (){
                	MultipleSelection(coincidences);
                });
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
            // pr(s)
            // pr(exactfind(s))
            $("#searchinput").val(strSearchBar);
            var coincidence = exactfind(s);
			$.doTimeout(30,function (){
                	MultipleSelection(coincidence.id);
            });
			$("input#searchinput").val("");
            $("input#searchinput").autocomplete( "close" );
            // if(categoriesIndex.length==1) updateLeftPanel_uni();
            // if(categoriesIndex.length==2) updateLeftPanel_fix();            
        }
    });
    
    $("#searchsubmit").click(function () {
        pr("searchsubmit CLICK");
        var s = $("#searchinput").val();
        search(s);
        $("#searchinput").val(strSearchBar);
    });
    /******************* /SEARCH ***********************/

    // button CENTER
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
                // LevelButtonDisable(true);
            }
        }
    });
    
    // minimap stuff
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
        })
        .mousewheel(onGraphScroll)
        .mousedown(function(e){

            //left click!
            if(e.which==1){


                var targeted = partialGraph._core.graph.nodes.filter(function(n) {
                    return !!n['hover'];
                }).map(function(n) {
                    return n.id;
                });
                
                partialGraph.dispatch(
                    e['type'] == 'mousedown' ?
                    'downgraph' :
                    'upgraph'
                );

                if(cursor_size>0) {
                    //Multiple selection

                    x1 = partialGraph._core.mousecaptor.mouseX;
                    y1 = partialGraph._core.mousecaptor.mouseY;
                    var counter=0;
                    var actualSel=[];
                    partialGraph.iterNodes(function(n){
                        if(!n.hidden){
                            distance = Math.sqrt(
                                Math.pow((x1-parseInt(n.displayX)),2) +
                                Math.pow((y1-parseInt(n.displayY)),2)
                                );
                            if(parseInt(distance)<=cursor_size) {
                                counter++;
                                actualSel.push(n.id);                                
                            }
                        }
                    });                    
                    MultipleSelection(actualSel);
                    // //The most brilliant way of knowing if an array is empty in the world of JavaScript
                    i=0; for(var s in actualSel) { i++; break;}
                    
                    if(is_empty(actualSel) || i==0){ 
                        pr("cursor radius ON, mouseDown -> selecciones vacias"); 
                        cancelSelection(false);                
                        LevelButtonDisable(true);
                        //                        $("#names").html("");
                        //                        $("#opossiteNodes").html("");
                        //                        $("#information").html("");
                        //                        $("#topPapers").html("");
                        //                        $("#tips").html(getTips());
                        //                        changeButton("unselectNodes");
                        //                        if(counter>0) graphResetColor();
                    }      

                } else {
                    //Unique Selection
                    partialGraph.dispatch(
                        e['type'] == 'mousedown' ? 'downnodes' : 'upnodes',
                        targeted
                        );
                }      
                
                partialGraph.draw();
                

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
        	// pr("*******lalala***********")
        	// pr(partialGraph.position().ratio)
        	// pr(sigmaJsMouseProperties.minRatio)
        	// pr(sigmaJsMouseProperties.maxRatio)
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
        if(!fa2enabled){
            fa2enabled=true;
            partialGraph.startForceAtlas2();
        } else {
            partialGraph.stopForceAtlas2();
        }
    });
    


    //  finished but not used
    //  NodeWeightFilter ( "#sliderANodeWeight" ,  "Document" , "type" , "size")
    $("#sliderANodeWeight").freshslider({
        range: true,
        step:1,
        value:[10, 60],
        enabled: false,
        onchange:function(low, high){
            console.log(low, high);
        }
    });

    //  finished
    EdgeWeightFilter("#sliderAEdgeWeight", "label" , "nodes1", "weight");


    //finished
    $("#sliderANodeSize").freshslider({
        step:1,
        min:1,
        max:25,
        value:1,
        bgcolor:"#27c470",
        onchange:function(value){
            $.doTimeout(100,function (){2
                   partialGraph.iterNodes(function (n) {
                       if(Nodes[n.id].type==catSoc) {
                           n.size = parseFloat(Nodes[n.id].size) + parseFloat((value-1))*0.3;
                       }
                   });
                   partialGraph.draw();
            });
        }
    }); 

    //finished
    $("#sliderBNodeSize").freshslider({
        step:1,
        min:1,
        max:25,
        value:1,
        bgcolor:"#FFA500",
        onchange:function(value){
            $.doTimeout(100,function (){
                   partialGraph.iterNodes(function (n) {
                       if(Nodes[n.id].type==catSem) {
                           n.size = parseFloat(Nodes[n.id].size) + parseFloat((value-1))*0.3;
                       }
                   });
                   partialGraph.draw();
            });
        }
    }); 


    // NodeWeightFilter ( "#sliderBNodeWeight" ,  "NGram" , "type" , "size") 

    // EdgeWeightFilter("#sliderBEdgeWeight", "label" , "nodes2", "weight");
    
    
    //finished
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


    // $.doTimeout(10,function (){
	   //  var deftoph=$("#defaultop").height();
	   //  var refh=$("#fixedtop").height();
	   //  pr("deftoph:"+deftoph+" vs refh:"+refh)
	   //  pr("deftoph:"+deftoph+" vs refh*2:"+refh*2)
	   //  pr("if deftoph > refh*2 ")
	   //  pr(deftoph+">"+(refh*2)+" : "+(deftoph>(refh*2))+"     then reload window")
	   //  // deftoph.height(64);
    // 	// if(deftoph>(refh*2)) window.location.reload();
    // });

}

