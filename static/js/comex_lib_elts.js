/**
 * @fileoverview
 *  Prepares cmxClt.uauth.box HTML elements (mail, pass inputs) in a modal
 *  (use case: enter login credentials client-side without changing page)
 *
 * @todo
 *    - package.json
 *
 * @version 1
 * @copyright ISCPIF-CNRS 2016
 * @author romain.loth@iscpif.fr
 *
 * @requires comex_user_shared
 *
 *
 * cmxClt.elts: A module to create dom elements handled by comex client
 * -----------
 *  - .elts.box is a loginbox
 *    currently need set up menu login box before rest to provide elts to uauth
 */


var cmxClt = (function(cC) {

    cC.elts = {}

    cC.elts.elBody = document.querySelector('body')
    cC.elts.elPage = document.querySelector('.page')


    // an optional modal box for login/register credentials
    //            -----------
    cC.elts.box = {}
    cC.elts.box.toggleBox
    cC.elts.box.addAuthBox
    cC.elts.box.postAuthBox
    cC.elts.box.authBox = null


    // function to login via ajax
    cC.elts.box.postAuthBox = function(formId) {
        var formObj = cmxClt.uform.allForms[formId]

        // so lame: we already put collectCaptcha in this form's submit()
        //          but here we are circumventing submit() b/c different url!
        if (formObj.validateCaptcha) {
            cmxClt.uauth.collectCaptcha(formObj)
        }

        // inputs should already have correct names: 'email', 'password'
        var formdat = formObj.asFormData();

        // TODO for SSL
        //      currently relative URL <=> same protocol as source
        //
        //      but ideally should force https either:
        //           1) https on all site
        //              NB if 1st option use nginx rewrite
        //              or
        //           2) https at least for login
        //              NB if 2nd option http => https just for login
        //                 then need CORS on flask side to allow it

        // new-style ajax
        if (window.fetch) {
            fetch('/services/user/login/', {
                method: 'POST',
                headers: {'X-Requested-With': 'MyFetchRequest'},
                body: formdat,
                credentials: "same-origin"  // <= this allows response's Set-Cookie
            })
            // 1st then() over promise
            .then(function(response) {
                // NB unwrapping the promise by consuming the body AND finishing this 1st then() will allow Fetch to complete which allows the cookie to be set
                if(response.ok) {
                  // unwraps the promise
                  return response.text()
                }
                else {
                  throw new Error('Network response was not ok.');
                }
            })
            // 2nd then(): at this point Fetch has completed and cookie is set
            .then(function(bodyText) {
                // console.log('the login cookie should be set, changing page now')
                window.location = '/services/user/profile'
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
                url: "/services/user/login/",
                success: function(data) {
                    // console.log('JQUERY got return', data, 'and login cookie should be set')
                    window.location = '/services/user/profile'
                },
                error: function(result) {
                    console.warn('jquery ajax error with result', result)
                }
            });
        }
    }

    // our self-made modal open/close function
    cC.elts.box.toggleBox = function(boxId) {
        var laBox = document.getElementById(boxId)
        if (laBox) {
            if (laBox.style.display == 'none') {
                // show box
                laBox.style.display = 'block'
                laBox.style.opacity = 1

                // opacify .page element
                if (cC.elts.elPage) cC.elts.elPage.style.opacity = .2
            }
            else {
                // remove box
                laBox.style.opacity = 0
                setTimeout(function(){laBox.style.display = 'none'}, 300)

                // show .page
                if (cC.elts.elPage) cC.elts.elPage.style.opacity = ''
            }
        }
        else {
            console.warn("Can't find box with id '"+$boxId+"'")
        }
    }


    // to create an html modal with doors auth (reg or login)
    cC.elts.box.addAuthBox = function(boxParams) {

        // --- default params
        if (!boxParams)                        boxParams = {}
        // mode <=> 'login' or 'register'
        if (boxParams.mode == undefined)       boxParams.mode = 'login'
        // for prefilled values
        if (boxParams.email == undefined)      boxParams.email = ""

        // add a captcha (requires jquery)?
        if (boxParams.insertCaptcha == undefined)
            boxParams.insertCaptcha = false


        var title, preEmail, emailLegend, passLegend, confirmPass, captchaBlock
        // --- template fragments
        if (boxParams.mode == 'register') {
            title = "Register your email on the Doors portal of the institute"
            preEmail = ""
            emailLegend = "Your email will also be your login for the ISC services."
            passPlaceholder = "Create a password"
            passLegend = "Please make your password difficult to predict."
            confirmPass = `
            <div class="question">
              <div class="input-group">
                <label for="menu_password2" class="smlabel input-group-addon">Password</label>
                <input id="menu_password2" name="password2" maxlength="30"
                       type="password" class="form-control" placeholder="Repeat the password">
              </div>
              <p class="umessage legend red" style="font-weight:bold"></p>
            </div>
            `
        }
        else if (boxParams.mode == 'login') {
            title = "Login via the Doors portal"
            preEmail = boxParams.email
            emailLegend = "This email is your login for both community explorer and the institute's authentication portal 'Doors'"
            passPlaceholder = "Your password"
            passLegend = ""
            confirmPass = ""
        }
        else {
            console.error("Unrecognized mode:", boxParams.mode)
        }

        // also perhaps captcha
        if (boxParams.insertCaptcha) {

            captchaBlock = `
                <input id="menu_captcha_hash" name="my-captchaHash" type="text" hidden></input>
                <!--pseudo captcha using realperson from http://keith-wood.name/realPerson.html -->
                <div class="question input-group">
                    <label for="menu_captcha" class="smlabel input-group-addon">Verification</label>
                    <input id="menu_captcha" name="my-captcha"
                           type="text" class="form-control input-lg" placeholder="Enter the 5 letters beside =>"
                           onblur="cmxClt.makeBold(this)" onfocus="cmxClt.makeNormal(this)">
                    <p class="legend legend-float">(A challenge for spam bots)</p>
                </div>
            `
        }
        else {
            captchaBlock=''
        }

        // --- insert it all into a new div
        var myDiv = document.createElement('div')
        myDiv.innerHTML = `
            <div class="modal fade self-made" id="auth_modal" role="dialog" aria-labelledby="authTitle" aria-hidden="true" style="display:none">
              <div class="modal-dialog" role="document">
                <div class="modal-content">
                  <form id="auth_box" enctype="multipart/form-data">
                      <div class="modal-header">
                        <button type="button" class="close" onclick="cmxClt.elts.box.toggleBox('auth_modal')" aria-label="Close">
                          <span aria-hidden="true">&times;</span>
                        </button>
                        <h5 class="modal-title" id="authTitle">${title}</h5>
                      </div>
                      <div class="modal-body">
                        <div class="question">
                          <p class="legend">${emailLegend}</p>
                          <div class="input-group">
                            <!-- email validation onblur/onchange is done by cmxClt.uauth.box.testMailFormatAndExistence -->
                            <label for="menu_email" class="smlabel input-group-addon">Email</label>
                            <input id="menu_email" name="email" maxlength="255"
                                   type="text" class="form-control" placeholder="Your email" value="${preEmail}">

                            <!-- doors return value icon -->
                            <div class="input-group-addon"
                                 title="The email will be checked in our DB after you type and leave the box.">
                              <span class="uicon glyphicon glyphicon-question-sign grey"></span>
                            </div>
                          </div>
                          <!-- doors return value message -->
                          <p class="umessage legend"></p>
                        </div>

                        <div class="question">
                          <p class="legend">${passLegend}</p>
                          <div class="input-group">
                            <label for="menu_password" class="smlabel input-group-addon">Password</label>
                            <input id="menu_password" name="password" maxlength="30"
                                   type="password" class="form-control" placeholder="${passPlaceholder}">
                          </div>
                        </div>
                        <br/>
                        ${confirmPass}
                        <br/>
                        ${captchaBlock}
                      </div>
                      <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick='cmxClt.elts.box.toggleBox('auth_modal')'>
                            Cancel
                        </button>
                        <!-- submit -->
                        <button type="button" id="menu_form_submit"
                                onclick="cmxClt.elts.box.postAuthBox('auth_box')"
                                class="btn btn-primary">
                            Submit
                        </button>
                      </div>
                  </form>
                </div>
              </div>
            </div>`


        // append on body (no positioning now: it's a fixed overlay anyway)
        var body = document.querySelector('body')
        body.insertBefore(myDiv, body.lastChild)

        // save a ref to it
        cC.elts.box.authBox = document.getElementById('auth_modal')
    }


    // /login box ----------------------------------------------------------


    // generic message box -------------------------------------------------

    // to create an html message modal with doors auth (reg or login)
    cC.elts.box.addGenericBox = function(boxId, boxTitle, boxContent) {

        // in a new div
        var myDiv = document.createElement('div')
        myDiv.innerHTML = `
            <div class="modal fade self-made" id="${boxId}" role="dialog" aria-labelledby="authTitle" aria-hidden="true" style="display:none">
              <div class="modal-dialog" role="document">
                <div class="modal-content">
                  <form id="auth_box" enctype="multipart/form-data">
                      <div class="modal-header">
                        <button type="button" class="close" onclick="cmxClt.elts.box.toggleBox('${boxId}')" aria-label="Close">
                          <span aria-hidden="true">&times;</span>
                        </button>
                        <h5 class="modal-title" id="authTitle">${boxTitle}</h5>
                      </div>
                      <div class="modal-body mini-hero">
                        ${boxContent}
                      </div>
                      <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="cmxClt.elts.box.toggleBox('${boxId}')">
                            Ok
                        </button>
                      </div>
                  </form>
                </div>
              </div>
            </div>`


        // append on body (no positioning now: it's a fixed overlay anyway)
        var body = document.querySelector('body')
        body.insertBefore(myDiv, body.lastChild)
    }

    // /generic message box ------------------------------------------------

    return cC

})(cmxClt) ;


console.log("html elements lib load OK")
