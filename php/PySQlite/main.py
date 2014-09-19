# -*- coding: utf-8 -*-

from FA2 import ForceAtlas2
from extractDataCustom import extract as SQLite

import sys
reload(sys)
sys.setdefaultencoding('utf-8')

from flask import Flask
from flask import request
import simplejson as json
app = Flask(__name__)


@app.route("/getJSON")
def main():

	db=SQLite('../community.db')
	
	if request.args.has_key("query"):
		filteredquery = request.args['query']
		scholars = db.getScholarsList("filter",filteredquery)
		db.extract(scholars)
	else:
		unique_id = request.args['unique_id']
		scholars = db.getScholarsList("unique_id",unique_id)
		db.extract(scholars)
	# < / Data Extraction > #

	graphArray = db.buildJSON_sansfa2(db.Graph)
	return json.dumps(graphArray)


    

if __name__ == "__main__":
	app.run(port=8080)
