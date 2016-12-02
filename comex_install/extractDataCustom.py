from sqlite3   import connect, Row
from networkx  import Graph, DiGraph
from random    import randint
from math      import floor
from cgi       import escape
from converter import CountryConverter
from pprint    import pprint
# from json      import loads  # for external FA2

class extract:

    def __init__(self,dbpath):
        self.connection=connect(dbpath)
        print("sqlite3 connected:", self.connection)
        self.connection.row_factory = Row# Magic line!
        self.cursor=self.connection.cursor()
        print("sqlite3 gotcursor:", self.cursor)
        self.scholars = {}
        self.scholars_colors = {}
        self.terms_colors = {}
        self.Graph = DiGraph()
        self.min_num_friends=0
        self.imsize=80
        self.terms_array = {}
        self.unique_id = {}


    def jaccard(self,occ1,occ2,cooc):
        if occ1==0 or occ2==0:
            return 0
        else:
            return cooc*cooc/float(occ1*occ2)


    def getRealSize(self,array):
        suma = 0
        ID = 0
        idflag = True
        for i in array:
            if i!="":
                if idflag:
                    ID=i
                    idflag=False
                if isinstance(i, (long, int)):
                    suma+=1
                else: suma+=len(i)
        return suma


    def getScholarsList(self,qtype,query):
        scholar_array = {}
        sql1=None
        sql2=None
        if qtype == "unique_id":
            try:
                sql1="SELECT * FROM scholars where unique_id='"+query+"'"

                STR_keywords_ids = ""

                self.cursor.execute(sql1)
                results=self.cursor.fetchall()

                if len(results)==0: return []

                if len(results)==1:
                    self.unique_id = { query : "D::"+str(results[0]["id"]) }
                    STR_keywords_ids = results[0]["keywords_ids"]

                # [ Solving duplicates ]
                if len(results)>1:
                    candidates = []
                    for res1 in results:
                        elementSize = self.getRealSize(res1)
                        candidate = [ res1["id"] , elementSize, res1["keywords_ids"] ]
                        #    candidate = ( integerID , realSize , #keywords )
                        candidates.append(candidate)

                    candidates = sorted(candidates, key=lambda candit: candit[1], reverse=True)
                    print("candidates:",candidates)
                    self.unique_id = { query : "D::"+str(candidates[0][0]) }
                    STR_keywords_ids = candidates[0][2]

                # [ / Solving duplicates ]

                keywords_ids = STR_keywords_ids.split(',')
                for keywords_id in keywords_ids:
                    if keywords_id != "":
                        sql2 = "SELECT * FROM scholars2terms where term_id="+keywords_id
                        try:
                            self.cursor.execute(sql2)
                            res2=self.cursor.fetchone()
                            while res2 is not None:
                                scholar_array[res2['scholar']]=1
                                res2=self.cursor.fetchone()#res2++
                        except Exception as error:
                            print("sql2:\t"+sql2)
                            print(error)


                return scholar_array

            except Exception as error:
                if sql1 != None:
                    print("sql1:\t"+sql1)
                if sql2 != None:
                    print("sql2:\t"+sql2)
                print(error)

        if qtype == "filter":
            try:
                self.cursor.execute(query)
                res1=self.cursor.fetchall()
                #            print(res1)
                for unique_id in res1:
                    scholar_array[ unique_id[0] ] = 1
                return scholar_array
            except Exception as error:
                if sql1 != None:
                    print("qtype filter sql1:\t"+sql1)
                if sql2 != None:
                    print("qtype filter sql2:\t"+sql2)
                print(error)


    def extract(self,scholar_array):
        """
        Adding each connected scholar per unique_id
        """
        for scholar_id in scholar_array:
            sql3='SELECT * FROM scholars where unique_id="'+scholar_id+'"'

            # debug
            # print("db.extract: sql3="+sql3)

            try:
                self.cursor.execute(sql3)
                res3=self.cursor.fetchall()
                n=len(res3)#in the DB, there are unique_ids duplicated
                info = {};
                #With (n-1) we're fetching only the last result.
                ide="D::"+str(res3[n-1]['id']);
                info['id'] = ide;
                info['unique_id'] = res3[n-1]['unique_id'];
                info['photo_url'] = res3[n-1]['photo_url'];
                info['first_name'] = res3[n-1]['first_name'];
                info['initials'] = res3[n-1]['initials'];
                info['last_name'] = res3[n-1]['last_name'];
                info['nb_keywords'] = res3[n-1]['nb_keywords'];
                info['css_voter'] = res3[n-1]['css_voter'];
                info['css_member'] = res3[n-1]['css_member'];
                info['keywords_ids'] = res3[n-1]['keywords_ids'].split(',');
                info['keywords'] = res3[n-1]['keywords'];
                info['country'] = res3[n-1]['country'];
                info['ACR'] = res3[n-1]['affiliation_acronym']
                #info['CC'] = res3[n-1]['norm_country'];
                info['homepage'] = res3[n-1]['homepage'];
                info['lab'] = res3[n-1]['lab'];
                info['affiliation'] = res3[n-1]['affiliation'];
                info['lab2'] = res3[n-1]['lab2'];
                info['affiliation2'] = res3[n-1]['affiliation2'];
                info['homepage'] = res3[n-1]['homepage'];
                info['title'] = res3[n-1]['title'];
                info['position'] = res3[n-1]['position'];
                info['job_market'] = res3[n-1]['job_market'];
                info['login'] = res3[n-1]['login'];
                if info['nb_keywords']>0:
                    self.scholars[ide] = info;

            except Exception as error:
                print("sql3:\t"+sql3)
                print(error)


        # génère le gexf
        # include('gexf_generator.php');
        imsize=80;
        termsMatrix = {};
        scholarsMatrix = {};
        scholarsIncluded = 0;

        for i in self.scholars:
            self.scholars_colors[self.scholars[i]['login'].strip()]=0;
            scholar_keywords = self.scholars[i]['keywords_ids'];
            for k in range(len(scholar_keywords)):
                kw_k = scholar_keywords[k]
                if kw_k != None and kw_k!="":
                    #print(kw_k)
                    if kw_k in termsMatrix:
                        termsMatrix[kw_k]['occ'] = termsMatrix[kw_k]['occ'] + 1

                        for l in range(len(scholar_keywords)):
                            kw_l = scholar_keywords[l]
                            if kw_l in termsMatrix[kw_k]['cooc']:
                                termsMatrix[kw_k]['cooc'][kw_l] += 1
                            else:
                                termsMatrix[kw_k]['cooc'][kw_l] = 1;

                    else:
                        termsMatrix[kw_k]={}
                        termsMatrix[kw_k]['occ'] = 1;
                        termsMatrix[kw_k]['cooc'] = {};
                        for l in range(len(scholar_keywords)):
                            kw_l = scholar_keywords[l]
                            if kw_l in termsMatrix[kw_k]['cooc']:
                                termsMatrix[kw_k]['cooc'][kw_l] += 1
                            else:
                                termsMatrix[kw_k]['cooc'][kw_l] = 1;
        sql='select login from jobs';
        for res in self.cursor.execute(sql):
            if res['login'].strip() in self.scholars_colors:
                self.scholars_colors[res['login'].strip()]+=1;

