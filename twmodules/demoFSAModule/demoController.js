/* ---------------------  demoFSA settings  ----------------------- */

demoFSA.settings = {
    // show button (otherwise still runnable via console)
    "showButton": false,

    // behavior choice: the 2 possible conditions are "interactions", "duration"
    "stopCondition": "interactions",

    // pause duration before demo restart when user makes actions
    // (used iff stopCondition is "interactions")
    "pauseDuration": 60000,

    // total duration of demo run
    // (used iff stopCondition is "duration")
    "totalDuration": 40000,

    // operations (proba and tgt state for each op, for each src state)
    "stateTransitions":  {

      // 2-states system, used when TW.categories.length == 1
      "monoMacro": {
        "ChgLvl":       [.15,  "monoMeso"],
        "NeiAdd":       [.1,  "monoMacro"],
        "NeiSelect":    [.2,  "monoMacro"],
        "RandSelect":   [.15, "monoMacro"],
        "RandColor":    [.2,  "monoMacro"],
        "SwitchDocTab": [.2,  "monoMacro"]
      },
      "monoMeso": {
        "ChgLvl":       [.35, "monoMacro"],   // high proba to go back to macro
        "NeiAdd":       [.05, "monoMeso"],
        "NeiSelect":    [.05, "monoMeso"],
        "RandSelect":   [.15, "monoMeso"],
        "RandColor":    [.2,  "monoMeso"],
        "SwitchDocTab": [.2,  "monoMeso"]
      },

      // 4-states system, used when TW.categories.length > 1
      "bipaMacro": {
        "ChgLvl":       [.25,   "bipaMeso"],     // favorise bipaMeso
        "ChgType":      [.2,   "bipaMacro"],
        "NeiAdd":       [.05,  "bipaMacro"],
        "NeiSelect":    [.1,   "bipaMacro"],
        "RandSelect":   [.05,  "bipaMacro"],
        "RandColor":    [.2,   "bipaMacro"],
        "SwitchNeiTab": [.05,  "bipaMacro"],
        "SwitchDocTab": [.01,  "bipaMacro"]
      },
      "bipaMeso": {
        "ChgLvl":       [.15,  "bipaMacro"],
        "ChgType":      [.4,  "bipaMesoXR"],   // access to mixed meso
        "NeiAdd":       [.05,   "bipaMeso"],
        "NeiSelect":    [.1,    "bipaMeso"],
        "RandSelect":   [.05,   "bipaMeso"],
        "RandColor":    [.15,   "bipaMeso"],
        "SwitchNeiTab": [.09,   "bipaMeso"],
        "SwitchDocTab": [.01,   "bipaMeso"]
      },
      "bipaMacroXR": {
        "ChgLvl":       [.1,   "bipaMesoXR"],
        "ChgType":      [.1,    "bipaMacro"],     // back to non-mixed view
        "NeiAdd":       [.05, "bipaMacroXR"],
        "NeiSelect":    [.1,  "bipaMacroXR"],
        "RandSelect":   [.1,  "bipaMacroXR"],
        "RandColor":    [.25, "bipaMacroXR"],
        "SwitchNeiTab": [.1,  "bipaMacroXR"],
        "SwitchDocTab": [.2,  "bipaMacroXR"]
      },
      "bipaMesoXR": {
        "ChgLvl":       [.3,  "bipaMacroXR"],     // access to full map
        "ChgType":      [.15,    "bipaMeso"],     // back to non-mixed view
        "NeiAdd":       [.05,  "bipaMesoXR"],
        "NeiSelect":    [.05,  "bipaMesoXR"],
        "RandSelect":   [.15,  "bipaMesoXR"],
        "RandColor":    [.15, "bipaMacroXR"],
        "SwitchNeiTab": [.14,  "bipaMesoXR"],
        "SwitchDocTab": [.01,  "bipaMesoXR"]
      }
    },

    // sleep between operations
    "sleepDuration": 5000

    // NB   at this point we return each time to the *same* state
    // POSSIBLE: we could define different states
    //           to allow contextual transition probas,
    //           ex: the proba to changeLevel could be higher after a zoom
}



// prepares a state from one conf entry in stateTransitions
AutomState = function (fsaName, fsaProbas) {
  this.transitions = fsaProbas

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
  for (var action in this.transitions) {
    let [value, target] = this.transitions[action]
    let p = parseFloat(value)
    this.opRanges.push({'threshold': this.lastRangeMax+p, 'action': action})
    this.lastRangeMax += p
  }

  if (this.lastRangeMax != 1) {
    console.log('demoFSA transitions for state "',fsaName,'" don\'t add up to 1, will normalize')
  }

}


// NB Demo implementation depends on 4 fundamental ProjectExplorer primitives:
//  - TW.SystemState()
//  - TW.partialGraph
//  - TW.instance
//  - TW.categories

