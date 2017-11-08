/* ---------------------  demoFSA settings  ----------------------- */

demoFSA.settings = {
    // show button (otherwise still runnable via console)
    "showButton": false,

    // behavior choice: the 2 possible conditions are "interactions", "duration"
    "stopCondition": "interactions",

    // pause duration before demo restart when user makes actions
    // (used iff stopCondition is "interactions")
    "pauseDuration": 120000,

    // total duration of demo run
    // (used iff stopCondition is "duration")
    "totalDuration": 40000,

    // operations (probabilities for each op)
    "transition_probas": {
      "NeiAdd": .15,
      "NeiSelect": .1,
      "RandSelect": .15,
      "ChgLvl": .15,

      // only makes sense if relatedDocs is true
      "SwitchDocTab": .05,

      // only makes sense if TW.categories.length > 1
      "ChgType": .2,
      "SwitchNeiTab": .2
    },

    // sleep between operations
    "sleepDuration": 5000

    // NB   at this point we return each time to the *same* state
    // POSSIBLE: we could define different states
    //           to allow contextual transition probas,
    //           ex: the proba to changeLevel could be higher after a zoom
}


// NB Demo implementation depends on 4 fundamental ProjectExplorer primitives:
//  - TW.SystemState()
//  - TW.partialGraph
//  - TW.instance
//  - TW.categories

// and access to some gui elements:
//  - TW.gui.checkBox
//  - TW.gui.activateRDTab

