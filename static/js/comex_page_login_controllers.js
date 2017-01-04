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

  // checks email, pass and captcha formats
  // and updates uauth.emailStatus, uauth.passStatus, uauth.captchaStatus 
  cmxClt.uauth.earlyValidate()

  if (cmxClt.uauth.passStatus
        && cmxClt.uauth.emailStatus
        && cmxClt.uauth.captchaStatus) {
      cmxClt.uform.submitButton.disabled = false
  }
  else {
      cmxClt.uform.submitButton.disabled = true
  }
}


console.log("login controllers load OK")
