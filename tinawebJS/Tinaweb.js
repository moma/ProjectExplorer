'use strict';

// this class will be instanciated once, as SelInst (and exposed)
function SelectionEngine() {

    // creates the union of prevsels and currsels, if addvalue
    this.SelectorEngine = (function(addvalue , prevsels , currsels ) {
        // console.log("addvalue, prevsels, currsels",addvalue, prevsels, currsels)

        var targeted = []
        var buffer = Object.keys(prevsels);

        // currsels = bunch of nodes from a click in the map
        if(addvalue) {
            // FOR SIMPLE ADD WITHOUT COMPLEMENT
            targeted = currsels.concat(buffer.filter(function (item) {
                return currsels.indexOf(item) < 0;
            }));
        } else targeted = currsels;

        if(targeted.length==0) return [];

        // ------------ FOR SETWISE COMPLEMENT ---------------------->8---------
        // if(buffer.length>0) {
        //     if(JSON.stringify(buffer)==JSON.stringify(targeted)) {
        //         // this is just effective for Add[ ] ...
        //         // If previous selection is equal to the current one, you've nothing :D
        //         cancelSelection(false);
        //         return [];
        //     }
        //     var inter = this.intersect_safe(buffer,targeted)
        //     if(inter.length>0) {
        //         var blacklist = {} , whitelist = {};
        //         for(var k in inter) blacklist[inter[k]]=true;
        //         for(var k in buffer){
        //             let n = buffer[k]
        //             if(!blacklist[n]) {
        //                 whitelist[n] = true;
        //             }
        //         }
        //         for(var k in targeted){
        //             let n = targeted[k]
        //             if(!blacklist[n]) {
        //                 whitelist[n] = true;
        //             }
        //         }
        //         targeted = Object.keys(whitelist);
        //     } else {// inter = 0 ==> click in other portion of the graph (!= current selection)
        //         // Union!
        //         if(addvalue) {
        //             targeted = currsels.concat(buffer.filter(function (item) {
        //                 return currsels.indexOf(item) < 0;
        //             }));
        //         }
        //     }
        // }
        // ---------------------------------------------------------->8---------

        return targeted;
    }).index();


    // uses: SelectorEngine() and MultipleSelection2()
    // we assume string is normalized
    this.search_n_select = function(string) {

        // alert("search is happening !")
        cancelSelection(false, {norender:true});

        if (typeof string != "string") {
            return -1 ;
        }
        else if (string.length == 0) {
            // alert("really? empty query?") ;
            return 0 ;
        }
        else {
            var id_node = '';
            var results = find(string)

            var coincd=[]
            for(var i in results) {
                coincd.push(results[i].id)
            }
            var targeted = this.SelectorEngine( {
                            addvalue:checkBox,
                            prevsels:selections,
                            currsels:coincd
                        } )

            if(targeted.length>0) {
                // got results
                // -----------
                this.MultipleSelection2({nodes:targeted});

            }
            else {
                // no results
                // ----------
                // we send event for plugins
                // (eg: propose to add the missing string to the graph)
                $('#searchinput').trigger({
                    type: "tw:emptyNodeSet",
                    q: string,
                    nodeIds: []
                });
                // console.log("\n\n\n  sent [[ emptyNodes ]] \n\n ")
            }

            // anyway
            // ------
            TW.lastQuery = string ;
            $("input#searchinput").val("");
            $("input#searchinput").autocomplete( "close" );

            return targeted.length
        }
    }

    //Util
    this.intersect_safe = function(a, b) {
        a.sort()
        b.sort()
        var ai=0, bi=0;
        var result = new Array();

        while( ai < a.length && bi < b.length ) {
            if      (a[ai] < b[bi] ){ ai++; }
            else if (a[ai] > b[bi] ){ bi++; }
            else /* they're equal */ {
                result.push(a[ai]);
                ai++;
                bi++;
            }
        }
        return result;
    }

    /**
     * Main function for any selecting action
     *
     * @nodes: eg targeted array (only ids)
     *
     *  external usage : partialGraph.states,
     *                   updateRelatedNodesPanel();
     */
     // ====================
    this.MultipleSelection2 = (function(nodes,nodesDict,edgesDict) {

      if (TW.debugFlags.selections) {
        var tMS2_deb = performance.now()

        console.log("IN SelectionEngine.MultipleSelection2:")
        console.log("nodes", nodes)
      }

        greyEverything();

        var sameSideNeighbors = {}
        var oppositeSideNeighbors = {}

        // TW.partialGraph.states.slice(-1)[0] is the present graph state
        // eg
        // {categories: ["someNodeCat"]
        // categoriesDict: {"someNodeCat":0}  // where val 0 or 1 is type sem or soc
        // opposites:
        // selections:
        // type:[0]}


        var activetypesKey = getActivetypesKey()
        // console.log ("console.loging the Type:")
        // console.log (activetypesKey)
        // console.log (" - - - - - - ")
        // Dictionaries of: selection+neighbors

        var nodes_2_colour = (nodesDict)? nodesDict : {};
        var edges_2_colour = (edgesDict)? edgesDict : {};

        selections = {}


        // targeted arg 'nodes' can be nid array or single nid
        var ndsids=[]
        if(nodes) {
            if(! $.isArray(nodes)) ndsids.push(nodes);
            else ndsids=nodes;

            for(var i in ndsids) {
                var s = ndsids[i];

                if(TW.Relations[activetypesKey] && TW.Relations[activetypesKey][s] ) {
                    var neigh = TW.Relations[activetypesKey][s]
                    if(neigh) {
                        for(var j in neigh) {
                            var t = neigh[j]
                            // highlight edges (except if n hidden or e dropped (<=> lock))
                            // POSS: use sigma's own index to avoid checking if node exists or edge dropped
                            if (TW.partialGraph.graph.nodes(t)
                                && ! TW.partialGraph.graph.nodes(t).hidden
                                && (
                                    (TW.Edges[s+";"+t] && !TW.Edges[s+";"+t].lock)
                                      ||
                                    (TW.Edges[t+";"+s] && !TW.Edges[t+";"+s].lock)
                                )
                              ) {
                                edges_2_colour[s+";"+t]=true;
                                edges_2_colour[t+";"+s]=true;

                                // we add as neighbor to color it (except if already in targeted)
                                if (!nodes_2_colour[t]) nodes_2_colour[t]=false;

                              // since we're there we keep the neighbors info
                              if (typeof sameSideNeighbors[t] == 'undefined') {
                                sameSideNeighbors[t]=0
                              }
                              sameSideNeighbors[t]++
                            }
                        }
                    }
                }
                // we make the selected (source) node active too
                nodes_2_colour[s]=true;

                // update GLOBAL selections dict
                // (FIXME it's widely used but TW.SystemStates.selections has the same)
                selections[ndsids[i]]=1;
            }
        }

        for(var nid in nodes_2_colour) {
            if(nid) {
                n = TW.partialGraph.graph.nodes(nid)
                if(n) {
                    n.color = n.customAttrs['true_color'];
                    n.customAttrs['grey'] = 0;

                    // it's a selected node
                    if(nodes_2_colour[nid]) {
                        n.active = true;
                        // selections[nid]=1
                    }
                    // it's a neighbor
                    else {
                        n.customAttrs.highlight = true;
                    }
                }
            }
        }

        for(var eid in edges_2_colour) {

            // at this point all edges are grey b/c greyEverything() was called
            let an_edge = TW.partialGraph.graph.edges(eid)
            if(!isUndef(an_edge) && !an_edge.hidden){

                an_edge.customAttrs['grey'] = 0;
                an_edge.customAttrs['activeEdge'] = 1;
            }
        }

        // show the button to remove selection
        $("#unselectbutton").show() ;

        var the_new_sels = Object.keys(selections)

        if (the_new_sels.length && the_new_sels[0] == 'NaN') {
          console.error("NaN selection key error")
        }

        TW.partialGraph.states.slice(-1)[0].selections = the_new_sels;
        TW.partialGraph.states.slice(-1)[0].setState( { sels: the_new_sels} )

        // alert("MultipleSelection2=======\nthe_new_sels:" + JSON.stringify(the_new_sels))

        // global flag
        TW.selectionActive = true

        // we send our "gotNodeSet" event
        // (signal for plugins that a search-selection was done or a new hand picked selection)
        $('#searchinput').trigger({
            type: "tw:gotNodeSet",
            q: $("#searchinput").val(),
            nodeIds: the_new_sels
        });
        // console.log("Event [gotNodeSet] sent from Tinaweb MultipleSelection2")

        // neighbors of the opposite type
        if(TW.Relations["1|1"]) {
            for(var s in the_new_sels) {
                var bipaNeighs = TW.Relations["1|1"][the_new_sels[s]];

                for(var n in bipaNeighs) {
                    if (typeof oppositeSideNeighbors[bipaNeighs[n]] == "undefined")
                        oppositeSideNeighbors[bipaNeighs[n]] = 0;
                    oppositeSideNeighbors[bipaNeighs[n]]++;
                }
            }
        }

        // debug
        // var neiLabls = []
        // for (var neiId in sameSideNeighbors) {
        //   neiLabls.push(TW.Nodes[neiId].label)
        // }
        // console.log('sameSideNeighbors labels', neiLabls)

        // NB doesn't only sort by value but also
        // rewrites dict[id]: val
        //   as array[order]: {key:id, value:val}
        var oppos = ArraySortByValue(oppositeSideNeighbors, function(a,b){
            return b-a
        });
        var same = ArraySortByValue(sameSideNeighbors, function(a,b){
            return b-a
        });

        if (TW.debugFlags.selections) {
          console.debug('selections', selections)
          console.debug('oppos', oppos)
          console.debug('same', same)
        }

        overNodes=true;

        TW.partialGraph.render();

        updateRelatedNodesPanel( selections , same, oppos );

        if (TW.debugFlags.selections) {
          var tMS2_fin = performance.now()
          console.log("end MultipleSelection2, own time:", tMS2_fin-tMS2_deb)
        }

    }).index()
};

