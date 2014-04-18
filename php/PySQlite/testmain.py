# -*- coding: utf-8 -*-

from FA2 import ForceAtlas2
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

	print request.args
	return "hola"

    

if __name__ == "__main__":
#	main()
	app.run(port=8080)
