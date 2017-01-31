/**
 * @fileoverview
 *  Validates an email ID and password(s)
 *  Prepares "captcha" data
 *  Transmits login credentials to Doors for login or register (fun callDoors)
 *
 * @todo
 *    - package.json
 *
 * @version 1
 * @copyright ISCPIF-CNRS 2016
 * @author romain.loth@iscpif.fr
 *
 * @requires comex_user_shared
 * @requires realperson (keith-wood.name/realPerson.html)
 */


// cmxClt module augmentation
// POSS remove cC.auth. namespace prefix from local scope vars
cmxClt = (function(cC) {
    // common vars to authenticating/registering in user area
    cC.uauth = {}

    // temporary parameter (TODO remove after doors deployment)
    // -------------------
    // true if we are using first minidoors prototype (commit fca0f79)
    // otherwise assume normal doors (commit >= a0ce580)
    cC.uauth.protoDoors = true

    // #doors_connect.value ~~> like a @classparam for uauthforms
    // :str: "doors_hostname:doors_port"
    cC.uauth.doorsConnectParam = document.getElementById('doors_connect').value

    // param for "realperson" widget generation & validation
    cC.uauth.realCaptchaLength = 5

    // our functions
    cC.uauth.AuthForm
    cC.uauth.collectCaptcha
    cC.uauth.testMailFormatAndExistence
    cC.uauth.doubleCheck
    cC.uauth.callDoors

    // AuthForm: init(id, onchange, params)
    // --------
    // @id
    // @params:
    //   - type         login|register
    //   - emailId      html email input element id
    //   - duuidId      html doors_uid hidden input element id
    //   - passId       html password input element id
    //   - pass2Id      optional
    //   - captchaId    optional
    //   - capcheckId   optional
    //   - all  other params are passed to super()
    //     (optional main_message, mtis, etc)

    cC.uauth.AuthForm = function(aFormId, aValidationFun, afParams) {
        if (!afParams)  afParams = {}

        // "super"
        var auForm = cC.uform.Form(aFormId, aValidationFun, afParams)
        // var auForm = {'id':aFormId, 'elForm':document.getElementById(aFormId)}
        auForm.emailStatus = null
        auForm.passStatus = null
        auForm.captchaStatus = null

        //  -> type
        auForm.type = afParams.type || "login"
        auForm.emailIdSupposedToExist = (auForm.type != 'register')
        auForm.validateCaptcha = afParams.validateCaptcha || false

        //  -> interaction elements (params, else default)
        var emailId, duuidId, passId, pass2Id, captchaId, capcheckId

        // console.info('new AuthForm "'+auForm.id+'"[.type='+auForm.type+'] init params', afParams)

        emailId    = afParams.emailId    || 'email'
        duuidId    = afParams.duuidId    || 'doors_uid'
        passId     = afParams.passId     || 'password'
        pass2Id    = afParams.pass2Id    || 'password2'
        captchaId  = afParams.captchaId  || 'my-captcha'
        capcheckId = afParams.capcheckId || 'my-captchaHash'

        // keep them as properties
        auForm.elDuuid = document.getElementById(duuidId)
        auForm.elEmail = document.getElementById(emailId)

        auForm.elPass = document.getElementById(passId)
        auForm.elPass2 = document.getElementById(pass2Id)

        auForm.elCaptcha = document.getElementById(captchaId)
        auForm.elCapcheck = document.getElementById(capcheckId)

        // dials init
        //  = signaling elements (icons, divs) for user feed-back
        auForm.emailDials = {}
        var emailQ = cC.findAncestor(auForm.elEmail, 'question')
        auForm.emailDials.elIcon = emailQ.querySelector('.uicon')
        auForm.emailDials.elMsg = emailQ.querySelector('.umessage')
        auForm.emailDials.elLbl = emailQ.querySelector('label[for='+auForm.elEmail.id+']')

        // individual event/function bindings -----------

        // 1) for email
        // side-effects: email icon + message
        auForm.elEmail.onkeyup = function(event) {
            // console.debug('..elMail '+auForm.id+' event:'+event.type)
            cC.uauth.testMailFormatAndExistence(auForm)
        }
        auForm.elEmail.onchange = auForm.elEmail.onkeyup

        // 2) for password
        // login <=> just test password's length
        if (auForm.type != 'register') {
            auForm.elPass.onkeyup = function(event) {
                // console.debug("..elPass "+auForm.id+" event:"+event.type)
                auForm.passStatus = (auForm.elPass.value.length > 7)
            }
            auForm.elPass.onchange = auForm.elPass.onkeyup
        }
        // register <=> do pass 1 and pass 2 match?
        else {
            // retrieve message element
            auForm.pass2Dials = {}
            var passQ = cC.findAncestor(auForm.elPass2, 'question')
            auForm.pass2Dials.elMsg = passQ.querySelector('.umessage')

            // bind doubleCheck
            auForm.elPass.onkeyup = function(event) {
              // console.debug('..elPass '+auForm.id+' event:'+event.type)
              cC.uauth.doubleCheck(auForm)
            }
            auForm.elPass.onchange = auForm.elPass.onkeyup
            auForm.elPass2.onkeyup = auForm.elPass.onkeyup
            auForm.elPass2.onchange = auForm.elPass.onkeyup
        }

        // 3) for captcha
        if (auForm.validateCaptcha) {
            // NB this captcha init requires *jquery*
            $(auForm.elCaptcha).realperson(
                {length: cC.uauth.realCaptchaLength}
            )

            // so... the events
            auForm.elCaptcha.onkeyup = function(event) {
                // console.debug('..elCaptcha '+auForm.id+' event:'+event.type)
                auForm.captchaStatus = (auForm.elCaptcha.value.length == cC.uauth.realCaptchaLength)
            }
            auForm.elCaptcha.onchange = auForm.elCaptcha.onkeyup

            // also form submit() overoverload
            auForm.elForm.oldSubmitAction = auForm.elForm.submit
            auForm.elForm.submit = function() {
                console.log("go newSubmit")
                cmxClt.uauth.collectCaptcha(auForm)
                console.log("go oldSubmit")
                auForm.elForm.oldSubmitAction()
            }
        }
        else {
            console.log("No captcha in auForm", auForm.id)
        }

        // return new obj
        return auForm
    }
    // -------------------

    cC.uauth.collectCaptcha = function (uformObj) {
        console.log
        uformObj.elCapcheck.value = $(uformObj.elCaptcha).realperson('getHash')
        console.debug('  '+uformObj.id+': collected captcha hash ' +uformObj.elCapcheck.value)
    }

    // NB removed earlyValidate
    //       => no need for 1 exposed validation function
    //          b/c all 3 checks bound to their elements onchange/onkeyup


    // ----------- interaction for mailID check via fetch @doors ---------------
    // global scope memoize email & last flags
    cC.uauth.lastEmailValueCheckedDisplayed = ''
    cC.uauth.lastExpectExists = true
    cC.uauth.lastEmailStatus = null

    // function testMailFormatAndExistence
    // ------------------------------------
    // args:
    //    obja: an AuthForm object
    //          in which we'll use
    //             elEmail.value,
    //             emailIdSupposedToExist,
    //             emailDials,
    //             emailStatus // == the updated flag ~~ 'return val'
    //
    // NB for login, use --------> expectExists = true
    //    for registration, use -> expectExists = false

    // effect 1 emailStatus ok/no, and side effect 2 on icon + msg
    //    wrong format ===========================> grey
    //    format ok, doorsStatus != expectExists => red
    //    format ok, doorsStatus == expectExists => green
    cC.uauth.testMailFormatAndExistence = function (obja) {

      var emailValue = obja.elEmail.value

      // if we have it in memo already then it's finished :) !
      if (emailValue == cC.uauth.lastEmailValueCheckedDisplayed) {
          // FIXME value ok but greying out forgotten:
          //       because the class value is above all forms
          //       but the dials effects are for current form obj only
          if (obja.emailIdSupposedToExist == cC.uauth.lastExpectExists)
            obja.emailStatus = cC.uauth.lastEmailStatus
          else
            obja.emailStatus = !cC.uauth.lastEmailStatus
      }
      // ...otherwise we do checks normally then modify the object's flag
      else {
          // 1) tests if email is well-formed
          // TODO: better extension and allowed chars set
          var emailFormatOk = /^[-A-z0-9_=.+]+@[-A-z0-9_=.+]+\.[-A-z0-9_=.+]{2,4}$/.test(emailValue)

          if (! emailFormatOk) {
              // restore original lack of message
              obja.emailDials.elIcon.classList.remove('glyphicon-ban-circle')
              obja.emailDials.elIcon.classList.remove('glyphicon-ok-circle')
              obja.emailDials.elIcon.classList.add('glyphicon-question-sign')
              obja.emailDials.elIcon.style.color = cC.colorGrey
              obja.emailDials.elMsg.innerHTML = ""
              obja.emailDials.elMsg.style.fontWeight = "normal"

              obja.emailDials.elLbl.style.color = ""

              // new emailStatus
              obja.emailStatus = false
          }
          else {
              // 2) additional ajax to check login availability
              //  => updates the emailStatus global boolean
              //  => displays an icon

              // NB using route in doors api/userExists
              // case true => Ok("""{"status":"login exists"}""")
              // case false => Ok("""{"status":"login available"}""")
              // /!\ async
              cC.uauth.callDoors(
                  "userExists",
                  [emailValue],
                  function(doorsResp) {
                      var doorsUid = doorsResp[0]
                      var doorsMsg = doorsResp[1]

                      // status true iff login is as expected and format ok
                      obja.emailStatus = (
                            (obja.emailIdSupposedToExist
                                && (doorsMsg == "login exists"))
                            ||
                            (!obja.emailIdSupposedToExist
                                && (doorsMsg == "login available"))
                        )
                      // signals the form change after this input status change
                      // (we're now after async came back, so long after keyup finished)
                      obja.elForm.dispatchEvent(new CustomEvent('change'))

                      // effects on dials
                      if (obja.emailStatus) {
                          // icon
                          obja.emailDials.elIcon.style.color = cC.colorGreen
                          obja.emailDials.elIcon.classList.remove('glyphicon-ban-circle')
                          obja.emailDials.elIcon.classList.remove('glyphicon-question-sign')
                          obja.emailDials.elIcon.classList.add('glyphicon-ok-circle')

                          // message in legend
                          obja.emailDials.elMsg.innerHTML = "OK: "+doorsMsg
                          obja.emailDials.elMsg.style.color = cC.colorGreen
                          obja.emailDials.elMsg.style.fontWeight = "bold"
                          obja.emailDials.elMsg.style.textShadow = cC.strokeWhite

                          // label
                          obja.emailDials.elLbl.style.backgroundColor = ""
                      }
                      else {
                          var errMsg = obja.emailIdSupposedToExist ? "your ID isn't recognized" : "this ID is already taken"
                          // icon
                          obja.emailDials.elIcon.style.color = cC.colorOrange
                          obja.emailDials.elIcon.classList.remove('glyphicon-ok-circle')
                          obja.emailDials.elIcon.classList.remove('glyphicon-question-sign')
                          obja.emailDials.elIcon.classList.add('glyphicon-ban-circle')

                          // message in legend
                          obja.emailDials.elMsg.innerHTML = "Sorry: "+errMsg+" !"
                          obja.emailDials.elMsg.style.color = cC.colorOrange
                          obja.emailDials.elMsg.style.fontWeight = "bold"
                          obja.emailDials.elMsg.style.textShadow = cC.strokeDeepGrey

                          // label
                          obja.emailDials.elLbl.style.backgroundColor = cC.colorOrange
                      }
                  }
              )
          }
      }

      // memoize in CLASS vars to debounce re-invocations
      cC.uauth.lastEmailValueCheckedDisplayed = emailValue
      cC.uauth.lastEmailStatus = obja.emailStatus
    }

    // -----------------------------------------------------------------------
    // Password validations functions
    // TODO use a most common passwords lists

    // args: a AUForm object
    //       we use properties:
    //        - elPass,
    //        - elPass2,
    //        - pass2Dials,
    //        - passStatus   // <= "ret value"

    // 2 in 1: used only for registration
    cC.uauth.doubleCheck = function (aUForm) {

      if (aUForm.elPass.value || aUForm.elPass2.value) {
        var pass1v = aUForm.elPass.value
        var pass2v = aUForm.elPass2.value

        if ((pass1v && pass1v.length > 7)
            || (pass2v && pass2v.length > 7)) {
          // test values
          if (pass1v == pass2v) {
              if (pass1v.match('[^A-z0-9]')) {
                  aUForm.pass2Dials.elMsg.innerHTML = 'Ok valid passwords!'
                  aUForm.passStatus = true
              }
              else {
                  aUForm.pass2Dials.elMsg.innerHTML = "Passwords match but don't contain any special characters, please complexify!"
                  aUForm.passStatus = false
              }
          }
          else {
            aUForm.pass2Dials.elMsg.innerHTML = "The passwords don't match yet."
            aUForm.passStatus = false
          }
        }
        else {
          aUForm.pass2Dials.elMsg.innerHTML = "The password is too short (8 chars min)."
          aUForm.passStatus = false
        }
      }
      if (!aUForm.passStatus) aUForm.pass2Dials.elMsg.style.color = cC.colorRed
      else                   aUForm.pass2Dials.elMsg.style.color = cC.colorGreen
    }


    /* --------------- doors ajax cors function ----------------
    * @args:
    *     apiAction:  'register' or 'user' or 'userExists' => route to doors api
    *                  if unknown type, default action is login via doors/api/user
    *
    *     data:       3-uple with mail, pass, name
    *
    *     callback:   function that will be called after success AND after error
    *                 with the return couple
    *
    *     process
    *     -------
    *     for userExists synchronous process: we block flag newEmailStatus
    *                                         until we get a response
    *     TODO: use fetch instead of $.ajax
    *
    *     returns couple (id, message)
    *     ----------------------------
    *     ajax success    <=>  doorsId should be != null except if unknown error
    *     ajax user infos  ==  doorsMsg
    *
    *     EXPECTED DOORS ANSWER FORMAT
    *     -----------------------------
    *     {
    *       "status": "login ok",
    *       "userInfo": {
    *         "id": {
    *           "id": "78407900-6f48-44b8-ab37-503901f85458"
    *         },
    *         "password": "68d23eab21abab38542184e8fca2199d",
    *         "name": "JPP",
    *         "hashAlgorithm": "PBKDF2",
    *         "hashParameters": {"iterations": 1000, "keyLength": 128}
    *       }
    *     }
    */
    cC.uauth.callDoors = function(apiAction, data, callback) {

        console.warn("=====> CORS  <=====")
        console.log("data",data)
        console.log("apiAction",apiAction)

        var doorsUid = null
        var doorsMsg = null

        // all mandatory params for doors
        var mailStr = data[0]
        var passStr = data[1]
        var nameStr = data[2]

        // test params and set defaults
        if (typeof apiAction != 'string'
            || (! /user|register|userExists/.test(apiAction))) {
            // currently forces login action unless we got an accepted action
            apiAction = 'user'
            console.warn('DBG: forcing user route')
        }

        if (typeof callback != 'function') {
            callback = function(retval) { return retval }
        }

        var ok = (
                    (apiAction == 'userExists'
                        && typeof mailStr == 'string' && mailStr)
                 || (apiAction == 'user'
                        && typeof mailStr == 'string' && mailStr
                        && typeof passStr == 'string' && passStr)

                 || (apiAction == 'register'
                        && typeof mailStr == 'string' && mailStr
                        && typeof passStr == 'string' && passStr
                        && typeof nameStr == 'string' && nameStr)
               )
        if (!ok) {
            doorsMsg = "Invalid parameters in input data (arg #1)"
            console.warn('DEBUG callDoors() internal validation failed before ajax')
        }
        else {
            var sendData = {
                    "login":    mailStr,
                    "password": passStr,
                    "name":     nameStr
                }

            var scheme = cC.uauth.protoDoors ? 'http' : 'https'

            $.ajax({
                contentType: cC.uauth.protoDoors ? "application/json" : "application/x-www-form-urlencoded; charset=UTF-8",
                dataType: 'json',

                url: scheme + "://"+cC.uauth.doorsConnectParam+"/api/" + apiAction,
                data: cC.uauth.protoDoors ? JSON.stringify(sendData) : sendData,
                type: 'POST',
                // traditional: !cC.uauth.protoDoors,
                success: function(data) {
                        if (typeof data != 'undefined'
                             && apiAction == 'userExists') {
                            // userExists success case: it's all in the message :)
                            doorsUid =  null
                            doorsMsg = data.status
                        }
                        else if (typeof data != 'undefined'
                                && typeof data.userInfo != undefined
                                && typeof data.userInfo.id != undefined
                                && typeof data.userInfo.id.id != undefined
                                && typeof data.status == 'string') {
                            // main success case: get the id
                            doorsUid = data.userInfo.id.id
                            doorsMsg = data.status
                        }
                        else {
                            doorsMsg = "Unknown response for doors apiAction (" + apiAction +"):"
                            doorsMsg += '"' + JSON.stringify(data).substring(0,10) + '..."'
                        }

                        // start the callback
                        callback([doorsUid,doorsMsg])
                },

                error: function(result) {
                        console.log(result)
                        if (apiAction == 'user'){
                            if (result.responseText.match(/"User .+@.+ not found"/)) {
                                doorsMsg = result.responseText.replace(/^"/g, '').replace(/"$/g, '')
                            }
                            else {
                                console.warn("Unhandled error doors login (" + result.responseText +")")
                            }
                        }
                        else if (apiAction == 'register' || apiAction == 'userExists'){
                            if (typeof result.responseJSON != 'undefined'
                                && typeof result.responseJSON.status == 'string') {

                                doorsMsg = result.responseJSON.status
                                // will be useful in the future (actually doors errs don't have a status message yet)
                                // if doorsMsg == ''
                            }
                            else {
                                doorsMsg = "Unrecognized response from doors /api/"+apiAction+" (response=" + result.responseText + '[' + result.statusText +"])"
                                console.warn(doorsMsg)
                            }
                        }
                        else {
                            doorsMsg = "Unhandled error from unknown doors apiAction (" + apiAction +")"
                            console.error(doorsMsg)
                        }

                        // start the callback
                        callback([doorsUid,doorsMsg])
                }
            });
        }
    }

    // we return our augmented comex client module
    return cC

})(cmxClt) ;


console.log("user shared auth load OK")
