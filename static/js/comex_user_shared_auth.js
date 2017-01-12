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

    cC.uauth.emailIdSupposedToExist = null

    cC.uauth.uidInput = document.getElementById('doors_uid')
    cC.uauth.email    = document.getElementById('email')
    cC.uauth.emailLbl = document.querySelector('label[for=email]')

    // str of the form: doors_hostname:doors_port
    cC.uauth.doorsConnectParam = document.getElementById('doors_connect').value

    // captcha
    // -------
    // div
    cC.uauth.captcha = document.getElementById('my-captcha')

    // param for generation & validation
    cC.uauth.realCaptchaLength = 5

    // captcha init
    $(cmxClt.uauth.captcha).realperson({length: cC.uauth.realCaptchaLength})

    // captchaHash should be appended by itself if normal submit,
    // but otherwise we need to do it ourselves with collectCaptcha()
    cC.uauth.captchaCheck = document.getElementById('my-captchaHash')
    cC.uauth.collectCaptcha = function() {
        cC.uauth.captchaCheck.value = $(cmxClt.uauth.captcha).realperson('getHash')
    }

    // doors-related html elements
    // ---------------------------
    cC.uauth.doorsMessage = document.getElementById('doors_ret_message')
    cC.uauth.doorsIconMessage = document.getElementById('doors_ret_icon_msg')
    cC.uauth.doorsIcon = document.getElementById('doors_ret_icon')

    // cmxClt.uauth flags (usually needed to even get the submitButton)
    cC.uauth.emailStatus = false
    cC.uauth.passStatus = false
    cC.uauth.captchaStatus = false

    cC.uauth.earlyValidate = function() {
        // will update the cC.uauth.emailStatus boolean
        cC.uauth.testMailFormatAndExistence(cC.uauth.email.value, cC.uauth.emailIdSupposedToExist)

        // will update cC.uauth.passStatus
        if (cC.uauth.pass2) {
            cC.uauth.doubleCheck()
        }
        else {
            cC.uauth.checkPassFormat()
        }

        // finally also update cC.uauth.captchaStatus
        cC.uauth.captchaStatus = (cC.uauth.captcha.value.length == cC.uauth.realCaptchaLength)
    }


    // email validation and side-effects
    // =================================
    cC.uauth.lastEmailValueCheckedDisplayed = null

    // function testMailFormatAndExistence
    // ------------------------------------
    // NB for login, use --------> expectExists = true
    //    for registration, use -> expectExists = false

    // no return value, but side effect on icon + msg + emailStatus
    //    wrong format ===========================> grey
    //    format ok, doorsStatus != expectExists => red
    //    format ok, doorsStatus == expectExists => green

    cC.uauth.testMailFormatAndExistence = function (emailValue, expectExists) {

      if (cC.uauth.email.value != cC.uauth.lastEmailValueCheckedDisplayed) {

          // tests if email is well-formed
          // TODO: better extension and allowed chars set
          var emailFormatOk = /^[-A-z0-9_=.+]+@[-A-z0-9_=.+]+\.[-A-z0-9_=.+]{2,4}$/.test(emailValue)

          if (! emailFormatOk) {
              // restore original lack of message
              cC.uauth.doorsMessage.title = 'The email will be checked in our DB after you finish typing'
              cC.uauth.doorsIcon.classList.remove('glyphicon-remove')
              cC.uauth.doorsIcon.classList.remove('glyphicon-ok')
              cC.uauth.doorsIcon.classList.add('glyphicon-question-sign')
              cC.uauth.doorsIcon.style.color = cC.colorGrey
              cC.uauth.doorsMessage.innerHTML = ""
              cC.uauth.doorsMessage.style.fontWeight = "normal"

              cC.uauth.emailLbl.style.color = ""

              // module-wide flag
              cC.uauth.emailStatus = false
          }
          else {
              // additional ajax to check login availability
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

                      // the global status can be true iff login is as expected and format ok
                      if (expectExists) {
                          cC.uauth.emailStatus = (doorsMsg == "login exists")
                      }
                      else {
                          cC.uauth.emailStatus = (doorsMsg == "login available")
                      }

                      if (cC.uauth.emailStatus) {
                          // icon
                          cC.uauth.doorsIconMessage.title = "OK: "+doorsMsg
                          cC.uauth.doorsIcon.style.color = cC.colorGreen
                          cC.uauth.doorsIcon.classList.remove('glyphicon-remove')
                          cC.uauth.doorsIcon.classList.remove('glyphicon-question-sign')
                          cC.uauth.doorsIcon.classList.add('glyphicon-ok')

                          // message in legend
                          cC.uauth.doorsMessage.innerHTML = "OK: "+doorsMsg
                          cC.uauth.doorsMessage.style.color = cC.colorGreen
                          cC.uauth.doorsMessage.style.fontWeight = "bold"
                          cC.uauth.doorsMessage.style.textShadow = cC.strokeWhite

                          // label
                          cC.uauth.emailLbl.style.backgroundColor = ""
                      }
                      else {
                          var errMsg = expectExists ? "your ID isn't recognized" : "this ID is already taken"
                          // icon
                          cC.uauth.doorsIconMessage.title= "Sorry: "+errMsg+" !"
                          cC.uauth.doorsIcon.style.color = cC.colorOrange
                          cC.uauth.doorsIcon.classList.remove('glyphicon-ok')
                          cC.uauth.doorsIcon.classList.remove('glyphicon-question-sign')
                          cC.uauth.doorsIcon.classList.add('glyphicon-remove')

                          // message in legend
                          cC.uauth.doorsMessage.innerHTML = "Sorry: "+errMsg+" !"
                          cC.uauth.doorsMessage.style.color = cC.colorOrange
                          cC.uauth.doorsMessage.style.fontWeight = "bold"
                          cC.uauth.doorsMessage.style.textShadow = cC.strokeDeepGrey

                          // label
                          cC.uauth.emailLbl.style.backgroundColor = cC.colorOrange
                      }

                      // to debounce re-invocations
                      cC.uauth.lastEmailValueCheckedDisplayed = emailValue
                  }
              )
          }
      }
    }

    // -----------------------------------------------------------------------
    // Password validations
    // TODO use a most common passwords lists
    cC.uauth.pass1 = document.getElementById('password')
    cC.uauth.pass2 = document.getElementById('password2')
    cC.uauth.passMsg = document.getElementById('password_message')

    // register <=> do pass 1 and pass 2 match?
    if (cC.uauth.pass2) {
      cC.uauth.pass1.onkeyup = cC.uauth.doubleCheck
      cC.uauth.pass1.onchange = cC.uauth.doubleCheck
      cC.uauth.pass2.onkeyup = cC.uauth.doubleCheck
      cC.uauth.pass2.onchange = cC.uauth.doubleCheck
    }
    // login <=> just one password
    else {
        cC.uauth.pass1.onkeyup = cC.uauth.checkPassFormat
        cC.uauth.pass1.onchange = cC.uauth.checkPassFormat
    }

    // used only for logins
    cC.uauth.checkPassFormat = function () {
        cC.uauth.passStatus = (cC.uauth.pass1.value.length > 7)
    }

    // 2 in 1: used only for registration
    cC.uauth.doubleCheck = function () {
      if (cC.uauth.pass1.value || cC.uauth.pass2.value) {
        var pass1v = cC.uauth.pass1.value
        var pass2v = cC.uauth.pass2.value

        if ((pass1v && pass1v.length > 7)
            || (pass2v && pass2v.length > 7)) {
          // test values
          if (pass1v == pass2v) {
              if (pass1v.match('[^A-z0-9]')) {
                  cC.uauth.passMsg.innerHTML = 'Ok valid passwords!'
                  cC.uauth.passStatus = true
              }
              else {
                  cC.uauth.passMsg.innerHTML = "Passwords match but don't contain any special characters, please complexify!"
                  cC.uauth.passStatus = false
              }
          }
          else {
            cC.uauth.passMsg.innerHTML = "The passwords don't match yet."
            cC.uauth.passStatus = false
        }
        }
        else {
          cC.uauth.passMsg.innerHTML = "The password is too short (8 chars min)."
          cC.uauth.passStatus = false
        }
      }
      if (!cC.uauth.passStatus) cC.uauth.passMsg.style.color = cC.colorRed
      else                            cC.uauth.passMsg.style.color = cC.colorGreen
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
            $.ajax({
                contentType: "application/json",
                dataType: 'json',
                url: "http://"+cC.uauth.doorsConnectParam+"/api/" + apiAction,
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
    return cC

})(cmxClt) ;


console.log("user shared auth load OK")
