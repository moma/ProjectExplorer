/**
 * @fileoverview
 * rootindex link fixing
 * @todo
 *    - package.json
 *
 * @version 1
 * @copyright ISCPIF-CNRS 2016
 * @author romain.loth@iscpif.fr
 *
 */


// just workaround for the profile/register iframe's loading mechanism to https

// context:
//           curiously, a relative path for iframe src:'/services/user/register'
//           doesn't work like other relative paths (reproducing current scheme)
//           so we put an absolute path and change the domain name at rendering.

var relsrc = document.getElementById('inlink').src
document.getElementById('inlink').src = 'https://'+location.host+'/'+relsrc

console.log("rootindex controllers load OK")
