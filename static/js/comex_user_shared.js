/**
 * @fileoverview
 * Shared vars and functions for all user forms
 *
 * @todo
 *    - package.json
 *
 * @version 1
 * @copyright ISCPIF-CNRS 2016
 * @author romain.loth@iscpif.fr
 *
 */

// common vars to user forms
// NB other vars defined in main scope but just before their respective funs
var theFormId = "comex_login_form"
var theForm = document.getElementById(theFormId)
var wholeFormData

// cf corresponding css classes
var colorWhite = '#fff'
var colorRed = '#910'
var colorGreen = '#161'
var colorGrey = '#554'

// vars that will be used during the interaction
var submitButton = document.getElementById('formsubmit')
var mainMessage = document.getElementById('main_validation_message')
theForm.onkeyup = testAsYouGo
theForm.onchange = testAsYouGo
theForm.onblur = testAsYouGo

var lastEmailValueCheckedDisplayed = null

function makeRandomString(nChars) {
  var rando = ""
  var possible = "abcdefghijklmnopqrstuvwxyz0123456789";
  var len = possible.length
  for( var i=0; i < nChars; i++ )
      rando += possible.charAt(Math.floor(Math.random() * len));
  return rando
}


function ulListFromLabelsArray(strArray, ulClassList) {
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
function makeNormal(elt) {
    elt.style.fontWeight = "normal"
}

// basic inputs get bold on blur
function makeBold(elt){
  if (elt.value != "")   elt.style.fontWeight = "bold"
}

