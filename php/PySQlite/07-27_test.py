
from extractDataCustom import extract as SQLite

import sys
reload(sys)
sys.setdefaultencoding('utf-8')

def main():
	f = open("globalstats","w")
	f.write("sch"+"\t"+"kw"+"\t"+"n1"+"\t"+"n2"+"\t"+"nbi"+"\n")

	import sqlite3
	connection=sqlite3.connect('../community.db')
	connection.row_factory = sqlite3.Row# Magic line!
	cursor=connection.cursor()
	for row in cursor.execute("SELECT unique_id FROM scholars where keywords_ids>0"):
		print row["unique_id"]


	# unique_id = "Elisa__Omodei"
	# db=SQLite(unique_id)
	# db.extract()
	
	# tempGraph = db.buildSimpleJSONFinal(db.Graph)	
	# graphArray = db.buildJSON_sansfa2(db.Graph)
	# S = graphArray["stats"]
	# f.write(S["sch"]+"\t"+S["kw"]+"\t"+S["n1"]+"\t"+S["n2"]+"\t"+S["nbi"]+"\n")



	f.close()


if __name__ == "__main__":
	main()