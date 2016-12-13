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
    ini.read("../../parametres_comex.ini")
    MY_SQL_HOST = ini['services']['SQL_HOST']

# ================= views =================
# @app.route("/getJSON")        # route renamed
@app.route("/comexAPI")
def main():

    # db=SQLite('../community.db')
    db=MySQL(MY_SQL_HOST)

    if 'qtype' in request.args:
        if request.args['qtype'] == "filters":
            # all the other args are a series of constraints for filtering
            # ex: qtype=filters&keywords[]=complex%20networks&keywords[]=complexity%20theory&countries[]=France&countries[]=USA
            scholars = db.getScholarsList("filter",request.query_string.decode())
        else:
            unique_id = request.args['unique_id']
            scholars = db.getScholarsList("unique_id",unique_id)
    else:
        raise TypeError("API query is missing qtype (should be 'filters' or 'uid')")

    if scholars and len(scholars):
        db.extract(scholars)
    # < / Data Extraction > #

    graphArray = db.buildJSON_sansfa2(db.Graph)
    return dumps(graphArray)


if __name__ == "__main__":
    print(" * Using %s:3306 as SQL_HOST" % MY_SQL_HOST)
    app.run(host="0.0.0.0", port=8484)