/* ---------------------  demoFSA object  ----------------------- */
Demo = function (settings = demoFSA.settings) {
  // INIT
  // ----
  // opRanges: array of choices as a partition of segments inside [0;1]
  this.opRanges = []
  // exemple:
  // [
  //   {threshold: 0.2, action: "NeiAdd"}
  //   {threshold: 0.4, action: "NeiSelect"}
  //   {threshold: 0.45, action: "RandSelect"}
  //   {threshold: 0.6, action: "ChgLvl"}
  //   {threshold: 0.8, action: "ChgType"}
  //   {threshold: 0.85, action: "SwitchDocTab"}
  //   {threshold: 1, action: "SwitchNeiTab"}
  // ]

  // prepare opRanges
  this.lastRangeMax = 0
  for (var action in settings['transition_probas']) {
    let p = parseFloat(settings['transition_probas'][action])
    this.opRanges.push({'threshold': this.lastRangeMax+p, 'action': action})
    this.lastRangeMax += p
  }

  // console.log("opRanges, final max", this.opRanges, this.lastRangeMax)

  if (this.lastRangeMax != 1) {
    console.warn('demoFSA transitions don\'t add up to 1, will normalize')
  }


  // like "interrupt signal" to stop after current step
  this.pauseDemo = false

  // flag to see if running
  this.isRunning = false

  // wait until lastInteraction > 120000
  this.lastActionTimeout = null

  this.pauseOnAction = function() {
    // pause if running
    this.pause()

    // remove potentially scheduled starts
    if (this.lastActionTimeout) {
      window.clearTimeout(this.lastActionTimeout)
    }

    // schedule restart after pauseDuration
    this.lastActionTimeout = window.setTimeout (
       function(){
         console.log("--- restarting demo ---", this.step)
         this.pauseDemo = false
         this.run()
       }.bind(this),
       settings.pauseDuration
    )
  }

  // listen in the window to remember last interactions
  document.body.addEventListener("mousedown", this.pauseOnAction.bind(this), true)
  document.body.addEventListener("keydown", this.pauseOnAction.bind(this), true)
  document.body.addEventListener("touchstart", this.pauseOnAction.bind(this), true)

  // NB: 'mousedown' better than 'click' because we may trigger 'click' via demo


  // ROUTINES
  // --------

  // pick one, from array
  this._randpick = function(arr) {
    let picked = Math.floor(Math.random() * arr.length)
    // console.log("picked", arr.length, picked, arr[picked])
    return arr[picked]
  }

  // select one, via TinaWebJS instance
  this._select = function(nid) {
    TW.instance.selNgn.runAndEffects([nid])
  }

  // cf. stackoverflow.com/questions/951021
  this._sleep = function(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }


  this.pause = function() {
    if (this.isRunning) {
      this.pauseDemo = true
    }

    if (this.button) {
      this.button.style.color = "DarkSlateGray"
      this.button.innerText = "Run Demo"
    }
  }

  // allow manual stopping
  this.stop = function() {
    this.pause()

    // full stop: remove scheduled restarts
    window.clearTimeout(this.lastActionTimeout)
  }

  this.randomSelect = function() {
    let nds = TW.partialGraph.graph.nodes().filter(function(n){return !n.hidden})
    if (! nds.length) {
      console.warn("won't randomSelect: no visible nodes")
    }
    else {
      let picked_node = this._randpick(nds)
      if (! picked_node || ! picked_node.id) {
        console.warn("won't randomSelect: invalid node: ", picked_node)
      }
      else {
        this._select(picked_node.id)
      }
    }
  }

  // we assume something is already selected and that it has a neighbor
  this.neighborSelect = function() {
    let sysState = TW.SystemState()

    let currentActiveRels = {}

    for (var i in sysState.activereltypes) {
      currentActiveRels[sysState.activereltypes[i]] = true
    }

    if (   !sysState
        || !sysState.selectionRels
        || !Object.keys(sysState.selectionRels).length) {
      console.warn("won't neighborSelect: no current selection or no neighbors")
    }
    else {
      let currentNeighNids = []
      for (var relType in sysState.selectionRels) {
        if (currentActiveRels[relType]) {
          for (var selectedNid in sysState.selectionRels[relType]) {
            currentNeighNids = currentNeighNids.concat(
              Object.keys(
                sysState.selectionRels[relType][selectedNid]
              )
            )
          }
        }
      }

      let picked_nid = this._randpick(currentNeighNids)
      let picked_node = null
      try {
        picked_node = TW.partialGraph.graph.nodes(picked_nid)
      }
      catch (e) {
        console.error("skipping neighborSelect on error:", e)
      }
      if (! picked_node || ! picked_node.id) {
        console.warn("won't neighborSelect: invalid node: ", picked_node)
      }
      else {
        this._select(picked_node.id)
      }
    }
  }

  this.neighborAdd = function() {
    TW.gui.checkBox = true
    this.neighborSelect()
    TW.gui.checkBox = false
  }


  // switching neighbors/opposites tab
  this.switchNeiTab = function() {
    // do we have another possible tab (an inactive one) ?
    let possTabsItems = document.querySelectorAll("#selection-tabs-contnr > ul > li:not(.active)")
    let possTabsAnchors = []

    // we must also filter li by display != 'none'
    for (var i=0 ; i < possTabsItems.length ; i++) {
      let elLi = possTabsItems[i]
      if (elLi && (!elLi.style.display || elLi.style.display != 'none')) {
        let elA = elLi.querySelector("a")
        possTabsAnchors.push(elA)
      }
    }

    if (!possTabsAnchors.length) {
      console.warn("won't switchNeiTab: no inactive neighbors-tab")
    }
    else {
      // choose one tab from the inactive
      let link = this._randpick(possTabsAnchors)
      link.click()
    }
  }

  // switching related docs tab
  this.switchRDTab = function() {
    let rdtabs = document.getElementById("reldocs-tabs")

    if (! TW.conf.getRelatedDocs && rdtabs) {
      console.warn("won't switchRDTab: no rdtabs")
    }
    else {
      // do we have another possible tab (an inactive one) ?
      let possTabsAnchors = rdtabs.querySelectorAll("li:not(.active) > a")
      if (!possTabsAnchors.length) {
        console.warn("won't switchRDTab: no inactive rdtab")
      }
      else {
        // choose one tab from the inactive
        TW.gui.activateRDTab(this._randpick(possTabsAnchors))
      }
    }
  }


  // call changeLevel if at least one selected
  this.changeLevel = function() {
    if (TW.SystemState().selectionNids.length) {
      window.changeLevel()
      this.cam.goTo({x:0, y:0, ratio:.9, angle: 0})
    }
    else {
      console.warn("won't changeLevel: no selection")
    }
  }

  // call changeType if more than one type
  this.changeType = function() {
    if (TW.categories.length > 1) {
      window.changeType()
      this.cam.goTo({x:0, y:0, ratio:.9, angle: 0})
    }
    else {
      console.warn("won't changeType: only one nodetype")
    }
  }


  // OPTIONAL BUTTON
  // ---------------

  this.button = null

  // add a button to run the demo
  this.showButton = function() {
    let navbar = document.getElementById('searchnav')
    if (navbar) {
      let navItem = document.createElement('li')
      navItem.id = "demo-navitem"
      navItem.classList.add("navbar-lower", "demoFSAModule")
      navItem.style.marginLeft = ".5em"
      navbar.appendChild(navItem)

      this.button = document.createElement('button')
      this.button.id = "run-demo"
      this.button.classList.add("btn", "btn-warning", "btn-sm")
      this.button.style.color = "DarkSlateGray"
      this.button.innerText = "Run Demo"

      let buttonClick = function() {
        if (! this.isRunning)    this.run()
        else                     this.stop()
      }.bind(this)
      this.button.addEventListener('click', buttonClick, false)
      navItem.appendChild(this.button)
    }
  }

  this.removeButton = function() {
    let navItem = document.getElementById("demo-navitem")
    if (navItem) {
      navItem.remove()
      this.button = null
    }
  }

  // MAIN RUN
  // --------
  // mapping from our actions to the name of the method to call
  this.actions = {
    "ChgLvl" :    this.changeLevel.bind(this),
    "ChgType" :   this.changeType.bind(this),
    "NeiSelect":  this.neighborSelect.bind(this),
    "NeiAdd":     this.neighborAdd.bind(this),
    "SwitchDocTab":  this.switchRDTab.bind(this),
    "SwitchNeiTab":  this.switchNeiTab.bind(this),
    "RandSelect": this.randomSelect.bind(this)
  }


  // prevent linking to any other method
  Object.freeze(this.actions)

  this.cam = null

  this.step = 0

  // run until pauseDemo
  this.run = async function(settings = demoFSA.settings) {
    this.pauseDemo = false
    this.isRunning = true

    // show on button
    if (this.button) {
      this.button.style.color = "Blue"
      this.button.innerText = "Stop Demo"
    }

    // wait until partialGraph (sigma instance) is loaded
    while (typeof TW.partialGraph == 'undefined') {
      await this._sleep(500)
    }

    // get cam from the sigma instance
    this.cam = TW.partialGraph.camera

    // monitor global time
    let startTime = performance.now()
    console.log("--- running demo ---", this.step)

    // step 0 must always be randomSelect => we need a node
    this.randomSelect()

    // next steps
    while (!this.pauseDemo
         &&
          (   settings.stopCondition != "duration"
           || performance.now() - startTime < settings.totalDuration)
         ) {
      // choose an action
      let todoAction = null
      let rand = Math.random() * this.lastRangeMax  // <=> normalized by total
      for (var i in this.opRanges) {
        let op = this.opRanges[i]
        if (rand < op['threshold']) {
          todoAction = op['action']
          break
        }
      }

      // make a step
      let method = this.actions[todoAction]
      method()                           // <==== /!\ invoke
      this.step ++
      console.log("did step", this.step, ":", todoAction)

      // zoom around one of the selected nodes as center
      if (todoAction != "SwitchNeiTab" && todoAction != "SwitchDocTab") {
        let selected = TW.SystemState().selectionNids
        let aNode = TW.partialGraph.graph.nodes(demo._randpick(selected))
        let camPfx = this.cam.readPrefix
        if (aNode && aNode[camPfx+'x'] && aNode[camPfx+'y']) {
          sigma.utils.zoomTo(
            this.cam,                         // cam
            aNode[camPfx+'x'] - this.cam.x,   // x
            aNode[camPfx+'y'] - this.cam.y,   // y
            .7,                               // rel ratio
            {'duration': 500}                 // animation
          )
        }
      }

      // rest a little
      await this._sleep(settings.sleepDuration)

      // when abs cam ratio becomes too close, add a 2s de-zoom step
      if (this.cam.ratio < .4) {
        // de-zoom
        sigma.utils.zoomTo(this.cam, 0, 0, 1/this.cam.ratio, {'duration': 2000})
        await this._sleep(2000)
      }

    }
    console.log("--- paused demo ---")
    this.isRunning = false
  }
}

// runnable with demo.run()
let demo = new Demo()

// optional button
if (demoFSA.settings.showButton)  demo.showButton()
