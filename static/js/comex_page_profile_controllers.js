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

// first menu setup from DB values
function selectSavedMenus(uinfo) {
    for (var i in cmxClt.COLS) {
        var colType = cmxClt.COLS[i][3]
        // m <=> menu
        if (colType == 'm') {
            var colName = cmxClt.COLS[i][0]
            var chosenV = uinfo[colName]
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

selectSavedMenus(uinfo)

// memory
var formValid = false

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

// 2 exposed vars for inline js controls
var teamCityDivStyle = document.getElementById('team_city_div').style
var otherInstDivStyle = document.getElementById('other_org_div').style


// open middlename if there is one
if (uinfo.middle_name != "" && uinfo.middle_name != "None") {
    cmxClt.uform.displayMidName()
}

console.log("profile controllers load OK")
