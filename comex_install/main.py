"""
comex helper backend to create json graphs from sqlite3 db

TODO integrate with new regcomex server
"""
from extractDataCustom import extract as SQLite

from flask import Flask
from flask import request
from json  import dumps
app = Flask(__name__)

# @app.route("/getJSON")        # route renamed
@app.route("/comexAPI")
def main():

    db=SQLite('../community.db')

    print(request.args)
    print('unique_id' in request.args)
    print()

    if 'query' in request.args:
        filteredquery = request.args['query']
        scholars = db.getScholarsList("filter",filteredquery)
    else:
        unique_id = request.args['unique_id']
        scholars = db.getScholarsList("unique_id",unique_id)
    if scholars and len(scholars):
        db.extract(scholars)
    # < / Data Extraction > #

    graphArray = db.buildJSON_sansfa2(db.Graph)
    return dumps(graphArray)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8484)
