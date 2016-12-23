/**
 * @fileoverview
 * Validates the comex (communityexplorer.org) registration form
 *  + adds a timestamp in input#last_modified_date
 *  + adds autocompletes
 *  + prepares DB save into COLS
 *
 * @todo
 *    - harmonize var names (eg 'email' vs 'initialsInput' are both input elts)
 *    - package.json
 *
 * @version 1
 * @copyright ISCPIF-CNRS 2016
 * @author romain.loth@iscpif.fr
 *
 * @requires comex_user_shared
 * @requires comex_user_shared_auth
 */

// common vars to user forms
// NB other vars defined in main scope but just before their respective funs
var theFormId = "comex_login_form"

var theForm = document.getElementById(theFormId)

var wholeFormData
var theForm = document.getElementById(theFormId)
// cf corresponding css classes
var colorWhite = '#fff'
var colorRed = '#910'
var colorGreen = '#161'
var colorGrey = '#554'

// vars that will be used during the interaction

// the target columns in DB: tuple (name, mandatoryBool, maxChars (or nChars))
var COLS = [ ["doors_uid",              true,        36,   'exact'],
             ["last_modified_date",     true,        24,   'exact'],
             ["email",                  true,       255],
             ["country",                true,        60],
             ["first_name",             true,        30],
             ["middle_name",           false,        30],
             ["last_name",              true,        50],
             ["initials",               true,         7],
             ["position",              false,        30],
             ["hon_title",             false,        30],
             ["interests_text",        false,      1200],
             ["community_hashtags",    false,       350],
             ["gender",                false,         1,   'exact'],
             ["job_looking_date",      false,        24,   'exact'],
             ["home_url",              false,       120],
             ["pic_url",               false,       120],
             ["pic_file",              false,      null],
             // ==> *scholars* table

             ["keywords",               true,       350],
             // ==> *keywords* table

             ["org",                    true,       120],
             ["org_type",               true,        50],
             ["team_lab",              false,       120],
             ["org_city",              false,        50]]
             // ==> *affiliations* table

var regTimestamp = document.getElementById('last_modified_date')

// dates up to 2049/12/31
var validDate = new RegExp( /^20[0-4][0-9]\/(?:0?[1-9]|1[0-2])\/(?:0?[1-9]|[1-2][0-9]|3[0-1])$/)
var subPage1Style = document.getElementById('subpage_1').style
var subPage2Style = document.getElementById('subpage_2').style
var teamCityDivStyle = document.getElementById('team_city_div').style
var otherInstDivStyle = document.getElementById('other_org_div').style
var jobLookingDivStyle = document.getElementById('job_looking_div').style

var submitButton = document.getElementById('formsubmit')
var mainMessage = document.getElementById('main_validation_message')

var jobLookingDateStatus = false
submitButton.disabled = true
theForm.onkeyup = testAsYouGo
theForm.onchange = testAsYouGo
theForm.onblur = testAsYouGo

var lastEmailValueCheckedDisplayed = null


// done when anything in the form changes
function testAsYouGo() {
  // console.log("testAsYouGo Go")

  if (email.value != lastEmailValueCheckedDisplayed) {
      // will update the emailStatus boolean
      basicEmailValidate(email.value)
  }

  captchaStatus = (captcha.value.length == realCaptchaLength)

  checkPassStatus()
  checkJobDateStatus()

  if (passStatus && emailStatus && captchaStatus && jobLookingDateStatus) {
      submitButton.disabled = false
  }
  else {
      submitButton.disabled = true
  }
  var now = new Date()
  regTimestamp.value = now.toISOString()
}


// NB using new route in doors api/userExists
// case true => Ok("""{"status":"login exists"}""")
// case false => Ok("""{"status":"login available"}""")
function testDoorsUserExists(emailValue) {
    // /!\ async
    callDoors(
        "userExists",
        [emailValue],
        function(doorsResp) {
            var doorsUid = doorsResp[0]
            var doorsMsg = doorsResp[1]

            // the global status can be true iff login is available and format ok
            emailStatus = (doorsMsg == "login available")

            displayDoorsStatusInRegisterBox(emailStatus, emailValue)
        }
    )
}


function registerDoorsAndSubmit(){
    mainMessage.innerHTML = "Registering with ISCPIF Doors..."

    // all values from the form have now been validated
    var emailValue = email.value
    var passValue = pass1.value
    var wholenameValue = ""

    if (mName.value != "") {
        wholenameValue = lName.value + ', ' + fName.value + ' ' + mName.value
    }
    else {
        wholenameValue = lName.value + ', ' + fName.value
    }


    // KNOCKING ON THE DOORS -------------------------------------
    // /!\ async
    callDoors(
        "register",
        [emailValue, passValue, wholenameValue],

        // callback: send to DB -------------------
        function(doorsResp) {
            addUidThenSubmit(doorsResp)
        }
    )
}

