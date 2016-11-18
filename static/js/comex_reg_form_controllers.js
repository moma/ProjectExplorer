/**
 * @fileoverview
 * Validates the comex (communityexplorer.org) registration form
 *  + adds a timestamp in input#last_modified_date
 *  + adds autocompletes
 *  + prepares DB save into COLS
 *  + transmits login credentials to Doors for login or register (fun callDoors)
 *
 * @todo
 *    - harmonize var names (eg 'email' vs 'initialsInput' are both input elts)
 *    - package.json
 *
 * @version 1
 * @copyright ISCPIF-CNRS 2016
 * @author romain.loth@iscpif.fr
 *
 * @requires realperson (keith-wood.name/realPerson.html)
 */

// the target columns in DB: tuple (name, mandatoryBool, maxChars (or nChars))
var COLS = [ ["doors_uid",             false,        36,   'exact'],
             ["last_modified_date",     true,        24,   'exact'],
             ["email",                  true,       255],
             ["initials",               true,         7],
             ["country",                true,        60],
             ["first_name",             true,        30],
             ["middle_name",           false,        30],
             ["last_name",              true,        50],
             ["jobtitle",               true,        30],
             ["keywords",               true,       350],
             ["institution",            true,       120],
             ["institution_type",       true,        50],
             ["team_lab",              false,        50],
             ["institution_city",      false,        50],
             ["interests_text",        false,      1200],
             ["community_hashtags",    false,       350],
             ["gender",                false,         1,   'exact'],
             ["pic_file",              false,      null]]

// vars that will be used during the interaction
// NB other vars defined in main scope but just before their respective funs
var wholeFormData
var theForm = document.getElementById('comex_reg_form')
var regTimestamp = document.getElementById('last_modified_date')
var uidInput = document.getElementById('doors_uid')
var email = document.getElementById('email')

// captchaHash should be appended by itself if normal submit,
// but we may need to do it ourselves (TODO test)
var captcha = document.getElementById('my-captcha')
var captchaCheck = document.getElementById('my-captchaHash')

var subPage1Style = document.getElementById('subpage_1').style
var subPage2Style = document.getElementById('subpage_2').style
var teamCityDivStyle = document.getElementById('team_city_div').style

// param for generation & validation
var realCaptchaLength = 5

// cf corresponding css classes
var colorWhite = '#fff'
var colorRed = '#910'
var colorGreen = '#161'
var colorGrey = '#554'

var submitButton = document.getElementById('formsubmit')
var mainMessage = document.getElementById('main_validation_message')

var doorsMessage = document.getElementById('doors_ret_message')

// validate as we go to even get the submitButton
var passStatus = false
var emailStatus = false
var captchaStatus = false
submitButton.disabled = true
theForm.onkeyup = beTestedAsYouGo
theForm.onchange = beTestedAsYouGo
theForm.onblur = beTestedAsYouGo

// done when anything in the form changes
function beTestedAsYouGo() {
  basicEmailValidate()
  captchaStatus = (captcha.value.length == realCaptchaLength)

  // for debug
  checkPassStatus()

  if (passStatus && emailStatus && captchaStatus) {
      submitButton.disabled = false
  }
  else {
      submitButton.disabled = true
  }
  var now = new Date()
  regTimestamp.value = now.toISOString()
}


// NB if login ok then user exists then not available
//      => TODO a route for doors/api/exists
//      => resulting bool instead of (resp[0] != null)
function testDoorsUserExists() {
    // /!\ async
    callDoors(
        [email.value, pass1.value, initialsInput.value],
        function(doorsResp) {
            var doorsUid = doorsResp[0]
            var doorsMsg = doorsResp[1]
            var available = (doorsUid == null)
            displayDoorsStatusInLoginBox(available)
        },
        "user"
    )
}


// doors register then submit
function registerDoors() {
    // /!\ async
    callDoors(
        [email.value, pass1.value, initialsInput.value],
        function(doorsResp) {
            var doorsUid = doorsResp[0]
            var doorsMsg = doorsResp[1]
            var available = (doorsUid == null)
            displayDoorsStatusInLoginBox(available)
        },
        "register"
    )
}

