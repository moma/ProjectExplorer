
//  THIS IS THE ORIGINAL FIRST VERSION OF changeType()
//  It's not used since before I arrived, but useful as a logical resume
//
// States:
// A : Macro-Social
// B : Macro-Semantic
// A*: Macro-Social w/selections
// B*: Macro-Semantic w/selections
// a : Meso-Social
// b : Meso-Semantic
// AaBb: Socio-Semantic
function RefreshState(newNOW){

    console.log("\t\t\tin RefreshState newNOW:_"+newNOW+"_.")

  if (newNOW!="") {
      PAST = NOW;
      NOW = newNOW;

    // if(NOW=="a" || NOW=="A" || NOW=="AaBb") {
    //   $("#category-A").show();
    // }
    // if(NOW=="b" || NOW=="B" || NOW=="AaBb") {
    //   $("#category-B").show();
    // }
  }

    $("#category-A").hide();
    $("#category-B").hide();
    // i=0; for(var s in selections) { i++; break;}
    // if(is_empty(selections) || i==0) LevelButtonDisable(true);
    // else LevelButtonDisable(false);

    //complete graphs case
    // sels=getNodeIDs(selections).length
    if(NOW=="A" || NOW=="a") {
      // N : number of nodes
      // k : number of ( selected nodes + their neighbors )
      // s : number of selections
        var N=( Object.keys(TW.Nodes).filter(function(n){return TW.Nodes[n].type==TW.conf.catSoc}) ).length
        var k=Object.keys(getNeighs(Object.keys(selections),nodes1)).length
        var s=Object.keys(selections).length
        console.log("in social N: "+N+" - k: "+k+" - s: "+s)
        if(NOW=="A"){
            if( (s==0 || k>=(N-1)) ) {
                LevelButtonDisable(true);
            } else LevelButtonDisable(false);
            if(s==N) LevelButtonDisable(false);
        }

        if(NOW=="a") {
            LevelButtonDisable(false);
        }

        $("#semLoader").hide();
        $("#category-A").show();
        $("#colorGraph").show();

    }
    if(NOW=="B" || NOW=="b") {
        var N=( Object.keys(TW.Nodes).filter(function(n){return TW.Nodes[n].type==TW.conf.catSem}) ).length
        var k=Object.keys(getNeighs(Object.keys(selections),nodes2)).length
        var s=Object.keys(selections).length
        console.log("in semantic N: "+N+" - k: "+k+" - s: "+s)
        if(NOW=="B") {
            if( (s==0 || k>=(N-1)) ) {
                LevelButtonDisable(true);
            } else LevelButtonDisable(false);
            if(s==N) LevelButtonDisable(false);
        }

        if(NOW=="b") {
            LevelButtonDisable(false);
        }
        if ( semanticConverged ) {
            $("#semLoader").hide();
            $("#category-B").show();
            setTimeout(function(){
              EdgeWeightFilter("#sliderBEdgeWeight", "0|1", "weight");
              NodeWeightFilter ( "#sliderBNodeWeight" , "NGram", "size");
            },30)
        } else {
            $("#semLoader").css('visibility', 'visible');
            $("#semLoader").show();
        }

    }
    if(NOW=="AaBb"){
        LevelButtonDisable(true);
        $("#category-A").show();
        $("#category-B").show();
    }

    TW.partialGraph.render();

}
