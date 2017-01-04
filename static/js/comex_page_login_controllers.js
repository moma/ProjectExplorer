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


// initialize form controllers
cmxClt.uform.initialize("comex_login_form", loginValidate)

// initialize auth with doors
cmxClt.uauth.emailIdSupposedToExist = true


// done when anything in the form changes
function loginValidate() {
  // console.log("loginValidate Go")

  cmxClt.uauth.earlyValidate()

  // TODO checkPassStatusSingle()

  if (cmxClt.uauth.passStatus
        && cmxClt.uauth.emailStatus
        && cmxClt.uauth.captchaStatus) {
      cmxClt.uform.submitButton.disabled = false
  }
  else {
      cmxClt.uform.submitButton.disabled = true
  }
}

function loginDoorsThenTestUidAndSubmit(){
    cmxClt.uform.mainMessage.innerHTML = "Logging in ISCPIF Doors..."

    // all values from the form have now been validated
    var emailValue = cmxClt.uauth.email.value
    var passValue = cmxClt.uauth.pass1.value

    // KNOCKING ON THE DOORS -------------------------------------
    // /!\ async
    callDoors(
        "user",
        [emailValue, passValue],

        // callback: get uid to send to server -------------------
        function(doorsResp) {
            console.log("login resp:", doorsResp)
            testUidAndSubmit(doorsResp)
        }
    )
}

function testUidAndSubmit(doorsResp) {
    var doorsUid = doorsResp[0]
    var doorsMsg = doorsResp[1]

    if (doorsUid == null) {
        cmxClt.uform.mainMessage.innerHTML = "Problem with doors login..."
        cmxClt.uform.mainMessage.style.color = cmxClt.colorRed
        cmxClt.uform.submitButton.disabled = false
    }
    else {
        // fill in the answer we got
        // £TODO fix scope uauth and uform ?
        uidInput.value = doorsUid

        console.info("form was validated and registered@doors: submitting now")

        //==== SEND! ====
         theForm.submit()
        //===============
    }
}


console.log("login controllers load OK")
