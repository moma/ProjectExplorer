/**
 * @fileoverview
 *  Validates email ID and passwords
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

// common vars to authenticating user forms

var uidInput = document.getElementById('doors_uid')
var email = document.getElementById('email')


// str of the form: doors_hostname:doors_port
var doorsConnectParam = document.getElementById('doors_connect').value

// captchaHash should be appended by itself if normal submit,
// but we may need to do it ourselves (TODO test)
var captcha = document.getElementById('my-captcha')
var captchaCheck = document.getElementById('my-captchaHash')

// param for generation & validation
var realCaptchaLength = 5



var doorsMessage = document.getElementById('doors_ret_message')
var doorsIconMessage = document.getElementById('doors_ret_icon_msg')
var doorsIcon = document.getElementById('doors_ret_icon')

// validate as we go to even get the submitButton
var passStatus = false
var emailStatus = false
var captchaStatus = false

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
function callDoors(apiAction, data, callback) {

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
            url: "http://"+doorsConnectParam+"/api/" + apiAction,
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
// very basic email validation TODO: better extension and allowed chars set :)
// (used in tests "as we go")
function basicEmailValidate (emailValue) {

  // tests if email is well-formed
  var emailFormatOk = /^[-A-z0-9_=.+]+@[-A-z0-9_=.+]+\.[-A-z0-9_=.+]{1,4}$/.test(emailValue)

  if (! emailFormatOk) {
      // restore original lack of message
      doorsMessage.title = 'The email will be checked in our DB after you type and leave the box.'
      doorsIcon.classList.remove('glyphicon-remove')
      doorsIcon.classList.remove('glyphicon-ok')
      doorsIcon.classList.add('glyphicon-question-sign')
      doorsIcon.style.color = colorGrey
      emailStatus = false
  }
  else {
      // additional ajax to check login availability
      //  => updates the emailStatus global boolean
      //  => displays an icon
      testDoorsUserExists(emailValue)
  }
}

// pass 1 and pass 2 ~~~> do they match?
// TODO use a most common passwords lists
var pass1 = document.getElementById('password')
var pass2 = document.getElementById('password2')
var passMsg = document.getElementById('password_message')
var passwords = [pass1, pass2]

passwords.forEach ( function(pass) {
  // could also be attached to form onchange but then called often for nothing
  pass.onkeyup = checkPassStatus
  pass.onchange = checkPassStatus
})


function checkPassStatus() {
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
  if (!passStatus) passMsg.style.color = colorRed
  else             passMsg.style.color = colorGreen
}



// pseudo captcha
$('#my-captcha').realperson({length: realCaptchaLength});
$('#my-captcha').val('')

console.log("user shared auth load OK")
