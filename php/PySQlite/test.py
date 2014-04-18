# -*- coding: utf-8 -*-

from extractData import extract as SQLite

import sys
reload(sys)
sys.setdefaultencoding('utf-8')

from flask import Flask
from flask import request
import simplejson as json
app = Flask(__name__)


@app.route("/getJSON")
def main():
	#unique_id = request.args['unique_id']
	#i = int(request.args['it'])
	queryFromFilter = request.args['query']
	if queryFromFilter:
		#db=SQLite("")
		#db.extract2(queryFromFilter)	

	return queryFromFilter#json.dumps(graphArray)


    

if __name__ == "__main__":
	#main()
	app.run(port=8080)
