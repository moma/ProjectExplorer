/* ---------------------  demoFSA settings  ----------------------- */

demoFSA.settings = {
    // total duration of demo run in ms
    // "totalDuration": 120000,
    "totalDuration": 40000,

    // duration sleep step between operations
    "sleepDuration": 5000,

    // operations (probabilities for each op)
    "transition_probas": {
      "NeiAdd": .3,
      "NeiSelect": .2,
      "RandSelect": .05,
      "ChgLvl": .2,
      "ChgType": .15,
      "SwitchTab": .1,
    }

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
  //   {threshold: 0.25, action: "NeiSelect"}
  //   {threshold: 0.3, action: "RandSelect"}
  //   {threshold: 0.45, action: "ChgLvl"}
  //   {threshold: 0.6, action: "ChgType"}
  //   {threshold: 1, action: "Sleep"}
  // ]

  // prepare opRanges
  this.lastRangeMax = 0
  for (var action in settings['transition_probas']) {
    let p = parseFloat(settings['transition_probas'][action])
    this.opRanges.push({'threshold': this.lastRangeMax+p, 'action': action})
    this.lastRangeMax += p
  }

  console.log("opRanges, final max", this.opRanges, this.lastRangeMax)

  if (this.lastRangeMax != 1) {
    console.warn('demoFSA transitions don\'t add up to 1, will normalize')
  }


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
    let currentNeiRels = TW.SystemState().selectionRels

    if (   !TW.SystemState()
        || !TW.SystemState().selectionRels
        || !Object.keys(TW.SystemState().selectionRels).length) {
      console.warn("won't neighborSelect: no current selection or no neighbors")
    }
    else {
      let currentNeighNids = []
      for (var relType in TW.SystemState().selectionRels) {
        for (var selectedNid in TW.SystemState().selectionRels[relType]) {
          currentNeighNids = currentNeighNids.concat(
            Object.keys(
              TW.SystemState().selectionRels[relType][selectedNid]
            )
          )
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


  // call changeType if more than one type
  this.changeType = function() {
    if (TW.categories.length > 1) {
      window.changeType()
    }
    else {
      console.warn("won't changeType: only one nodetype")
    }
  }


  // MAIN RUN
  // --------
  // mapping from our actions to the name of the method to call
  this.actions = {
    "ChgLvl" :    window.changeLevel, // => will call window.changeLevel()
    "ChgType" :   this.changeType.bind(this),
    "NeiSelect":  this.neighborSelect.bind(this),
    "NeiAdd":     this.neighborAdd.bind(this),
    "SwitchTab":  this.switchRDTab.bind(this),
    "RandSelect": this.randomSelect.bind(this)
  }

  // prevent linking to any other method
  Object.freeze(this.actions)

  this.cam = null

  this.step = 0

  this.run = async function(settings = demoFSA.settings) {

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
    while (performance.now() - startTime < settings.totalDuration) {
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
      if (todoAction != "SwitchTab") {
        let selected = TW.SystemState().selectionNids
        let aNode = TW.partialGraph.graph.nodes(demo._randpick(selected))
        let camPfx = this.cam.readPrefix
        if (aNode && aNode[camPfx+'x'] && aNode[camPfx+'y']) {
          sigma.utils.zoomTo(
            this.cam,                         // cam
            aNode[camPfx+'x'] - this.cam.x,   // x
            aNode[camPfx+'y'] - this.cam.y,   // y
            .4,                               // rel ratio
            {'duration': 500}                 // animation
          )
        }
      }

      // rest a little
      await this._sleep(settings.sleepDuration)

      // when abs cam ratio becomes too close, add a 2s de-zoom step
      if (this.cam.ratio < .3) {
        // de-zoom
        sigma.utils.zoomTo(this.cam, 0, 0, 1/this.cam.ratio, {'duration': 2000})
        await this._sleep(2000)
      }

    }
    console.log("--- finished demo ---")
  }
}


// add a button to run the demo
let demo = new Demo()
let demoButton = '<button type="button" id="run-demo" class="btn btn-warning btn-sm" title="Lancez une démo d\'exploration automatique" onclick="demo.run()" style="color: DarkSlateGray;">Run Demo</button>'
let navbar = document.getElementById('searchnav')
if (navbar) {
  let navItem = document.createElement('li')
  navItem.id = "demo-navitem"
  navItem.classList.add("navbar-lower")
  navItem.classList.add("demoFSAModule")
  navItem.style.marginLeft = ".5em"
  navItem.innerHTML = demoButton
  navbar.appendChild(navItem)
}
