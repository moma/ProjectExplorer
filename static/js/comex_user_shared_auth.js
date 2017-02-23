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

    // #doors_connect.value ~~> like a @classparam for uauthforms
    // :str: "doors_hostname:doors_port"
    cC.uauth.doorsConnectParam = document.getElementById('doors_connect').value

    // param for "realperson" widget generation & validation
    cC.uauth.realCaptchaLength = 5

    // our functions
    cC.uauth.AuthForm
    cC.uauth.collectCaptcha
    cC.uauth.testMailFormatAndExistence
    cC.uauth.showEmailGUIEffects          // helper for testMail
    cC.uauth.doubleCheck
    cC.uauth.callDoors
    cC.uauth.callUserApi

    // AuthForm: init(id, onchange, params)
    // --------
    // @id
    // @params:
    //   - type         login|register|doorsRegister
    //   - emailId      html email input element id
    //   - duuidId      html doors_uid hidden input element id
    //   - passId       html password input element id
    //   - pass2Id      optional
    //   - captchaId    optional
    //   - capcheckId   optional
    //   - all  other params are passed to super()
    //       (optional:  - mainMessageId
    //        optional:  - timestampId
    //        optional:  - submitBtnId
    //        optional:  - multiTextinputs)
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
        if (auForm.type == 'login') {
            auForm.elPass.onkeyup = function(event) {
                // console.debug("..elPass "+auForm.id+" event:"+event.type)
                auForm.passStatus = (auForm.elPass.value.length > 7)
            }
            auForm.elPass.onchange = auForm.elPass.onkeyup
        }
        // register cases <=> do pass 1 and pass 2 match?
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

            // another form submit() overload to prevent double registrations
            auForm.elForm.normalSubmitAction = auForm.elForm.submit
            auForm.elForm.submit = function() {
                auForm.elSubmitBtn.disabled = true
                auForm.elForm.normalSubmitAction()
            }
        }

        // 3) for captcha
        if (auForm.validateCaptcha) {
            if (auForm.elCaptcha) {
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
                    // console.log("go newSubmit")
                    cmxClt.uauth.collectCaptcha(auForm)
                    // console.log("go oldSubmit")
                    auForm.elForm.oldSubmitAction()
                }
            }
            else {
            console.warn(`validateCaptcha is set to true but there is no captcha in the authentication form #${auForm.id}`)
            }
        }

        // return new obj
        return auForm
    }
    // -------------------

    cC.uauth.collectCaptcha = function (uformObj) {
        uformObj.elCapcheck.value = $(uformObj.elCaptcha).realperson('getHash')
        // console.debug('  '+uformObj.id+': collected captcha hash ' +uformObj.elCapcheck.value)
    }

    // NB removed earlyValidate
    //       => no need for 1 exposed validation function
    //          b/c all 3 checks bound to their elements onchange/onkeyup


    // ----------- interaction for mailID check via fetch @doors ---------------
    // function testMailFormatAndExistence
    // ------------------------------------
    // args:
    //    obja: an AuthForm object
    //
    // NB for login we only check the doors DB
    //    for registration, we must check both DBs if email is available

    // effect 1 emailStatus ok/no, and side effect 2 on icon + msg
    //    wrong format ===========================> grey
    //    format ok, doorsStatus != expectExists => red
    //    format ok, doorsStatus == expectExists => green
    cC.uauth.testMailFormatAndExistence = function (obja) {


      // PREP-ING
      if (obja.lastEmailValue == undefined) {
          obja.lastEmailValue == null
      }

      // locate our dials if any and if not already done
      if (!obja.emailDials) {
          //  = signaling elements (icons, divs) for user feed-back
          obja.emailDials = {}
          var emailQ = cC.findAncestor(obja.elEmail, 'question')
          obja.emailDials.elIcon = emailQ.querySelector('.uicon')
          obja.emailDials.elMsg = emailQ.querySelector('.umessage')
          obja.emailDials.elLbl = emailQ.querySelector('label[for='+obja.elEmail.id+']')
      }

      // GO TESTS
      var emailValue = obja.elEmail.value


      // 0) memo
      if (obja.emailStatus != null
          && emailValue == obja.lastEmailValue) {
          return obja.emailStatus
      }

      // 1) tests if email is well-formed
      // TODO: better extension and allowed chars set
      var emailFormatOk = /^[-A-z0-9_=.+]+@[-A-z0-9_=.+]+\.[-A-z0-9_=.+]{2,4}$/.test(emailValue)

      if (! emailFormatOk) {

          // TODO add to showEmailGUIEffects with a status == "neutral"
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
          obja.lastEmailValue = emailValue
      }
      else {
          // 2) additional ajax(es) to check login availability
          //  => updates the emailStatus global boolean
          //  => displays an icon

          // NEW: added a user api check in register case

          // if type == login <=> just callDoors for an existing ID
          // if type == register <=> callUserApi and callDoors for a new ID
          // if type == doorsRegister <=> just callDoors for a new ID

          // NB using route in doors api/userExists
          //    using route in comex api/user?op=exists
          // /!\ async

          cC.uauth.callDoors(
              "userExists",
              [emailValue],
              function(doorsResp) {
                  var doorsUid = doorsResp[0]
                  var doorsMsg = doorsResp[1]

                  if (obja.type == "login") {

                      obja.emailStatus = (doorsMsg == "LoginAlreadyExists")
                        // signals the form change after this input status change
                        // (we're now after async came back, so long after keyup finished)
                        obja.elForm.dispatchEvent(new CustomEvent('change'))

                        // trigger visual side-effects
                        if (obja.emailStatus) {
                            cC.uauth.showEmailGUIEffects(obja, "login recognized")
                        }
                        else {
                            cC.uauth.showEmailGUIEffects(obja, "login not found")
                        }
                        obja.lastEmailValue = emailValue
                  }
                  // similar but one chained call to local api
                  else if (obja.type == "register"
                            || obja.type == "doorsRegister") {

                    // email available on doors side
                    // -----------------------------
                    if (doorsMsg == ("LoginAvailable")) {

                      if (obja.type == 'doorsRegister') {
                          obja.emailStatus = true
                          obja.elForm.dispatchEvent(new CustomEvent('change'))
                          cC.uauth.showEmailGUIEffects(obja, doorsMsg)
                          obja.lastEmailValue = emailValue
                      }

                      // full register
                      else {
                          // let's see if it's also available on comexdb side
                          cC.uauth.callUserApi(
                              "exists",
                              emailValue,
                              function(boolExists) {
                                  obja.emailStatus = !boolExists
                                  var guiMsg = boolExists ? 'login already taken in communityexplorer' : 'login available'
                                  // signal and trigger
                                  obja.elForm.dispatchEvent(new CustomEvent('change'))
                                  cC.uauth.showEmailGUIEffects(obja, guiMsg)
                                  obja.lastEmailValue = emailValue
                              }
                          )
                      }
                    }
                    // not available on doors side
                    // ---------------------------
                    else if (doorsMsg == "LoginAlreadyExists") {
                        obja.emailStatus = false
                        // signal and trigger
                        obja.elForm.dispatchEvent(new CustomEvent('change'))
                        cC.uauth.showEmailGUIEffects(obja, "login already taken in ISC services")
                        obja.lastEmailValue = emailValue
                    }
                    // doors error
                    else {
                        console.error("Error with doors connection")
                    }
                  }
              }
          )
      }
    }

    // showEmailGUIEffects(aUform)
    //
    // Uses a status (the boolean aUform.emailStatus) to show info in gui
    // Now as a separate function to call in different callback nesting levels
    //
    // TODO A add the status == "neutral" case
    // TODO B add a status == "ERROR" case
    cC.uauth.showEmailGUIEffects = function(formObj, ajaxMsg) {

      // effects on dials
      if (formObj.emailStatus) {
          // icon
          formObj.emailDials.elIcon.style.color = cC.colorGreen
          formObj.emailDials.elIcon.classList.remove('glyphicon-ban-circle')
          formObj.emailDials.elIcon.classList.remove('glyphicon-question-sign')
          formObj.emailDials.elIcon.classList.add('glyphicon-ok-circle')

          // message in legend
          formObj.emailDials.elMsg.innerHTML = "OK: "+ajaxMsg
          formObj.emailDials.elMsg.style.color = cC.colorGreen
          formObj.emailDials.elMsg.style.fontWeight = "bold"
          formObj.emailDials.elMsg.style.fontSize = ""
          formObj.emailDials.elMsg.style.textShadow = cC.strokeWhite
          formObj.emailDials.elMsg.style.backgroundColor = ""

          // label
          formObj.emailDials.elLbl.style.backgroundColor = ""
      }
      else {
          // icon
          formObj.emailDials.elIcon.style.color = cC.colorOrange
          formObj.emailDials.elIcon.classList.remove('glyphicon-ok-circle')
          formObj.emailDials.elIcon.classList.remove('glyphicon-question-sign')
          formObj.emailDials.elIcon.classList.add('glyphicon-ban-circle')

          // message in legend
          formObj.emailDials.elMsg.innerHTML = "Sorry: "+ajaxMsg+" !"
          formObj.emailDials.elMsg.style.color = cC.colorDarkerOrange
          formObj.emailDials.elMsg.style.fontWeight = "bold"
          formObj.emailDials.elMsg.style.fontSize = "110%"
          //   formObj.emailDials.elMsg.style.backgroundColor = "#888"
          //   formObj.emailDials.elMsg.style.textShadow = cC.strokeDeepGrey
          formObj.emailDials.elMsg.style.textShadow = ""

          // label
          formObj.emailDials.elLbl.style.backgroundColor = cC.colorOrange
      }
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


    /* ------------------ local ajax function ------------------
    * @args:
    *     apiOp:  'exists' is the only supported operation atm
    *
    *     theEmail: an email as search param
    *
    *     callback:   function that will be called after success ONLY
    *                 (takes the boolean value of 'exists' response)
    */

    cC.uauth.callUserApi = function(apiOperation, theEmail, callback) {
        if (apiOperation != 'exists') {
            console.error('uauth:callUserApi unsupported apiOp:', apiOperation)
        }
        else {
            var urlArgs = new URLSearchParams();
            urlArgs.append('op', "exists");
            urlArgs.append('email', theEmail);
        }

        if (!callback) {
            callback = function (boolean) { console.log("callUserApi response:", boolean) }
        }

        if (window.fetch) {
            fetch('/services/api/user?' + urlArgs)
            // 1st then() over promise
            .then(function(response) {
                if(response.ok) {
                  // unwraps the promise
                  return response.json()
                }
                else {
                  console.warn('uauth:callUserApi: Network response was not ok.');
                }
            })
            // 2nd then(): takes response.json() from preceding
            .then(function(bodyJson) {
                // ex: {'exists': true}
                callback(bodyJson[apiOperation])
            })
            // .catch(function(error) {
            //     console.warn('uauth:callUserApi: fetch error:'+error.message);
            // });
        }

        // also possible using old-style jquery ajax
        else {
            $.ajax({
                type: 'GET',
                dataType: "json",
                url: '/services/api/user?' + urlArgs,
                success: function(data) {
                    // ex: {'exists': true}
                    callback(data[apiOperation])
                },
                error: function(result) {
                    console.warn('uauth:callUserApi(jquery version) ajax error with result', result)
                }
            });
        }
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

        // console.warn("=====> CORS  <=====")
        // console.log("data",data)
        // console.log("apiAction",apiAction)

        var doorsUid = null
        var doorsMsg = null

        // all mandatory params for doors
        var mailStr = data[0]
        var passStr = data[1]
        var nameStr = data[2]

        // test params and set defaults
        if (typeof apiAction != 'string'
            || (! /user|register|userExists/.test(apiAction))) {
            console.error('callDoors error: Unknown doors-api action')
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
            console.warn('DBG callDoors() internal validation failed before ajax')
        }
        else {
            var sendData = {
                    "login":    mailStr,
                    "password": passStr,
                    "name":     nameStr
                }

            var scheme = 'https'

            $.ajax({
                contentType: "application/x-www-form-urlencoded; charset=UTF-8",
                dataType: 'json',

                url: scheme + "://"+cC.uauth.doorsConnectParam+"/api/" + apiAction,
                data: sendData,
                type: 'POST',
                success: function(data) {

                        // console.log('response data', data)

                        if (typeof data != 'undefined'
                             && apiAction == 'userExists') {
                            // userExists success case: it's all in the message :)
                            doorsUid =  null
                            doorsMsg = data.status
                        }
                        else if (typeof data != 'undefined'
                                && typeof data.userID != undefined
                                && typeof data.status == 'string') {
                            // main success case: get the id
                            doorsUid = data.userID
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
                        // console.log(result)
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
