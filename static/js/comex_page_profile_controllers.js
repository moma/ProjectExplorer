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
 *
 * NB The uinfo variable should be set to template's user.json_info value.
 */

 // 3 exposed vars for inline js controls
 var teamCityDiv = document.getElementById('team_city_div')
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
            if (tgtElt && chosenV != null) {
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
                console.warn("setupSavedItems: couldn't find element: "+colName)
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




// initialize form controllers
var theUForm = cmxClt.uform.Form(
    // id
    "comex_profile_form",
    // onkeyup function
    completionAsYouGo,
    // other params
    { 'multiTextinputs': [{'id':'keywords',
                           'prevals': uinfo.keywords},
                          {'id':'hashtags',
                           'prevals': uinfo.hashtags,
                           'color': "#23A"}]
    }
)

var deleteUser = document.getElementById('delete_user')
deleteUser.checked = false

setupSavedItems(uinfo)

// main validation function
// ------------------------
function completionAsYouGo() {
    theUForm.elMainMessage.style.display = 'block'
    theUForm.elMainMessage.innerHTML = "Checking the answers..."

    var diagnosticParams = {'fixResidue': true,
                            'ignore': ['email']}

    cmxClt.uform.simpleValidateAndMessage(theUForm, diagnosticParams)

    // stamp => #last_modified_date
    cmxClt.uform.stampTime(theUForm)

    // debug
    // console.log("timestamp:", cmxClt.uform.timestamp.value)
}

// run first check on existing profile data pre-filled by the template
completionAsYouGo()


// open middlename if there is one
if (uinfo.middle_name != null
    && uinfo.middle_name != ""
    && uinfo.middle_name != "None") {
    console.log("showing midname for profile")
    cmxClt.uform.displayMidName()
}

console.log("profile controllers load OK")