#    sql="SELECT term,id,occurrences FROM terms"
#    #self.cursor.execute(sql)
#    cont=0
#
##    for t in termsMatrix:
##        if cont==0:
##            sql+=' where id='+t
##            cont+=1
##        else: sql+=' or id='+t
##    print("before crash")
##    print(sql)
##    print("nb terms:",len(termsMatrix))

        query = "SELECT term,id,occurrences FROM terms WHERE id IN "
        conditions = ' (' + ','.join(sorted(list(termsMatrix))) + ')'

        # debug
        # print("SQL query ===============================")
        # print(query+conditions)
        # print("/SQL query ==============================")
        for res in self.cursor.execute(query+conditions):
            idT = res['id']
            info = {}
            info['id'] = idT
            info['occurrences'] = res['occurrences']
            info['term'] = res['term']
            self.terms_array[idT] = info
        count=1

        for term in self.terms_array:
            self.terms_colors[term]=0

        sql='select term_id from jobs2terms'
        for row in self.cursor.execute(sql):
            if row['term_id'] in self.terms_colors:
                self.terms_colors[row['term_id']]+=1

        cont=0
        for term in self.terms_array:
            #sql="SELECT scholar FROM scholars2terms where term_id='"+str(term)+"'";
            sql="SELECT scholars.id FROM scholars,scholars2terms where term_id='"+str(term)+"' and scholars.unique_id=scholars2terms.scholar"
            term_scholars=[]
            for row in self.cursor.execute(sql):
                term_scholars.append("D::"+str(row['id']))

            for k in range(len(term_scholars)):
                if term_scholars[k] in scholarsMatrix:
                    scholarsMatrix[term_scholars[k]]['occ'] = scholarsMatrix[term_scholars[k]]['occ'] + 1
                    for l in range(len(term_scholars)):
                        if term_scholars[l] in self.scholars:
                            if term_scholars[l] in scholarsMatrix[term_scholars[k]]['cooc']:
                                scholarsMatrix[term_scholars[k]]['cooc'][term_scholars[l]] += 1
                            else:
                                scholarsMatrix[term_scholars[k]]['cooc'][term_scholars[l]] = 1;

                else:
                    scholarsMatrix[term_scholars[k]]={}
                    scholarsMatrix[term_scholars[k]]['occ'] = 1;
                    scholarsMatrix[term_scholars[k]]['cooc'] = {};

                    for l in range(len(term_scholars)):
                        if term_scholars[l] in self.scholars:
                            if term_scholars[l] in scholarsMatrix[term_scholars[k]]['cooc']:
                                scholarsMatrix[term_scholars[k]]['cooc'][term_scholars[l]] += 1
                            else:
                                scholarsMatrix[term_scholars[k]]['cooc'][term_scholars[l]] = 1;

            nodeId = "N::"+str(term)
            self.Graph.add_node(nodeId)

        for scholar in self.scholars:
            if scholar in scholarsMatrix:
                if len(scholarsMatrix[scholar]['cooc']) >= self.min_num_friends:
                    scholarsIncluded += 1;
                    nodeId = str(scholar);
                    self.Graph.add_node(nodeId)

        edgeid = 0
        for scholar in self.scholars:
            if scholar in scholarsMatrix:
                if len(scholarsMatrix[scholar]['cooc']) >= 1:
                    for keyword in self.scholars[scholar]['keywords_ids']:
                        if keyword:
                            source= str(scholar)
                            target="N::"+str(keyword)
                            self.Graph.add_edge( source , target , {'weight':1,'type':"bipartite"})
                            #Some bipartite relations are missing (just the 1%)

        for term in self.terms_array:
            nodeId1 = self.terms_array[term]['id'];
            if str(nodeId1) in termsMatrix:
                neighbors = termsMatrix[str(nodeId1)]['cooc'];
                for i, neigh in enumerate(neighbors):
                    if neigh != str(term):
                        source="N::"+str(term)
                        target="N::"+neigh
                        weight=neighbors[str(neigh)]/float(self.terms_array[term]['occurrences'])
                        self.Graph.add_edge( source , target , {'weight':weight,'type':"nodes2"})

        for scholar in self.scholars:
            nodeId1 = scholar;
            if str(nodeId1) in scholarsMatrix:
                neighbors=scholarsMatrix[str(nodeId1)]['cooc'];
                for i, neigh in enumerate(neighbors):
                    if neigh != str(scholar):
                        source=str(scholar)
                        target=str(neigh)
                        weight=self.jaccard(scholarsMatrix[nodeId1]['occ'],scholarsMatrix[neigh]['occ'],neighbors[str(neigh)])
                        #print("\t"+source+","+target+" = "+str(weight))
                        self.Graph.add_edge( source , target , {'weight':weight,'type':"nodes1"})


    def toHTML(self,string):
        return escape(string).encode("ascii", "xmlcharrefreplace")


    def buildJSON_sansfa2(self,graph,coordsRAW=None):

        inst = CountryConverter("","","","")
        ISO=inst.getCountries("countries_ISO3166.txt")
        Alternatives=inst.getCountries("countries_alternatives.txt")
        inst.createInvertedDicts(ISO,Alternatives)

        nodesA=0
        nodesB=0
        edgesA=0
        edgesB=0
        edgesAB=0
        print("printing in buildJSON_sansfa2()")
        nodes = {}
        edges = {}
        if coordsRAW:
            xy = coordsRAW #For FA2.java: loads(coordsRAW)
            #print(xy)
            coords = {}
            for i in xy:
                coords[i['sID']] = {}
                coords[i['sID']]['x'] = i['x']
                coords[i['sID']]['y'] = i['y']
            #print(coords)

        for idNode in graph.nodes_iter():
            if idNode[0]=="N":#If it is NGram
                numID=int(idNode.split("::")[1])
                # print("DBG terms_array:", self.terms_array)
                try:
                    nodeLabel= self.terms_array[numID]['term'].replace("&"," and ")
                    colorg=max(0,180-(100*self.terms_colors[numID]))
                    term_occ = self.terms_array[numID]['occurrences']

                except KeyError:
                    print("WARN: couldn't find label and meta for term " + str(numID))
                    nodeLabel = "UNKNOWN"
                    colorg = 0
                    term_occ = 1

                node = {}
                node["type"] = "NGram"
                node["label"] = nodeLabel
                node["color"] = "19,"+str(colorg)+",244"
                node["term_occ"] = term_occ
                if coordsRAW: node["x"] = str(coords[idNode]['x'])
                if coordsRAW: node["y"] = str(coords[idNode]['y'])

                nodes[idNode] = node

