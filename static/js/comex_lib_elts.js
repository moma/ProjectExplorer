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
    cC.elts.box.addGenericBox
    cC.elts.box.addAuthBox
    cC.elts.box.postAuthBox
    cC.elts.box.authBox = null


    // function to login via ajax
    cC.elts.box.postAuthBox = function(formId) {
        var formObj = cmxClt.uform.allForms[formId]

        // inputs should already have correct names: 'email', 'password'
        var formdat = formObj.asFormData();
        // + real captcha value has also been collected by asFormData()

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
                // NB 2 promises to unwrap for Fetch to complete which allows the cookie to be set in the OK case
                if(response.ok) {
                  // unwraps the promise => 2nd then()
                  response.text().then( function(bodyText) {
                    // cookie should be set now !
                    console.log("Login was OK, redirecting to profile...")
                    window.location = '/services/user/profile'
                  })
                }
                else {
                   // also unwraps the promise => 2nd then()
                   // (we want to use the bodyText as message)
                   // cf. github.com/github/fetch/issues/203
                  response.text().then( function(bodyText) {
                    console.log("Login failed, aborting and showing message")
                    formObj.elMainMessage.innerHTML = bodyText

                    // TODO factorize CSS with old #main_message as a class
                    formObj.elMainMessage.style.color = cmxClt.colorRed
                    formObj.elMainMessage.style.fontSize = "150%"
                    formObj.elMainMessage.style.lineHeight = "130%"
                    formObj.elMainMessage.style.textAlign = "center"
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
    // optional dontOpacifyPage (default false)
    cC.elts.box.toggleBox = function(boxId, dontOpacifyPage) {
        var laBox = document.getElementById(boxId)
        if (laBox) {
            if (laBox.style.display == 'none') {
                // show box
                laBox.style.display = 'block'
                laBox.style.opacity = 1

                // opacify .page element
                if (cC.elts.elPage && !dontOpacifyPage) cC.elts.elPage.style.opacity = .2
            }
            else {
                // remove box
                laBox.style.opacity = 0
                setTimeout(function(){laBox.style.display = 'none'}, 300)

                // show .page
                if (cC.elts.elPage && !dontOpacifyPage) cC.elts.elPage.style.opacity = ''
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
            title = "Register your email"
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
            title = "Login"
            preEmail = boxParams.email
            emailLegend = "This email is your login for community explorer"
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
                        <br/>
                        <div id="menu_message" class="legend"></div>
                      </div>
                      <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="cmxClt.elts.box.toggleBox('auth_modal')">
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

        // add an enter action like classic submit but ignored when email is focused (because email often has browser's own completion)
        myDiv.onkeydown = function(evt) {
            if (evt.keyCode == 13 && evt.target.id != 'menu_email')
                cmxClt.elts.box.postAuthBox('auth_box')
        }

        // save a ref to it
        cC.elts.box.authBox = document.getElementById('auth_modal')
    }


    // /login box ----------------------------------------------------------


    // generic message box -------------------------------------------------

    // to create an html message modal with doors auth (reg or login)
    // @params
    //    boxId: string
    //    boxTitle: any html
    //    boxContent: any html content
    //    onOK: optional function to perform on clicking the 'OK' button
    //          (apart from closing the box)
    cC.elts.box.addGenericBox = function(boxId, boxTitle, boxContent, onOK) {

        // in a new div
        var myDiv = document.createElement('div')
        myDiv.innerHTML = `
            <div class="modal fade self-made" id="${boxId}" role="dialog" aria-labelledby="${boxId}-title" aria-hidden="true" style="display:none">
              <div class="modal-dialog" role="document">
                <div class="modal-content">
                  <form id="auth_box" enctype="multipart/form-data">
                      <div class="modal-header">
                        <button type="button" class="close" onclick="cmxClt.elts.box.toggleBox('${boxId}')" aria-label="Close">
                          <span aria-hidden="true">&times;</span>
                        </button>
                        <h5 class="modal-title" id="${boxId}-title">
                            <span class="glyphicon glyphicon-comment glyphicon-float-left"></span>&nbsp;&nbsp;
                            ${boxTitle}
                        </h5>
                      </div>
                      <div class="modal-body mini-hero">
                        ${boxContent}
                      </div>
                      <div class="modal-footer">
                        <button type="button" class="btn btn-primary">
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

        // tie in the custom onclick function
        var functionOnOk
        if (onOK) {
            functionOnOk = function() {
                onOK()
                cmxClt.elts.box.toggleBox(boxId)
            }
        }
        else {
            functionOnOk = function() {
                cmxClt.elts.box.toggleBox(boxId)
            }
        }
        // we assume there's only one .btn
        var okBtn = document.getElementById(boxId).querySelector('.btn')
        okBtn.onclick = functionOnOk
    }

    // cookie warning ------------------------------------------------------

    // NB we use localStorage (kept "forever") to not re-display to same browser
    // POSS use sessionStorage instead

    cC.elts.box.closeCookieOnceForAll = function () {
        cmxClt.elts.box.toggleBox('cookie-div', true)
        localStorage['comex_cookie_warning_done'] = 1
    }

    // to create an html message panel with the legal cookie warning
    // no params (FIXME div id is hard-coded)
    //
    cC.elts.box.addCookieBox = function() {

        // in a new div
        var myDiv = document.createElement('div')
        myDiv.innerHTML = `
        <div id="cookie-div" class="panel panel-success cookie-panel" role="dialog">
            <div class="panel-body">
              <h4 class="center">
                This website uses cookies to adapt the display to your navigation.
              </h4>
              <p class="center">
                Press <span class="framed-text">SPACE</span> to accept or click here:
                <button type="button" class="btn btn-primary"
                        onclick="cmxClt.elts.box.closeCookieOnceForAll()">
                    OK
                </button>
              </p>
            </div>
        </div>`

        // append on body (no positioning: fixed overlay)
        var body = document.querySelector('body')
        body.insertBefore(myDiv, body.lastChild)

        // add a closing action to spacebar
        window.onkeydown = function(evt) {
            if (!localStorage['comex_cookie_warning_done']) {
                if (evt.keyCode == 32) {
                    cmxClt.elts.box.closeCookieOnceForAll()
                    // console.log('space toggleBox')
                }
            }
        }
    }

    return cC

})(cmxClt) ;


console.log("html elements lib load OK")
