/**
 * @fileoverview
 * Validates the comex (communityexplorer.org) registration form
 *  + adds a timestamp in input#last_modified_date
 *  + adds autocompletes
 *  + prepares DB save into cmxClt.COLS
 *
 * @todo
 *    - package.json
 *
 * @version 1
 * @copyright ISCPIF-CNRS 2016
 * @author romain.loth@iscpif.fr
 *
 * @requires comex_user_shared
 * @requires comex_user_shared_auth
 */

// initialize form controllers
cmxClt.uform.initialize("comex_reg_form", testAsYouGo)
// our form is now in cmxClt.uform.theForm

// initialize auth with doors
cmxClt.uauth.emailIdSupposedToExist = false

// initially we let the user fill
// with no validation message, then at some point we turn the flag on
var validateWithMessage = false


var shortRegVersion = true
var ignoredFields = []
if (shortRegVersion) {
    ignoredFields = ['community_hashtags', 'gender', 'home_url', 'org', 'org_type']
}

// done when anything in the form changes
function testAsYouGo() {
  // console.log("testAsYouGo Go")

  cmxClt.uauth.earlyValidate()
  if (validateWithMessage) {
      cmxClt.uform.simpleValidateAndMessage({'ignore':ignoredFields})
  }
  cmxClt.uform.checkJobDateStatus()

  if (cmxClt.uauth.passStatus
        && cmxClt.uauth.emailStatus
        && cmxClt.uauth.captchaStatus
        && cmxClt.uform.jobLookingDateStatus) {
      cmxClt.uform.submitButton.disabled = false
  }
  else {
      cmxClt.uform.submitButton.disabled = true
  }
  // stamp => #last_modified_date
  cmxClt.uform.stampTime()
}

var teamCityDivStyle = document.getElementById('team_city_div').style

if (document.getElementById('other_org_div')) {
    var otherInstDivStyle = document.getElementById('other_org_div').style
}

function registerDoorsAndSubmit(){
    cmxClt.uform.mainMessage.innerHTML = "Registering with ISCPIF Doors..."

    // all values from the form have now been validated
    var emailValue = cmxClt.uauth.email.value
    var passValue = cmxClt.uauth.pass1.value
    var wholenameValue = ""

    if (cmxClt.uform.mName.value != "") {
        wholenameValue = cmxClt.uform.lName.value + ', ' + cmxClt.uform.fName.value + ' ' + cmxClt.uform.mName.value
    }
    else {
        wholenameValue = cmxClt.uform.lName.value + ', ' + cmxClt.uform.fName.value
    }


    // REGISTERING ON THE DOORS -------------------------------------
    // /!\ async
    cmxClt.uauth.callDoors(
        "register",
        [emailValue, passValue, wholenameValue],

        // callback: send to DB -------------------
        function(doorsResp) {
            console.log("register resp:", doorsResp)
            addUidThenSubmit(doorsResp)
        }
    )
}

function addUidThenSubmit(doorsResp) {
    var doorsUid = doorsResp[0]
    var doorsMsg = doorsResp[1]

    if (doorsUid == null) {
        cmxClt.uform.mainMessage.innerHTML = "Problem with doors registration... TODO debug"
        cmxClt.uform.mainMessage.style.color = cmxClt.colorRed
        cmxClt.uform.submitButton.disabled = false
    }
    else {
        // fill in the answer we got
        cmxClt.uauth.uidInput.value = doorsUid

        console.info("form was validated and registered@doors: submitting now")

        //==== SEND! ==================
         cmxClt.uform.theForm.submit()
        //=============================
    }
}

// validateAndMsg() : bool (validates fields before doors registration and send)
// -----------------------------------------------------------------------------
//      valid => return *true* which will trigger the doors registration
//                                            and the real submit action
//
//      else  => message the user, unblock the button and return *false*
// -----------------------------------------------------------------------------
function validateAndMsg() {

    // not necessary b/c button type is set and is != "submit"
    // submitEvent.preventDefault()

    cmxClt.uform.submitButton.disabled = true
    cmxClt.uform.mainMessage.style.display = 'block'
    cmxClt.uform.mainMessage.innerHTML = "Validating the form..."

    // runs field-by-field validation and highlights mandatory missing fields
    var diagnostic = cmxClt.uform.testFillField(cmxClt.uform.theForm)
    //                            +++++++++++++

    // RESULTS
    var valid = diagnostic[0]
    var missingFields = diagnostic[1]

    if (valid) {
      // adds the captchaCheck inside the form
      cmxClt.uauth.collectCaptcha()

      cmxClt.uform.mainMessage.innerHTML = "Form is valid... Will register and submit..."
      cmxClt.uform.mainMessage.style.opacity = 1
      cmxClt.uform.mainMessage.style.display = 'block'

      return true
    }
    else {
      console.warn("form is not valid")

      // we reinvoke the testAsYouGo validators with message turned on to help the user
      validateWithMessage = true
      testAsYouGo()
      return false
    }
}


console.log("reg controllers load OK")

// £DEBUG autofill ----------->8------
// cmxClt.uform.fName.value = "Jean"
// cmxClt.uform.lName.value = "Tartampion"
// document.getElementById('initials').value="JPP"
// document.getElementById('country').value = "France"
// document.getElementById('position').value = "atitle"
// document.getElementById('keywords').value = "Blabla"
// document.getElementById('org').value = "CNRS"
//
// cmxClt.uauth.email.value= cmxClt.makeRandomString(7)+"@om.fr"
// cmxClt.uauth.pass1.value="123456+789"
// cmxClt.uauth.pass2.value="123456+789"
// cmxClt.uauth.testMailFormatAndExistence(email.value, false)
// --------------------------->8------
