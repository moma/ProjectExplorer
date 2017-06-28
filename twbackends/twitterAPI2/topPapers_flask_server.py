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

from json  import load, dumps
from flask import Flask, request
from time  import ctime
from sys   import argv
from urllib.parse import quote
from argparse  import ArgumentParser
import twitter


app = Flask(__name__)
app.config['DEBUG'] = False

# ---- initialize twitter api with credentials ----
keys_file = open("keys.json")
credentials = load(keys_file)
keys_file.close()

TAPI = twitter.Api(consumer_key=credentials['consumer_key'],
                  consumer_secret=credentials['consumer_secret'],
                  access_token_key=credentials['access_token_key'],
                  access_token_secret=credentials['access_token_secret'])

print("logged in to twitter as ***%s***" % TAPI.VerifyCredentials().screen_name)

# query context: constant for one app
# QCONTEXT = "(Fillon OR Macron OR JLM2017 OR Mélenchon OR #Marine2017 OR @MLP_officiel OR Hamon OR Presidentielle2017)"
QCONTEXT = ""

@app.route('/twitter_search')
def searcher():
    if 'query' in request.args:
        # prepare query
        # from args
        q = request.args['query']
        # TODO here sanitize
        q = "%s AND %s" % (q, QCONTEXT)

        q = quote(q)

        q = "q=%s" % q + "&result_type=recent&count=5"

        try:
            search_res = TAPI.GetSearch(raw_query=q)
            sending_json = "[%s]" % ",".join([status.AsJsonString() for status in search_res])
            sending_status = 200

        except twitter.TwitterError as te:
            sending_json = '{"error": "Rate limit exceeded"}'
            sending_status = 429

    else:
        sending_json = '{"error":"no query??"}'
        sending_status = 400

    response = app.response_class(
        response=sending_json,
        status=sending_status,
        mimetype='application/json'
    )

    return response


@app.route('/twitter_limits')
def latest_api_limits():

    if 'search' not in TAPI.rate_limit.resources:
        # the API has never been used
        send = {'left':180, 'until':-1, 'until_human':""}
    else:
        n_left = TAPI.rate_limit.resources['search']['/search/tweets']['remaining']
        until_unix_time = TAPI.rate_limit.resources['search']['/search/tweets']['reset']

        send = {'left':n_left, 'until':until_unix_time, 'until_human': ctime(until_unix_time)}

    response = app.response_class(
        response= dumps(send),
        status=200,
        mimetype='application/json'
    )
    return response

########### MAIN ###########
if __name__ == "__main__":

    # cli args
    # --------
    parser = ArgumentParser(
        description="Connect to twitter search/tweets API",
        epilog="-----(© 2017 ISCPIF-CNRS romain.loth at iscpif dot fr )-----")

    # conditional CORS: use True only if working on localhost
    parser.add_argument('--cors',
        help='allow queries from any domain (safe only for local tests)',
        required=False,
        action='store_true')

    parser.add_argument('--qcontext',
        type = str,
        help='a boolean query that will be added to all queries with an AND()',
        required=False,
        metavar="'%s'" % QCONTEXT,
        default=QCONTEXT,
        action='store')

    args = parser.parse_args(argv[1:])

    if (args.cors):
        print("WARNING: CORS activated (it is safe only if you're on a localhost)")
        from flask_cors import CORS, cross_origin
        cors = CORS(app, resources={r"/*": {"origins": "*"}})
        app.config['CORS_HEADERS'] = 'Content-Type'

    if (args.qcontext):
        QCONTEXT = args.qcontext

    app.run()