// ...and access to some gui elements and utilities call:
//  - TW.gui.checkBox
//  - TW.gui.activateRDTab
//  - sigma_utils calls (for layouts)
//  - getActivetypesNames

/* ---------------------  demoFSA object  ----------------------- */
Demo = function (settings = demoFSA.settings) {
  // INIT
  // ----
  this.currentState = null

  // prepare states
  this.states = {}
  for (var stateName in settings['stateTransitions']) {
    let state = new AutomState(
        stateName,
        settings['stateTransitions'][stateName]
    )

    // console.log(stateName, "opRanges, final max", state.opRanges, state.lastRangeMax)

    // save the obj
    this.states[stateName] = state
  }


  // like "interrupt signal" to stop after current step
  this.pauseDemo = false

  // flag to see if running
  this.isRunning = false

  // wait until lastInteraction > 120000
  this.lastActionTimeout = null

  this.pauseOnAction = function() {
    // remove potentially scheduled starts
    if (this.lastActionTimeout) {
      window.clearTimeout(this.lastActionTimeout)
    }

    // if not running we don't do a thing
    if (this.isRunning) {
      // pause
      this.pause()

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
  }

  // listen to events in the window to pause on GUI interactions
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
      console.log("won't randomSelect: no visible nodes")
    }
    else {
      let picked_node = this._randpick(nds)
      if (! picked_node || ! picked_node.id) {
        console.log("won't randomSelect: invalid node: ", picked_node)
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
      console.log("won't neighborSelect: no current selection or no neighbors")
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
        console.log("won't neighborSelect: invalid node: ", picked_node)
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
      console.log("won't switchNeiTab: no inactive neighbors-tab")
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
      console.log("won't switchRDTab: no rdtabs")
    }
    else {
      // do we have another possible tab (an inactive one) ?
      let possTabsAnchors = rdtabs.querySelectorAll("li:not(.active) > a")
      if (!possTabsAnchors.length) {
        console.log("won't switchRDTab: no inactive rdtab")
      }
      else {
        // choose one tab from the inactive
        TW.gui.activateRDTab(this._randpick(possTabsAnchors))
      }
    }
  }


  // apply a random color from those available in current view
  this.applyRandomColor = function() {
    if (getActivetypesNames && getColorFunction) {
      let actypes = getActivetypesNames()
      let possibleColors = []
      for (var k in actypes) {
        let ty = actypes[k]
        for (var attTitle in TW.Facets[ty]) {
          possibleColors.push(attTitle)
        }
      }

      let pickedColor = this._randpick(possibleColors)
      // coloring function
      let colMethod = getColorFunction(pickedColor)

      console.log("pickedColor", pickedColor, colMethod)

      // invoke
      window[colMethod](pickedColor)
    }
  }

  // call changeLevel if at least one selected
  this.changeLevel = function() {
    if (TW.SystemState().selectionNids.length) {
      window.changeLevel()
      this.cam.goTo({x:0, y:0, ratio:.9, angle: 0})
    }
    else {
      console.log("won't changeLevel: no selection")
    }
  }

  // call changeType if more than one type
  this.changeType = function() {
    if (TW.categories.length > 1) {
      window.changeType()
      this.cam.goTo({x:0, y:0, ratio:.9, angle: 0})
    }
    else {
      console.log("won't changeType: only one nodetype")
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
    "RandColor":  this.applyRandomColor.bind(this),
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

    // (at start or after pause) deduce new state name from TW vars
    if (! this.currentState) {
      let prefix = TW.categories.length > 1 ? "bipa" : "mono"
      let level = TW.SystemState().level ? "Macro" : "Meso"
      let mixed = TW.SystemState().activereltypes.length > 1 ? "XR" : ""

      // TODO remove depending on name convention
      this.currentState = prefix + level + mixed

      console.log("chosed currentState",   this.currentState )
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

      // our current state
      let state = this.states[this.currentState]

      // choose an action
      let todoAction = null
      let todoTarget = null
      let rand = Math.random() * state.lastRangeMax  // <=> normalized by
                                                     //     total for this state

      for (var i in state.opRanges) {
        let op = state.opRanges[i]
        if (rand < op['threshold']) {
          todoAction = op['action']
          todoTarget = state.transitions[todoAction][1]
          break
        }
      }

      // make a step
      let method = this.actions[todoAction]
      method()                           // <==== /!\ invoke
      this.step ++
      console.log("did step", this.step, ":", todoAction, "=>", todoTarget)

      // new state
      this.currentState = todoTarget

      // special case: bipaMacroXR needs fa2 if present
      if (this.currentState == "bipaMacroXR"
          && sigma_utils && sigma_utils.smartForceAtlas) {
        sigma_utils.smartForceAtlas({
          'callback': sigma_utils.smartDisperse
        })
        await this._sleep(settings.sleepDuration)
      }

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
    this.currentState = null
  }
}

// runnable with demo.run()
let demo = new Demo()

// optional button
if (demoFSA.settings.showButton)  demo.showButton()
