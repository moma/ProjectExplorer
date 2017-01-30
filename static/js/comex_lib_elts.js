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

    cC.elts.box.authBox = null

    // our self-made modal open/close function
    cC.elts.box.toggleAuthBox = function() {
        if (cC.elts.box.authBox) {
            if (cC.elts.box.authBox.style.display == 'none') {
                // show box
                cC.elts.box.authBox.style.display = 'block'
                cC.elts.box.authBox.style.opacity = 1

                // opacify .page element
                if (cC.elts.elPage) cC.elts.elPage.style.opacity = .2
            }
            else {
                // remove box
                cC.elts.box.authBox.style.opacity = 0
                setTimeout(function(){cC.elts.box.authBox.style.display = 'none'}, 300)

                // show .page
                if (cC.elts.elPage) cC.elts.elPage.style.opacity = ''
            }
        }
        else {
            console.warn("Can't find cmxClt.uauth.box.authBox try addAuthBox()")
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
            passLegend = "Please make your password difficult to predict."
            confirmPass = `
            <div class="question">
              <div class="input-group">
                <label for="menu_password2" class="smlabel input-group-addon">* Password</label>
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
                    <label for="menu_captcha" class="smlabel input-group-addon">Code</label>
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
                        <button type="button" class="close" onclick="cmxClt.elts.box.toggleAuthBox()" aria-label="Close">
                          <span aria-hidden="true">&times;</span>
                        </button>
                        <h5 class="modal-title" id="authTitle">${title}</h5>
                      </div>
                      <div class="modal-body">
                        <div class="question">
                          <p class="legend">${emailLegend}</p>
                          <div class="input-group">
                            <!-- email validation onblur/onchange is done by cmxClt.uauth.box.testMailFormatAndExistence -->
                            <label for="menu_email" class="smlabel input-group-addon">* Email</label>
                            <input id="menu_email" name="email" maxlength="255"
                                   type="text" class="form-control" placeholder="email" value="${preEmail}">

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
                            <label for="menu_password" class="smlabel input-group-addon">* Password</label>
                            <input id="menu_password" name="password" maxlength="30"
                                   type="password" class="form-control" placeholder="Create a password">
                          </div>
                        </div>
                        <br/>
                        ${confirmPass}
                        <br/>
                        ${captchaBlock}
                      </div>
                      <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick='cmxClt.elts.box.toggleAuthBox()'>
                            Cancel
                        </button>
                        <button type="submit" id="menu_form_submit"
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

    return cC

})(cmxClt) ;


console.log("test modal auth load OK")