#            print("NGR","\t",idNode,"\t",nodeLabel,"\t",term_occ)

                nodesB+=1

            if idNode[0]=='D':#If it is Document
                nodeLabel= self.scholars[idNode]['title']+" "+self.scholars[idNode]['first_name']+" "+self.scholars[idNode]['initials']+" "+self.scholars[idNode]['last_name']
                color=""
                if self.scholars_colors[self.scholars[idNode]['login']]==1:
                    color='243,183,19'
                elif self.scholars[idNode]['job_market'] == "Yes":
                    color = '139,28,28'
                else:
                    color = '78,193,127'

                content=""
                photo_url=self.scholars[idNode]['photo_url']
                if photo_url != "":
                    content += '<img  src=http://main.csregistry.org/' + photo_url + ' width=' + str(self.imsize) + 'px  style=float:left;margin:5px>';
                else:
                    if len(self.scholars)<2000:
                        im_id = int(floor(randint(0, 11)))
                        content += '<img src=http://communityexplorer.org/img/'  + str(im_id) +  '.png width='  + str(self.imsize) +  'px   style=float:left;margin:5px>'

                content += '<b>Country: </b>' + self.scholars[idNode]['country'] + '</br>'

                if self.scholars[idNode]['position'] != "":
                    content += '<b>Position: </b>' +self.scholars[idNode]['position'].replace("&"," and ")+ '</br>'

                affiliation=""
                if self.scholars[idNode]['lab'] != "":
                    affiliation += self.scholars[idNode]['lab']+ ','
                if self.scholars[idNode]['affiliation'] != "":
                    affiliation += self.scholars[idNode]['affiliation']
                if self.scholars[idNode]['affiliation'] != "" or self.scholars[idNode]['lab'] != "":
                    content += '<b>Affiliation: </b>' + affiliation.replace("&"," and ") + '</br>'
                if len(self.scholars[idNode]['keywords']) > 3:
                    content += '<b>Keywords: </b>' + self.scholars[idNode]['keywords'][:-2].replace(",",", ")+'.</br>'
                if self.scholars[idNode]['homepage'][0:3] == "www":
                    content += '[ <a href=http://' +self.scholars[idNode]['homepage'].replace("&"," and ")+ ' target=blank > View homepage </a ><br/>]'
                elif self.scholars[idNode]['homepage'][0:4] == "http":
                    content += '[ <a href=' +self.scholars[idNode]['homepage'].replace("&"," and ")+ ' target=blank > View homepage </a >]<br/>'


                node = {}
                node["type"] = "Document"
                node["label"] = nodeLabel
                node["color"] = color


                dacountry = self.scholars[idNode]["country"]
                code=inst.searchCode(dacountry)
                if code: node["CC"] = code
                else: node["CC"]="-"

                node["ACR"] = self.scholars[idNode]["ACR"]
                if node["ACR"]=="": node["ACR"]="-"

                node["term_occ"] = "12"
                if coordsRAW: node["x"] = str(coords[idNode]['x'])
                if coordsRAW: node["y"] = str(coords[idNode]['y'])
                node["content"] = str(self.toHTML(content))

                nodes[idNode] = node

