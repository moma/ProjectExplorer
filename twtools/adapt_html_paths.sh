#! /bin/bash

# Usage exemple:
# bash twtools/adapt_html_paths.sh 'static/projectExplorer/'


function helpmessage {
    echo '---'
    echo 'Suggested usage:'
    echo ' > bash twtools/adapt_html_paths.sh "your/relative/url/to/ProjectExplorer/"'
    echo '---'
    echo 'Explanation:'
    echo 'This script helps you deploy ProjectExplorer by adapting all relative paths in the explorerjs.html file for your future production routes.'
    echo '---'
}


if [ "$1" == "" -o "$1" == "-h" -o "$1" == "-help" -o "$1" == "--help" ]
  then
    helpmessage
    exit 1
  else
    # exemple: newpathprefix='static/projectExplorer'
    newpathprefix=$1
fi

if [ -e explorerjs.html ]
  then
    perl -pse 's/ ((?:href|src)=[\x22\x27]?)(twlibs3?|twmain|settings_explorerjs)/ $1$pathprefix$2/g' -- -pathprefix=$newpathprefix < explorerjs.html > explorerjs.prod.html
    echo 'created: explorerjs.prod.html'
    exit 0
  else
    echo 'Please run this script from the ProjectExplorer root'
    echo '(because script is looking for ./explorerjs.html)'
    helpmessage
fi