function displayDoorsStatusInLoginBox (available) {

    if (available) {
        doorsMessage.innerHTML = "This ID + password is available !"
        doorsMessage.style.color = colorGreen
    }
    else {
        doorsMessage.innerHTML = "Sorry this ID + password is already taken"
        doorsMessage.style.color = colorRed
    }
    doorsMessage.style.display = 'block'
}

/* --------------- doors ajax cors function ----------------
* @args:
*     data:       3-uple with mail, pass, name
*
*
*     callback:   function that will be called after success AND after error
*                 with the return couple
*
*     apiAction:  'register' or 'user' => route to doors api
*     [optional]   default action is login via doors/api/user route
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
function callDoors(data, callback, apiAction) {

    // console.warn("=====> CORS  <=====")
    // console.log("data",data)
    console.log("apiAction",apiAction)

    var doorsUid = null
    var doorsMsg = null

    // all mandatory params for doors
    var mailStr = data[0]
    var passStr = data[1]
    var nameStr = data[2]

    // test params and set defaults
    if (typeof apiAction == 'undefined' || apiAction != 'register') {
        // currently forces login action unless we got 'register'
        apiAction = 'user'
    }

    if (typeof callback != 'function') {
        callback = function(retval) { return retval }
    }

    var ok = (typeof mailStr != 'undefined'
            && typeof mailStr != 'undefined'
            && typeof nameStr != 'undefined'
            && mailStr && passStr)    // assumes mail and pass will nvr be == 0

    if (!ok) {
        doorsMsg = "Invalid parameters in input data (arg #2)"
    }
    else {
        $.ajax({
            contentType: "application/json",
            dataType: 'json',
            url: "http://localhost:8989/api/" + apiAction,
            data: JSON.stringify({
                "login":    mailStr,
                "password": passStr,
                "name":     nameStr
            }),
            type: 'POST',
            success: function(data) {
                    if (typeof data != 'undefined'
                            && typeof data.userInfo != undefined
                            && typeof data.userInfo.id != undefined
                            && typeof data.userInfo.id.id != undefined
                            && typeof data.status == 'string') {
                        // main success case
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

function makeRandomString(nChars) {
  var rando = ""
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for( var i=0; i < nChars; i++ )
      rando += possible.charAt(Math.floor(Math.random() * possible.length));
  return rando
}

function registerDoorsAndSubmit(e){
    e.preventDefault()  // ? not necessary if button type is set and != "submit"

    submitButton.disabled = true
    mainMessage.style.display = 'block'
    mainMessage.innerHTML = "Registering with ISCPIF Doors..."

    // objectify the form
    wholeFormData = new FormData(theForm);


    // KNOCKING ON THE DOORS -------------------------------------
    // /!\ async
    callDoors(
        [
            // these values from the form have been checked by beTestedAsYouGo
            wholeFormData.get("email"),
            wholeFormData.get("password"),
            wholeFormData.get("initials")
        ],
        // VALIDATING + send to DB -------------------
        function(doorsResp) {
            validateSubmit(wholeFormData, doorsResp)
        },
        "register"
    )

}

// doValidate() : actions to do after doors registration and before send
//
//  => validate the columns
//      valid => trigger the real submit action
//      else  => message the user & unblock the button
// validate more precisely at the end
function validateSubmit(wholeFormData, doorsResp) {

    var valid = true

    // TODO pass mainMessage ref as arg
    mainMessage.innerHTML = "Validating the form..."

    // ersatz for tests
    // doorsUid = makeRandomString(36)

    var doorsUid = doorsResp[0]
    var doorsMsg = doorsResp[1]

    if (doorsUid == null) {
        // TODO harmonize this case with the valid=False case
        mainMessage.innerHTML = "Problem with doors registration... TODO debug"
        mainMessage.style.color = colorRed
        submitButton.disabled = false
    }
    else {
        // fill in the answer we got
        wholeFormData.set("doors_uid", doorsUid)
        uidInput.value = doorsUid
        // todo feels redundant (but if we submit via ajax, cgi-bin response won't be loaded)

        // here entire validation
        var missingFields = []
        var toolongFields = []
        for (var i in COLS) {
          // console.warn("checking COLS["+i+"]", COLS[i])
          var fieldName = COLS[i][0]
          var mandatory = COLS[i][1]
          var nChars    = COLS[i][2]
          var isExactN = (COLS[i][3] == 'exact')


          // skip picture already done
          if (fieldName == 'pic_file') continue ;

          var actualValue = wholeFormData.get(fieldName)

          // console.log("actualValue", actualValue)

          // test mandatory -----------------
          if (mandatory && actualValue == null && actualValue != "") {
              // todo human-readable fieldName here
              missingFields.push(fieldName)
              valid = false
              console.log("missingField", fieldName)
          }

          // test length --------------------
          else if (actualValue != null) {

              if (isExactN) {
                  // should never happen => trigger error
                  if (actualValue.length != nChars) {
                      console.error("invalid value for field " + fieldName
                                    + "("+actualValue+")"
                                    + "should have exactly "+nChars+" chars")
                      valid = false

                      console.log("wrong value")
                  }
              }
              else {
                  if (actualValue.length > nChars) {
                      toolongFields.push([fieldName, nChars])
                      valid = false

                      console.log("tooShort")
                  }
              }
          }
          // --------------------------------
        } // end for val in COLS


        // RESULTS
        if (valid) {
          // add the captchaCheck inside the form (jquery interference)
          captchaCheck.value = $(captcha).realperson('getHash')

          mainMessage.innerHTML = "Form is valid... Submitting..."
          mainMessage.style.display = 'block'
          // console.log("uidInput.value", uidInput.value)
          theForm.submit()

          // debug
          console.log("submitted")
          return true
        }
        else {

          console.warn("form is not valid")
          // TODO better user message
          // TODO highlight invalid fields
          submitButton.disabled = false

          var errorMessage = ""

          if (missingFields.length) {
             errorMessage += "<br/>Please fill the missing fields: " + JSON.stringify(missingFields)
          }
          // TODO should be handled question by question
          if (toolongFields.length) {
             errorMessage += "<br/>Please shorten the following fields: " + JSON.stringify(toolongFields)
          }

          // display (TODO setTimeout and fade)
          mainMessage.innerHTML = errorMessage
          return false
        }
    }
    console.warn("=====> end of doValidate <=====")
}



var picMsg = document.getElementById('picture_message')
function testPictureBlob(fileInput) {
  // TEMPORARY initial size already 200 kB, user has to do it himself
  var max_size = 204800

  // TODO  max source image size before resizing
  //       see libs or stackoverflow.com/a/24015367
  // 4 MB
  // var max_size = 4194304

  // Objectify -----------------------
  // we build entire map for form
  myFormData = new FormData(theForm);
  // TODO better  (either use it to send it or only build it from file)

  // retrieve the blob
  var theFile = myFormData.get(fileInput.id)

  // debug
  console.log(theFile.name, "size", theFile.size, theFile.lastModifiedDate)

  if (theFile.size > max_size) {
    picMsg.innerHTML = "The picture is too big (200kB max)!"
    picMsg.style.color = colorRed
  }
  else {
    picMsg.innerHTML = "Picture ok"
    picMsg.style.color = colorGreen
  }
}

// basic inputs get normal on focus
function makeNormal(elt) {
    elt.style.fontWeight = "normal"
}

// basic inputs get bold on blur
function makeBold(elt){
  if (elt.value != "")   elt.style.fontWeight = "bold"
}


// show middlename button binding
var mnBtn = document.getElementById('btn-midname')
mnBtn.onclick= function() {
  var mnDiv = document.getElementById('group-midname')
  if (mnDiv.style.display == 'none') {
    mnDiv.style.display = 'table'
  }
  else {
    mnDiv.style.display = 'none'
  }
}

// first, middle & last name ~~~> initials
var fName = document.getElementById('first_name')
var mName = document.getElementById('middle_name')
var lName = document.getElementById('last_name')
var initialsInput = document.getElementById('initials')

var nameInputs = [fName, mName, lName]
nameInputs.forEach ( function(nameInput) {
  nameInput.onchange = function () {
    var apparentInitials = ""
      nameInputs.forEach ( function(nameInput) {
        var txt = nameInput.value
        if (txt.length) {
          if(/[A-Z]/.test(txt)) {
            var capsArr = txt.match(/[A-Z]/g)
            for (var i in capsArr) {
              apparentInitials += capsArr[i] + '.'
            }
          }
          else {
            apparentInitials += txt.charAt(0) + '.'
          }
        }
      }) ;
    // update the displayed value
    initialsInput.value = apparentInitials
  }
})


// very basic email validation TODO: better extension and allowed chars set :)
// (used in tests "as we go")
function basicEmailValidate () {
  emailStatus = /^[-A-z0-9_=.+]+@[-A-z0-9_=.+]+\.[-A-z0-9_=.+]{1,4}$/.test(email.value)
}

// pass 1 and pass 2 ~~~> do they match?
// TODO use a most common passwords lists
var pass1 = document.getElementById('password')
var pass2 = document.getElementById('password2')
var passMsg = document.getElementById('password_message')
var passwords = [pass1, pass2]


// £DEBUG autofill ----------->8------
// email.value= makeRandomString(10)+"@om.fr"
// pass1.value="123456+789"
// pass2.value="123456+789"
// initialsInput.value="JPP"
// --------------------------->8------


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



// autocomplete countries
$(function() {
  var $countryInput = $('#country')

  var countriesList = ["Afghanistan", "Albania", "Algeria", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
                       "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina",
                       "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burma (Myanmar)", "Burundi", "Cambodia", "Cameroon", "Canada",
                       "Cape Verde", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo, Rep. of", "Congo, Dem. Rep. of",
                       "Costa Rica", "Côte d'Ivoire", "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic",
                       "East Timor", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Ethiopia", "Fiji", "Finland", "France",
                       "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti",
                       "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan",
                       "Kazakhstan", "Kenya", "Kiribati", "Korea, North", "Korea, South", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho",
                       "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Macedonia5", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali",
                       "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro",
                       "Morocco", "Mozambique", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "Norway", "Oman",
                       "Pakistan", "Palau", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia",
                       "Rwanda", "St. Kitts and Nevis", "St. Lucia", "St. Vincent and the Grenadines", "Samoa", "São Tomé and Príncipe", "Saudi Arabia",
                       "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa",
                       "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Swaziland", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan",
                       "Tanzania", "Thailand", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine",
                       "United Arab Emirates", "United Kingdom", "USA", "Uruguay", "Uzbekistan", "Vanuatu", "Venezuela", "Vietnam",
                       "Yemen", "Zambia", "Zimbabwe"]

  $countryInput.autocomplete({
      source: countriesList,
      autoFocus: true,
      select:   function( event, ui ) {
        // console.log(ui)
        $countryInput[0].style.fontWeight = "bold"
      }
  });
});


// autocomplete position
$(function() {
  var $jobtitlesInput = $('#jobtitle')

  var jobtitlesList = ["Student", "Engineer", "capetown",
                       "PhD Student", "Dr", "Post-Doc",
                       "Lecturer", "Associate Professor", "Professor",
                       "Research Fellow", "Research Director", "Chairman"]

  $jobtitlesInput.autocomplete({
      source: jobtitlesList,
      autoFocus: true,
      select:   function( event, ui ) {
        // console.log(ui)
        $jobtitlesInput[0].style.fontWeight = "bold"
      }
  });
});

// autocomplete institution
$(function() {
  var $institutionInput = $('#institution')

  var orgList = [
    "Centre National de la Recherche Scientifique (CNRS)",
    "Institut National de la Recherche Agronomique (INRA)",
    "Université Paris 6 – Pierre et Marie Curie (UPMC)",
    "University of Warwick",
    "Instituto Superior das Ciências do Trabalho e da Empresa - Instituto Universitário de Lisboa",
    "Ecole Normale Supérieure (ENS) - Ulm",
    "Ecole Polytechnique (X), U. Paris Saclay",
    "Institut National de Recherche en Informatique et Automatique (INRIA)",
    "Université Paris 7 – Diderot",
    "Universidad Nacional Autonoma de Mexico (UNAM)",
    "Commissariat à l'Energie Atomique (CEA)",
    "Institut de Recherche en Sciences et Technologies pour l'Environnement et l'Agriculture (IRSTEA)",
    "Université Paris 1 – Panthéon-Sorbonne",
    "University College London (UCL)",
    "State University of São Paulo (UNESP)",
    "Open University",
    "Universitat de Barcelona",
    "Institut des Systèmes Complexes de Paris Ile-de-France (ISCPIF)",
    "Institut des Systèmes Complexes Rhône Alpes (IXXI)",
    "Complex System Society",
    "Institut National de la Santé et de la Recherche Médicale (INSERM), UMRS 707",
    "Universidad de Zaragoza",
    "Université du Havre",
    "Centre for Nonlinear Studies, Institute of Cybernetics at Tallinn University of Technology",
    "Eotvos Lorand University",
    "Indiana University",
    "Institut de Recherche pour le Développement",
    "Max Planck Institute for Mathematics in the Sciences",
    "Northeastern University",
    "Santa Fe Institute",
    "Universidad Nacional de Colombia",
    "Universitat Politècnica de Catalunya (UPC)",
    "Université Grenoble-Alpes",
    "Université Paris 5 – Descartes",
    "Sapienza - Università di Roma",
    "Centre de Coopération Internationale en Recherche Agronomique pour le Développement",
    "Commonwealth Scientific and Industrial Research Organization",
    "Complex Open Systems Research Network (COSNet)",
    "Cranfield Universtiy",
    "Facultés Universitaires Notre-Dame de la Paix",
    "Umeå University",
    "Universidade de Lisboa",
    "Universitat de les Illes Balears",
    "Université de Nice – Sophia Antipolis",
    "Université de Strasbourg",
    "Université Libre de Bruxelles",
    "Université Lyon 2 – Lumière",
    "Université Paris 11 – Sud",
    "Université Toulouse 1 – Capitole",
    "University of Limerick",
    "University of Manchester",
    "University of Oxford",
    "University of Cambridge",
    "University of Stanford",
    "University of California (UCal), Berkeley",
    "ETH Zürich",
    "Bandung Fe Institute",
    "Bristol Centre for Complexity Sciences",
    "Center for Genomic Regulation",
    "Chalmers University of Technology",
    "Consiglio Nazionale delle Ricerche",
    "Ecole Polytechnique Fédérale de Lausanne",
    "Institut Curie",
    "Institute for Scientific Interchange Foundation",
    "Instituto de Sistemas Complejos de Valparaiso",
    "King's College London",
    "London School of Economics and Political Sciences",
    "Nanyang Technological University",
    "Queen Mary, University of London",
    "Ruhr Universität Bochum",
    "Technion - Israel Institute of Technology",
    "Universidad del Rosario",
    "Universidad Politécnica de Madrid",
    "Universidade Federal do Rio Grande do Sul",
    "Universitat Rovira i Virgili",
    "Université catholique de Louvain",
    "Université de Cergy-Pontoise",
    "Université de Lille",
    "Université de Rouen",
    "Université de Versailles Saint Quentin",
    "Université Européenne de Bretagne",
    "Université Paris 14 – Est Créteil",
    "University of Amsterdam",
    "University of Surrey",
    "Vrije Universiteit Brussel",
    "Wroclaw University of Technology",
    "UPM Autonomous Systems Laboratory (ASLab)",
    "Agency for Science, Technology and Research (A*STAR), Singapore",
    "Anglia Ruskin University",
    "ARC Centre for Complex Systems (ACCS)",
    "Arizona State University",
    "Brunel University",
    "Center for the Study of Complex Systems",
    "Central European University",
    "Centre for Complex Systems",
    "Cracow University of Economics, Cracow, Poland",
    "Delft University of Technology",
    "Eastern Connecticut State University",
    "Ecole des Hautes Etudes en Sciences Sociales (EHESS)",
    "Ecole des Ponts ParisTech, U. Paris Est",
    "Ecole Superieure de Physique et Chimie Industrielle (ESPCI)",
    "Emergence Paris",
    "Ghent University",
    "Harvard University",
    "Imperial College London",
    "Institut des Systèmes Complexes en Normandie",
    "Institut National Sport Expertise Performance (INSEP)",
    "Institute for Complex Systems and Mathematical Biology",
    "Institute for Complex Systems Simulation",
    "Institute of Energy and Sustainable Development",
    "Massachusetts Institute of Technology (MIT)",
    "National Center for Scientific Research 'Demokritos'",
    "National Centre for Nuclear Research (POLATOM)",
    "Non-linearity and Complexity Research Group, Aston",
    "Northwestern University",
    "Sabanci University",
    "Swedish Morphological Society",
    "Technical University of Denmark",
    "Tel Aviv University",
    "Telecom ParisTech",
    "The Australian National University",
    "The University of Melbourne",
    "Universidad Carlos III de Madrid",
    "Universidade Estadual de Campinas",
    "Universidade Federal do Rio de Janeiro",
    "Universidade Nova de Lisboa",
    "Università degli Studi di Bologna",
    "Università Roma Tre",
    "Université de Bourgogne",
    "Université de Montréal",
    "Université de Valenciennes et du Hainaut-Cambrésis",
    "Université Paris 4 – Sorbonne",
    "Université Toulouse 3 – Paul Sabatier",
    "University of Calgary",
    "University of Essex",
    "University of Exeter",
    "University of Groningen",
    "University of Hamburg",
    "University of Lausanne",
    "University of Macedonia, Thessaloniki, Greece",
    "University of Maryland",
    "University of Warsaw",
    "Uppsala Universitet",
    "Warsaw University of Technology",
    "University of California (UCal), Los Angeles",
    "Institute of Computer Science of Czech Republic (AV ČR)",
    "Institute for Condensed Matter Physics of the National Academy of Sciences of Ukraine (ICMP)",]

  $institutionInput.autocomplete({
      source: orgList,
      autoFocus: true,
      select:   function( event, ui ) {
          // console.log(ui)

          // not tab because used to move on to next field
          if(event.keyCode == 9) return false;

          $institutionInput[0].style.fontWeight = "bold"
      }
  });
});


// pseudo captcha
$('#my-captcha').realperson({length: realCaptchaLength});
$('#my-captcha').val('')


// autocomplete keywords
$(function() {
  var $kwInput = $('#keywords')

  // TODO transform into simple array => faster
  var kwFreqs = {
    "complex networks": 154,
    "complex systems": 134,
    "networks": 84,
    "modelling": 63,
    "simulation": 63,
    "social networks": 53,
    "emergence": 52,
    "complexity": 50,
    "statistical physics": 42,
    "machine learning": 40,
    "dynamical systems": 36,
    "multi-agent systems": 36,
    "evolution": 35,
    "data mining and analysis": 34,
    "self-organization": 34,
    "ABM (agent-based modeling and simulation)": 32,
    "systems biology": 31,
    "synchronization": 29,
    "artificial life": 28,
    "game theory": 28,
    "nonlinear dynamics": 28,
    "ecology": 27,
    "econophysics": 27,
    "information theory": 26,
    "complex adaptive systems": 25,
    "sustainability": 25,
    "neural networks": 24,
    "chaos": 23,
    "cellular automata": 22,
    "cognition": 22,
    "innovation": 22,
    "morphogenesis": 21,
    "neuroscience": 21,
    "statistical mechanics": 21,
    "artificial intelligence": 20,
    "epidemiology": 20,
    "collective intelligence and behavior": 19,
    "epistemology": 18,
    "mathematical modelling": 18,
    "resilience": 18,
    "social network analysis": 18,
    "transportation": 18,
    "network": 17,
    "network dynamics": 17,
    "social simulation": 17,
    "environment": 16,
    "evolutionary computation": 16,
    "geography": 16,
    "opinion dynamics": 16,
    "sociophysics": 16,
    "bioinformatics": 15,
    "biology": 15,
    "complexity science": 15,
    "computational biology": 15,
    "learning": 15,
    "philosophy": 15,
    "sociology": 15,
    "visualization": 15,
    "GIS (geographic information systems)": 14,
    "graph theory": 14,
    "optimization": 14,
    "social systems": 14,
    "swarm intelligence": 14,
    "computational neuroscience": 13,
    "economics": 13,
    "fractals": 13,
    "network analysis": 13,
    "phase transitions": 13,
    "population dynamics": 13,
    "spatial networks": 13,
    "urban planning and design": 13,
    "big data": 12,
    "cognitive science": 12,
    "control": 12,
    "design": 12,
    "mathematics": 12,
    "social dynamics": 12,
    "social sciences": 12,
    "spatial analysis": 12,
    "statistics": 12,
    "archaeology": 11,
    "biological networks": 11,
    "biophysics": 11,
    "brain": 11,
    "dynamics": 11,
    "financial markets": 11,
    "management": 11,
    "network theory": 11,
    "security": 11,
    "data science": 10,
    "decision making": 10,
    "developmental biology": 10,
    "network science": 10,
    "pattern formation": 10,
    "robotics": 10,
    "stochastic processes": 10,
    "anthropology": 9,
    "community detection": 9,
    "cooperation": 9,
    "development": 9,
    "education": 9,
    "entropy": 9,
    "evolutionary algorithms": 9,
    "internet": 9,
    "mathematical biology": 9,
    "psychology": 9,
    "risk": 9,
    "social network": 9,
    "urban systems": 9,
    "agents": 8,
    "architecture": 8,
    "digital humanities": 8,
    "distributed systems": 8,
    "epidemics": 8,
    "evolutionary game theory": 8,
    "finance": 8,
    "robustness": 8,
    "sustainable development": 8,
    "synthetic biology": 8,
    "systemic risk": 8,
    "text mining": 8,
    "viability theory": 8,
    "adaptation": 7,
    "cities": 7,
    "computational social science": 7,
    "epidemic spreading": 7,
    "image processing": 7,
    "leadership": 7,
    "natural language processing": 7,
    "origin of life": 7,
    "pattern recognition": 7,
    "policy": 7,
    "scientometrics": 7,
    "social": 7,
    "social-ecological systems": 7,
    "aging": 6,
    "analysis": 6,
    "artificial neural networks": 6,
    "autopoiesis": 6,
    "complex systems dynamics": 6,
    "cultural evolution": 6,
    "ecosystems": 6,
    "gene regulatory networks": 6,
    "information": 6,
    "java": 6,
    "linguistics": 6,
    "mobility": 6,
    "multiplex": 6,
    "non linear dynamics": 6,
    "prediction": 6,
    "public policy": 6,
    "self-assembly": 6,
    "semantic networks": 6,
    "signal processing": 6,
    "social science": 6,
    "strategy": 6,
    "system dynamics": 6,
    "systems": 6,
    "systems engineering": 6,
    "temporal networks": 6,
    "time series analysis": 6,
    "adaptive systems": 5,
    "applied mathematics": 5,
    "behavior": 5,
    "bibliometrics": 5,
    "cancer": 5,
    "causality": 5,
    "communication": 5,
    "community structure": 5,
    "complexity theory": 5,
    "computational intelligence": 5,
    "consciousness": 5,
    "critical phenomena": 5,
    "culture": 5,
    "cybernetics": 5,
    "decision support": 5,
    "diffusion": 5,
    "economic complexity": 5,
    "EEG": 5,
    "energy": 5,
    "entrepreneurship": 5,
    "evolutionary economics": 5,
    "fracture": 5,
    "games": 5,
    "genetic algorithms": 5,
    "genetics": 5,
    "governance": 5,
    "health": 5,
    "human mobility": 5,
    "immunology": 5,
    "information retrieval": 5,
    "language evolution": 5,
    "MAS": 5,
    "mathematical physics": 5,
    "methodology": 5,
    "multi-scale": 5,
    "multiscale": 5,
    "netlogo": 5,
    "ontology": 5,
    "organization": 5,
    "philosophy of science": 5,
    "physics": 5,
    "plasticity": 5,
    "public health": 5,
    "risk management": 5,
    "scaling": 5,
    "science of science": 5,
    "SNA": 5,
    "social cognition": 5,
    "social complexity": 5,
    "social media": 5,
    "socio-technical systems": 5,
    "spin glasses": 5,
    "systems thinking": 5,
    "technology": 5,
    "trust": 5,
    "validation": 5
    // ,
    // "adaptive networks": 4,
    // "agent-based computational economics": 4,
    // "agriculture": 4,
    // "bacteria": 4,
    // "chaos theory": 4,
    // "climate and climate change": 4,
    // "cloud computing": 4,
    // "co-evolution": 4,
    // "collective motion": 4,
    // "combinatorics": 4,
    // "complex systems engineering": 4,
    // "complex systems modelling": 4,
    // "complexity management": 4,
    // "computational complexity": 4,
    // "computational linguistics": 4,
    // "computational science": 4,
    // "computer science": 4,
    // "creativity": 4,
    // "criticality": 4,
    // "data": 4,
    // "decision": 4,
    // "diffusion of innovation": 4,
    // "distributed computing": 4,
    // "distributed system": 4,
    // "DNA": 4,
    // "dynamic": 4,
    // "dynamical networks": 4,
    // "dynamical system": 4,
    // "e-learning": 4,
    // "engineering": 4,
    // "evolutionary biology": 4,
    // "evolutionary robotics": 4,
    // "extreme events": 4,
    // "financial networks": 4,
    // "formal concept analysis": 4,
    // "grid computing": 4,
    // "high performance computing": 4,
    // "HIV": 4,
    // "information diffusion": 4,
    // "information systems": 4,
    // "international relations": 4,
    // "language": 4,
    // "language dynamics": 4,
    // "markov chains": 4,
    // "metabolic networks": 4,
    // "morphodynamics": 4,
    // "negotiation": 4,
    // "nonequilibrium statistical physics": 4,
    // "online social networks": 4,
    // "open-ended evolution": 4,
    // "percolation": 4,
    // "perturbation": 4,
    // "planning": 4,
    // "population genetics": 4,
    // "privacy": 4,
    // "probability": 4,
    // "quantitative finance": 4,
    // "semantic web": 4,
    // "social computing": 4,
    // "society": 4,
    // "software engineering": 4,
    // "space-time": 4,
    // "stability": 4,
    // "structure": 4,
    // "swarm robotics": 4,
    // "symbolic dynamics": 4,
    // "system biology": 4,
    // "topology": 4,
    // "twitter": 4,
    // "uncertainty": 4,
    // "vulnerability": 4,
    // "wireless sensor networks": 4
  }


  // sorted couples [[networks, 84], [cooperation, 8], [topology, 4]...]
  var kwValuedArray = [];
  for (var kwKey in kwFreqs) {
    kwValuedArray.push([kwKey, kwFreqs[kwKey]])
  }

  // rn sort on vals
  kwValuedArray.sort(
    function(a, b) {
        return  b[1] - a[1]
    }
  )

  // console.log(kwValuedArray)

  // sorted auto completion array by previous freq
  var kwArray = []
  for (var i in kwValuedArray) {
    kwArray.push(kwValuedArray[i][0])
  }


  $kwInput.autocomplete({
      // source: kwArray,
      source: function( request, response ) {
          // "crf, adn, swarm robotics, anticonstitu" <= extract the last term being typed
          var terms = request.term.split(/\s*,\s*/)
          var currentQuery = terms[terms.length-1]
          response(
            // recurse on same autocomplete but only on last term
            $.ui.autocomplete.filter(kwArray, currentQuery )
          );
      },
      autoFocus: true,

    //   search: function () {
    //     var terms = this.value.split(/\s*,\s*/)
    //     var term = terms[terms.length-1];
    //     // custom minLength
    //     if (term.length < 1) {
    //         return false;
    //     }
    // },
      focus: function () {
          // prevent value inserted on focus
          return false;
      },
      select: function (event, ui) {
          var terms = this.value.split(/\s*,\s*/) ;

          // console.log("currently autocompleting segment:",terms)

          // remove the current input
          terms.pop();
          // add the selected item
          terms.push(ui.item.value);
          // add placeholder to get the comma-and-space at the end
          terms.push("");
          this.value = terms.join(", ");

          // $kwInput[0].style.fontWeight = "bold"
          return false;
      }
  });
});

console.log("load OK")
