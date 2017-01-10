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
// POSS remove ccModule.auth. namespace prefix from local scope vars
cmxClt = (function(ccModule) {
    // common vars to authenticating/registering in user area
    ccModule.uauth = {}

    ccModule.uauth.emailIdSupposedToExist = null

    ccModule.uauth.uidInput = document.getElementById('doors_uid')
    ccModule.uauth.email    = document.getElementById('email')
    ccModule.uauth.emailLbl = document.querySelector('label[for=email]')

    // str of the form: doors_hostname:doors_port
    ccModule.uauth.doorsConnectParam = document.getElementById('doors_connect').value

    // captcha
    // -------
    ccModule.uauth.captcha = document.getElementById('my-captcha')

    // param for generation & validation
    ccModule.uauth.realCaptchaLength = 5

    // captcha init
    $(cmxClt.uauth.captcha).realperson({length: ccModule.uauth.realCaptchaLength})

    // captchaHash should be appended by itself if normal submit,
    // but otherwise we need to do it ourselves with collectCaptcha()
    ccModule.uauth.captchaCheck = document.getElementById('my-captchaHash')
    ccModule.uauth.collectCaptcha = function() {
        ccModule.uauth.captchaCheck.value = $(cmxClt.uauth.captcha).realperson('getHash')
    }

    // doors-related html elements
    // ---------------------------
    ccModule.uauth.doorsMessage = document.getElementById('doors_ret_message')
    ccModule.uauth.doorsIconMessage = document.getElementById('doors_ret_icon_msg')
    ccModule.uauth.doorsIcon = document.getElementById('doors_ret_icon')

    // cmxClt.uauth flags (usually needed to even get the submitButton)
    ccModule.uauth.emailStatus = false
    ccModule.uauth.passStatus = false
    ccModule.uauth.captchaStatus = false

    ccModule.uauth.earlyValidate = function() {
        // will update the ccModule.uauth.emailStatus boolean
        ccModule.uauth.testMailFormatAndExistence(ccModule.uauth.email.value, ccModule.uauth.emailIdSupposedToExist)

        // will update ccModule.uauth.passStatus
        if (ccModule.uauth.pass2) {
            ccModule.uauth.doubleCheck()
        }
        else {
            ccModule.uauth.checkPassFormat()
        }

        // finally also update ccModule.uauth.captchaStatus
        ccModule.uauth.captchaStatus = (ccModule.uauth.captcha.value.length == ccModule.uauth.realCaptchaLength)
    }


    // email validation and side-effects
    // =================================
    ccModule.uauth.lastEmailValueCheckedDisplayed = null

    // function testMailFormatAndExistence
    // ------------------------------------
    // NB for login, use --------> expectExists = true
    //    for registration, use -> expectExists = false

    // no return value, but side effect on icon + msg + emailStatus
    //    wrong format ===========================> grey
    //    format ok, doorsStatus != expectExists => red
    //    format ok, doorsStatus == expectExists => green

    ccModule.uauth.testMailFormatAndExistence = function (emailValue, expectExists) {

      if (ccModule.uauth.email.value != ccModule.uauth.lastEmailValueCheckedDisplayed) {

          // tests if email is well-formed
          // TODO: better extension and allowed chars set
          var emailFormatOk = /^[-A-z0-9_=.+]+@[-A-z0-9_=.+]+\.[-A-z0-9_=.+]{2,4}$/.test(emailValue)

          if (! emailFormatOk) {
              // restore original lack of message
              ccModule.uauth.doorsMessage.title = 'The email will be checked in our DB after you finish typing'
              ccModule.uauth.doorsIcon.classList.remove('glyphicon-remove')
              ccModule.uauth.doorsIcon.classList.remove('glyphicon-ok')
              ccModule.uauth.doorsIcon.classList.add('glyphicon-question-sign')
              ccModule.uauth.doorsIcon.style.color = ccModule.colorGrey
              ccModule.uauth.doorsMessage.innerHTML = ""

              ccModule.uauth.emailLbl.style.color = ""

              // module-wide flag
              ccModule.uauth.emailStatus = false
          }
          else {
              // additional ajax to check login availability
              //  => updates the emailStatus global boolean
              //  => displays an icon

              // NB using route in doors api/userExists
              // case true => Ok("""{"status":"login exists"}""")
              // case false => Ok("""{"status":"login available"}""")
              // /!\ async
              ccModule.uauth.callDoors(
                  "userExists",
                  [emailValue],
                  function(doorsResp) {
                      var doorsUid = doorsResp[0]
                      var doorsMsg = doorsResp[1]

                      // the global status can be true iff login is as expected and format ok
                      if (expectExists) {
                          ccModule.uauth.emailStatus = (doorsMsg == "login exists")
                      }
                      else {
                          ccModule.uauth.emailStatus = (doorsMsg == "login available")
                      }

                      if (ccModule.uauth.emailStatus) {
                          // icon
                          ccModule.uauth.doorsIconMessage.title = "OK: "+doorsMsg+" on Doors"
                          ccModule.uauth.doorsIcon.style.color = ccModule.colorGreen
                          ccModule.uauth.doorsIcon.classList.remove('glyphicon-remove')
                          ccModule.uauth.doorsIcon.classList.remove('glyphicon-question-sign')
                          ccModule.uauth.doorsIcon.classList.add('glyphicon-ok')

                          // message in legend
                          ccModule.uauth.doorsMessage.innerHTML = "OK: "+doorsMsg+" on Doors"
                          ccModule.uauth.doorsMessage.style.color = ccModule.colorGreen

                          // label
                          ccModule.uauth.emailLbl.style.backgroundColor = ""
                      }
                      else {
                          var errMsg = expectExists ? "your ID isn't recognized" : "this ID is already taken"
                          // icon
                          ccModule.uauth.doorsIconMessage.title = "Sorry "+errMsg+" on Doors!"
                          ccModule.uauth.doorsIcon.style.color = ccModule.colorRed
                          ccModule.uauth.doorsIcon.classList.remove('glyphicon-ok')
                          ccModule.uauth.doorsIcon.classList.remove('glyphicon-question-sign')
                          ccModule.uauth.doorsIcon.classList.add('glyphicon-remove')

                          // message in legend
                          ccModule.uauth.doorsMessage.innerHTML = "Sorry "+errMsg+" on Doors!"
                          ccModule.uauth.doorsMessage.style.color = ccModule.colorRed

                          // label
                          ccModule.uauth.emailLbl.style.backgroundColor = ccModule.colorOrange
                      }

                      // to debounce re-invocations
                      ccModule.uauth.lastEmailValueCheckedDisplayed = emailValue
                  }
              )
          }
      }
    }

    // -----------------------------------------------------------------------
    // Password validations
    // TODO use a most common passwords lists
    ccModule.uauth.pass1 = document.getElementById('password')
    ccModule.uauth.pass2 = document.getElementById('password2')
    ccModule.uauth.passMsg = document.getElementById('password_message')

    // register <=> do pass 1 and pass 2 match?
    if (ccModule.uauth.pass2) {
      ccModule.uauth.pass1.onkeyup = ccModule.uauth.doubleCheck
      ccModule.uauth.pass1.onchange = ccModule.uauth.doubleCheck
      ccModule.uauth.pass2.onkeyup = ccModule.uauth.doubleCheck
      ccModule.uauth.pass2.onchange = ccModule.uauth.doubleCheck
    }
    // login <=> just one password
    else {
        ccModule.uauth.pass1.onkeyup = ccModule.uauth.checkPassFormat
        ccModule.uauth.pass1.onchange = ccModule.uauth.checkPassFormat
    }

    // used only for logins
    ccModule.uauth.checkPassFormat = function () {
        ccModule.uauth.passStatus = (ccModule.uauth.pass1.value.length > 7)
    }

    // 2 in 1: used only for registration
    ccModule.uauth.doubleCheck = function () {
      if (ccModule.uauth.pass1.value || ccModule.uauth.pass2.value) {
        var pass1v = ccModule.uauth.pass1.value
        var pass2v = ccModule.uauth.pass2.value

        if ((pass1v && pass1v.length > 7)
            || (pass2v && pass2v.length > 7)) {
          // test values
          if (pass1v == pass2v) {
              if (pass1v.match('[^A-z0-9]')) {
                  ccModule.uauth.passMsg.innerHTML = 'Ok valid passwords!'
                  ccModule.uauth.passStatus = true
              }
              else {
                  ccModule.uauth.passMsg.innerHTML = "Passwords match but don't contain any special characters, please complexify!"
                  ccModule.uauth.passStatus = false
              }
          }
          else {
            ccModule.uauth.passMsg.innerHTML = "The passwords don't match yet."
            ccModule.uauth.passStatus = false
        }
        }
        else {
          ccModule.uauth.passMsg.innerHTML = "The password is too short (8 chars min)."
          ccModule.uauth.passStatus = false
        }
      }
      if (!ccModule.uauth.passStatus) ccModule.uauth.passMsg.style.color = ccModule.colorRed
      else                            ccModule.uauth.passMsg.style.color = ccModule.colorGreen
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
    ccModule.uauth.callDoors = function(apiAction, data, callback) {

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
            $.ajax({
                contentType: "application/json",
                dataType: 'json',
                url: "http://"+ccModule.uauth.doorsConnectParam+"/api/" + apiAction,
                data: JSON.stringify({
                    "login":    mailStr,
                    "password": passStr,
                    "name":     nameStr
                }),
                type: 'POST',
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
                                // POSS: user message
                                console.warn("Unhandled error doors login (" + result.responseText +")")
                            }
                        }
                        else if (apiAction == 'register'){
                            if (typeof result.responseJSON != 'undefined'
                                && typeof result.responseJSON.status == 'string') {

                                doorsMsg = result.responseJSON.status
                                // will be useful in the future (actually doors errs don't have a status message yet)
                                // if doorsMsg == ''
                            }
                            else {
                                // POSS: user message
                                doorsMsg = "Unhandled error doors register (" + result.responseText +")"
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
    return ccModule

})(cmxClt) ;


console.log("user shared auth load OK")