function addUidThenSubmit(doorsResp) {
    var doorsUid = doorsResp[0]
    var doorsMsg = doorsResp[1]

    if (doorsUid == null) {
        mainMessage.innerHTML = "Problem with doors registration... TODO debug"
        mainMessage.style.color = colorRed
        submitButton.disabled = false
    }
    else {
        // fill in the answer we got
        uidInput.value = doorsUid

        console.info("form was validated and registered@doors: submitting now")

        //==== SEND! ====
         theForm.submit()
        //===============
    }
}

var doorsIcon = document.getElementById('doors_ret_icon')
function displayDoorsStatusInRegisterBox (available, emailValue) {

    if (available) {
        // icon
        doorsIconMessage.title = "Ok ID available on Doors"
        doorsIcon.style.color = colorGreen
        doorsIcon.classList.remove('glyphicon-remove')
        doorsIcon.classList.remove('glyphicon-question-sign')
        doorsIcon.classList.add('glyphicon-ok')

        // message in legend
        doorsMessage.innerHTML = "Ok, this email ID is available on Doors!"
        doorsMessage.style.color = colorGreen

    }
    else {
        // icon
        doorsIconMessage.title = "Sorry ID already taken on Doors!"
        doorsIcon.style.color = colorRed
        doorsIcon.classList.remove('glyphicon-ok')
        doorsIcon.classList.remove('glyphicon-question-sign')
        doorsIcon.classList.add('glyphicon-remove')

        // message in legend
        doorsMessage.innerHTML = "Sorry this email ID is already taken on Doors!"
        doorsMessage.style.color = colorRed

    }

    // to debounce further actions in testAsYouGo
    // return to neutral is also in testAsYouGo
    lastEmailValueCheckedDisplayed = emailValue
}

function makeRandomString(nChars) {
  var rando = ""
  var possible = "abcdefghijklmnopqrstuvwxyz0123456789";
  var len = possible.length
  for( var i=0; i < nChars; i++ )
      rando += possible.charAt(Math.floor(Math.random() * len));
  return rando
}

// validateAndMsg() : bool (validates fields before doors registration and send)
// -----------------------------------------------------------------------------
//      valid => return *true* which will trigger the doors registration
//                                            and the real submit action
//
//      else  => message the user, unblock the button and return *false*
// -----------------------------------------------------------------------------
function validateAndMsg() {

    // not necessary b/c button type is set and is != "submit"
    // submitEvent.preventDefault()

    submitButton.disabled = true
    mainMessage.style.display = 'block'

    var valid = true

    // TODO pass mainMessage ref as arg
    mainMessage.innerHTML = "Validating the form..."

    // also reformat the jobDate from "YYYY/MM/DD" to ISO

    if (jobDate.value.length) jobDate.value = (new Date(jobDate.value)).toISOString()

    // objectify the form
    wholeFormData = new FormData(theForm);

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

      // skip doors_uid done afterwards if form ok
      if (fieldName == 'doors_uid') continue ;

      var actualValue = wholeFormData.get(fieldName)

      // console.log("actualValue", actualValue)

      // test mandatory -----------------
      if (mandatory && (actualValue == null || actualValue == "")) {
          // todo human-readable fieldName here
          missingFields.push(fieldName)
          valid = false
          console.log("missingField", fieldName)
      }

      // test length --------------------
      else if (mandatory || (actualValue != null && actualValue != "")) {

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

      mainMessage.innerHTML = "Form is valid... Will register and submit..."
      mainMessage.style.display = 'block'

      return true
    }
    else {

      console.warn("form is not valid")
      // TODO highlight invalid fields
      submitButton.disabled = false

      var errorMessage = ''
      if (missingFields.length) {
         errorMessage += "Please fill the missing fields: " + ulListFromLabelsArray(missingFields, ["red"])
      }

      // length is handled by each input's maxlength

      // re change the jobDate from ISO to YYYY/MM/DD
      if (jobDate.value.length) jobDate.value = jobDate.value.slice(0,10).replace(/-/g,"/")

      // display (TODO setTimeout and fade)
      mainMessage.innerHTML = errorMessage
      return false
    }
}


function ulListFromLabelsArray(strArray, ulClassList) {
    ulClasses=["minilabels"].concat(ulClassList).join(" ")
    var resultHtml = '<ul class="'+ulClasses+'">'
    for (var i in strArray) {
        var label = strArray[i].replace(/_/, " ")
        resultHtml += '<li class="minilabel">'+label+'</li>'
    }
    resultHtml += '</ul>'
    return resultHtml
}


