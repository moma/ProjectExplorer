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

// first menu setup from DB values
function selectSavedMenus(uinfo) {
    for (var i in cmxClt.COLS) {
        var colType = cmxClt.COLS[i][3]
        // m <=> menu
        if (colType == 'm') {
            var colName = cmxClt.COLS[i][0]
            var chosenV = uinfo[colName]
            console.log("..selectSavedMenus", colName, chosenV)
            var selectElt = document.getElementById(colName)
            if (selectElt) {
                var myOption = selectElt.querySelector(`option[value="${chosenV}"]`)
                if (myOption) {
                    selectElt.selectedIndex = myOption.index
                }
                else {
                    console.warn(`selectSavedMenus: couldn't find option: ${chosenV} for element: ${colName}`)
                }
            }
            else {
                console.warn("selectSavedMenus: couldn't find element: "+colName)
            }
        }
    }
}

// also pre-setup for images
var picShow = document.getElementById('show_pic')
if (uinfo.pic_url || uinfo.pic_fname) {
    if (uinfo.pic_url) {
        cmxClt.uform.showPic(uinfo.pic_url)
    }
    if (uinfo.pic_fname) {
        cmxClt.uform.showPic('/data/shared_user_img/'+uinfo.pic_fname)
    }
}

// the contents are conditioned on what return_user had in his info

var presentMtis = []
if (uinfo.keywords.length) {
    presentMtis.push(
        {'id':'keywords', 'prevals': uinfo.keywords, 'readonly':true}
    )
}
if (uinfo.hashtags.length) {
    presentMtis.push(
        {'id':'hashtags', 'prevals': uinfo.hashtags,'readonly':true, 'color': "#23A"}
    )
}

// initialize readonly form controllers
var consultReturnDataUForm = cmxClt.uform.Form(
    // id
    "comex_claim_profile_form",
    // onkeyup function
    null,
    // other params
    { 'multiTextinputs': presentMtis }
)

selectSavedMenus(uinfo)

// 1 exposed vars for inline js controls
var otherInstDiv = document.getElementById('other_org_div')


// open middlename if there is one
if (uinfo.middle_name != null
    && uinfo.middle_name != ""
    && uinfo.middle_name != "None") {
    cmxClt.uform.displayMidName()
}


//  the "re-create this account" form


// initialize "createlogin form" controllers
var returnForm = cmxClt.uauth.AuthForm(
    'comex_createlogin_form',
    miniregValidate,
    {
      'type': "doorsRegister",
      // if email validation, captcha perhaps too much?
      'validateCaptcha': false
    }
)


// the email is readonly
function miniregValidate(self) {
  self.elSubmitBtn.disabled = !self.passStatus
}

// trigger auth changes (email always autocompleted for return_user)
returnForm.elEmail.dispatchEvent(new CustomEvent('change'))

console.log("profile controllers load OK")
