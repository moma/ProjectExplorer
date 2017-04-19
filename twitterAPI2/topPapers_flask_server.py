#! /usr/bin/python3
"""
Micro-server for testing twitter top tweets queries
"""
__author__    = "Romain Loth"
__copyright__ = "Copyright 2017 ISCPIF-CNRS"
__license__   = "LGPL"
__version__   = "0.5"
__email__     = "romain.loth@iscpif.fr"
__status__    = "dev"

from json  import  load
from flask import Flask, request
from urllib.parse import quote
import twitter

from flask.ext.cors import CORS, cross_origin

app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'

# ---- initialize twitter api with credentials ----
keys_file = open("keys.json")
credentials = load(keys_file)
keys_file.close()

TAPI = twitter.Api(consumer_key=credentials['consumer_key'],
                  consumer_secret=credentials['consumer_secret'],
                  access_token_key=credentials['access_token_key'],
                  access_token_secret=credentials['access_token_secret'])

print("logged in to twitter as", TAPI.VerifyCredentials().screen_name)

# query context: constant for one app
QCONTEXT = "(Fillon OR Macron OR JLM2017 OR Mélenchon OR #Marine2017 OR @MLP_officiel OR Hamon OR Presidentielle2017)"

@app.route('/twitter_search')
# @cross_origin(origin="twjs.org")
@cross_origin()
def searcher():
    if 'query' in request.args:
        # prepare query
        # from args
        q = request.args['query']
        # TODO here sanitize
        q = "%s AND %s" % (q, QCONTEXT)

        q = quote(q)

        q = "q=%s" % q + "&result_type=recent&count=5"

        search_res = TAPI.GetSearch(raw_query=q)

        sending_json = "[%s]" % ",".join([status.AsJsonString() for status in search_res])
    else:
        sending_json = '{"error":"no query??"}'

    response = app.response_class(
        response=sending_json,
        status=200,
        mimetype='application/json'
    )
    return response

########### MAIN ###########
if __name__ == "__main__":
    app.run(debug=True)