var fileInput = document.getElementById('pic_file')
var showPicImg = document.getElementById('show_pic')
var boxShowPicImg = document.getElementById('box_show_pic')
var picMsg = document.getElementById('picture_message')

var imgReader = new FileReader();

function checkShowPic() {
    // TEMPORARY initial size already 200 kB, user has to do it himself
    var max_size = 204800

    // TODO  max source image size before resizing
    //       see libs or stackoverflow.com/a/24015367
    // 4 MB


    // always reset style and width/height calculations
    boxShowPicImg.style.display = 'none'
    showPicImg.style.display  = ""
    showPicImg.style.width  = ""
    showPicImg.style.height = ""

    // var max_size = 4194304
    if (fileInput.files) {
        var theFile = fileInput.files[0]

        // debug
        console.log(theFile.name, "size", theFile.size, theFile.lastModifiedDate)

        if (theFile.size > max_size) {
          // msg pb
          picMsg.innerHTML = "The picture is too big (200kB max)!"
          picMsg.style.color = colorRed
        }
        else {
          // msg ok
          picMsg.innerHTML = "Picture ok"
          picMsg.style.color = colorGreen

          // to show the pic when readAsDataURL
          imgReader.onload = function () {
              showPicImg.src = imgReader.result;

              // prepare max size while preserving ratio
              var imgW = window.getComputedStyle(showPicImg).getPropertyValue("width")
              var imgH = window.getComputedStyle(showPicImg).getPropertyValue("height")
              console.log("img wid", imgW)
              console.log("img hei", imgH)

              if (imgW > imgH) {
                  showPicImg.style.width  = "100%"
                  showPicImg.style.height  = "auto"
              }
              else {
                  showPicImg.style.width  = "auto"
                  showPicImg.style.height = "100%"
              }

              // now reaadjust outer box and show
              boxShowPicImg.style.display = 'block'
              // possible re-adjust outerbox ?

            //   showPicImg.style.border = "2px dashed " + colorGrey

          }

          // create fake src url & trigger the onload
          imgReader.readAsDataURL(theFile);
        }
    }
    else {
        console.warn("skipping testPictureBlob called w/o picture in fileInput")
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
              apparentInitials += capsArr[i]
            }
          }
          else {
            apparentInitials += txt.charAt(0)
          }
        }
      }) ;
    // update the displayed value
    initialsInput.value = apparentInitials
  }
})



// jobLookingDateStatus ~~~> is job date a valid date?
var jobBool = document.getElementById('job_bool')
var jobDate = document.getElementById('job_looking_date')
var jobDateMsg = document.getElementById('job_date_message')

jobDate.onkeyup = checkJobDateStatus
jobDate.onchange = checkJobDateStatus

function checkJobDateStatus() {
  jobLookingDateStatus = (jobBool.value == "No" || validDate.test(jobDate.value))
  if (!jobLookingDateStatus) {
      jobDateMsg.style.color = colorRed
      jobDateMsg.innerHTML = 'Date is not yet in the valid format YYYY/MM/DD'
  }
  else {
      jobDateMsg.style.color = colorGreen
      jobDateMsg.innerHTML = 'Ok valid date!'
  }
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


// autocomplete hon_title
$(function() {
  var $hontitlesInput = $('#hon_title')

  var hontitlesList = ["Mr", "Ms", "Dr.", "Prof.", "Prof. Dr."]

  $hontitlesInput.autocomplete({
      source: hontitlesList,
      autoFocus: true,
      select:   function( event, ui ) {
        $hontitlesInput[0].style.fontWeight = "bold"
      }
  });
});


// autocomplete position
$(function() {
  var $jobtitlesInput = $('#position')

  var jobtitlesList = ["Graduate Student", "Post-Graduate Student", "Engineer",
                        "Lecturer", "Associate Professor", "Professor",
                       "PhD Student", "Research Fellow", "Research Director"]

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
  var $orgInput = $('#org')

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

  $orgInput.autocomplete({
      source: orgList,
      autoFocus: true,
      select:   function( event, ui ) {
          // console.log(ui)

          // not tab because used to move on to next field
          if(event.keyCode == 9) return false;

          $orgInput[0].style.fontWeight = "bold"
      }
  });
});


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

console.log("reg controllers load OK")

// £DEBUG autofill ----------->8------
// fName.value = "Jean"
// lName.value = "Tartampion"
// initialsInput.value="JPP"
// document.getElementById('country').value = "France"
// email.value= makeRandomString(7)+"@om.fr"
// pass1.value="123456+789"
// pass2.value="123456+789"
// document.getElementById('position').value = "atitle"
// document.getElementById('keywords').value = "Blabla"
// document.getElementById('org').value = "CNRS"
// basicEmailValidate(email.value)
// --------------------------->8------
