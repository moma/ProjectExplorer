#!/bin/bash

function FA2gephi {
	for f in gexfs/*.gexf
	do
		if [[ "$f" != *_.gexf* ]]
		then
			java -jar tinaviz-2.0-SNAPSHOT.jar "$f" 10 &
			break;
		fi
	done
}

function testing {
	for f in gexfs/*.gexf
	do
		if [[ "$f" != *_.gexf* ]]
		then
			variable=`cat $f | grep "<description>Carla__Taramasco"`
			if [[ "$variable" != "" ]]
			then
				echo $f
			fi
		fi
	done
}

#Searching for the word "Magic"
function test2 {
	iter=`find . -name '*.js' -print`
	for f in $iter
	do
		filename=`echo $f | sed s/"\.\/"//g`
		variable=`cat $filename | grep "greyColor"`
		if [[ "$variable" != "" ]]
		then
			echo $filename
		fi
	done
}

test2
