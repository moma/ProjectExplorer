'use strict';

// this class will be instanciated once (and exposed as TW.instance.selNgn)
function SelectionEngine() {

    // "main" selection function for a typical event
    //  - checks the cases
    //  - calls the other SelectionEngine routines
    //  - triggers GUI effects and state
    this.runAndEffects = function (eventTargets) {
      // 1)
      var targeted = this.SelectorEngine( {
                          addvalue:TW.gui.checkBox,
                          currsels: eventTargets,
                          prevsels: TW.SystemState().selectionNids
                      } )
      // 2)
      if(targeted.length>0) {

        // we still check if the selection is unchanged before create state
        let currentNids = TW.SystemState().selectionNids
        let sameNids = true
        if (currentNids.length != targeted.length) {
          sameNids = false
        }
        else {
          for (var j in currentNids) {
            if (currentNids[j] != targeted[j]) {
              sameNids = false
              break
            }
          }
        }

        // iff new selection, create effects and state
        if (!sameNids) {
          this.MultipleSelection2( {nodes:targeted} )
        }
      }
      // or clear previous selection, also with effects and state
      else {
        cancelSelection(false)
      }
    }

    // creates the union of prevsels and currsels, if addvalue
    // called for:
    //    clickNode selections
    //    circleArea selections
    //    searchInput selections
    this.SelectorEngine = function( args ) {

        // console.log("addvalue, prevsels, currsels", args)

        if (!args)                 args = {}
        if (!args.addvalue)        args.addvalue = false
        if (!args.prevsels)        args.prevsels = []
        if (!args.currsels)        args.currsels = []

        var targeted = []

        // currsels = bunch of nodes from a click in the map
        if(args.addvalue) {
            // complementary select if disjoint, deselect if overlap
            targeted = args.currsels.filter(function (item) {
                return args.prevsels.indexOf(item) < 0;
            }).concat(args.prevsels.filter(function (item) {
                return args.currsels.indexOf(item) < 0;
              }));
        }
        // circle select default: deselect if overlap
        else if (TW.gui.circleSize) {
          targeted = args.currsels.filter(function (item) {
              return args.prevsels.indexOf(item) < 0;
          });
        }
        // other view default: only new targets
        else {
          targeted = args.currsels;
        }

        if(targeted.length==0) return [];

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
     * @noState: bool flag to avoid registering new state (useful for CTRL+Z)
     *
     *  external usage : clickHandler, search, changeType, filters, tag click...
     */
     // ====================
    this.MultipleSelection2 = function(args) {

        if (!args)                      args = {}
        if (isUndef(args.nodes))        args.nodes = []
        if (isUndef(args.noState))      args.noState = false

        if (TW.conf.debug.logSelections) {
          var tMS2_deb = performance.now()
          console.log(
            "IN SelectionEngine.MultipleSelection2:", args.nodes,
            "noState:", args.noState
          )
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


        var activereltypes = TW.SystemState().activereltypes


        // Dictionaries of: selection+neighbors for the new state and updateRelatedNodesPanel
        let selections = {}

        // detailed relations sorted by types and srcid (for state cache, deselects etc)
        let activeRelations = {}

        for (var k in activereltypes) {
          let activereltype = activereltypes[k]
          activeRelations[activereltype] = {}
        }

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


                for (var k in activereltypes) {
                  let activereltype = activereltypes[k]

                  if(TW.Relations[activereltype] && TW.Relations[activereltype][srcnid] ) {
                      var neighs = TW.Relations[activereltype][srcnid]

                      activeRelations[activereltype][srcnid] = {}

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

                                    // except when XR because it'll already be in oppoSideNeighbors
                                    if (activereltype != 'XR')
                                      sameSideNeighbors[tgtnid]=0
                                  }

                                  // and the detailed info
                                  if (typeof activeRelations[activereltype][srcnid][tgtnid] == 'undefined') {
                                    activeRelations[activereltype][srcnid][tgtnid]=0
                                  }

                                  // **make the edge active**
                                  if (e1 && !e1.hidden) {
                                    e1.customAttrs.activeEdge = 1;
                                    activeRelations[activereltype][srcnid][tgtnid] += e1.weight || 1

                                    // + enrich neighbor's info except if duplicate with oppoSideNeighbors
                                    if (activereltype != 'XR')
                                      sameSideNeighbors[tgtnid] += e1.weight || 1
                                  }
                                  if (e2 && !e2.hidden) {
                                     e2.customAttrs.activeEdge = 1;
                                     activeRelations[activereltype][srcnid][tgtnid] += e2.weight || 1

                                     // + enrich neighbor's info except if duplicate with oppoSideNeighbors
                                     if (activereltype != 'XR')
                                      sameSideNeighbors[tgtnid] += e2.weight || 1
                                  }

                                  // we add as neighbor to color it (except if already in targeted)
                                  if (!tgt.customAttrs.active)    tgt.customAttrs.highlight = 1;
                                }
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
        if(TW.Relations["XR"]) {

          activeRelations["XR"] = {}

          for(var i in theSelection) {
                let srcnid = theSelection[i]

                var bipaNeighs = TW.Relations["XR"][srcnid];

                activeRelations["XR"][srcnid] = {}

                for(var k in bipaNeighs) {

                  let eid1 = srcnid+';'+bipaNeighs[k]
                  let eid2 = bipaNeighs[k]+';'+srcnid

                  var edgeWeight = 1
                  if (TW.Edges[eid1])      edgeWeight = TW.Edges[eid1].weight
                  else if (TW.Edges[eid2]) edgeWeight = TW.Edges[eid2].weight

                  if (typeof activeRelations["XR"][srcnid][bipaNeighs[k]] == "undefined") {
                    activeRelations["XR"][srcnid][bipaNeighs[k]] = 0;
                  }
                  if (typeof oppoSideNeighbors[bipaNeighs[k]] == "undefined") {
                    oppoSideNeighbors[bipaNeighs[k]] = 0 ;
                  }

                  // cumulated weight for all srcnids
                  oppoSideNeighbors[bipaNeighs[k]] += edgeWeight

                  // console.log('edgeWeight', edgeWeight)

                  // and the details
                  activeRelations["XR"][srcnid][bipaNeighs[k]] += edgeWeight
                }
            }
        }

        // Sort by descending value
        //   and rewrites dict[id]: val as array[order]: {key:id, value:val}
        let oppos = []
        let same = []

        if (activeRelations["XR"]) {
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
        if (! args.noState) {
          TW.pushGUIState( { 'sels': theSelection,
                             'rels': activeRelations } )
        }

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
          // POSS: index by ntypeId = 0 for nodes0 or 1 for nodes1
          if (n.type && n.size) {
            let typekey = TW.catDict[n.type]
            let sizekey = parseFloat(n.size)
            if (!this.nodesByTypeNSize[typekey])
              this.nodesByTypeNSize[typekey] = {}
            if (!this.nodesByTypeNSize[typekey][sizekey])
              this.nodesByTypeNSize[typekey][sizekey] = {}
            this.nodesByTypeNSize[typekey][sizekey][n.id] = true
          }
          else {
            // should never happen
            console.warn("warning: couldn't add node to index ?", n)
          }
        },
        dropNode: function(n) {
          if (n.type && n.size) {
            let typekey = TW.catDict[n.type]
            delete(this.nodesByTypeNSize[typekey][n.size][n.id])
          }
        }
      });

      // @typekey: a node type id among {0,1}
      // @aSizeSelector can be:
      //  - a numeric value
      //  - a range (ordered array of 2 numeric values)
      sigmaModule.classes.graph.addMethod('getNodesBySize', function(typekey, aSizeSelector) {
        let res = []

        // shortcut case for commodity: entire index if no arg
        if (isUndef(aSizeSelector)) {
          res = this.nodesByTypeNSize[typekey]
        }

        // normal cases
        else if (isNumeric(aSizeSelector)) {
          let sizekey = parseFloat(aSizeSelector)
          if (this.nodesByTypeNSize[typekey][sizekey]) {
            res = Object.keys(this.nodesByTypeNSize[typekey][sizekey])
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
          let sortedSizes = Object.keys(this.nodesByTypeNSize[typekey]).sort(function(a,b){return a-b})

          // the nodes with sizes in range
          for (var k in sortedSizes) {
            let val = sortedSizes[k]
            if (val > sizeMax) {
              break
            }
            if (val >= sizeMin) {
              res = res.concat(Object.keys(this.nodesByTypeNSize[typekey][val]))
            }
          }
        }
        return res;
      });

      // All nodes *in the instance* by type
      // NB: not used at the moment but easy and perhaps very useful in future
      // arg:
      //   @typekey: a node type id among {0,1}
      sigmaModule.classes.graph.addMethod('getNodesByType', function(typekey) {
        let res = []
        // concatenate all sizes because this detail doesn't matter to us here
        for (let szk in this.nodesByTypeNSize[typekey]) {
          res = res.concat(Object.keys(this.nodesByTypeNSize[typekey][szk]))
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

        var selectionEngine = this.selNgn

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
            selectionEngine.search_n_select(query)
            // ------------------------------------------------
        });

        // Search by pressing ENTER, independently from autocomplete
        $("#searchinput").keydown(function (e) {
            if (e.keyCode == 13) {
                var query = normalizeString($("#searchinput").val())
                selectionEngine.search_n_select(query)
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
                $("#read-opposite-neighs").readmore({maxHeight:200});
                $("#read-sameside-neighs").readmore({maxHeight:200});
              },
              500
            )
        });

        $("#changetype").click(function(){
            console.log("changeTYPE click");
            if (TW.partialGraph.isForceAtlas2Running())
                sigma_utils.ourStopFA2();

            changeType();
            setTimeout(function(){
              //  $('.etabs a[href="#tagCloudXR"]').trigger('click');
              $('#selection-tabs-contnr').easytabs('select', '#tagcloud-XR')
            },500)
        });

        $("#changelevel").click(function(){
            console.log("changeLEVEL click");
            if (TW.partialGraph.isForceAtlas2Running())
                sigma_utils.ourStopFA2();
            changeLevel();
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

        $("#tips").html(getTips());

        // we start with no selection
        $("#selection-tabs-contnr").hide();

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
                // determine if we work just on visible nodes
                let skipHiddenFlag = !TW.conf.stablePositions || TW.conf.independantTypes

                // show waiting cursor on page and button
                TW.gui.elHtml.classList.add('waiting');
                this.style.cursor = 'wait'
                // and waiting icon
                this.insertBefore(createWaitIcon('noverlapwait'), this.children[0])

                // reconfigure to account for nodesizes (if current sizes up => margin needs up)
                let sizeFactor = Math.max.apply(null, TW.gui.sizeRatios)
                TW.gui.noverlapConf.nodeMargin =  .5 * sizeFactor
                TW.gui.noverlapConf.scaleNodes = 1.5 * sizeFactor
                if (skipHiddenFlag) {
                  TW.gui.noverlapConf.nodes = getVisibleNodes()
                }
                TW.partialGraph.configNoverlap(TW.gui.noverlapConf)
                var listener = TW.partialGraph.startNoverlap();
                var noverButton = this
                listener.bind('stop', function(event) {
                  // update fa2 positions in any case, but don't skipHidden unless unstable positions
                  reInitFa2({
                    localZoneSettings: !TW.SystemState().level,
                    skipHidden: skipHiddenFlag,
                    typeAdapt: skipHiddenFlag,
                    callback: function() {console.debug("noverlap: updated fa2 positions")}
                  })
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
              // console.log("pop state")
              let previousState = TW.states.pop()

              deselectNodes(previousState)

              let returningState = TW.SystemState()

              // restoring level (will also restore selections)
              if (returningState.level != previousState.level) {
                changeLevel(returningState)
              }
              else {
                // restoring selection
                if (returningState.selectionNids.length) {
                  TW.gui.selectionActive = true
                  // changes active/highlight and refresh
                  // POSS turn the nostate version into a select fun like deselect (ie no state, no refresh)
                  TW.instance.selNgn.MultipleSelection2({
                    nodes: returningState.selectionNids,
                    noState: true
                  })
                }
                else {
                  TW.gui.selectionActive = false
                  TW.partialGraph.refresh()
                }
              }
            }, 100)
          }
        } );

    } // finish envListeners


    // to init local, instance-related listeners (need to run at new sigma instance)
    // args: @partialGraph = a sigma instance
    // accessed globals: TW.Facets
    this.initSigmaListeners = function(partialGraph, initialActivetypes, initialActivereltypes, optionalRelDocsConf) {

      // console.log("initSigmaListeners TW.categories / types array / reltypeskeys array: ", TW.categories, initialActivetypes, initialActivereltypes)

      var selectionEngine = this.selNgn

      // changetype button
      if (TW.categories.length == 1) {
        $("#changetype").hide();
      }
      else {
        $("#changetype").show();
      }

      // sigma events bindings
      // ---------------------

      // cf. https://github.com/jacomyal/sigma.js/wiki/Events-API

      // cases:
      // 'click'    - simple click, early event
      //              used for area (with global: TW.gui.circleSize)
      // 'clickNode'- simple click, second event if one node

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

          selectionEngine.runAndEffects(circleNodes)
        }
      })

      // when one node and normal click
      // ===============================
      partialGraph.bind('clickNode', function(e) {
        // console.log("clickNode event e", e)

        // new sigma.js gives easy access to clicked node!
        var theNodeId = e.data.node.id

        if (TW.gui.circleSize == 0) {
                selectionEngine.runAndEffects([theNodeId])
        }
        // case with a selector circle cursor handled
        // just before, at click event
      })


      // doubleClick creates new meso view around clicked node
      partialGraph.bind('doubleClickNode', function(e) {
        // /!\   doubleClick will also fire 2 singleClick events  /!\
        //
        //      https://github.com/jacomyal/sigma.js/issues/208
        //      https://github.com/jacomyal/sigma.js/issues/506
        //
        //      (order: clickNode, doubleClickNode, clickNode)
        //                 1st        2nd (NOW)        3rd

        // so if this was also a new selection, the 1st clickNode did handle it
        // => we just create the new zoom level


        // A - create new zoom level state
        TW.pushGUIState({ level: false })
        // NB2: we never switch back to macro level from doubleClick

        // B - apply it without changing state
        changeLevel(TW.SystemState())
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
        $("#zoomSlider").slider("value",Math.log(1/(TW.cam.ratio+zoomSliRangeRatio)))
      })


      // dragNodes plugin
      if (TW.conf.dragNodesAvailable) {
        var dragListener = sigma.plugins.dragNodes(partialGraph, partialGraph.renderers[0]);

        dragListener.bind("dragend", function(dragEndEvent){
          let mouseEvent = dragEndEvent.data.captor
          if (mouseEvent.ctrlKey) {
            // update FA2 positions array
            reInitFa2({
              localZoneSettings: !TW.SystemState().level,
              skipHidden: !TW.conf.stablePositions || TW.conf.independantTypes,
              typeAdapt: !TW.conf.stablePositions || TW.conf.independantTypes,
              callback: function() {console.debug("dragNodes: updated fa2 positions")}
            })
          }
        })

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

      var zoomSliRangeRatio = TW.conf.zoomMin/TW.conf.zoomMax
      var zoomSliBoundaryTop = Math.log(1/(TW.conf.zoomMin+zoomSliRangeRatio))
      var zoomSliBoundaryBot = Math.log(1/(TW.conf.zoomMax+zoomSliRangeRatio))
      var zoomSliOrigin =      Math.log(1/(TW.cam.ratio+zoomSliRangeRatio))
      var zoomSliStep = (zoomSliBoundaryTop - zoomSliBoundaryBot)/50

      $("#zoomSlider").slider({
          orientation: "vertical",

          // new sigma.js current zoom ratio
          value: partialGraph.camera.ratio,
          min: zoomSliBoundaryBot,   // ex  log(1/(ZOOM-OUT_RATIO+k))
          max: zoomSliBoundaryTop,   // ex  log(1/(ZOOM-IN_RATIO+k))
          // where k is the ratio of the full range

          // range: true,
          step: zoomSliStep,
          value: zoomSliOrigin,
          slide: function( event, ui ) {
              TW.partialGraph.camera.goTo({
                  // we use 1/e^x -k transform for result like logscale on 1/x
                  ratio: 1/Math.exp(ui.value) - zoomSliRangeRatio
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

      // initialize selection tabs (order: show => easytabs => hide => readmore)
      if (TW.categories.length == 1) {
        $('#selection-tabs-contnr').easytabs({
          updateHash:false,
          defaultTab: 'li#tabsameside'
        });
        $("#taboppos").hide();
        $("#read-sameside-neighs").readmore({maxHeight:200});
      }
      else {
        $("#taboppos").show();
        $('#selection-tabs-contnr').easytabs({
          updateHash:false,
          defaultTab: 'li#taboppos'
        });
        $("#read-sameside-neighs").readmore({maxHeight:200});
        $("#read-opposite-neighs").readmore({maxHeight:200});
      }

      // initialize reldocs tabs if declared in optionalRelDocsConf
      // (optionalRelDocsConf function-scope name of TW.currentRelDocsDBs)
      if (TW.conf.getRelatedDocs && optionalRelDocsConf) {
        resetTabs(initialActivetypes, optionalRelDocsConf)
      }

      // defaultColoring: an attribute name to immediately apply color with
      let madeDefaultColor = false
      if (TW.conf.defaultColoring) {
        let colMethodName, colMethod
        if (TW.facetOptions[TW.conf.defaultColoring]) {
          colMethodName = TW.gui.colorFuns[TW.facetOptions[TW.conf.defaultColoring]['col']]
        }
        if (! colMethodName) {
          if(TW.conf.defaultColoring.indexOf("clust")>-1||TW.conf.defaultColoring.indexOf("class")>-1) {
            // for classes and clusters
            colMethod = "clusterColoring"
          }
          else {
            colMethod = "heatmapColoring"
          }
        }

        // retrieve the actual function and if there, try and run it
        colMethod = window[colMethodName]
        if (colMethod && typeof colMethod == "function") {
          try {
            colMethod(TW.conf.defaultColoring)
            madeDefaultColor = true
          }
          catch(err) {
            console.warn(`Settings asked for defaultColoring by the
                          attribute "${TW.conf.defaultColoring}" but
                          it's not present in the dataset => skip action`)
          }
        }
      }
      // otherwise, set the default legend
      if (! madeDefaultColor) {
        updateColorsLegend ( "clust_default" )
      }

      // select currently active sliders
      if (TW.conf.filterSliders) {
        // also for all active cats
        for (let activeId in initialActivetypes) {
          if (initialActivetypes[activeId]) {
            // args: for display: target div ,
            //       for context: family/type prop value,
            //       for values:  the property to filter
            NodeWeightFilter (`#slidercat${activeId}nodesweight` , activeId);
            EdgeWeightFilter(`#slidercat${activeId}edgesweight`,
                              activeId.toString().repeat(2),
                              "weight"
                            );
            $(`.for-nodecategory-${activeId}`).show()
          }
          else {
            $(`.for-nodecategory-${activeId}`).hide()
          }
        }
      }

      // node's label size
      var labelSizeTimeout = null
      $("#sliderlabelsize0").freshslider({
          step:.25,
          min:.25,
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
                // also adapt label threshold
                TW.partialGraph.settings('labelThreshold', getSizeFactor())
                TW.partialGraph.render()
              }
            }, 200)
          }
      });
      var labelSizeTimeout = null
      $("#sliderlabelsize1").freshslider({
          step:.25,
          min:.25,
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
                // also adapt label threshold
                TW.partialGraph.settings('labelThreshold', getSizeFactor())
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

      // add all numeric attributes to titlingMetric with option type fromFacets
      fillAttrsInForm('attr-titling-metric', 'num')

      // show dev stats on json input for this graph if available
      if (TW.stats && Object.keys(TW.stats).length) {
        $("#stats-panel").show()
        $("#stats").html(showStats());
      }
      else {
        $("#stats-panel").hide()
      }


      // add attributes' names list to saveGEXF modal examples
      // ex: "kw: nbjobs,total_occurrences / sch: nbjobs,total_occurrences"
      let exs = document.getElementById("data_attrs_exemples")
      if (exs) {
        let spanContents = []
        for (var ntype in TW.Facets) {
          let attrs = Object.keys(TW.Facets[ntype])
          // remove dynamic attributes
          attrs = attrs.filter( function(at) { return (! TW.sigmaAttributes[at]) } )
          if (attrs && attrs.length) {
            spanContents.push(ntype+': '+attrs.join(","))
          }
        }
        if (spanContents.length) {
          exs.innerHTML = '('+spanContents.join(" / ")+')'
        }
      }

      // cancelSelection(false);
    }


    // clears the graph instance
    this.clearSigma = function() {
      if (TW.partialGraph && TW.partialGraph.graph) {
        TW.partialGraph.graph.clear()
        TW.partialGraph.refresh()

        TW.pushGUIState({'sels':[]})
        TW.SystemState().selectionNids = []
      }
    }


    // our current choice: show only the last cat
    // except when setting TW.conf.debug.initialShowAll
    this.initialActivetypes = function( categories ) {
        let firstActivetypes = []
        for(var i=0; i<categories.length ; i++) {
          if (TW.conf.debug.initialShowAll || i==categories.length-1) {
            firstActivetypes.push(true)
          }
          else firstActivetypes.push(false)
        }
        return firstActivetypes;
    }

    // new business logic associating some activetypes to some activerels
    // (it now allows multiple "relation-families" to be added as visible edges)
    this.inferActivereltypes = function( nodeActivetypes ) {
        let activereltypes = []
        // multiple nodetypes all true => all reltypes
        if (nodeActivetypes.indexOf(false) == -1) {
          if (TW.categories.length == 1) {
            activereltypes = ['00']
          }
          else if (TW.categories.length == 2) {
            activereltypes = ['00', '11', 'XR']
          }
          // POSSible: generalize if length > 1: recurse to generate all true/false combinations except the all-false one
        }
        // normal case: one activereltype, equal to the initialActivetype key
        else {
          activereltypes = [nodeActivetypes.indexOf(true).toString().repeat(2)]
        }

        return activereltypes;
    }

    // POSS for one type => many (jutsu case) results are also interesting when
    //      "disconnecting" previous direct neighbors (making them indirect via XR)
    //      ie:
    //         00 => [11, XR]
    //         11 => [00, XR]
};