// TODO TW.SelInst
var SelInst

TinaWebJS = function ( sigmacanvas ) {
    this.sigmacanvas = sigmacanvas;

    this.init = function () {

        if (TW.debugFlags.logSettings)    console.info("TW settings", TW)

        let initErrMsg = null

        if (typeof sigma == 'undefined') {
          initErrMsg = "no sigma library"
        }
        else {
          this.prepareSigmaCustomIndices(sigma)

          if (TW.ourRendering)
            this.prepareSigmaCustomRenderers(sigma)
        }

        if (initErrMsg) {
          console.error(initErrMsg)
        }
    }

    this.prepareSigmaCustomIndices = function(sigmaModule) {
      // register direct access methods for nNodes nEdges
      sigmaModule.classes.graph.addMethod('nNodes', function() {
        return this.nodesArray.length;
      });
      sigmaModule.classes.graph.addMethod('nEdges', function() {
        return this.edgesArray.length;
      });

      // register an index for nodes by type and size (<= origNode.size||origNode.weight)
      sigmaModule.classes.graph.addIndex('nodesBySize', {
        constructor: function() {
          this.nodesBySize = {};
        },
        addNode: function(n) {
          if (n.type && n.size) {
            let sizekey = parseFloat(n.size)
            if (!this.nodesBySize[n.type])
              this.nodesBySize[n.type] = {}
            if (!this.nodesBySize[n.type][sizekey])
              this.nodesBySize[n.type][sizekey] = {}
            this.nodesBySize[n.type][sizekey][n.id] = true
          }
        },
        dropNode: function(n) {
          if (n.type && n.size) {
            delete(this.nodesBySize[n.type][n.size][n.id])
          }
        }
      });

      // @ntype: a node type from TW.categories
      // @aSizeSelector can be:
      //  - a numeric value
      //  - a range (ordered array of 2 numeric values)
      sigmaModule.classes.graph.addMethod('getNodesBySize', function(ntype, aSizeSelector) {
        let res = []

        // shortcut case for commodity: entire index if no arg
        if (isUndef(aSizeSelector)) {
          res = this.nodesBySize[ntype]
        }

        // normal cases
        else if (isNumeric(aSizeSelector)) {
          let sizekey = parseFloat(aSizeSelector)
          if (this.nodesBySize[ntype][sizekey]) {
            res = Object.keys(this.nodesBySize[ntype][sizekey])
          }
        }
        else if (Array.isArray(aSizeSelector)
                 && aSizeSelector.length == 2
                 && isNumeric(aSizeSelector[0])
                 && isNumeric(aSizeSelector[1])
               ) {
          let sizeMin = parseFloat(aSizeSelector[0])
          let sizeMax = parseFloat(aSizeSelector[1])

          // the available sizes
          let sortedSizes = Object.keys(this.nodesBySize[ntype]).sort(function(a,b){return a-b})

          // the nodes with sizes in range
          for (var k in sortedSizes) {
            let val = sortedSizes[k]
            if (val > sizeMax) {
              break
            }
            if (val >= sizeMin) {
              res = res.concat(Object.keys(this.nodesBySize[ntype][val]))
            }
          }
        }
        return res;
      });
    }


    // register our renderers in sigma module
    this.prepareSigmaCustomRenderers = function(sigmaModule) {

      // £TODO group the rendering primitives it all together
      //       and perhaps move here where the preparation occurs
      var tempo = new SigmaUtils();


      // custom nodes rendering
      // overriding the def is simplest
      // (could also do it by type)
      sigmaModule.canvas.nodes.def = tempo.twRender.canvas.nodes.withBorders

      // custom edges rendering registered under 'curve'
      sigmaModule.canvas.edges.curve = tempo.twRender.canvas.edges.curve
      sigmaModule.canvas.edges.line = tempo.twRender.canvas.edges.line

      // custom labels rendering
      //  - based on the normal one sigma.canvas.labels.def
      //  - additionnaly supports 'active/forcelabel' node property (magnify x 3)
      sigmaModule.canvas.labels.def = tempo.twRender.canvas.labels.largeractive

      // custom hovers rendering
      //  - based on the normal one sigma.canvas.hovers.def
      //  - additionnaly magnifies all labels x 2
      //  - additionnaly supports 'active/forcelabel' node property (magnify x 3)
      sigmaModule.canvas.hovers.def = tempo.twRender.canvas.hovers.largerall

      if (TW.debugFlags.logSettings) console.log('tw renderers registered in sigma module')
    }

    this.initSearchListeners = function () {

        var SelInst = new SelectionEngine();

        $('input#searchinput').autocomplete({
            source: function(request, response) {
                // labels initialized in settings, filled in updateSearchLabels
                // console.log(labels.length)
                matches = [];
                var matcher = new RegExp($.ui.autocomplete.escapeRegex(request.term), "i");
                // grep at heart
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
            minLength: minLengthAutoComplete,


            // ----------------------->8---------------------
            // send a "no more suggestions event"
            response: function (event, ui_response_array) {
                // exemple in ui_response_array
                // {"content":
                //  [{id: 239, label:"warning system",desc:"ISIterms.."},
                //   ...
                //  ]
                // }

                if (ui_response_array.content.length == 0) {
                    // we send our "noAutocomplete" event
                    $('#searchinput').trigger("tw:noAutocomplete");
                    // (signal for plugins like crowdsourcing that
                    //  are sensitive to autocomplete being empty)
                    // console.log("000 Event [noAutocomplete] sent from Tinaweb search")
                }
                else {
                    // we send a "hasAutocomplete" event
                    // (/!\ will be sent for each typed char)
                    $('#searchinput').trigger("tw:gotAutocomplete");
                    // console.log("+++ Event [gotAutocomplete] sent from Tinaweb search")
                }
            }
            // ----------------------->8---------------------
        });

        // is_open flag for keydown choice
        $('#searchinput').bind('autocompleteopen', function(event, ui) {
            $(this).data('is_open',true);
        });
        $('#searchinput').bind('autocompleteclose', function(event, ui) {
            $(this).data('is_open',false);
        });

        // default search value now handled through input/@placeholder
        // $("#searchinput").focus(function () {        });
        // $("#searchinput").blur(function () {        });


        // i click on the search button, independently from autocomplete
        $("#searchbutton").click(function() {
            var query = normalizeString($("#searchinput").val())
            // console.log('===\nyour query was: "'+query+'"');

            // --- SelectionEngine.search() -------------------
            //   -> will call sigmaUtils.find()
            //           over sigmaUtils.getnodesIndex()
            //   -> then call this.SelectorEngine
            //            and this.MultipleSelection2
            SelInst.search_n_select(query)
            // ------------------------------------------------
        });


        // i've a list of coincidences and i press enter like a boss >:D
        //  external usage: partialGraph, SelectorEngine() , MultipleSelection2()
        $("#searchinput").keydown(function (e) {
            if (e.keyCode == 13 && $("input#searchinput").data('is_open') === true) {
                // Search has several results and you pressed ENTER
                if(!is_empty(matches)) {
                    var coincidences = []
                    for(j=0;j<matches.length;j++){
                        coincidences.push(matches[j].id)
                    }
                    setTimeout(
                      function (){
                          targeted = SelInst.SelectorEngine( {
                                          addvalue:checkBox,
                                          clicktype:"double",
                                          prevsels:selections,
                                          currsels:coincidences
                                      } )

                          // tricky stuff for simulating a multiple selection D:
                          // ... to be improved in the future ...
                          var prev_cursor_size = cursor_size;
                          if(targeted.length>0) {
                              cursor_size = (cursor_size==0)? 1 : cursor_size;
                              cancelSelection(false);
                              SelInst.MultipleSelection2({nodes:targeted});
                              cursor_size = prev_cursor_size;
                          }

                          $("input#searchinput").val("");
                          $("input#searchinput").autocomplete( "close" );
                      },
                      30
                    )
                    //$("input#searchinput").trigger('autocompleteclose');
                }

            // alert("matches[].id\n" + JSON.stringify(matches.map(function(n) {return n.id})))
            }
            else if (e.keyCode == 13 && $("input#searchinput").data('is_open') !== true) {
                // pressed down [ENTER] but with no autocomplete
                // it really means "do search_and_select()"
                // (but we know the results will be empty)
                // (we still do it for the side effects: events, cleaning)
                var query = normalizeString($("#searchinput").val())
                SelInst.search_n_select(query)
            }
        });

        // i was navigating (with the up|down) sur the coincidences-list and i pressed enter!
        //  external usage: partialGraph, SelectorEngine() , MultipleSelection2()
        $("#searchinput").keyup(function (e) {
            if (e.keyCode == 13 && $("input#searchinput").data('is_open') !== true) {
                var targeted = [] ;
                var exfnd = exactfind( $("#searchinput").val() )
                if (exfnd!=null) {
                    console.log("search KEY UP");
                    setTimeout(
                      function() {
                        targeted = SelInst.SelectorEngine( {
                                    addvalue:checkBox,
                                    clicktype:"double",
                                    prevsels:selections,
                                    currsels:[exfnd.id]
                                } )
                        if(targeted.length>0) {
                            cancelSelection(false);
                            SelInst.MultipleSelection2({nodes:targeted});
                        }

                        $("input#searchinput").val("");
                        $("input#searchinput").autocomplete( "close" );
                      },
                      30
                    )
                }
            }
        });
    }

    // to init handlers for tina GUI environment (run once on page load)
    this.initGUIListeners = function () {

        var body=document.getElementsByTagName('body')[0];
        body.style.paddingTop="41px";

        $('.etabs').click(function(){
            setTimeout(
              function() {
                $("#opossiteNodes").readmore({maxHeight:200});
                $("#sameNodes").readmore({maxHeight:200});
              },
              500
            )
        });

        $("#changetype").click(function(){
            console.log("")
            console.log(" ############  changeTYPE click");
            if (TW.partialGraph.isForceAtlas2Running())
                sigma_utils.ourStopFA2();
            changeType();

            setTimeout(function(){
              $('.etabs a[href="#tabs1"]').trigger('click');
            },500)

            console.log(" ############  / changeTYPE click");
            console.log("")
        });

        $("#changelevel").click(function(){
            console.log("")
            console.log(" ############  changeLEVEL click");
            if (TW.partialGraph.isForceAtlas2Running())
                sigma_utils.ourStopFA2();
            changeLevel();

            console.log(" ############  / changeLEVEL click");
            console.log("")
        });

        //  ===  un/hide leftpanel  === //
        $("#aUnfold").click(function(e) {
            //SHOW rightcolumn
            sidebar = $("#rightcolumn");
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

                // $('#sigma-contnr').width(fullwidth-sidebar.width());
                $('#sigma-contnr').animate({
                        "width": fullwidth-sidebar.width()+"px"
                }, { duration: 400, queue: false });
            }
            else {
                //HIDE rightcolumn
                $("#aUnfold").attr("class","leftarrow");
                sidebar.animate({
                    "right" : "-" + sidebar.width() + "px"
                }, { duration: 400, queue: false });

                $("#ctlzoom").animate({
                        "right": "0px"
                }, { duration: 400, queue: false });

                    // $('#sigma-contnr').width(fullwidth);
                $('#sigma-contnr').animate({
                        "width": fullwidth+"px"
                },{ duration: 400, queue: false });
            }
        });

        $("#tips").html(getTips());

        // a bit costly, TODO make conditional or deprecated
        // showMeSomeLabels(6);

        // updateDownNodeEvent(false);


        // #saveAs => toggle #savemodal initialized in html + bootstrap-native

        // button CENTER
        $("#lensButton").click(function () {
            // new sigma.js
            partialGraph.camera.goTo({x:0, y:0, ratio:1.2})
        });

        $("#layoutButton").click(function () {
          sigma_utils.smartForceAtlas()
        });

        $("#noverlapButton").click(function () {

          if(! TW.partialGraph.isNoverlapRunning()) {
              // show waiting cursor on page and button
              theHtml.classList.add('waiting');
              this.style.cursor = 'wait'
              // and waiting icon
              this.insertBefore(createWaitIcon('noverlapwait'), this.children[0])

              var listener = TW.partialGraph.startNoverlap();
              var noverButton = this
              listener.bind('stop', function(event) {
                var stillRunning = document.getElementById('noverlapwait')
                if (stillRunning) {
                  theHtml.classList.remove('waiting');
                  noverButton.style.cursor = 'auto'
                  stillRunning.remove()
                }
              });

              return;
          }
        });

        $("#edges-switch").click(function () {
            sigma_utils.toggleEdges(this.checked)
        });


        //Cursor Size slider
        var cursorSlider = $("#unranged-value").freshslider({
            step: 1,
            min:cursor_size_min,
            max:cursor_size_max,
            value:cursor_size,
            onchange:function(value){
                // console.log("en cursorsize: "+value);
                cursor_size=value;
            }
        });

        // double click on cursor selector slider => set it to 0
        $("#areacircle-size").dblclick(function(){
            cursorSlider.setValue(0)
        });

        // //finished
        // $("#slidercat1nodessize").freshslider({
        //     step:1,
        //     min:-20,
        //     max:20,
        //     value:0,
        //     bgcolor:"#FFA500",
        //     onchange:function(value){
        //         setTimeout(function (){
        //             // new sigma.js loop on nodes POSS optimize
        //             nds  = TW.partialGraph.graph.nodes()
        //             console.log("init: slider resize")
        //             for(j=0 ; j<TW.partialGraph.nNodes ; j++){
        //                 if (nds[j]
        //                  && nds[j].type == TW.catSem) {
        //                      var n = nds[j]
        //                      var newval = parseFloat(TW.Nodes[n.id].size) + parseFloat((value-1))*0.3
        //                      n.size = (newval<1.0)?1:newval;
        //                      sizeMult[TW.catSem] = parseFloat(value-1)*0.3;
        //                 }
        //             }
        //             partialGraph.render()
        //         },
        //         100);
        //     }
        // });


        // costly entire refresh (~400ms) only after stopped resizing for 3s
        // NB: rescale middleware already reacted and, except for large win size changes, it handles the resize fine
        //     (so this fragment is only to accomodate the large changes)
        var winResizeTimeout = null
        window.addEventListener('resize', function(){
          if (winResizeTimeout) {
            clearTimeout(winResizeTimeout)
          }
          winResizeTimeout = setTimeout(function() {
            console.log('did refresh')

            if (window.TW.partialGraph && window.TW.partialGraph.refresh) {
              window.TW.partialGraph.refresh()
            }
            if (theHtml.classList) {
              theHtml.classList.remove('waiting');
            }
          }, 3000)
        }, true)


        // general listener: shift key in the window <=> add to selection
        $(document).on('keyup keydown', function(e){
          // changes the global boolean ("add node to selection" status) if keydown and SHIFT
          checkBox = manuallyChecked || e.shiftKey

          // show it in the real checkbox too
          $('#checkboxdiv').prop("checked", manuallyChecked || e.shiftKey)
        } );

    } // finish envListeners


    // to init local, instance-related listeners (need to run at new sigma instance)
    // args: @partialGraph = a sigma instance
    this.SigmaListeners = function(partialGraph) {

      var SelInst = new SelectionEngine();

      // sigma events bindings
      // ---------------------

      // cf. https://github.com/jacomyal/sigma.js/wiki/Events-API

      // cases:
      // 'click'    - simple click, early event
      //              used for area (with global: cursor_size)
      // 'clickNode'- simple click, second event if one node

      // POSS easy in new sigma.js:
      //       add doubleClick to select node + neighboors


      // when circle area select
      // ========================
      // 1st event, even before we know if there are nodes
      partialGraph.bind('click', function(e) {
        // console.log("sigma click event e", e)

        // case with a selector circle cursor handled here
        if (cursor_size > 0) {
          // actual click position, but in graph coords
          var x = e.data.x
          var y = e.data.y

          // convert
          var camCoords = TW.cam.cameraPosition(x,y)

          // retrieve area nodes, using indexed quadtree and global cursor_size
          var circleNodes = circleGetAreaNodes(
            camCoords.x,
            camCoords.y
          )

          // 1) clear previous while keeping its list (useful iff 'Add' checkBox)
          var previousSelection = selections
          cancelSelection(false)

          // 2) show selection + do all related effects
          var targeted = SelInst.SelectorEngine( {
                              addvalue:checkBox,
                              currsels:circleNodes,
                              prevsels:previousSelection
                          } )
          if(targeted.length>0) {
            SelInst.MultipleSelection2( {nodes:targeted} )
          }
        }
      })

      // when one node and normal click
      // ===============================
      partialGraph.bind('clickNode', function(e) {
        // console.log("clickNode event e", e.data.node)

        // new sigma.js gives easy access to clicked node!
        var theNodeId = e.data.node.id

        // we keep the global selections and then clear it and all its effects
        var previousSelection = selections
        cancelSelection(false, {norender:true}); // no need to render before MS2

        if (cursor_size == 0) {
          var targeted = SelInst.SelectorEngine( {
                              addvalue:checkBox,
                              currsels:[theNodeId],
                              prevsels:previousSelection
                          } )
          if(targeted.length>0) {
            SelInst.MultipleSelection2( {nodes:targeted} )
          }
        }
        // case with a selector circle cursor handled
        // just before, at click event
      })

      // when click in the empty background
      // ==================================
      if (TW.deselectOnclickStage) {
        partialGraph.bind('clickStage', function(e) {
          // console.log("clickStage event e", e)

          if (! e.data.captor.isDragging
            && Object.keys(selections).length
            && ! cursor_size) {

            // we clear selections and all its effects
            cancelSelection(false);
          }
        })
      }

      // for all TW.cam.goTo (move/zoom) events
      //     ===============
      var zoomTimeoutId = null
      TW.cam.bind('coordinatesUpdated', function(e) {
        $("#zoomSlider").slider("value",1/TW.cam.ratio)
      })

      // ---------------------------------------------------------------------

      // POSS: bind to captors  (0=>mouse, 1=>touch)
      // TW.rend.captors[0].bind('mousemove', function(e) {
      //   console.log("mousemove event e", e.data.node)
      //
      // })

      // ---------------------------------------------------------------------

      // raw events (non-sigma): handlers attached to the container
      // ==========
      $("#sigma-contnr")
          .mousemove(function(e){
              if(!isUndef(partialGraph)) {
                  // show/move selector circle cursor
                  if(cursor_size>0) circleTrackMouse(e);
              }
          })

      // POSSible for the future: add tools to contextmenu
      //     .contextmenu(function(){
      //         return false;
      //     })

      // sliders events
      // ==============
      $("#zoomSlider").slider({
          orientation: "vertical",

          // new sigma.js current zoom ratio
          value: partialGraph.camera.ratio,
          min: 1 / sigmaJsMouseProperties.maxRatio,   // ex x.5
          max: 1 / sigmaJsMouseProperties.minRatio,   // ex x32
          // range: true,
          step: .2,
          value: 1,
          slide: function( event, ui ) {
              partialGraph.camera.goTo({
                  // POSS: make a transform to increase detail around x = 1
                  ratio: 1 / ui.value
              });
          }
      });

      $("#zoomPlusButton").click(function () {
          var newRatio = TW.cam.ratio * .75
          if (newRatio >= sigmaJsMouseProperties.minRatio) {
            // triggers coordinatesUpdated which sets the slider cursor
            partialGraph.camera.goTo({ratio: newRatio});
            return false;
          }
      });

      $("#zoomMinusButton").click(function () {
        var newRatio = TW.cam.ratio * 1.25
        if (newRatio <= sigmaJsMouseProperties.maxRatio) {
          // triggers coordinatesUpdated which sets the slider cursor
          partialGraph.camera.goTo({ratio: newRatio});
          return false;
        }
      });

      if (TW.filterSliders) {

        // args: for display: target div ,
        //       for context: family/type prop value,
        //       for values:  the property to filter
        NodeWeightFilter ( "#slidercat0nodesweight" ,
                              TW.categories[0] ,
                             "size"
                           );

        EdgeWeightFilter("#slidercat0edgesweight",
                          getActivetypesKey(),
                          "weight"
                        );
      }

      // node's label size
      var labelSizeTimeout = null
      $("#sliderlabelsize").freshslider({
          step:.25,
          min:0,
          max:5,
          value: sigmaJsDrawingProperties['labelSizeRatio'] || 1,
          bgcolor:"#27c470",
          onchange:function(value){
            if (labelSizeTimeout) {
              clearTimeout(labelSizeTimeout)
            }
            labelSizeTimeout = setTimeout(function(){
              if (TW.partialGraph.settings('labelSizeRatio') != value) {
                var adaptedLabelThreshold = 7 - value
                // console.log("value", value, "thres", adaptedLabelThreshold)

                TW.partialGraph.settings('labelSizeRatio', value)
                TW.partialGraph.settings('labelThreshold', adaptedLabelThreshold)
                TW.partialGraph.render()
              }
            }, 200)

          }
      });

      document.getElementById('edges-switch').checked = TW.customSettings.drawEdges

      cancelSelection(false);
    }


    this.initialActivetypes = function( categories ) {
        var firstActivetypes = []
        for(var i=0; i<categories.length ; i++) {
            if(i==0) firstActivetypes.push(true)  // <==> show the cat stored in 0
            else firstActivetypes.push(false)     // <==> hide the cat stored in 1
        }
        console.debug('firstActivetypes', firstActivetypes)
        return firstActivetypes;
    }

    this.allPossibleActivetypes = function (cats) {
        if (TW.debugFlags.logSettings) console.debug(`allPossibleActivetypes(cats=${cats})`)
        var possibleActivetypes = {}
        var N=Math.pow(2 , cats.length);

        for (i = 0; i < N; i++) {

            let bin = (i).toString(2)
            let bin_splitted = []
            for(var j in bin)
                bin_splitted.push(bin[j])

            let bin_array = [];
            let toadd = cats.length-bin_splitted.length;
            for (var k = 0; k < toadd; k++)
                bin_array.push("0")

            for(var j in bin)
                bin_array.push(bin[j])

            bin_array = bin_array.map(Number)
            let sum = bin_array.reduce(function(a, b){return a+b;})

            if( sum != 0 && sum < 3) {
                let id = bin_array.join("|")
                possibleActivetypes[id] = bin_array.map(Boolean)
            }
        }
        return possibleActivetypes;
    }


};
