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
 * @requires comex_user_shared, comex_lib_elts
 *
 * NB The uinfo variable should be set to template's user.json_info value.
 */

 // 3 exposed vars for inline js controls
 var teamCityDiv = document.getElementById('lab_locname_div')
 var otherInstDiv = document.getElementById('other_inst_div')
 // TODO make relative to inst_type and move inline snippet to extended form obj
 var otherOrgTypeInput = document.getElementById('other_inst_type')

// reselecting current_user's info choices
function setupSavedItems(uinfo) {
    //  (date and menu values are set up here
    //   but normal text vals are set up via html template,
    //   pic and middle_name are set below from a separate function,
    //   and multi text inputs are set up via form init... fixable to harmonize)
    for (var i in cmxClt.COLS) {
        var colType = cmxClt.COLS[i][3]

        if (colType == 'd' || colType == 'm') {
            var colName = cmxClt.COLS[i][0]
            var chosenV = uinfo[colName]

            // special case
            if (colName == 'inst_type' && uinfo.insts.length) {
                chosenV = uinfo.insts[0].inst_type
            }

            // console.log('setupSavedItems', colName, '('+colType+')' , 'with', chosenV)

            // if the value is none => there's nothing to do
            if (chosenV != undefined && chosenV != null) {

                var tgtElt = document.getElementById(colName)
                if (tgtElt != null) {
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

                        // this case is really just for inst_type right now
                        else if (tgtElt.querySelector(`option[value="other"]`)) {
                            console.log('setting menu option other for', colName, 'with', chosenV)
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

// open middlename if there is one
if (uinfo.middle_name != null
    && uinfo.middle_name != ""
    && uinfo.middle_name != "None") {
    console.log("showing midname for profile")
    cmxClt.uform.displayMidName()
}


// main validation function
// ------------------------
function completionAsYouGo() {
    theUForm.elMainMessage.style.display = 'block'
    theUForm.elMainMessage.innerHTML = "Checking the answers..."

    var diagnosticParams = {'fixResidue': true,
                            'ignore': ['email']}

    cmxClt.uform.simpleValidateAndMessage(theUForm, diagnosticParams)

    // timestamp is done server-side
}


// run first check on existing profile data pre-filled by the template
completionAsYouGo()


// set up a "Your data was saved" modal box (tied to the SUBMIT button)


function addAndShowModal(someHtmlContent) {
    // create and add modal
    cmxClt.elts.box.addGenericBox(
        'save_info',
        'Profile update',
        someHtmlContent,
        function(){window.location.reload()}
    )

    // show modal
    var saveInfoModal = document.getElementById('save_info')
    saveInfoModal.style.display = 'block'
    saveInfoModal.style.opacity = 1
}

function submitAndModal() {

    var formdat = theUForm.asFormData();
    var postUrl = "/services/user/profile/"

    // if (window.fetch) {
    if (false) {
        fetch(postUrl, {
            method: 'POST',
            headers: {'X-Requested-With': 'MyFetchRequest'},
            body: formdat,
            credentials: "same-origin"  // <= allows our req to have id cookie
        })
        .then(function(response) {
            if(response.ok) {
              response.text().then( function(bodyText) {
                // console.log("Profile POST was OK, showing answer")
                addAndShowModal(bodyText)
              })
            }
            else {
              response.text().then( function(bodyText) {
                console.log("Profile POST failed, aborting and showing message")
                addAndShowModal("<h4>Profile POST server error:</h4>"+bodyText)
              })
            }
        })
        .catch(function(error) {
            console.warn('fetch error:'+error.message);
        });
    }

    // also possible using old-style jquery ajax
    else {
        $.ajax({
            contentType: false,  // <=> multipart
            processData: false,  // <=> multipart
            data: formdat,
            type: 'POST',
            url: postUrl,
            success: function(data) {
                addAndShowModal(data)
            },
            error: function(result) {
                console.warn('jquery ajax error with result', result)
            }
        });
    }
}



console.log("profile controllers load OK")
