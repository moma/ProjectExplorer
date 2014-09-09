# -*- coding: utf-8 -*-

from FA2 import ForceAtlas2
from extractDataCustom import extract as SQLite

import sys
reload(sys)
sys.setdefaultencoding('utf-8')

#from flask import Flask
#from flask import request
import simplejson as json
#app = Flask(__name__)


#@app.route("/getJSON")
def main():
	#query = request.args['query']
	#{"categorya"%3A"Keywords"%2C"categoryb"%3A"Scholars"%2C"keywords"%3A[]%2C"countries"%3A["Chile"]%2C"laboratories"%3A[]%2C"coloredby"%3A[]%2C"tags"%3A[]%2C"organizations"%3A[]}

#	i=int(sys.argv[2])
#	unique_id = sys.argv[1]
#	db=SQLite(unique_id)
#	db.extract()

	# < Data Extraction > #
#	i = int(request.args['it'])

#	if request.args.has_key("query"):

	# #testcase 1:
	# db=SQLite()
	# scholars = db.getScholarsList("unique_id","Carla__Taramasco")
	# print scholars
	# db.extract(scholars)
	# print len(db.Graph)
	# # added to production

	
	#testcase 2:
	db=SQLite()
	query = 'SELECT unique_id FROM scholars where   country = "Chile" OR country="France"'
	scholars = db.getScholarsList("filter",query)
	db.extract(scholars)
	print len(db.Graph)



#	else:
#		unique_id = request.args['unique_id']
#		db=SQLite(unique_id)
#		db.extract()
	# < / Data Extraction > #

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
	

	# graphArray = db.buildJSON_sansfa2(db.Graph)

	# return json.dumps(graphArray)


    

if __name__ == "__main__":
	main()
#	app.run(port=8080)
