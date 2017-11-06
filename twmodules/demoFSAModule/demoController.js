/* ---------------------  demoFSA settings  ----------------------- */

demoFSA.settings = {
    // total duration of demo run in ms
    // "totalDuration": 120000,
    "totalDuration": 20000,

    // duration sleep step between operations
    "sleepDuration": 4000,

    // operations (probabilities for each op)
    "transition_probas": {
      "NeiSelect": .35,
      "RandSelect": .05,
      "ChgLvl": .4,
      "ChgType": .2
    }

    // NB   at this point we return each time to the *same* state
    // POSSIBLE: we could define different states
    //           to allow contextual transition probas,
    //           ex: the proba to changeLevel could be higher after a zoom

}


// NB Demo implementation depends on 3 fundamental ProjectExplorer primitives:
//  - TW.SystemState()
//  - TW.partialGraph
//  - TW.instance

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

  if (this.lastRangeMax != 1) {
    console.warn('demoFSA transitions don\'t add up to 1, will normalize')
  }


  // ROUTINES
  // --------

  // pick one, from array
  this._randpick = function(nds) {
    let picked = Math.round(Math.random() * nds.length)
    return nds[picked]
  }

  // select one, via TinaWebJS instance
  this._select = function(nid) {
    TW.instance.selNgn.MultipleSelection2({nodes:[nid]})
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
      let picked_node = TW.partialGraph.graph.nodes(picked_nid)
      if (! picked_node || ! picked_node.id) {
        console.warn("won't neighborSelect: invalid node: ", picked_node)
      }
      else {
        this._select(picked_node.id)
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
    "ChgLvl" : window.changeLevel, // => will call window.changeLevel()
    "ChgType" : this.changeType.bind(this),
    "NeiSelect": this.neighborSelect.bind(this),
    "RandSelect": this.randomSelect.bind(this)
  }

  // prevent linking to any other method
  Object.freeze(this.actions)

  this.step = 0

  this.run = async function(settings = demoFSA.settings) {

    // wait until partialGraph (sigma instance) is loaded
    while (typeof TW.partialGraph == 'undefined') {
      await this._sleep(500)
    }

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

      // POSSIBLE use selected node as center
      TW.partialGraph.camera.goTo({x:0, y:0, ratio:.8, angle: 0})

      // rest a little
      await this._sleep(settings.sleepDuration)
    }
    console.log("--- finished demo ---")
  }
}


let demo = new Demo()

// we wait 4s for tina to load and then run for totalDuration
demo.run()
