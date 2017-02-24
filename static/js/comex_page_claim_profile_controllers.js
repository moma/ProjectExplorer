/**we have all
 * @fileoverview
 * Profile 1/overview and 2/completing
 * @todo
 *    - package.json
 *
 * @version 1
 * @copyright ISCPIF-CNRS 2016
 * @author romain.loth@iscpif.fr
 *
 * @requires comex_user_shared
 * @requires comex_user_shared_auth
 *
 * NB The uinfo variable should be set to template's user.json_info value.
 *
 * 2 forms here:
 *   1/ The consultation of legacy profile is simply a copy of
 *   comex_page_profile_controllers with the old input re-fills
 *   iff present but without the new input validations
 *
 *   2/ The "re-create your account" form is a doors-auth of register type
 */


//  the "re-create this account" form


// initialize "createlogin form" controllers
var returnForm = cmxClt.uauth.AuthForm(
    'comex_createlogin_form',
    miniregValidate,
    {
      'type': "doorsRegister",
      // if email validation, captcha perhaps too much?
      'validateCaptcha': false,
      'validateEmail': false
    }
)


// the email is readonly
function miniregValidate(self) {
  self.elSubmitBtn.disabled = !self.passStatus
}

function showMessageAndSubmit() {
    returnForm.elMainMessage.style.display = "block"
    returnForm.elMainMessage.innerHTML = "Registering with the test login portal<br/> and sending validation email..."
    returnForm.elForm.submit()
}

// trigger auth changes (email always autocompleted for return_user)
returnForm.elEmail.dispatchEvent(new CustomEvent('change'))

console.log("profile controllers load OK")
