/**
 * @fileoverview
 * Validates the comex (communityexplorer.org) registration form
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
var regfo = cmxClt.uauth.AuthForm(
    'comex_reg_form',
    testAsYouGo,
    {
      'type': "register",
      'validateCaptcha': true,
      'multiTextinputs': [{'id':'keywords'}]
    }
)

// initially we let the user fill
// with no validation message, then at some point we turn the flag on
var validateWithMessage = false

// debug main validation message
// validateWithMessage = true
// regfo.elMainMessage.style.opacity = 1
// regfo.elMainMessage.style.display = 'block'

var shortRegVersion = true
var ignoredFields = []
if (shortRegVersion) {
    ignoredFields = ['gender', 'home_url', 'org',
                     'hon_title', 'position', 'org_type',
                     'hashtags']
}

// done when anything in the form changes
function testAsYouGo() {
  // console.log("testAsYouGo Go")

  if (validateWithMessage) {
      cmxClt.uform.simpleValidateAndMessage(
          regfo,
          {'ignore':ignoredFields,
           'fixResidue':true}
      )
      // NB fixResidue is useful when user has a problem
      //    on submit then clicks "back" and ends up with
      //    hashtags in brackets like "['#a','#b']"
  }
  if (regfo.passStatus
        && regfo.emailStatus
        && regfo.captchaStatus) {
      regfo.elSubmitBtn.disabled = false
  }
  else {
      regfo.elSubmitBtn.disabled = true
  }
}

var teamCityDivStyle = document.getElementById('team_city_div').style

function registerDoorsAndSubmit(){
    regfo.elMainMessage.innerHTML = "Registering with ISCPIF Doors..."

    // REGISTERING ON THE DOORS -------------------------------------
    // all values from the form have now been validated
    var emailValue = regfo.elEmail.value
    var passValue = regfo.elPass.value
    var wholenameValue = ""

    if (cmxClt.uform.mName.value != "") {
        wholenameValue = cmxClt.uform.lName.value + ', ' + cmxClt.uform.fName.value + ' ' + cmxClt.uform.mName.value
    }
    else {
        wholenameValue = cmxClt.uform.lName.value + ', ' + cmxClt.uform.fName.value
    }

    // /!\ async
    // POSS: could now be invoked via regfo object
    cmxClt.uauth.callDoors(
        "register",
        [emailValue, passValue, wholenameValue],

        // callback: send to DB -------------------
        function(doorsResp) {
            // console.log("register resp:", doorsResp)
            addUidThenSubmit(doorsResp)
        }
    )

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

    regfo.elSubmitBtn.disabled = true
    regfo.elMainMessage.style.display = 'block'
    regfo.elMainMessage.innerHTML = "Validating the form..."

    // runs field-by-field validation and highlights mandatory missing fields
    var diagnostic = cmxClt.uform.testFillField(
            regfo,
            {'ignore':ignoredFields}
    )

    // RESULTS
    var valid = diagnostic[0]
    var missingFields = diagnostic[1]

    if (valid) {
      regfo.elMainMessage.innerHTML = "Form is valid... Will submit and register..."
      regfo.elMainMessage.style.opacity = 1
      regfo.elMainMessage.style.display = 'block'

      return true
    }
    else {
      console.warn("form is not valid")

      // we reinvoke the testAsYouGo validators with message turned on to help the user
      validateWithMessage = true
      regfo.elMainMessage.style.opacity = 1
      regfo.elMainMessage.style.display = 'block'
      testAsYouGo()
      return false
    }
}

// bound inline to submit button if validateAndMsg was true
function addUidThenSubmit(doorsResp) {
    var doorsUid = doorsResp[0]
    var doorsMsg = doorsResp[1]

    console.warn("FIXME doorsUid is valid but pending (subject to confirmation or not) => find a strategy to confirm it later ??")

    if (doorsUid == null) {
        regfo.elMainMessage.innerHTML = "Problem with doors registration..."
        regfo.elMainMessage.mainMessage.style.color = cmxClt.colorRed
        regfo.elSubmitBtn.disabled = false
    }
    else {
        // fill in the answer we got
        regfo.elDuuid.value = doorsUid

        console.info("form was validated and registered@doors: submitting now")

        //==== SEND! ==========
         regfo.elForm.submit()
        //=====================
    }
}



// trigger auth changes (useful if browser completed from cache)
regfo.elEmail.dispatchEvent(new CustomEvent('change'))
regfo.elPass.dispatchEvent(new CustomEvent('change'))
regfo.elCaptcha.dispatchEvent(new CustomEvent('change'))


console.log("reg controllers load OK")

// £DEBUG autofill ----------->8------
// cmxClt.uform.fName.value = "Jean"
// cmxClt.uform.lName.value = "Tartampion"
// document.getElementById('initials').value="JPP"
// document.getElementById('country').value = "France"
// document.getElementById('position').value = "atitle"
// document.getElementById('keywords').value = "Blabla"
// document.getElementById('team_lab').value = "CNRS"
//
// regfo.elEmail.value= cmxClt.makeRandomString(7)+"@om.fr"
// regfo.elPass.value="123456+789"
// regfo.elPass2.value="123456+789"
// // trigger once all auth validations for browser-cache values
// regfo.elForm.dispatchEvent(new CustomEvent('change'))
// console.log('>>>> pass values', regfo.elPass.value, regfo.elPass2.value)
// regfo.elPass.dispatchEvent(new CustomEvent('change'))
// regfo.elCaptcha.dispatchEvent(new CustomEvent('change'))
// --------------------------->8------
