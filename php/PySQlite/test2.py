# -*- coding: utf-8 -*-

from extractData import extract as SQLite
import time
import sys
reload(sys)
sys.setdefaultencoding('utf-8')


def main():

	db=SQLite("")
	print "Start"
	start = time.time()
	db.extract2('SELECT * FROM scholars where   country = "'+sys.argv[1]+'"')
	end = time.time()  
	seconds1=end-start
	print "End"
	print "\ttotal: "+str(seconds1)+"[s]"
	
	#return queryFromFilter#json.dumps(graphArray)


    

if __name__ == "__main__":
	main()
	#app.run(port=8080)
