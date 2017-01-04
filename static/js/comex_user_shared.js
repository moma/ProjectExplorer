/**
 * @fileoverview
 * Comex Client Module: initialize and expose as *cmxClt* var
 *   -> shared vars for css
 *   -> shared vars and functions for all user forms in *cmxClt.uform* submodule
 *
 * @todo
 *    - package.json
 *
 * @version 1
 * @copyright ISCPIF-CNRS 2016
 * @author romain.loth@iscpif.fr
 *
 */


// initialize and export cmxClt module
var cmxClt = (function() {

    ccModule = {}

    // cf corresponding css classes
    ccModule.colorWhite = '#fff'
    ccModule.colorRed = '#910'
    ccModule.colorGreen = '#161'
    ccModule.colorGrey = '#554'


    ccModule.makeRandomString = function (nChars) {
      var rando = ""
      var possible = "abcdefghijklmnopqrstuvwxyz0123456789";
      var len = possible.length
      for( var i=0; i < nChars; i++ )
          rando += possible.charAt(Math.floor(Math.random() * len));
      return rando
    }

    ccModule.ulListFromLabelsArray = function (strArray, ulClassList) {
        ulClasses=["minilabels"].concat(ulClassList).join(" ")
        var resultHtml = '<ul class="'+ulClasses+'">'
        for (var i in strArray) {
            var label = strArray[i].replace(/_/, " ")
            resultHtml += '<li class="minilabel">'+label+'</li>'
        }
        resultHtml += '</ul>'
        return resultHtml
    }

    // basic inputs get normal on focus
    ccModule.makeNormal = function (elt) {
        elt.style.fontWeight = "normal"
    }

    // basic inputs get bold on blur
    ccModule.makeBold = function (elt){
      if (elt.value != "")   elt.style.fontWeight = "bold"
    }


    // common vars to user forms
    ccModule.uform = {}
    ccModule.uform.theFormId = null
    ccModule.uform.theForm = null
    ccModule.uform.wholeFormData = null

    // vars that will be used during the interaction
    ccModule.uform.submitButton = document.getElementById('formsubmit')
    ccModule.uform.mainMessage = document.getElementById('main_validation_message')

    ccModule.uform.initialize = function(aFormId, aValidationFun) {
        ccModule.uform.theFormId = aFormId
        ccModule.uform.theForm = document.getElementById(aFormId)

        ccModule.uform.theForm.onkeyup = aValidationFun
        ccModule.uform.theForm.onchange = aValidationFun
        ccModule.uform.theForm.onblur = aValidationFun

    }

    return ccModule
}()) ;



console.log("shared load OK")
