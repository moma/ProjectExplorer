/**
 * @fileoverview
 * Autocompletes
 *  -> local data for countries, jobtitles
 *  -> use ajax /services/api/aggs for the scholars, kws and labs (TODO)
 *
 * @todo
 *    - package.json
 *
 * @version 1
 * @copyright ISCPIF-CNRS 2016
 * @author romain.loth@iscpif.fr
 *
 * @requires comex_user_shared
 */

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
                        "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Macedonia", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali",
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
   var $orgInput = $('#team_lab')

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


 // autocomplete via remote aggs api
 //   @fieldName : 'keywords' or 'hashtags'
 //       => must match the html form input id (eg #keywords)
 //       => supposed to also match the REST param
 //            (eg services/api/aggs?field=keywords)
function remoteAutocompleteInit(fieldName) {
   var nMax = 100
   var hapaxThresh = 1

   var $theInput = $('#'+fieldName)

   var theValuedArray = []

   $.ajax({
       type: 'GET',
       dataType: 'json',
       url: "/services/api/aggs?field="+fieldName+"&hapax="+hapaxThresh,
       success: function(data) {
           // ex data is array like:
           // [{"occs": 1116, "x": null},
           //  {"occs": 100, "x": "complex systems"},
           //  {"occs": 90, "x": "complex networks"},
           //  {"occs": 66, "x": "agent-based models"}]

           for (var i in data) {
               if (data[i].x != null) {
                   var item = data[i].x
                   var occs = data[i].occs
                   theValuedArray.push([item, occs])
               }
           }

           // sorted couples [[networks, 84], [cooperation, 8], [topology, 4]...]
           // rn sort on vals
           theValuedArray.sort(
             function(a, b) {
                 return  b[1] - a[1]
             }
           )

           // console.log(kwValuedArray)

           // sorted auto completion array by previous freq, with max
           var theArray = []
           for (var i in theValuedArray) {
             theArray.push(theValuedArray[i][0])
             if (i > nMax) {
                 break;
             }
           }

           $theInput.autocomplete({
               source: theArray,
               autoFocus: true,
               focus: function () {
                   // prevent value inserted on focus
                   return false;
               },
               select: function (event, ui) {
               }
           });

       },
       error: function(result) {
           console.warn('jquery ajax error with result', result)
       }
   });
}


 $(function() {
     remoteAutocompleteInit('keywords')
     remoteAutocompleteInit('hashtags')
 });

 console.log("autocompletes load OK")
