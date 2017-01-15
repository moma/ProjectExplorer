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
            }
            else {
                console.warn("selectSavedMenus: couldn't find element: "+colName)
            }
        }
    }
}

selectSavedMenus(uinfo)

// initialize form controllers
cmxClt.uform.initialize("comex_profile_form", completionAsYouGo)


// activate multiTextinput
cmxClt.uform.multiTextinput('keywords', uinfo.keywords)


// memory
var formValid = false

// main validation function
// ------------------------
function completionAsYouGo() {
    cmxClt.uform.mainMessage.style.display = 'block'
    cmxClt.uform.mainMessage.innerHTML = "Checking the answers..."

    var diagnosticParams = {'fixResidue': true,
                            'ignore': ['email']}

    cmxClt.uform.simpleValidateAndMessage(diagnosticParams)

    // stamp => #last_modified_date
    cmxClt.uform.stampTime()

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
