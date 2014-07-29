# -*- coding: utf-8 -*-

from FA2 import ForceAtlas2
from extractDataCustom import extract as SQLite


import json
import sys
reload(sys)
sys.setdefaultencoding('utf-8')

def main():
	#query = request.args['query']
	#{"categorya"%3A"Keywords"%2C"categoryb"%3A"Scholars"%2C"keywords"%3A[]%2C"countries"%3A["Chile"]%2C"laboratories"%3A[]%2C"coloredby"%3A[]%2C"tags"%3A[]%2C"organizations"%3A[]}

#	i=int(sys.argv[2])
#	unique_id = sys.argv[1]
#	db=SQLite(unique_id)
#	db.extract()



	# < Data Extraction > #
	i = 100
	unique_id = "Christophe__Lang"#"Noël__Bonneuil"
	db=SQLite(unique_id)
	db.extract()
	# < / Data Extraction > #


	tempGraph = db.buildSimpleJSONFinal(db.Graph)
	
	# Arnaud Banos network:
	#   Bruce Edmonds exists twice, but one of them has no keywords
#	import pprint as p
#	A=tempGraph["edges"]
#	for j in A:
#		s=j["source"]
#		t=j["target"]
#		if s=="D::593" or t=="D::593":
#			print j
	
#	spatialized = ForceAtlas2(tempGraph)
#	spatialized.init()

#	spatialized.getGraph()

#	for i in range(0,i):
#		spatialized.atomicGo()
	

	graphArray = db.buildJSON_sansfa2(db.Graph)
	
#	A=graphArray["edges"]
#	for j in A:
#		print A[j]
#	
#	print "finish"
	print graphArray["stats"]
#	return json.dumps(graphArray)


    

if __name__ == "__main__":
	main()
