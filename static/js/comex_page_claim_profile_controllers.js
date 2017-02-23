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

 // 2 exposed vars for inline js controls
 var otherInstDiv = document.getElementById('other_org_div')
 // TODO make relative to org_type and move inline snippet to extended form obj
 var otherOrgTypeInput = document.getElementById('other_org_type')

// reselecting current_user's info choices
function setupSavedItems(uinfo) {
    //  (date and menu values are set up here
    //   but normal text vals are set up via html,
    //   pic is set below from a separate function,
    //   and multi text inputs are set up via form init... fixable to harmonize)
    for (var i in cmxClt.COLS) {
        var colType = cmxClt.COLS[i][3]

        if (colType == 'd' || colType == 'm') {
            var colName = cmxClt.COLS[i][0]
            var chosenV = uinfo[colName]

            var tgtElt = document.getElementById(colName)
            if (tgtElt && (chosenV != null)) {
                // d <=> convert to YY/MM/DD from iso string YYYY-MM-DD
                if (colType == 'd') {
                    // console.log('setting date', colName, 'with', chosenV)
                    tgtElt.value = chosenV.replace(/-/g,'/')
                    tgtElt.dispatchEvent(new CustomEvent('change'))
                }
                // m <=> select saved menus
                if (colType == 'm') {
                    // console.log('setting menu', colName, 'with', chosenV)
                    var myOption = tgtElt.querySelector(`option[value="${chosenV}"]`)

                    // normal case
                    if (myOption) {
                        tgtElt.selectedIndex = myOption.index
                        tgtElt.dispatchEvent(new CustomEvent('change'))
                    }

                    // this case is really just for org_type right now
                    else if (tgtElt.querySelector(`option[value="other"]`)) {
                        tgtElt.selectedIndex = tgtElt.querySelector(`option[value="other"]`).index
                        tgtElt.dispatchEvent(new CustomEvent('change'))

                        var relatedFreeTxt = document.getElementById('other_'+colName)
                        if (relatedFreeTxt) {
                            relatedFreeTxt.value = chosenV
                            relatedFreeTxt.dispatchEvent(new CustomEvent('change'))
                        }
                    }
                    // fallback case
                    else {
                        var optionOthers =
                        console.warn(`setupSavedItems: couldn't find option: ${chosenV} for select element: ${colName}`)
                    }
                }
            }
            else {
                // console.warn("setupSavedItems: couldn't find element: "+colName)
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

setupSavedItems(uinfo)



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

function showMessageAndSubmit() {
    returnForm.elMainMessage.style.display = "block"
    returnForm.elMainMessage.innerHTML = "Registering with ISCPIF Doors<br/> and sending validation email..."
    returnForm.elForm.submit()
}

// trigger auth changes (email always autocompleted for return_user)
returnForm.elEmail.dispatchEvent(new CustomEvent('change'))

console.log("profile controllers load OK")
