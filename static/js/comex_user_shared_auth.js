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
cmxClt = (function(ccModule) {
    // common vars to authenticating/registering in user area
    ccModule.uauth = {}

    var bidule = "trux"

    ccModule.uauth.emailIdSupposedToExist = null

    ccModule.uauth.uidInput = document.getElementById('doors_uid')
    ccModule.uauth.email    = document.getElementById('email')
    ccModule.uauth.emailLbl = document.querySelector('label[for=email]')

    // str of the form: doors_hostname:doors_port
    ccModule.uauth.doorsConnectParam = document.getElementById('doors_connect').value

    // captchaHash should be appended by itself if normal submit,
    // but we may need to do it ourselves (TODO test)
    ccModule.uauth.captcha = document.getElementById('my-captcha')
    ccModule.uauth.captchaCheck = document.getElementById('my-captchaHash')

    // param for generation & validation
    ccModule.uauth.realCaptchaLength = 5

    // initialize pseudo captcha
    $('#my-captcha').realperson({length: ccModule.uauth.realCaptchaLength});

    // doors-related html elements
    ccModule.uauth.doorsMessage = document.getElementById('doors_ret_message')
    ccModule.uauth.doorsIconMessage = document.getElementById('doors_ret_icon_msg')
    ccModule.uauth.doorsIcon = document.getElementById('doors_ret_icon')

    // cmxClt.u.auth validators (needed to even get the submitButton)
    ccModule.uauth.passStatus = false
    ccModule.uauth.emailStatus = false
    ccModule.uauth.captchaStatus = false
    ccModule.uauth.lastEmailValueCheckedDisplayed = null

    ccModule.uauth.earlyValidate = function() {
        // will update the ccModule.uauth.emailStatus boolean
        ccModule.uauth.testMailFormatAndExistence(ccModule.uauth.email.value, ccModule.uauth.emailIdSupposedToExist)

        ccModule.uauth.captchaStatus = (ccModule.uauth.captcha.value.length == ccModule.uauth.realCaptchaLength)

    }

    // email validation and side-effects
    // =================================
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
          var emailFormatOk = /^[-A-z0-9_=.+]+@[-A-z0-9_=.+]+\.[-A-z0-9_=.+]{1,4}$/.test(emailValue)

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
                          ccModule.uauth.emailLbl.style.color = ccModule.colorGreen
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
                          ccModule.uauth.emailLbl.style.backgroundColor = ccModule.colorRed
                      }

                      // to debounce further actions in testAsYouGo
                      // return to neutral is also in testAsYouGo
                      ccModule.uauth.lastEmailValueCheckedDisplayed = emailValue
                  }
              )
          }
      }
    }

    // -----------------------------------------------------------------------
    // pass 1 and pass 2 ~~~> do they match?
    // TODO use a most common passwords lists
    ccModule.uauth.pass1 = document.getElementById('password')
    ccModule.uauth.pass2 = document.getElementById('password2')
    ccModule.uauth.passMsg = document.getElementById('password_message')

    ccModule.uauth.pass1.onkeyup = ccModule.uauth.checkPassStatus
    ccModule.uauth.pass1.onchange = ccModule.uauth.checkPassStatus

    if (ccModule.uauth.pass2) {
      // could also be attached to form onchange but then called often for nothing
      ccModule.uauth.pass2.onkeyup = ccModule.uauth.checkPassStatus
      ccModule.uauth.pass2.onchange = ccModule.uauth.checkPassStatus
    }


    ccModule.uauth.checkPassStatus = function () {
      // £TODO 2 functions:
      //   - check pass #X is valid (with arg pass1 or pass2) [for Login + Register]
      //   - check 2 passes are identical (only for Register)
      if (pass1.value || pass2.value) {
        var pass1v = pass1.value
        var pass2v = pass2.value

        if ((pass1v && pass1v.length > 7)
            || (pass2v && pass2v.length > 7)) {
          // test values
          if (pass1v == pass2v) {
              if (pass1v.match('[^A-z0-9]')) {
                  passMsg.innerHTML = 'Ok valid passwords!'
                  passStatus = true
              }
              else {
                  passMsg.innerHTML = 'Passwords match but contain only letters and/or digits, please complexify!'
                  passStatus = false
              }
          }
          else {
            passMsg.innerHTML = "The passwords don't match yet."
            passStatus = false
        }
        }
        else {
          passMsg.innerHTML = "The password is too short (8 chars min)."
          passStatus = false
        }
      }
      if (!passStatus) passMsg.style.color = ccModule.colorRed
      else             passMsg.style.color = ccModule.colorGreen
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
        if (typeof apiAction == 'undefined'
            || (apiAction != 'register' && apiAction != 'userExists')) {
            // currently forces login action unless we got 'register' or userExists
            apiAction = 'user'
            console.warn('DBG: forcing user route')
        }

        if (typeof callback != 'function') {
            callback = function(retval) { return retval }
        }

        var ok = ((apiAction == 'userExists' && typeof mailStr != 'undefined' && mailStr)
                 || (typeof mailStr != 'undefined'
                   && typeof mailStr != 'undefined'
                   && typeof nameStr != 'undefined'
                   && mailStr && passStr))  // assumes mail and pass will nvr be == 0

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
