from sqlite3  import connect, Row
from re       import sub, match

if __package__ == "services.text":
    from services.tools import mlog
else:
    from tools          import mlog


def sanitize(value, specific_type=None):
    """
    One of the main goals is to remove ';'
    POSS better

    args:
        @value: any string to santize

        @specific_type: None or one of {surl,sdate,sbool,sorg}
    """
    vtype = type(value)
    if vtype not in [int, str]:
        raise ValueError("Value has an incorrect type %s" % str(vtype))

    str_val = str(value)

    if specific_type == "sbool":
        # DB uses int(0) or int(1)
        if match('^[01]$',str_val):
            san_val = int(str_val)
        else:
            san_val = 0
        # NB san_val_bool = bool(san_val)

    elif specific_type == "surl":
        san_val = sub(r'[^\w@\.: /~_+$?=&%-\'"]', '_', str_val)
    elif specific_type == "sdate":
        san_val = sub(r'[^0-9/-:]', '_', str_val)

    # free string types
    else:
        clean_val = normalize_forms(normalize_chars(str_val))
        san_val = sub(r'\b(?:drop|select|update|delete)\b', '_', clean_val)
        if not specific_type:
            san_val = sub(r'[^\w@\.:,()# -]', '_', san_val)
        elif specific_type == "sorg":
            # most troublesome because we'll want to parse the label
            # (to split name and acronym and perhaps suggest similar org)
            san_val = sub(r'[\n;"\']', '_', san_val)

    # cast back to orginal type
    san_typed_val = vtype(san_val)
    return san_typed_val



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


#! /usr/bin/python3
from re  import sub
from sys import stdin, stderr


# settings
dont_touch_first_column = False
NCOLS = 1

# functions
def normalize_chars(my_str, rm_qt=False):
    """
    Simplification des chaînes de caractères en entrée de la BDD
       - normalisation
            > espaces
            > tirets
            > guillemets
       - déligatures

    Goal: normalize input values more like ascii will be easier to process
    """
    # print('normalize_chars  IN: "%s"' % my_str)
    # --------------
    # E S P A C E S
    # --------------
    # tous les caractères de contrôle (dont \t = \x{0009} et \r = \x{000D}) --> espace
    my_str = sub(r'[\u0000\u0001\u0002\u0003\u0004\u0005\u0006\u0007\u0008\u0009\u000B\u000C\u000D\u000E\u000F\u0010\u0011\u0012\u0013\u0014\u0015\u0016\u0017\u0018\u0019\u001A\u001B\u001C\u001D\u001E\u001F\u007F]', ' ', my_str)
    # mais pas \n = \x{000A}

    # Line separator
    my_str = sub(r'\u2028',' ', my_str)
    my_str = sub(r'\u2029',' ', my_str)

    # U+0092: parfois quote parfois cara de contrôle
    my_str = sub(r'\u0092', ' ', my_str)

    # tous les espaces alternatifs --> espace
    my_str = sub(r'[\u00A0\u1680\u180E\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u200B\u202F\u205F\u3000\uFEFF]', ' ' , my_str)


    # quelques puces courantes (bullets)
    my_str = sub(r'^\s+►', '   • ', my_str)
    my_str = sub(r'^\s+●', '   • ', my_str)
    my_str = sub(r'^\s+◘', '   • ', my_str)
    my_str = sub(r'^\s+→', '   • ', my_str)
    my_str = sub(r'^\s+▪', '   • ', my_str)
    my_str = sub(r'^\s+·', '   • ', my_str)
    my_str = sub(r'^\s+\*', '   • ', my_str)


    # pour finir on enlève les espaces en trop
    # (dits "trailing spaces")
    my_str = sub(r' +', ' ', my_str)
    my_str = sub(r'^ +', '', my_str)
    my_str = sub(r' +$', '', my_str)

    # ------------------------
    # P O N C T U A T I O N S
    # ------------------------
    # la plupart des tirets alternatifs --> tiret normal (dit "du 6")
    # (dans l'ordre U+002D U+2010 U+2011 U+2012 U+2013 U+2014 U+2015 U+2212 U+FE63)
    my_str = sub(r'[‐‑‒–—―−﹣]','-', my_str)

    # le macron aussi parfois comme tiret
    my_str = sub(r'\u00af','-', my_str)

    # Guillemets
    # ----------
    # la plupart des quotes simples --> ' APOSTROPHE
    my_str = sub(r"[‘’‚`‛]", "'", my_str) # U+2018 U+2019 U+201a U+201b
    my_str = sub(r'‹ ?',"'", my_str)    # U+2039 plus espace éventuel après
    my_str = sub(r' ?›',"'", my_str)    # U+203A plus espace éventuel avant

    # la plupart des quotes doubles --> " QUOTATION MARK
    my_str = sub(r'[“”„‟]', '"', my_str)  # U+201C U+201D U+201E U+201F
    # my_str = sub(r'« ?', '"', my_str)   # U+20AB plus espace éventuel après
    # my_str = sub(r' ?»', '"', my_str)   # U+20AB plus espace éventuel avant

    # deux quotes simples (préparées ci-dessus) => une double
    my_str = sub(r"''", '"', my_str)

    # if we need to remove single quotes
    if rm_qt:
        my_str = sub(r"'", '"', my_str)

    # print('normalize_chars OUT: "%s"' % my_str)

    return my_str


def normalize_forms(term_str, do_lowercase=False):
    """
    Removes unwanted trailing punctuation
    AND optionally puts everything to lowercase

    ex /©""ecosystem services"";/ => /"ecosystem services"/

    (benefits from normalize_chars upstream so there's less cases to consider)

    largely inadequate to the enormity of the task
    """
    # print('normalize_forms  IN: "%s"' % term_str)
    term_str = sub(r'^[,; ©]+', '', term_str)
    term_str = sub(r'[,; ©]+$', '', term_str)
    term_str = sub(r'"+', '"', term_str)
    term_str = sub(r'/+', '/', term_str)
    term_str = sub(r"'+", "'", term_str)

    if do_lowercase:
        term_str = term_str.lower()

    # print('normalize_forms OUT: "%s"' % term_str)
    return term_str


if __name__ == "__main__":
    for i, line in enumerate(stdin):
        fields = line.rstrip().split('\t')
        if len(fields) > NCOLS:
            print ("skipping line %i (%s)" % (i, fields), file=stderr)
            continue

        if dont_touch_first_column:
            # some ID supposed in 1st col => kept unchanged
            clean_fields = [fields[0]]
            todo_fields = fields[1:]

        else:
            # normalize in all columns
            clean_fields = []
            todo_fields = fields

        for field in todo_fields:
            clean_lines = []
            last_line = None
            for line in field.split('%%%'):
                # print(">> (doing line)", line)
                clean_line = normalize_forms(normalize_chars(line))
                if clean_line == '' and last_line == '':
                    last_line = clean_line
                    continue
                else:
                    clean_lines.append(normalize_forms(normalize_chars(line)))
                    last_line = clean_line

            # remove trailing lines
            # TODO test if instead s/(?:%%%)+$// on clean_fields later is faster
            for i in range(len(clean_lines)-1, 0, -1):
                if not len(clean_lines[i]):
                    clean_lines.pop()
                else:
                    break

            clean_fields.append('%%%'.join(clean_lines))

        # OUTPUT
        print("\t".join(clean_fields))
