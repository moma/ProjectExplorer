from sqlite3  import connect, Row

if __package__ == "services.db_to_tina_api":
    from services.tools import mlog
else:
    from tools          import mlog


class CountryConverter:
    def __init__(self,dbname,dbtable,dbcolumnID,dbcolumnName):

        self.connDBLP=connect(dbname)
        self.connDBLP.row_factory = Row# Magic line!
        self.cursorDBLP=self.connDBLP.cursor()
        self.dbname=dbname
        self.dbtable=dbtable
        self.dbcolumnID=dbcolumnID
        self.dbcolumnName=dbcolumnName
        self.ISO={}
        self.dictISO={}
        self.dictAlt={}

    def searchCode(self,c):
        C=c.upper()
        if C in self.ISO:
            return C
        if C in self.dictISO:
            return self.dictISO[C]
        if C in self.dictAlt:
            return self.dictAlt[C]


    def getCountries(self,filename):
        dadict={}
        f = open(filename, 'r')
        for d in f:
            line=d.replace("\n","")
            a=line.split("\t")
            arr=[]
            for j in range(1,len(a)):
                if a[j] is not "":
                    arr.append(a[j])
            code=a[0]
            name=[]
            if len(arr)==1:
                name.append(a[1])
            if len(arr)>1:
                name=arr
            dadict[code]=name
        f.close()
        return dadict

    def createInvertedDicts(self,ISO,Alternatives):
        self.ISO=ISO
        for i in ISO:
            self.dictISO[ISO[i][0].upper()]=i

        for i in Alternatives:
            a=Alternatives[i]
            if len(a)>0:
                for j in a:
                    self.dictAlt[j.upper()]=i


    def convertAll(self,write):
        dbtable=self.dbtable
        dbcolumnName=self.dbcolumnName
        dbcolumnID=self.dbcolumnID

        if write:
            query="ALTER TABLE "+dbtable+" ADD COLUMN norm_"+dbcolumnName+" char(250)"
            self.cursorDBLP.execute(query)
            self.connDBLP.commit()


        query="SELECT "+dbcolumnID+","+dbcolumnName+" FROM "+dbtable
        self.cursorDBLP.execute(query)
        rows = self.cursorDBLP.fetchall()
        total=len(rows)

        fails={}
        for i in rows:
            # if write:
            #     q2='UPDATE '+dbtable+' SET norm_'+dbcolumnName+'="'+i[dbcolumnName]+'" WHERE '+dbcolumnID+'='+str(i[dbcolumnID])
            #     self.cursorDBLP.execute(q2)
            #     self.connDBLP.commit()

            ind=i[dbcolumnName].encode("UTF-8")
            code=self.searchCode(ind)
            if code:
                if write:
                    q3='UPDATE '+dbtable+' SET norm_'+dbcolumnName+'="'+code+'" WHERE '+dbcolumnID+'='+str(i[dbcolumnID])
                    self.cursorDBLP.execute(q3)
                    self.connDBLP.commit()
            else: fails[i[dbcolumnID]]=ind
            mlog("INFO", str(i[dbcolumnID])+" / "+str(total))

        self.connDBLP.close()
        return fails
