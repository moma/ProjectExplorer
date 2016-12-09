"""
comex helper backend to create json graphs from sqlite3 db

TODO integrate with new regcomex server
"""
from extractDataCustom import MyExtractor as MySQL

from flask        import Flask, request
from json         import dumps
from os           import environ
from configparser import ConfigParser
# ============= app creation ==============
app = Flask(__name__)

# ============= read environ ==============
MY_SQL_HOST = environ.get('SQL_HOST', None)

if not MY_SQL_HOST:
    ini = ConfigParser()
    ini.read("../parametres_comex.ini")
    MY_SQL_HOST = ini['services']['SQL_HOST']

# ================= views =================
# @app.route("/getJSON")        # route renamed
@app.route("/comexAPI")
def main():

    # db=SQLite('../community.db')
    db=MySQL(MY_SQL_HOST)

    if 'query' in request.args:
        # TODO fix ('refine' button)
        # query is a json {cat:filtervalue} , not an executable SQL query !!
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
