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
    ccModule.colorOrange = '#F96'

    // the target columns in DB: tuple (name, mandatoryBool, group, type)
    ccModule.COLS = [ ["doors_uid",              true,       "auto"   , "t"],
                      ["last_modified_date",     true,       "auto"   , "d"],
                      ["email",                  true,       "plsfill", "t"],
                      ["country",                true,       "plsfill", "t"],
                      ["first_name",             true,       "plsfill", "t"],
                      ["middle_name",           false,       "pref",    "t"],
                      ["last_name",              true,       "plsfill", "t"],
                      ["initials",               true,       "plsfill", "t"],
                      ["position",               true,       "plsfill", "t"],
                      ["hon_title",             false,       "plsfill", "t"],
                      ["interests_text",        false,       "plsfill", "t"],
                      ["community_hashtags",    false,       "plsfill", "at"],
                      ["gender",                false,       "plsfill", "m"],
                      ["job_looking_date",      false,       "pref"   , "d"],
                      ["home_url",              false,       "plsfill", "t"],
                      ["pic_url",               false,       "pref"   , "t"],
                      ["pic_file",              false,       "pref"   , "f"],
                      // ==> *scholars* table

                      ["keywords",               true,       "plsfill", "at"],
                      // ==> *keywords* table

                      ["org",                    true,       "plsfill", "t"],
                      ["org_type",               true,       "plsfill", "m"],
                      ["team_lab",              false,       "pref"   , "t"],
                      ["org_city",              false,       "pref"   , "t"]]
                      // ==> *affiliations* table


    // group "auto"    === filled by controllers
    // group "plsfill" === filled by user, ideally needed for a complete profile
    // group "pref"    === filled by user but not needed at all

    ccModule.miniSanitize = function(aString) {
        return aString.replace(/[^A-z0-9, :\(\)-]/, ' ').replace(/^ +| +$/, '')
    }

    ccModule.makeRandomString = function (nChars) {
      var rando = ""
      var possible = "abcdefghijklmnopqrstuvwxyz0123456789";
      var len = possible.length
      for( var i=0; i < nChars; i++ )
          rando += possible.charAt(Math.floor(Math.random() * len));
      return rando
    }

    ccModule.ulListFromLabelsArray = function (cplArray, ulClassList, message) {
        ulClasses=["minilabels"].concat(ulClassList).join(" ")
        var resultHtml = ""
        if (message) {
            resultHtml = ccModule.miniSanitize(message)
        }
        resultHtml += '<ul class="'+ulClasses+'">'
        for (var i in cplArray) {
            var fname = cplArray[i][0]
            var flabel = cplArray[i][1]
            resultHtml += '<li class="minilabel">'+flabel+'</li>'
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


    // ===============================
    // common vars to all user forms
    // ===============================

    // exposed functions and vars that will be used during the interaction
    ccModule.uform = {}
    ccModule.uform.theFormId = null
    ccModule.uform.theForm = null

    ccModule.uform.initialize
    ccModule.uform.testFillField
    ccModule.uform.stampTime
    ccModule.uform.mainMessage = document.getElementById('main_message')
    ccModule.uform.submitButton = document.getElementById('form_submit')
    ccModule.uform.timestamp = document.getElementById('last_modified_date')

    // dates up to 2049/12/31
    ccModule.uform.validDate = new RegExp( /^20[0-4][0-9]\/(?:0?[1-9]|1[0-2])\/(?:0?[1-9]|[1-2][0-9]|3[0-1])$/)


    // function definitions
    // =====================

    // initialize
    // -----------
    ccModule.uform.initialize = function(aFormId, aValidationFun) {
        ccModule.uform.theFormId = aFormId
        ccModule.uform.theForm = document.getElementById(aFormId)

        ccModule.uform.theForm.onkeyup = aValidationFun
        ccModule.uform.theForm.onchange = aValidationFun
        ccModule.uform.theForm.onblur = aValidationFun
    }

    // testFillField
    // --------------
    // checks if mandatory fields are filled
    // checks if other plsfill ones are filled
    // highlights labels of missing mandatory fields
    ccModule.uform.testFillField = function (aForm, params) {
        // "private" copy
        var wholeFormData = new FormData(aForm)

        // our return values
        var valid = true
        var mandatoryMissingFields = []
        var otherMissingFields = []

        // default params
        if (!params)                           params = {}
        if (params.doHighlight == undefined)   params.doHighlight = true
        if (params.fixResidue == undefined)    params.fixResidue = false

        // let's go
        for (var i in ccModule.COLS) {
          //   console.info("testFillField COLS["+i+"]", ccModule.COLS[i])

          var fieldName = ccModule.COLS[i][0]
          var mandatory = ccModule.COLS[i][1]
          var fieldGroup = ccModule.COLS[i][2]
          var fieldType = ccModule.COLS[i][3]

          var actualValue = wholeFormData.get(fieldName)

          // python residue ~~~> can correct on the fly
          // --------------
          // POSS better strategy ?
          if (params.fixResidue) {
            // "None" as a string
            if (actualValue == "None") {
                actualValue = null
                document.getElementById(fieldName).value = ""
            }
            // arrays of text
            if (fieldType == "at" && actualValue
                  && actualValue.charAt(0) == '['
                  && actualValue.charAt(1) == "'") {
                actualValue = actualValue.replace(/[\[\]']/g,'')
                document.getElementById(fieldName).value = actualValue
            }
          }

          // filled/not filled validation
          // ----------------------------
          // skip non-plsfill elements
          if (fieldGroup != 'plsfill') continue ;

          // get a human-readable label
          var labelElt = document.querySelector('label[for='+fieldName+']')
          var fieldLabel = labelElt ? labelElt.innerText : fieldName

          // alternative null values
          if (actualValue == "") {
              actualValue = null
          }

          // debug
          // console.log(
          //              "cmxClt.testFillField: field", fieldName,
          //              "actualValue:", actualValue
          //             )

          // test mandatory -----------------
          if (mandatory && actualValue == null) {
              // todo human-readable fieldName here
              mandatoryMissingFields.push([fieldName, fieldLabel])
              valid = false
            //   console.log("mandatoryMissingFields", fieldName)

              if (params.doHighlight) {
                  labelElt.style.backgroundColor = ccModule.colorOrange
              }
          }

          // test benign
          // may be missing but doesn't affect valid
          else if (actualValue == null) {
              otherMissingFields.push([fieldName, fieldLabel])
            //   console.log("otherMissingField", fieldName)
          }

          else if (params.doHighlight) {
              labelElt.style.backgroundColor = ""
          }
        } // end for val in ccModule.COLS

        // return full form diagnostic and field census
        return [  valid,
                  mandatoryMissingFields,
                  otherMissingFields         ]
    }

    // simple timestamp on #last_modified_date element
    //                      ------------------
    ccModule.uform.stampTime = function () {
        var now = new Date()
        ccModule.uform.timestamp.value = now.toISOString()
    }

    // ===================================================================
    // additional controllers for detailed forms like /register, /profile
    // ===================================================================

    // exposed functions and vars
    ccModule.uform.checkShowPic
    ccModule.uform.createInitials
    ccModule.uform.checkJobDateStatus
    ccModule.uform.fName = document.getElementById('first_name')
    ccModule.uform.mName = document.getElementById('middle_name')
    ccModule.uform.lName = document.getElementById('last_name')
    ccModule.uform.jobLookingDateStatus = false


    // function definitions, private vars and event handlers
    // ======================================================


    // image fileInput ~~~> display image
    // ----------------------------------
    var fileInput = document.getElementById('pic_file')
    var showPicImg = document.getElementById('show_pic')
    var boxShowPicImg = document.getElementById('box_show_pic')
    var picMsg = document.getElementById('picture_message')
    var imgReader = new FileReader();

    ccModule.uform.checkShowPic = function (aForm, doHighlight) {
        // TEMPORARY initial size already 200 kB, user has to do it himself
        var max_size = 204800

        // TODO  max source image size before resizing
        //       see libs or stackoverflow.com/a/24015367
        // 4 MB
        // var max_size = 4194304

        // always reset style and width/height calculations
        boxShowPicImg.style.display = 'none'
        showPicImg.style.display  = ""
        showPicImg.style.width  = ""
        showPicImg.style.height = ""

        if (fileInput.files) {
            var theFile = fileInput.files[0]

            // debug
            console.log(theFile.name, "size", theFile.size, theFile.lastModifiedDate)

            if (theFile.size > max_size) {
              // msg pb
              picMsg.innerHTML = "The picture is too big (200kB max)!"
              picMsg.style.color = cmxClt.colorRed
            }
            else {
              // msg ok
              picMsg.innerHTML = "Picture ok"
              picMsg.style.color = cmxClt.colorGreen

              // to show the pic when readAsDataURL
              imgReader.onload = function () {
                  showPicImg.src = imgReader.result;

                  // prepare max size while preserving ratio
                  var realValues = window.getComputedStyle(showPicImg)
                  var imgW = realValues.getPropertyValue("width")
                  var imgH = realValues.getPropertyValue("height")

                  // debug
                  // console.log("img wid", imgW)
                  // console.log("img hei", imgH)

                  if (imgW > imgH) {
                      showPicImg.style.width  = "100%"
                      showPicImg.style.height  = "auto"
                  }
                  else {
                      showPicImg.style.width  = "auto"
                      showPicImg.style.height = "100%"
                  }

                  // now show it
                  boxShowPicImg.style.display = 'block'
                  // possible re-adjust outerbox ?
              }
              // create fake src url & trigger the onload
              imgReader.readAsDataURL(theFile);
            }
        }
        else {
            console.warn("skipping testPictureBlob called w/o picture in fileInput")
        }
    }

    // first, middle & last name ~~~> initials
    // ----------------------------------------
    var nameInputs = [ccModule.uform.fName,
                      ccModule.uform.mName,
                      ccModule.uform.lName]

    var initialsInput = document.getElementById('initials')

    ccModule.uform.createInitials = function() {
      var apparentInitials = ""
        nameInputs.forEach ( function(nameInput) {
          var txt = nameInput.value
          if (txt.length) {
            if(/[A-Z]/.test(txt)) {
              var capsArr = txt.match(/[A-Z]/g)
              for (var i in capsArr) {
                apparentInitials += capsArr[i]
              }
            }
            else {
              apparentInitials += txt.charAt(0)
            }
          }
        }) ;
      // update the displayed value
      initialsInput.value = apparentInitials
    }

    // handlers: names to initials
    nameInputs.forEach ( function(nameInput) {
      if (nameInput) {
        nameInput.onkeyup = ccModule.uform.createInitials
        nameInput.onchange = ccModule.uform.createInitials
      }
    })

    // handler: show middlename button
    var mnBtn = document.getElementById('btn-midname')
    if(mnBtn) {
        mnBtn.onclick= function() {
          var mnDiv = document.getElementById('group-midname')
          if (mnDiv.style.display == 'none') {
            mnDiv.style.display = 'table'
          }
          else {
            mnDiv.style.display = 'none'
          }
        }
    }


    // jobLookingDateStatus ~~~> is job date a valid date?
    // ---------------------------------------------------
    var jobBool = document.getElementById('job_bool')
    var jobDate = document.getElementById('job_looking_date')
    var jobDateMsg = document.getElementById('job_date_message')
    var jobLookingDiv = document.getElementById('job_looking_div')

    ccModule.uform.checkJobDateStatus = function () {
      ccModule.uform.jobLookingDateStatus = (jobBool.value == "No" || ccModule.uform.validDate.test(jobDate.value))
      if (!ccModule.uform.jobLookingDateStatus) {
          jobDateMsg.style.color = cmxClt.colorRed
          jobDateMsg.innerHTML = 'Date is not yet in the valid format YYYY/MM/DD'
      }
      else {
          jobDateMsg.style.color = cmxClt.colorGreen
          jobDateMsg.innerHTML = 'Ok valid date!'
      }
    }

    // handler: show jobLookingDiv
    if (jobBool && jobDate) {
        jobBool.onchange = function() {
            if(this.value=='Yes'){
                jobLookingDiv.style.display = 'block'
            }
            else {
                jobLookingDiv.style.display='none'
                jobDate.value=''
            }
        }
        jobDate.onkeyup = ccModule.uform.checkJobDateStatus
        jobDate.onchange = ccModule.uform.checkJobDateStatus
    }


    // ========= end of advanced form controls ===========

    return ccModule
}()) ;

console.log("user shared load OK")
