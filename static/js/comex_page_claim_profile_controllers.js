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
 *
 *  THIS IS A SIMPLE COPY OF comex_page_profile_controllers
 *               with the old input re-fills
 *          but without the new input validations
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

// the contents are conditioned on what return_user had in his info

var presentMtis = []
if (uinfo.keywords.length) {
    presentMtis.push(
        {'id':'keywords', 'prevals': uinfo.keywords}
    )
}
if (uinfo.hashtags.length) {
    presentMtis.push(
        {'id':'hashtags', 'prevals': uinfo.hashtags,'color': "#23A"}
    )
}

// initialize form controllers
var theUForm = cmxClt.uform.Form(
    // id
    "comex_claim_profile_form",
    // onkeyup function
    null,
    // other params
    { 'multiTextinputs': presentMtis }
)

selectSavedMenus(uinfo)

// memory
var formValid = false

// 2 exposed vars for inline js controls
var teamCityDivStyle = document.getElementById('team_city_div').style
var otherInstDivStyle = document.getElementById('other_org_div').style


// open middlename if there is one
if (uinfo.middle_name != "" && uinfo.middle_name != "None") {
    cmxClt.uform.displayMidName()
}

console.log("profile controllers load OK")