#            print("SCH","\t",idNode,"\t",nodeLabel)

                nodesA+=1

        GG = Graph()
        for n in self.Graph.edges_iter():
            s = n[0]
            t = n[1]
            w = float(self.Graph[n[0]][n[1]]['weight'])
            tp = self.Graph[n[0]][n[1]]['type']

            if GG.has_edge(s,t):
                oldw = GG[s][t]['weight']
                avgw = (oldw+w)/2
                GG[s][t]['weight'] = avgw
            else:
                GG.add_edge( s , t , { "weight":w , "type":tp } )

        e = 0
        for n in GG.edges_iter():#Memory, what's wrong with you?
            wr = 0.0
            origw = GG[n[0]][n[1]]['weight']
            for i in range(2,10):
                wr = round( origw , i)
                if wr > 0.0: break
            edge = {}
            edge["s"] = n[0]
            edge["t"] = n[1]
            edge["w"] = str(wr)
#        edge["type"] = GG[n[0]][n[1]]['type']
            if GG[n[0]][n[1]]['type']=="nodes1": edgesA+=1
            if GG[n[0]][n[1]]['type']=="nodes2": edgesB+=1
            if GG[n[0]][n[1]]['type']=="bipartite": edgesAB+=1

#        print(edge["type"],"\t",nodes[n[0]]["label"],"\t",nodes[n[1]]["label"],"\t",edge["w"])

#        if edge["type"]=="nodes1": print(wr)
            edges[str(e)] = edge
            e+=1
            #if e%1000 == 0:
            #    print(e)
#    for n in GG.nodes_iter():
#        if nodes[n]["type"]=="NGram":
#            concepto = nodes[n]["label"]
#            nodes2 = []
#            neigh = GG.neighbors(n)
#            for i in neigh:
#                if nodes[i]["type"]=="NGram":
#                    nodes2.append(nodes[i]["label"])
#            print(concepto,"\t",", ".join(nodes2))

        graph = {}
        graph["nodes"] = nodes
        graph["links"] = edges
        graph["stats"] = { "sch":nodesA,"kw":nodesB,"n1":edgesA,"n2":edgesB,"nbi":edgesAB ,  }
        graph["ID"] = self.unique_id

        pprint(graph["stats"])

        print("scholars",nodesA)
        print("concepts",nodesB)
        print("nodes1",edgesA)
        print("nodes2",edgesB)
        print("bipartite",edgesAB)
        print(type(graph))
        return graph
