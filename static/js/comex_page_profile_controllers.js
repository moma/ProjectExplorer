/**
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



// initialize form controllers
cmxClt.uform.initialize("comex_profile_form", completionAsYouGo)

var isProfileComplete = false
var pleaseCompleteMessage = document.selectById("please_complete")

var missingColumns = []

function completionAsYouGo() {
    var valid = true
    var mandatoryMissingFields = []
    var optionalMissingFields = []

    [   valid,
        mandatoryMissingFields,
        optionalMissingFields
    ] = cmxClt.uform.testFillField(cmxClt.uform.theForm)
}
