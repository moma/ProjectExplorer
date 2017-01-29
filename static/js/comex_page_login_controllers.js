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

 // initialize auth with doors
var loginForm = cmxClt.uauth.AuthForm(
                    "comex_login_form",
                    loginValidate,
                    {'type': "login",
                     'emailId': "email",
                     'duuidId': "doors_uid",
                     'passId':  "password"}
                )

var submitButton = document.getElementById('form_submit')

// done when anything in the form changes
function loginValidate(myForm) {
  console.log("loginValidate Go")

  if (myForm.emailStatus
      && myForm.passStatus
      && myForm.captchaStatus) {
      submitButton.disabled = false
  }
  else {
      submitButton.disabled = true
  }
}


console.log("login controllers load OK")
