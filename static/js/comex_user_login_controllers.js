/**
 * @fileoverview
 * Login via Doors
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

submitButton.disabled = true
theForm.onkeyup = testAsYouGo
theForm.onchange = testAsYouGo
theForm.onblur = testAsYouGo

var lastEmailValueCheckedDisplayed = null

// done when anything in the form changes
function testAsYouGo() {
  // console.log("testAsYouGo Go")

  if (email.value != lastEmailValueCheckedDisplayed) {
      // will update the emailStatus boolean
      basicEmailValidate(email.value)
  }

  captchaStatus = (captcha.value.length == realCaptchaLength)

  checkPassStatusSingle()

  if (passStatus && emailStatus && captchaStatus) {
      submitButton.disabled = false
  }
  else {
      submitButton.disabled = true
  }
}


// NB using new route in doors api/userExists
// case true => Ok("""{"status":"login exists"}""")
// case false => Ok("""{"status":"login available"}""")
function testDoorsUserExists(emailValue) {
    // /!\ async
    callDoors(
        "userExists",
        [emailValue],
        function(doorsResp) {
            var doorsUid = doorsResp[0]
            var doorsMsg = doorsResp[1]

            // for login the global status can be true iff login exists
            emailStatus = (doorsMsg == "login available")

            displayDoorsStatusInLoginBox(emailStatus, emailValue)
        }
    )
}


function doorsThenTestUidAndSubmit(){
    mainMessage.innerHTML = "Logging in ISCPIF Doors..."

    // all values from the form have now been validated
    var emailValue = email.value
    var passValue = pass.value

    // KNOCKING ON THE DOORS -------------------------------------
    // /!\ async
    callDoors(
        "user",
        [emailValue, passValue],

        // callback: get uid to send to server -------------------
        function(doorsResp) {
            testUidAndSubmit(doorsResp)
        }
    )
}

function testUidAndSubmit(doorsResp) {
    var doorsUid = doorsResp[0]
    var doorsMsg = doorsResp[1]

    if (doorsUid == null) {
        mainMessage.innerHTML = "Problem with doors login..."
        mainMessage.style.color = colorRed
        submitButton.disabled = false
    }
    else {
        // fill in the answer we got
        uidInput.value = doorsUid

        console.info("form was validated and registered@doors: submitting now")

        //==== SEND! ====
         theForm.submit()
        //===============
    }
}

var doorsIcon = document.getElementById('doors_ret_icon')
function displayDoorsStatusInLoginBox (available, emailValue) {

    if (available) {
        // icon
        doorsIconMessage.title = "Sorry this ID isn't recognized on Doors!"
        doorsIcon.style.color = colorRed
        doorsIcon.classList.remove('glyphicon-ok')
        doorsIcon.classList.remove('glyphicon-question-sign')
        doorsIcon.classList.add('glyphicon-remove')

        // message in legend
        doorsMessage.innerHTML = "Sorry this email ID isn't recognized on Doors!"
        doorsMessage.style.color = colorRed
    }
    else {
        // icon
        doorsIconMessage.title = "Ok ID exists in Doors"
        doorsIcon.style.color = colorGreen
        doorsIcon.classList.remove('glyphicon-remove')
        doorsIcon.classList.remove('glyphicon-question-sign')
        doorsIcon.classList.add('glyphicon-ok')

        // message in legend
        doorsMessage.innerHTML = "Ok, this email ID is recognized in Doors!"
        doorsMessage.style.color = colorGreen
    }

    // to debounce further actions in testAsYouGo
    // return to neutral is also in testAsYouGo
    lastEmailValueCheckedDisplayed = emailValue
}




console.log("login controllers load OK")
