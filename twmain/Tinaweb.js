'use strict';

// this class will be instanciated once (and exposed as TW.instance.selNgn)
function SelectionEngine() {

    // creates the union of prevsels and currsels, if addvalue
    this.SelectorEngine = function( args ) {

        // console.log("addvalue, prevsels, currsels", args)

        if (!args)                 args = {}
        if (!args.addvalue)        args.addvalue = false
        if (!args.prevsels)        args.prevsels = []
        if (!args.currsels)        args.currsels = []

        var targeted = []

        // currsels = bunch of nodes from a click in the map
        if(args.addvalue) {
            // FOR SIMPLE UNIQUE UNION
            targeted = args.currsels.concat(args.prevsels.filter(function (item) {
                return args.currsels.indexOf(item) < 0;
            }));
        } else targeted = args.currsels;

        if(targeted.length==0) return [];

        // ------------ FOR SETWISE COMPLEMENT ---------------------->8---------
        // if(args.prevsels.length>0) {
        //     if(JSON.stringify(args.prevsels)==JSON.stringify(targeted)) {
        //         // this is just effective for Add[ ] ...
        //         // If previous selection is equal to the current one, you've nothing :D
        //         cancelSelection(false);
        //         return [];
        //     }
        //     var inter = this.intersect_safe(args.prevsels,targeted)
        //     if(inter.length>0) {
        //         var blacklist = {} , whitelist = {};
        //         for(var k in inter) blacklist[inter[k]]=true;
        //         for(var k in args.prevsels){
        //             let nid = args.prevsels[k]
        //             if(!blacklist[nid]) {
        //                 whitelist[nid] = true;
        //             }
        //         }
        //         for(var k in targeted){
        //             let nid = targeted[k]
        //             if(!blacklist[nid]) {
        //                 whitelist[nid] = true;
        //             }
        //         }
        //         targeted = Object.keys(whitelist);
        //     } else {// inter = 0 ==> click in other portion of the graph (!= current selection)
        //         // Union!
        //         if(args.addvalue) {
        //             targeted = currsels.concat(args.prevsels.filter(function (item) {
        //                 return currsels.indexOf(item) < 0;
        //             }));
        //         }
        //     }
        // }
        // ---------------------------------------------------------->8---------

        return targeted;
    };


    // uses: SelectorEngine() and MultipleSelection2()
    // we assume string is normalized
    this.search_n_select = function(string) {

        let previousSelections = TW.SystemState().selectionNids

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
            var resultNids = find(string)

            var coincd=[]
            for(var i in resultNids) {
                coincd.push(resultNids[i])
            }
            var targeted = this.SelectorEngine( {
                            addvalue:TW.gui.checkBox,
                            prevsels:previousSelections,
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
     *  external usage : clickHandler, search, changeType, filters, tag click...
     */
     // ====================
    this.MultipleSelection2 = function(args) {

        if (!args)                      args = {}
        if (isUndef(args.nodes))        args.nodes = []

        if (TW.conf.debug.logSelections) {
          var tMS2_deb = performance.now()

          console.log("IN SelectionEngine.MultipleSelection2:")
          console.log("nodes", args.nodes)
        }

        // deselects only the active ones (based on SystemState())
        deselectNodes()

        // TW.SystemState() is the present graph state
        // eg
        // {categories: ["someNodeCat"]
        // categoriesDict: {"someNodeCat":0}  // where val 0 or 1 is type sem or soc
        // opposites:
        // selections:
        // type:[0]}


        var activetypesKey = getActivetypesKey()


        // Dictionaries of: selection+neighbors for the new state and updateRelatedNodesPanel
        let selections = {}

        // detailed relations sorted by types and srcid (for state cache, deselects etc)
        let activeRelations = {}
            activeRelations[activetypesKey] = {}

        // cumulated neighbor weights no matter what srcid (for tagCloud etc)
        let sameSideNeighbors = {}
        let oppoSideNeighbors = {}

        // targeted arg 'nodes' can be nid array or single nid
        var ndsids=[]
        if(args.nodes) {
            if(! $.isArray(args.nodes)) ndsids.push(args.nodes);
            else ndsids=args.nodes;

            for(var i in ndsids) {
                var srcnid = ndsids[i];

                if(TW.Relations[activetypesKey] && TW.Relations[activetypesKey][srcnid] ) {
                    var neighs = TW.Relations[activetypesKey][srcnid]

                    activeRelations[activetypesKey][srcnid] = {}

                    if(neighs) {
                        for(var j in neighs) {
                            var tgtnid = neighs[j]

                            let tgt = TW.partialGraph.graph.nodes(tgtnid)
                            // highlight edges (except if n hidden or e dropped (<=> lock))
                            // POSS: use sigma's own index to avoid checking if edge dropped
                            if (tgt && !tgt.hidden) {

                              let eid1 = srcnid+';'+tgtnid
                              let eid2 = tgtnid+';'+srcnid

                              if ( (TW.Edges[eid1] && !TW.Edges[eid1].lock)
                                     ||
                                   (TW.Edges[eid2] && !TW.Edges[eid2].lock) ) {

                                let e1 = TW.partialGraph.graph.edges(eid1)
                                let e2 = TW.partialGraph.graph.edges(eid2)

                                // since we're there we'll also keep the neighbors info
                                if (typeof sameSideNeighbors[tgtnid] == 'undefined') {
                                  sameSideNeighbors[tgtnid]=0
                                }

                                // and the detailed info
                                if (typeof activeRelations[activetypesKey][srcnid][tgtnid] == 'undefined') {
                                  activeRelations[activetypesKey][srcnid][tgtnid]=0
                                }

                                // **make the edge active**
                                if (e1 && !e1.hidden) {
                                  e1.customAttrs.activeEdge = 1;
                                  sameSideNeighbors[tgtnid] += e1.weight || 1
                                  activeRelations[activetypesKey][srcnid][tgtnid] += e1.weight || 1
                                }
                                if (e2 && !e2.hidden) {
                                   e2.customAttrs.activeEdge = 1;
                                   sameSideNeighbors[tgtnid] += e2.weight || 1
                                   activeRelations[activetypesKey][srcnid][tgtnid] += e2.weight || 1
                                }

                                // we add as neighbor to color it (except if already in targeted)
                                if (!tgt.customAttrs.active)    tgt.customAttrs.highlight = 1;
                              }
                            }
                        }
                    }
                }
                // we make the selected (source) node active too
                let src = TW.partialGraph.graph.nodes(srcnid)
                src.customAttrs.active = true;

                // update local selections dict
                selections[ndsids[i]]=1;
            }
        }

        // show the button to remove selection
        $("#unselectbutton").show() ;

        let theSelection = Object.keys(selections)

        // neighbors of the opposite type
        if(TW.Relations["1|1"]) {

          activeRelations["1|1"] = {}

          for(var i in theSelection) {
                let srcnid = theSelection[i]
                var bipaNeighs = TW.Relations["1|1"][srcnid];

                activeRelations["1|1"][srcnid] = {}

                for(var k in bipaNeighs) {
                    if (typeof activeRelations["1|1"][srcnid][bipaNeighs[k]] == "undefined") {
                      activeRelations["1|1"][srcnid][bipaNeighs[k]] = 0;
                    }
                    if (typeof oppoSideNeighbors[bipaNeighs[k]] == "undefined") {
                      oppoSideNeighbors[bipaNeighs[k]] = 0 ;
                    }

                    // cumulated for all srcnids
                    oppoSideNeighbors[bipaNeighs[k]]++

                    // and the details
                    activeRelations["1|1"][srcnid][bipaNeighs[k]]++;
                }
            }
        }

        // Sort by descending value
        //   and rewrites dict[id]: val as array[order]: {key:id, value:val}
        let oppos = []
        let same = []

        if (activeRelations["1|1"]) {
          oppos = ArraySortByValue(oppoSideNeighbors, function(a,b){
            return b-a
          });
        }

        same = ArraySortByValue(sameSideNeighbors, function(a,b){
            return b-a
        });

        if (TW.conf.debug.logSelections) {
          console.log('new states\'s selectionNids', theSelection)
          console.log('oppos', oppos)
          console.log('same', same)
        }

        // it's a new SystemState
        TW.pushState( { 'sels': theSelection,
                        'rels': activeRelations } )

        // we send our "gotNodeSet" event
        // (signal for plugins that a search-selection was done or a new hand picked selection)
        $('#searchinput').trigger({
            type: "tw:gotNodeSet",
            q: $("#searchinput").val(),
            nodeIds: theSelection
        });

        // global flag
        TW.gui.selectionActive = true

        TW.partialGraph.render();


        updateRelatedNodesPanel( theSelection , same, oppos )

        if (TW.conf.debug.logSelections) {
          var tMS2_fin = performance.now()
          console.log("end MultipleSelection2, own time:", tMS2_fin-tMS2_deb)
        }
    }
};

var TinaWebJS = function ( sigmacanvas ) {
    this.sigmacanvas = sigmacanvas;

    this.selNgn = new SelectionEngine();

    // functions that modify the sigma module (not sigma instance!)
    this.init = function () {

        if (TW.conf.debug.logSettings)    console.info("TW settings", TW)

        let initErrMsg = null

        if (typeof sigma == 'undefined') {
          initErrMsg = "no sigma library"
        }
        else {
          this.prepareSigmaCustomIndices(sigma)

          if (TW.conf.twRendering)
            this.prepareSigmaCustomRenderers(sigma)
        }

        // overriding pixelRatio is possible if we need high definition
        if (TW.conf.overSampling) {
          var realRatio = sigma.utils.getPixelRatio
          sigma.utils.getPixelRatio = function() {
            return 2 * realRatio()
          }
        }

        $('#tab-container').easytabs({
          updateHash:false,
          defaultTab: 'li#tabneigh'
        });

        // show any already existing panel
        document.getElementById("graph-panels").style.display = "block"

        // grey message in the search bar from settings
        $("#searchinput").attr('placeholder', TW.conf.strSearchBar) ;

        // load optional modules
        activateModules() ;

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
      sigmaModule.classes.graph.addIndex('nodesByTypeNSize', {
        constructor: function() {
          this.nodesByTypeNSize = {};
        },
        addNode: function(n) {
          if (n.type && n.size) {
            let sizekey = parseFloat(n.size)
            if (!this.nodesByTypeNSize[n.type])
              this.nodesByTypeNSize[n.type] = {}
            if (!this.nodesByTypeNSize[n.type][sizekey])
              this.nodesByTypeNSize[n.type][sizekey] = {}
            this.nodesByTypeNSize[n.type][sizekey][n.id] = true
          }
          else {
            // should never happen
            console.warn("warning: couldn't add node to index ?", n)
          }
        },
        dropNode: function(n) {
          if (n.type && n.size) {
            delete(this.nodesByTypeNSize[n.type][n.size][n.id])
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
          res = this.nodesByTypeNSize[ntype]
        }

        // normal cases
        else if (isNumeric(aSizeSelector)) {
          let sizekey = parseFloat(aSizeSelector)
          if (this.nodesByTypeNSize[ntype][sizekey]) {
            res = Object.keys(this.nodesByTypeNSize[ntype][sizekey])
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
          let sortedSizes = Object.keys(this.nodesByTypeNSize[ntype]).sort(function(a,b){return a-b})

          // the nodes with sizes in range
          for (var k in sortedSizes) {
            let val = sortedSizes[k]
            if (val > sizeMax) {
              break
            }
            if (val >= sizeMin) {
              res = res.concat(Object.keys(this.nodesByTypeNSize[ntype][val]))
            }
          }
        }
        return res;
      });

      // All nodes *in the instance* by type
      // NB: not used at the moment but easy and perhaps very useful in future
      // arg:
      //   @ntype: a node type from TW.categories
      sigmaModule.classes.graph.addMethod('getNodesByType', function(ntype) {
        let res = []
        // concatenate all sizes because this detail doesn't matter to us here
        for (let szk in this.nodesByTypeNSize[ntype]) {
          res = res.concat(Object.keys(this.nodesByTypeNSize[ntype][szk]))
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
      //  - additionnaly supports 'active/highlight' node property (magnify x 3)
      //  - also handles 'forceLabel' property
      sigmaModule.canvas.labels.def = tempo.twRender.canvas.labels.largeractive

      // custom hovers rendering
      //  - based on the normal one sigma.canvas.hovers.def
      //  - additionnaly magnifies all labels x 2
      //  - additionnaly supports 'active/highlight' node property (magnify x 3)
      sigmaModule.canvas.hovers.def = tempo.twRender.canvas.hovers.largerall

      if (TW.conf.debug.logSettings) console.log('tw renderers registered in sigma module')
    }

    this.initSearchListeners = function () {

        var selInst = this.selNgn

        $('input#searchinput').autocomplete({
            source: function(request, response) {
                // labels initialized in settings, filled in updateSearchLabels
                // console.log(labels.length)
                var matches = [];
                var matcher = new RegExp($.ui.autocomplete.escapeRegex(request.term), "i");
                // grep at heart
                var results = $.grep(TW.labels, function(e) {
                    return matcher.test(e.label); //|| matcher.test(e.desc);
                });

                if (!results.length) {
                    $("#noresults").text("Pas de résultats");
                } else {
                    $("#noresults").empty();
                }
                matches = results.slice(0, TW.conf.maxSuggestionsAutoComplete);
                response(matches);

            },
            minLength: TW.conf.minLengthAutoComplete,


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

        // Search by click on the search button, independently from autocomplete
        $("#searchbutton").click(function() {
            var query = normalizeString($("#searchinput").val())
            // console.log('===\nyour query was: "'+query+'"');

            // --- SelectionEngine.search() -------------------
            //   -> will call sigmaUtils.find()
            //           over sigmaUtils.getnodesIndex()
            //   -> then call this.SelectorEngine
            //            and this.MultipleSelection2
            selInst.search_n_select(query)
            // ------------------------------------------------
        });

        // Search by pressing ENTER, independently from autocomplete
        $("#searchinput").keydown(function (e) {
            if (e.keyCode == 13) {
                var query = normalizeString($("#searchinput").val())
                selInst.search_n_select(query)
            }
        });
    }

    // to init handlers + elts for tina GUI environment (run once on page load)
    this.initGUIListeners = function () {

        var body=document.getElementsByTagName('body')[0];
        body.style.paddingTop="41px";


        // side panel width
        if(TW.conf.sidePanelSize && TW.conf.sidePanelSize != "400px") {
          // change stylesheet rules preferably to element style directly
          //    (this way we don't block the mobile-variants CSS effects,
          //     b/c twjs-mobile.css is loaded after twjs.css in the html)
          if (TW.gui.sheets) {
            if (TW.gui.sheets.main) {
              TW.gui.sheets.main.insertRule(
                `#sidebar {width: ${TW.conf.sidePanelSize};}`,
                TW.gui.sheets.main.cssRules.length
              )
              TW.gui.sheets.main.insertRule(
                `#sigma-contnr {right: ${TW.conf.sidePanelSize};}`,
                TW.gui.sheets.main.cssRules.length
              )
            }
            if (TW.gui.sheets.panels) {
              TW.gui.sheets.panels.insertRule(
                `#ctlzoom {right: calc(${TW.conf.sidePanelSize} + 10px);}`,
                TW.gui.sheets.panels.cssRules.length
              )
            }
          }
          // otherwise we do it the easy way
          else {
            console.warn("Couldn't identify twjs.css and selection-panels.css")
            document.getElementById('sidebar').style.width = TW.conf.sidePanelSize
            document.getElementById('sigma-contnr').style.right = TW.conf.sidePanelSize
            document.getElementById('ctlzoom').style.right = `calc(${TW.conf.sidePanelSize} + 10px)`
          }
        }

        // tab handlers
        $('.etabs').click(function(){
            setTimeout(
              function() {
                $("#oppositeNodes").readmore({maxHeight:200});
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

            console.log("DBG before changeType SystemState:", TW.SystemState())
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

        // sidepanel folding
        $('#sidefold').click(function(){
          if (window.innerWidth >= 768) {
            let width = TW.conf.sidePanelSize || '400px'
            // $("#ctlzoom").css('right','10px')
            $("#ctlzoom").animate(
              {"right": "10px"}, "slow"
            )
            $("#sidebar").animate(
              {"right":`-${width}`}, "slow",
              function(){
                $("#sigma-contnr").css('right',0)
                $("#sidebar").hide()
                TW.partialGraph.refresh()
                $("#sidefold").hide()
                $("#sideunfold").show()
              }
            );
            TW.gui.foldedSide = true
          }
        })

        $('#sideunfold').click(function(){
          if (window.innerWidth >= 768) {
            let width = TW.conf.sidePanelSize || '400px'
            $("#sidebar").show()
            $("#sidebar").animate(
              {"right": 0}, "slow",
              function(){
                $("#sigma-contnr").css('right', width)
                TW.partialGraph.refresh()
                $("#sideunfold").hide()
                $("#sidefold").show()
                $("#ctlzoom").css('right',`calc(${width} + 10px)`)
              }
            );
            TW.gui.foldedSide = false
          }
        })

        if (TW.conf.getRelatedDocs && document.getElementById('reldocs-type')) {
          document.getElementById('reldocs-type').value = TW.conf.relatedDocsType
        }

        $("#tips").html(getTips());

        // a bit costly, TODO make conditional or deprecated
        // showMeSomeLabels(6);

        // updateDownNodeEvent(false);


        // #saveAs => toggle #savemodal initialized in html + bootstrap-native

        // button CENTER
        $("#lensButton").click(function () {
            // new sigma.js
            TW.partialGraph.camera.goTo({x:0, y:0, ratio:1.2})
        });

        if (!TW.conf.colorByAtt) {
          $("#setcolorsMenu").hide()
        }

        if (TW.conf.fa2Available) {
          $("#layoutButton").click(function () {
            sigma_utils.smartForceAtlas({'manual': true})
          });
        }
        else {
          $("#layoutButton").hide()
        }

        if (TW.conf.disperseAvailable) {
          $("#noverlapButton").click(function () {
            if(! TW.partialGraph.isNoverlapRunning()) {
                // show waiting cursor on page and button
                TW.gui.elHtml.classList.add('waiting');
                this.style.cursor = 'wait'
                // and waiting icon
                this.insertBefore(createWaitIcon('noverlapwait'), this.children[0])

                var listener = TW.partialGraph.startNoverlap();
                var noverButton = this
                listener.bind('stop', function(event) {
                  var stillRunning = document.getElementById('noverlapwait')
                  if (stillRunning) {
                    TW.gui.elHtml.classList.remove('waiting');
                    noverButton.style.cursor = 'auto'
                    stillRunning.remove()
                  }
                });

                return;
            }
          });
        }
        else {
          $("#noverlapButton").hide()
        }


        $("#edges-switch").click(function () {
            sigma_utils.toggleEdges(this.checked)
        });


        //Cursor Size slider
        TW.gui.circleSlider = $("#unranged-value").freshslider({
            step: 1,
            min:TW.conf.circleSizeMin,
            max:TW.conf.circleSizeMax,
            value:TW.gui.circleSize,
            onchange:function(value){
                // console.log("en cursorsize: "+value);
                TW.gui.circleSize=value;
            }
        });

        // double click on cursor selector slider => set it to 0
        $("#areacircle-size").dblclick(function(){
            TW.gui.circleSlider.setValue(0)
        });

        // costly entire refresh (~400ms) only after stopped resizing for 3s
        // NB: rescale middleware already reacted and, except for large win size changes, it handles the resize fine
        //     (so this fragment is only to accomodate the large changes)
        var winResizeTimeout = null
        window.addEventListener('resize', function(ev){
          if (winResizeTimeout) {
            clearTimeout(winResizeTimeout)
          }
          winResizeTimeout = setTimeout(function() {

            if (window.TW.partialGraph && window.TW.partialGraph.refresh) {
              window.TW.partialGraph.refresh()
              // console.log('did refresh')
            }
            if (TW.gui.elHtml.classList) {
              TW.gui.elHtml.classList.remove('waiting');
            }


            // monitor passing out of or into smaller width
            // (along with twjs-mobile.css and selection-panels.mobile.css)
            if (ev.target.innerWidth < 768 && !TW.gui.smallView) {
              TW.gui.smallView = true
              cssReset()
              $('#sideunfold,#sidefold').hide()
            }
            else if (ev.target.innerWidth >= 768 && TW.gui.smallView) {
              TW.gui.smallView = false
              foldingReset()
            }

          }, 1000)
        }, true)


        // general listener: shift key in the window <=> add to selection
        $(document).on('keyup keydown', function(e){
          // changes the global boolean ("add node to selection" status) if keydown and SHIFT
          TW.gui.checkBox = TW.gui.manuallyChecked || e.shiftKey

          // show it in the real TW.gui.checkBox too
          $('#checkboxdiv').prop("checked", TW.gui.manuallyChecked || e.shiftKey)

          // also listen for CTRL+Z  17 + 90
          if (e.type == "keyup"
              && (e.which == 90 || e.keyCode == 90) && e.ctrlKey
              && TW.states.length > 2
            ) {

            if (timeoutIdCTRLZ) {
              window.clearTimeout(timeoutIdCTRLZ)
            }

            var timeoutIdCTRLZ = window.setTimeout(function() {

              if (TW.gui.selectionActive) {
                deselectNodes(TW.SystemState())
                TW.gui.selectionActive = false
              }

              console.log("pop state")

              TW.states.pop()

              let returningState = TW.SystemState()
              if (returningState.selectionNids.length) {
                TW.instance.selNgn.MultipleSelection2({nodes:returningState.selectionNids})
              }
              else {
                cancelSelection()
              }
              TW.partialGraph.refresh()

            }, 100)

          }
        } );

    } // finish envListeners


    // to init local, instance-related listeners (need to run at new sigma instance)
    // args: @partialGraph = a sigma instance
    this.initSigmaListeners = function(partialGraph, initialActivetypes) {

      console.log("initSigmaListeners TW.categories", TW.categories)

      var selInst = this.selNgn

      // sigma events bindings
      // ---------------------

      // cf. https://github.com/jacomyal/sigma.js/wiki/Events-API

      // cases:
      // 'click'    - simple click, early event
      //              used for area (with global: TW.gui.circleSize)
      // 'clickNode'- simple click, second event if one node

      // POSS easy in new sigma.js:
      //       add doubleClick to select node + neighboors


      // when circle area select
      // ========================
      // 1st event, even before we know if there are nodes
      partialGraph.bind('click', function(e) {
        // console.log("sigma click event e", e)

        // case with a selector circle cursor handled here
        if (TW.gui.circleSize > 0) {
          // actual click position, but in graph coords
          var x = e.data.x
          var y = e.data.y

          // convert
          var camCoords = TW.cam.cameraPosition(x,y)

          // retrieve area nodes, using indexed quadtree and global TW.gui.circleSize
          var circleNodes = circleGetAreaNodes(
            camCoords.x,
            camCoords.y
          )

          // 1) determine new selection
          var targeted = selInst.SelectorEngine( {
                              addvalue:TW.gui.checkBox,
                              currsels:circleNodes,
                              prevsels:TW.SystemState().selectionNids
                          } )

          // 2) show new selection + do all related effects
          if(targeted.length>0) {
            selInst.MultipleSelection2( {nodes:targeted} )
          }
          // or clear previous selection
          else {
            cancelSelection(false)
          }
        }
      })

      // when one node and normal click
      // ===============================
      partialGraph.bind('clickNode', function(e) {
        // console.log("clickNode event e", e.data.node)

        // new sigma.js gives easy access to clicked node!
        var theNodeId = e.data.node.id

        if (TW.gui.circleSize == 0) {
          // 1)
          var targeted = selInst.SelectorEngine( {
                              addvalue:TW.gui.checkBox,
                              currsels:[theNodeId],
                              prevsels: TW.SystemState().selectionNids
                          } )
          // 2)
          if(targeted.length>0) {
            selInst.MultipleSelection2( {nodes:targeted} )
          }
        }
        // case with a selector circle cursor handled
        // just before, at click event
      })

      // when click in the empty background
      // ==================================
      if (TW.conf.deselectOnclickStage) {
        partialGraph.bind('clickStage', function(e) {
          // console.log("clickStage event e", e)

          if (! e.data.captor.isDragging
            && TW.gui.selectionActive
            && ! TW.gui.circleSize) {

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


      // dragNodes plugin
      if (TW.conf.dragNodesAvailable) {
        var dragListener = sigma.plugins.dragNodes(partialGraph, partialGraph.renderers[0]);

        // intercept dragNodes events if not CTRL+click
        document.getElementById('sigma-contnr').addEventListener(
          'mousemove',
          function(ev) {
            if (!ev.ctrlKey) {
              ev.stopPropagation()
            }
          }
        )
      }

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
                  if(TW.gui.circleSize>0) circleTrackMouse(e);
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
          min: 1 / TW.conf.zoomMax,   // ex x.5
          max: 1 / TW.conf.zoomMin,   // ex x32
          // range: true,
          step: .2,
          value: 1,
          slide: function( event, ui ) {
              TW.partialGraph.camera.goTo({
                  // POSS: make a transform to increase detail around x = 1
                  ratio: 1 / ui.value
              });
          }
      });

      $("#zoomPlusButton").click(function () {
          var newRatio = TW.cam.ratio * .75
          if (newRatio >= TW.conf.zoomMin) {
            // triggers coordinatesUpdated which sets the slider cursor
            partialGraph.camera.goTo({ratio: newRatio});
            return false;
          }
      });

      $("#zoomMinusButton").click(function () {
        var newRatio = TW.cam.ratio * 1.25
        if (newRatio <= TW.conf.zoomMax) {
          // triggers coordinatesUpdated which sets the slider cursor
          partialGraph.camera.goTo({ratio: newRatio});
          return false;
        }
      });

      if (TW.conf.getRelatedDocs) {
        let reldocsEls = document.querySelectorAll('.reldocs')
        for (var k in reldocsEls) {
          if (reldocsEls[k].style) {
            reldocsEls[k].style.display = 'block'
          }
        }
      }

      if (TW.conf.filterSliders) {

        // the indice of the first cat to be active (ex: '1')
        let activeId = initialActivetypes.indexOf(true)

        // args: for display: target div ,
        //       for context: family/type prop value,
        //       for values:  the property to filter
        NodeWeightFilter ( `#slidercat${activeId}nodesweight` ,
                              TW.categories[activeId] ,
                             "size"
                           );

        // ex: #slidercat1edgesweight
        EdgeWeightFilter(`#slidercat${activeId}edgesweight`,
                          getActivetypesKey(),
                          "weight"
                        );
      }

      // node's label size
      var labelSizeTimeout = null
      $("#sliderlabelsize0").freshslider({
          step:.25,
          min:0,
          max:5,
          value: 1,
          bgcolor:"#FFA500",
          onchange:function(value){
            if (labelSizeTimeout) {
              clearTimeout(labelSizeTimeout)
            }
            labelSizeTimeout = setTimeout(function(){
              if (TW.gui.sizeRatios[0] != value) {
                TW.gui.sizeRatios[0] = value
                // -------------------------------------------------------------
                // generic efficient method acting on entire graphs label ratio
                // (can't use it b/c we need to distinguish by type)
                // var adaptedLabelThreshold = 7 - value
                // TW.partialGraph.settings('labelSizeRatio', value)
                // TW.partialGraph.settings('labelThreshold', adaptedLabelThreshold)
                // -------------------------------------------------------------
                TW.partialGraph.render()
              }
            }, 200)
          }
      });
      var labelSizeTimeout = null
      $("#sliderlabelsize1").freshslider({
          step:.25,
          min:0,
          max:5,
          value: 1,
          bgcolor:"#27c470",
          onchange:function(value){
            if (labelSizeTimeout) {
              clearTimeout(labelSizeTimeout)
            }
            labelSizeTimeout = setTimeout(function(){
              if (TW.gui.sizeRatios[1] != value) {
                TW.gui.sizeRatios[1] = value
                TW.partialGraph.render()
              }
            }, 200)
          }
      });

      // set the switch
      document.getElementById('edges-switch').checked = TW.customSettings.drawEdges

      // hide GUI elements of inactive types
      // (frontend currently allows max 2 types)
      for (var possibleTypeid in [0,1]) {
        if (   ! TW.categories[possibleTypeid]
            || ! initialActivetypes[possibleTypeid]) {
          $(".for-nodecategory-"+possibleTypeid).hide();
        }
      }

      // attributes' facet-options init & handler
      fillAttrsInForm('choose-attr')
      document.getElementById('choose-attr').onchange = showAttrConf
      fillAttrsInForm('attr-titling-metric', 'num')

      // cancelSelection(false);
    }


    // clears the graph instance
    this.clearSigma = function() {
      if (TW.partialGraph && TW.partialGraph.graph) {
        TW.partialGraph.graph.clear()
        TW.partialGraph.refresh()

        TW.pushState({'sels':[]})
        TW.SystemState().selectionNids = []
      }
    }


    // our current choice: show only the last cat
    // POSS make it a configuration settings
    this.initialActivetypes = function( categories ) {
        var firstActivetypes = []
        for(var i=0; i<categories.length ; i++) {
          if(i==categories.length-1) firstActivetypes.push(true)
          else firstActivetypes.push(false)
        }
        return firstActivetypes;
    }

};
