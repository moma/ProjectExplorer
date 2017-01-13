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

    cC = {}

    // cf corresponding css classes
    cC.colorWhite = '#fff'
    cC.colorRed = '#910'
    cC.colorGreen = '#161'
    cC.colorGrey = '#554'
    cC.colorOrange = '#F96'
    cC.colorBlue = '#23A'


    cC.strokeWhite = ".8px .8px #fff, -.8px -.8px #fff, -.8px .8px #fff, .8px -.8px #fff"
    cC.strokeGrey = ".8px .8px #333, -.5px -.8px #333, -.8px .8px #333, .8px -.8px #333"
    cC.strokeBlack = ".5px .5px #000, -.5px -.5px #000, -.5px .5px #000, .5px -.5px #000"
    cC.strokeDeepGrey = "3px 3px 4px #333,-3px 3px 4px #333,-3px -3px 4px #333,3px -3px 4px #333"


    // the target columns in DB: tuple (name, mandatory, group, type, section)
    cC.COLS = [
                ["keywords",               true,       "plsfill", "at", "map_infos"],
                    // ==> *keywords* table

                ["doors_uid",              true,       "auto"   , "t",  null],
                ["last_modified_date",     true,       "auto"   , "d",  null],
                ["hon_title",             false,       "plsfill", "t",  "basic_infos"],
                ["email",                  true,       "plsfill", "t",  "login_infos"],
                ["first_name",             true,       "plsfill", "t",  "basic_infos"],
                ["middle_name",           false,       "pref",    "t",  "basic_infos"],
                ["last_name",              true,       "plsfill", "t",  "basic_infos"],
                ["country",                true,       "plsfill", "t",  "basic_infos"],
                ["initials",               true,       "pref",    "t",  null],
                ["position",               true,       "plsfill", "t",  "map_infos"],
                ["interests_text",        false,       "pref",    "t",  "other_infos"],
                ["community_hashtags",    false,       "plsfill", "at", "map_infos"],
                ["gender",                false,       "plsfill", "m",  "other_infos"],
                ["job_looking_date",      false,       "pref"   , "d",  "map_infos"],
                ["home_url",              false,       "plsfill", "t",  "other_infos"],
                ["pic_url",               false,       "pref"   , "t",  "other_infos"],
                ["pic_file",              false,       "pref"   , "f",  "other_infos"],
                // ==> *scholars* table

                ["org",                   false,       "plsfill", "t", "org_infos"],
                ["org_type",              false,       "plsfill", "m", "org_infos"],
                ["team_lab",               true,       "plsfill", "t", "map_infos"],
                ["org_city",              false,       "pref"   , "t", "org_infos"]]
                // ==> *affiliations* table

    // group "auto"    === filled by controllers
    // group "plsfill" === filled by user, ideally needed for a complete profile
    // group "pref"    === filled by user but not needed at all

    cC.miniSanitize = function(aString) {
        return aString.replace(/[^A-z0-9, :\(\)-]/, ' ').replace(/^ +| +$/, '')
    }

    cC.makeRandomString = function (nChars) {
      var rando = ""
      var possible = "abcdefghijklmnopqrstuvwxyz0123456789";
      var len = possible.length
      for( var i=0; i < nChars; i++ )
          rando += possible.charAt(Math.floor(Math.random() * len));
      return rando
    }

    cC.ulListFromLabelsArray = function (cplArray, ulClassList, message) {
        ulClasses=["minilabels"].concat(ulClassList).join(" ")
        var resultHtml = ""
        if (message) {
            resultHtml = cC.miniSanitize(message)
        }
        resultHtml += '<ul class="'+ulClasses+'">'
        for (var i in cplArray) {
            var fname = cplArray[i][0]
            var flabel = cplArray[i][1]

            // to open any collapsible containing the label and input
            var openFun = 'return cC.uform.gotoField(\''+fname+'\')'

            // debug onclick fun
            // console.log("openFun", openFun)

            // link works if anchorLabels was run
            resultHtml += '<li class="minilabel"><div onclick="'+openFun+'">'+flabel+'</div></li>'
        }
        resultHtml += '</ul>'
        return resultHtml
    }

    // basic inputs get normal on focus
    cC.makeNormal = function (elt) {
        elt.style.fontWeight = "normal"
    }

    // basic inputs get bold on blur
    cC.makeBold = function (elt){
      if (elt.value != "")   elt.style.fontWeight = "bold"
    }

    // insert after
    // cf. stackoverflow.com/questions/4793604
    cC.insertAfter = function(referenceNode, newNode) {
        referenceNode.parentNode.insertBefore(
            newNode, referenceNode.nextSibling
        )
    }

    // find ancestor
    // cf. stackoverflow.com/questions/22119673
    cC.findAncestor = function(elt, cls) {
        while ((elt = elt.parentElement) && !elt.classList.contains(cls));
        return elt
    }

    // ============================================
    // cmxClt.uform: common vars to all user forms
    // ============================================

    // exposed vars that may be used during the interaction
    cC.uform = {}
    cC.uform.theFormId = null
    cC.uform.theForm = null
    cC.uform.submitButton = document.getElementById('form_submit')
    cC.uform.timestamp = document.getElementById('last_modified_date')
    cC.uform.mainMessage = document.getElementById('main_message')

    // functions
    cC.uform.initialize
    cC.uform.testFillField
    cC.uform.simpleValidateAndMessage
    cC.uform.stampTime
    cC.uform.gotoField
    cC.uform.multiTextinput

    // dates up to 2049/12/31
    cC.uform.validDate = new RegExp( /^20[0-4][0-9]\/(?:0?[1-9]|1[0-2])\/(?:0?[1-9]|[1-2][0-9]|3[0-1])$/)


    // function definitions
    // =====================


    // multiTextinput
    //
    // stub for multiple textinput like keywords
    //   => UX shows newInput where user enters words one by one
    //   => validate words become removable "pills"
    //   => result is concatenated texts in hidden input.#fName
    // TODO finalize and add to initialize
    cC.uform.multiTextinput = function (fName) {
        var normalInput = document.getElementById(fName)
        normalInput.hidden = true

        var newTextArrayInput = document.createElement('input');
        newTextArrayInput.class = "form-control autocomp"  // TODO use autocomp
        cC.insertAfter(normalInput, newTextArrayInput)
    }

    // initialize
    // -----------
    cC.uform.initialize = function(aFormId, aValidationFun) {
        cC.uform.theFormId = aFormId
        cC.uform.theForm = document.getElementById(aFormId)

        // events
        cC.uform.theForm.onkeyup = aValidationFun
        cC.uform.theForm.onchange = aValidationFun
        cC.uform.theForm.onblur = aValidationFun
    }

    // testFillField
    // --------------
    // diagnostic over COLS, good to use in validation funs
    //
    // checks if mandatory fields are filled
    // checks if other plsfill ones are filled
    // highlights labels of missing mandatory fields
    cC.uform.testFillField = function (aForm, params, cols) {
        // "private" copy
        var wholeFormData = new FormData(aForm)

        // our return values
        var valid = true
        var mandatoryMissingFields = []
        var otherMissingFields = []

        // default params
        if (!params)                           params = {}
        // bool
        if (params.doHighlight == undefined)   params.doHighlight = true
        if (params.fixResidue == undefined)    params.fixResidue = false
        // $
        if (!params.filterGroup)               params.filterGroup = "plsfill"
        // @
        if (!params.ignore)                    params.ignore = []
        if (!params.cols)                      params.cols = cC.COLS

        // let's go
        for (var i in params.cols) {
          //   console.info("testFillField COLS["+i+"]", cC.COLS[i])

          var fieldName = params.cols[i][0]
          var mandatory = params.cols[i][1]
          var fieldGroup = params.cols[i][2]
          var fieldType = params.cols[i][3]

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

          // filled or not filled
          // --------------------

          // skipping params.ignore and non-filterGroup elements
          var ignoreFlag = false
          for (var j in params.ignore) {
            if (fieldName == params.ignore[j]) {
                ignoreFlag = true
                break
            }
          }
          if (ignoreFlag || fieldGroup != params.filterGroup) continue ;
          //                                                    skip

          // otherwise get a human-readable label
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

              if (params.doHighlight && labelElt) {
                  labelElt.style.backgroundColor = cC.colorOrange
              }
          }

          // test benign
          // may be missing but doesn't affect valid
          else if (actualValue == null) {
              otherMissingFields.push([fieldName, fieldLabel])
            //   console.log("otherMissingField", fieldName)
          }

          else if (params.doHighlight && labelElt) {
              labelElt.style.backgroundColor = ""
          }
      } // end for val in params.cols

        // return full form diagnostic and field census
        return [  valid,
                  mandatoryMissingFields,
                  otherMissingFields         ]
    }

    // simple timestamp on #last_modified_date element
    //                      ------------------
    cC.uform.stampTime = function () {
        var now = new Date()
        cC.uform.timestamp.value = now.toISOString()
    }



    // diagnosticParams are optional
    //
    cC.uform.simpleValidateAndMessage = function (diagnosticParams) {
        var diagnostic = cmxClt.uform.testFillField(cmxClt.uform.theForm,
                                                    diagnosticParams)
        var isValid = diagnostic[0]
        var mandatoryMissingFields = diagnostic[1]
        var optionalMissingFields = diagnostic[2]

        if (isValid) {
            cmxClt.uform.mainMessage.innerHTML = "<span class='green glyphicon glyphicon-check glyphicon-float-left' style='float:left;'></span><p>OK thank you! <br/>(we have all the fields needed for the mapping!)<br/>(don't forget to SAVE!)</p>"


            cmxClt.uform.mainMessage.classList.add('faded')
        }
        else {
            cmxClt.uform.mainMessage.innerHTML = "<span class='orange glyphicon glyphicon-exclamation-sign glyphicon-float-left'></span><p>Sorry, there are some<br/> important missing fields</p>"

            cmxClt.uform.mainMessage.classList.remove('faded')
        }

        // list of missing fields
        cmxClt.uform.mainMessage.innerHTML += cmxClt.ulListFromLabelsArray(mandatoryMissingFields, ['orange'])

        if (optionalMissingFields.length) {
            cmxClt.uform.mainMessage.innerHTML += cmxClt.ulListFromLabelsArray(
                    optionalMissingFields,
                    ['white'],
                    "You may also want to fill:"
                )
        }
    }



    // gotoField
    // (assumes nothing)
    // (side-effect: opens the corresponding panel)
    cC.uform.gotoField = function (fName) {
        // debug
        // console.log('goto fName', fName)

        var fieldElt = document.getElementById(fName)

        // open panel if it is closed
        var ourPanel = cC.findAncestor(fieldElt, "panel-collapse")
        if (ourPanel && ! ourPanel.classList.contains('in')) {
            // POSS use cols with key/value structure to use cols[fName] instead of looking for i
            var theCol = -1
            for (var i in cC.COLS) {
                if (fName == cC.COLS[i][0]) {
                    theCol = i
                    break
                }
            }
            var ccSection = cC.COLS[i][4]

            // debug
            // console.log('ccSection', ccSection)

            if (ccSection) {
                // click the corresponding toggler
                document.getElementById('ccsection_toggle_'+ccSection).click()
            }
        }
        // now go to the field itself (actually, 120px above)
        // --------------------------------------------------
        fieldElt.scrollIntoView(true)
        window.scrollTo(window.scrollX, window.scrollY - 120)
    }

    // ===================================================================
    // additional controllers for detailed forms like /register, /profile
    // ===================================================================

    // exposed functions and vars
    cC.uform.checkShowPic
    cC.uform.createInitials
    cC.uform.checkJobDateStatus
    cC.uform.fName = document.getElementById('first_name')
    cC.uform.mName = document.getElementById('middle_name')
    cC.uform.lName = document.getElementById('last_name')
    cC.uform.jobLookingDateStatus = false


    // function definitions, private vars and event handlers
    // ======================================================


    // image fileInput ~~~> display image
    // ----------------------------------
    var fileInput = document.getElementById('pic_file')
    var showPicImg = document.getElementById('show_pic')
    var boxShowPicImg = document.getElementById('box_show_pic')
    var picMsg = document.getElementById('picture_message')
    var imgReader = new FileReader();

    cC.uform.checkShowPic = function (aForm, doHighlight) {
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
    var nameInputs = [cC.uform.fName,
                      cC.uform.mName,
                      cC.uform.lName]

    var initialsInput = document.getElementById('initials')

    cC.uform.createInitials = function() {
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
        nameInput.onkeyup = cC.uform.createInitials
        nameInput.onchange = cC.uform.createInitials
      }
    })

    // handler: show middlename button
    var mnDiv = document.getElementById('group-midname')

    if (mnDiv) {
        var mnLabel = mnDiv.querySelector('label')

        var mnBtn = document.getElementById('btn-midname')
        var mnBtnIcon = document.getElementById('btn-midname-icon')

        if(!mnBtn) {
            console.warn('group-midname without btn-midname')
            mnDiv.style.display = 'block'
        }
        else {
            mnBtn.onclick= function() {

              if (mnDiv.style.display == 'none') {
                mnDiv.style.display = 'table'
                mnLabel.style.color="#23A"
                setTimeout(function(){mnLabel.style.color=""}, 2000)

                mnBtnIcon.classList.remove("glyphicon-plus")
                mnBtnIcon.classList.add("glyphicon-arrow-down")
                mnBtnIcon.style.color="#23A"
                mnBtnIcon.style.textShadow = cC.strokeBlack
              }

              else {
                mnDiv.style.display = 'none'

                mnBtnIcon.classList.remove("glyphicon-arrow-down")
                mnBtnIcon.classList.add("glyphicon-plus")
                mnBtnIcon.style.color=""
                mnBtnIcon.style.textShadow = ""
              }
            }
        }
    }

    cC.uform.displayMidName = function() {
        mnDiv.style.display = 'table'
        mnLabel.style.color="#23A"
        setTimeout(function(){mnLabel.style.color=""}, 2000)

        mnBtnIcon.classList.remove("glyphicon-plus")
        mnBtnIcon.classList.add("glyphicon-arrow-down")
        mnBtnIcon.style.color="#23A"
        mnBtnIcon.style.textShadow = cC.strokeBlack
    }

    cC.uform.hideMidName = function() {
        mnDiv.style.display = 'none'

        mnBtnIcon.classList.remove("glyphicon-arrow-down")
        mnBtnIcon.classList.add("glyphicon-plus")
        mnBtnIcon.style.color=""
        mnBtnIcon.style.textShadow = ""
    }


    // jobLookingDateStatus ~~~> is job date a valid date?
    // ---------------------------------------------------
    var jobBool = document.getElementById('job_bool')
    var jobDate = document.getElementById('job_looking_date')
    var jobDateMsg = document.getElementById('job_date_message')
    var jobLookingDiv = document.getElementById('job_looking_div')

    cC.uform.checkJobDateStatus = function () {
      cC.uform.jobLookingDateStatus = (jobBool.value == "No" || cC.uform.validDate.test(jobDate.value))
      if (!cC.uform.jobLookingDateStatus) {
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
        jobDate.onkeyup = cC.uform.checkJobDateStatus
        jobDate.onchange = cC.uform.checkJobDateStatus
    }


    // ========= end of advanced form controls ===========

    return cC
}()) ;

console.log("user shared load OK")
