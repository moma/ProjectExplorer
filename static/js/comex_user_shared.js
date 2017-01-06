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

    // the target columns in DB: tuple (name, mandatoryBool, type)
    ccModule.COLS = [ ["doors_uid",              true,       "auto"   ],
                      ["last_modified_date",     true,       "auto"   ],
                      ["email",                  true,       "plsfill"],
                      ["country",                true,       "plsfill"],
                      ["first_name",             true,       "plsfill"],
                      ["middle_name",           false,       "plsfill"],
                      ["last_name",              true,       "plsfill"],
                      ["initials",               true,       "plsfill"],
                      ["position",              false,       "plsfill"],
                      ["hon_title",             false,       "plsfill"],
                      ["interests_text",        false,       "plsfill"],
                      ["community_hashtags",    false,       "plsfill"],
                      ["gender",                false,       "plsfill"],
                      ["job_looking_date",      false,       "pref"   ],
                      ["home_url",              false,       "plsfill"],
                      ["pic_url",               false,       "pref"   ],
                      ["pic_file",              false,       "pref"   ],
                      // ==> *scholars* table

                      ["keywords",               true,       "plsfill"],
                      // ==> *keywords* table

                      ["org",                    true,       "plsfill"],
                      ["org_type",               true,       "plsfill"],
                      ["team_lab",              false,       "pref"   ],
                      ["org_city",              false,       "pref"   ]]
                      // ==> *affiliations* table


    // "type" is a complementary information to mandatory
    // --------------------------------------------------
    // type "auto"    === filled by controllers
    // type "plsfill" === filled by user, ideally needed for a complete profile
    // type "pref"    === filled by user but not needed at all

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

    // dates up to 2049/12/31
    ccModule.uform.validDate = new RegExp( /^20[0-4][0-9]\/(?:0?[1-9]|1[0-2])\/(?:0?[1-9]|[1-2][0-9]|3[0-1])$/)


    // checks if mandatory fields are filled
    // checks if other plsfill ones are filled
    ccModule.uform.testFillField = function (aForm) {
        // "private" copy
        var wholeFormData = new FormData(aForm)

        // our return values
        var valid = true
        var mandatoryMissingFields = []
        var otherMissingFields = []
        // var toolongFields = []

        // let's go
        for (var i in ccModule.COLS) {
          // console.warn("checking ccModule.COLS["+i+"]", ccModule.COLS[i])
          var fieldName = ccModule.COLS[i][0]
          var mandatory = ccModule.COLS[i][1]
          var fieldType = ccModule.COLS[i][2]

          // skip non-plsfill elements
          if (fieldName != 'plsfill') continue ;

          var actualValue = wholeFormData.get(fieldName)

          // alternative null values
          if (actualValue == "" || actualValue == "None") {
              actualValue = null
          }

          // debug
          // console.log(
          //              "cmxClt.testEachField: field", fieldName,
          //              "actualValue:", actualValue
          //             )

          // test mandatory -----------------
          if (mandatory && actualValue == null) {
              // todo human-readable fieldName here
              mandatoryMissingFields.push(fieldName)
              valid = false
              console.log("mandatoryMissingFields", fieldName)
          }

          // test benign --------------------
          // may be missing but doesn't affect valid
          else if (actualValue == null) {
              otherMissingFields.push(fieldName)
              console.log("otherMissingField", fieldName)
          }

          // --------------------------------
        } // end for val in ccModule.COLS

        // return full form diagnostic and field census
        return [  valid,
                  mandatoryMissingFields,
                  otherMissingFields         ]
    }

    return ccModule
}()) ;

console.log("shared load OK")
