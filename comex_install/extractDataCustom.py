from MySQLdb   import connect, cursors
from networkx  import Graph, DiGraph
from random    import randint
from math      import floor
from cgi       import escape
from converter import CountryConverter
from pprint    import pprint


class MyExtractor:

    def __init__(self,dbhost):
        self.connection=connect(
            host=dbhost, db="comex_shared",
            user="root", passwd="very-safe-pass"
        )
        print("MySQL connected:", self.connection)
        self.cursor=self.connection.cursor(cursors.DictCursor)
        print("MySQL gotcursor:", self.cursor)
        self.scholars = {}
        self.scholars_colors = {}
        self.terms_colors = {}
        self.Graph = DiGraph()
        self.min_num_friends=0
        self.imsize=80
        self.terms_dict = {}
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
                if i is None:
                    continue
                elif isinstance(i, int):
                    suma+=1
                else: suma+=len(i)
        return suma


    def getScholarsList(self,qtype,query):
        # debug
        # print("getScholarsList<============")
        # print("qtype", qtype)
        # print("query", query)

        # remove quotes from id
        unique_id = query[1:-1]
        scholar_array = {}
        sql1=None
        sql2=None
        if qtype == "unique_id":
            try:
                # old way
                # sql1="SELECT * FROM scholars WHERE doors_uid='"+unique_id+"'"

                # TODO this query brings back doors_uid and keywords_ids
                #      as the old way used to do, but with keywords scholar index
                #      we won't need STR_keywords_ids anymore
                sql1="""
                SELECT
                        doors_uid,
                        COUNT(keywords.kwid) AS nb_keywords,
                        GROUP_CONCAT(keywords.kwid) AS keywords_ids
                FROM scholars
                JOIN sch_kw ON doors_uid = uid
                JOIN keywords ON sch_kw.kwid = keywords.kwid
                WHERE doors_uid = "%s"
                GROUP BY doors_uid
                """ % unique_id

                STR_keywords_ids = ""

                self.cursor.execute(sql1)
                results=self.cursor.fetchall()

                print("getScholarsList<==len(results) =", len(results))

                if len(results)==0:
                    return []

                if len(results)==1:
                    self.unique_id = { unique_id : "D::"+str(results[0]["doors_uid"][0:8]) }
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
                    self.unique_id = { unique_id : "D::"+str(candidates[0]["doors_uid"][0:8]) }
                    STR_keywords_ids = candidates[0][2]

                # [ / Solving duplicates ]

                keywords_ids = STR_keywords_ids.split(',')
                for keywords_id in keywords_ids:
                    # debug
                    # print("kwid >> ", keywords_id)

                    if keywords_id != "":
                        sql2 = "SELECT * FROM sch_kw where kwid="+keywords_id
                        try:
                            self.cursor.execute(sql2)
                            res2=self.cursor.fetchone()
                            while res2 is not None:
                                scholar_array[res2['uid']]=1
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


        # TODO fix ('refine' button)
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
        # debug
        # print("MySQL extract scholar_array:", scholar_array)

        for scholar_id in scholar_array:
            sql3='''
                    SELECT
                        scholars.*,
                        affiliations.*,
                        COUNT(keywords.kwid) AS keywords_nb,
                        GROUP_CONCAT(keywords.kwid) AS keywords_ids,
                        GROUP_CONCAT(kwstr) AS keywords_list
                    FROM scholars
                    JOIN sch_kw
                        ON doors_uid = uid
                    JOIN keywords
                        ON sch_kw.kwid = keywords.kwid
                    LEFT JOIN affiliations
                        ON affiliation_id = affid
                    WHERE doors_uid = "%s"
                    GROUP BY doors_uid ;
            ''' % scholar_id

            # debug
            # print("db.extract: sql3="+sql3)

            try:
                self.cursor.execute(sql3)
                res3=self.cursor.fetchone()
                info = {};
                # POSS: semantic short ID
                # ex "D::JFK/4913d6c7"

                # for now we use uid substring [0:8]
                # ex ide="D::4913d6c7"
                ide="D::"+res3['doors_uid'][0:8];
                info['id'] = ide;
                info['doors_uid'] = res3['doors_uid'];
                info['pic_url'] = res3['pic_url'];
                info['first_name'] = res3['first_name'];
                info['mid_initial'] = res3['middle_name'][0] if res3['middle_name'] else ""       # TODO adapt usage
                info['last_name'] = res3['last_name'];
                info['keywords_nb'] = res3['keywords_nb'];
                info['keywords_ids'] = res3['keywords_ids'].split(',');
                info['keywords_list'] = res3['keywords_list'];
                info['country'] = res3['country'];
                # info['ACR'] = res3['org_acronym']       # TODO create
                #info['CC'] = res3['norm_country'];
                info['home_url'] = res3['home_url'];
                info['team_lab'] = res3['team_lab'];
                info['org'] = res3['org'];
                # info['lab2'] = res3['lab2'];                 # TODO restore
                # info['affiliation2'] = res3['affiliation2'];
                info['hon_title'] = res3['hon_title'] if res3['hon_title'] else ""
                info['position'] = res3['position'];
                info['job_looking_date'] = res3['job_looking_date'];
                info['email'] = res3['email'];
                if info['keywords_nb']>0:
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
            self.scholars_colors[self.scholars[i]['email'].strip()]=0;
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

        # TODO restore job snippet 1
        # sql='select login from jobs';
        # for res in self.cursor.execute(sql):
        #     if res['login'].strip() in self.scholars_colors:
        #         self.scholars_colors[res['login'].strip()]+=1;

        # TODO add occurrences ?
        # query = "SELECT kwstr,kwid,occurrences FROM keywords WHERE kwid IN "
        query = "SELECT kwstr,kwid FROM keywords WHERE kwid IN "
        conditions = ' (' + ','.join(sorted(list(termsMatrix))) + ')'

        # debug
        print("SQL query ===============================")
        print(query+conditions)
        print("/SQL query ==============================")

        self.cursor.execute(query+conditions)
        results4 = self.cursor.fetchall()

        for res in results4:
            idT = res['kwid']
            info = {}
            info['kwid'] = idT
            # info['occurrences'] = res['occurrences']  # TODO add occurrences ?
            info['kwstr'] = res['kwstr']
            self.terms_dict[idT] = info
        count=1

        for term in self.terms_dict:
            self.terms_colors[term]=0

        # TODO restore job snippet 2
        # sql='select term_id from jobs2terms'
        # for row in self.cursor.execute(sql):
        #     if row['term_id'] in self.terms_colors:
        #         self.terms_colors[row['term_id']]+=1

        cont=0
        for term_id in self.terms_dict:
            sql="SELECT uid FROM sch_kw WHERE kwid=%i" % term_id
            term_scholars=[]
            self.cursor.execute(sql)
            rows = self.cursor.fetchall()
            for row in rows:
                term_scholars.append("D::"+row['uid'][0:8])

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

        for term in self.terms_dict:
            nodeId1 = self.terms_dict[term]['kwid'];
            if str(nodeId1) in termsMatrix:
                neighbors = termsMatrix[str(nodeId1)]['cooc'];
                for i, neigh in enumerate(neighbors):
                    if neigh != str(term):
                        source="N::"+str(term)
                        target="N::"+neigh
                        # TODO restore keywords.occurrences
                        # weight=neighbors[str(neigh)]/float(self.terms_dict[term]['occurrences'])
                        weight=neighbors[str(neigh)]
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
        escaped = escape(string).encode("ascii", "xmlcharrefreplace").decode()
        print(type(escaped))
        return escaped


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
        # print("printing in buildJSON_sansfa2()")
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
                # print("DBG terms_dict:", self.terms_dict)
                try:
                    nodeLabel= self.terms_dict[numID]['term'].replace("&"," and ")
                    colorg=max(0,180-(100*self.terms_colors[numID]))
                    term_occ = self.terms_dict[numID]['occurrences']

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
                nodeLabel= self.scholars[idNode]['hon_title']+" "+self.scholars[idNode]['first_name']+" "+self.scholars[idNode]['mid_initial']+" "+self.scholars[idNode]['last_name']
                color=""
                if self.scholars_colors[self.scholars[idNode]['email']]==1:
                    color='243,183,19'

                # TODO test the date
                elif self.scholars[idNode]['job_looking_date'] is not None:
                    color = '139,28,28'
                else:
                    color = '78,193,127'

                content=""
                pic_url=self.scholars[idNode]['pic_url']

                # TODO double case pic_url or pic_file
                if pic_url and pic_url != "":
                    content += '<img  src="'+pic_url+'" width=' + str(self.imsize) + 'px  style=float:left;margin:5px>';
                else:
                    if len(self.scholars)<2000:
                        im_id = int(floor(randint(0, 11)))
                        content += '<img src="img/'+str(im_id)+'.png" width='  + str(self.imsize) +  'px   style=float:left;margin:5px>'

                content += '<b>Country: </b>' + self.scholars[idNode]['country'] + '</br>'

                if self.scholars[idNode]['position'] and self.scholars[idNode]['position'] != "":
                    content += '<b>Position: </b>' +self.scholars[idNode]['position'].replace("&"," and ")+ '</br>'

                affiliation=""
                if self.scholars[idNode]['team_lab'] and self.scholars[idNode]['team_lab'] != "":
                    affiliation += self.scholars[idNode]['team_lab']+ ','
                if self.scholars[idNode]['org'] and self.scholars[idNode]['org'] != "":
                    affiliation += self.scholars[idNode]['org']

                # TODO restore if not redundant with org
                # if self.scholars[idNode]['affiliation'] != "" or self.scholars[idNode]['lab'] != "":
                #     content += '<b>Affiliation: </b>' + affiliation.replace("&"," and ") + '</br>'

                if len(self.scholars[idNode]['keywords_list']) > 3:
                    content += '<b>Keywords: </b>' + self.scholars[idNode]['keywords_list'].replace(",",", ")+'.</br>'

                if self.scholars[idNode]['home_url']:
                    if self.scholars[idNode]['home_url'][0:3] == "www":
                        content += '[ <a href=http://' +self.scholars[idNode]['home_url'].replace("&"," and ")+ ' target=blank > View homepage </a ><br/>]'
                    elif self.scholars[idNode]['home_url'][0:4] == "http":
                        content += '[ <a href=' +self.scholars[idNode]['home_url'].replace("&"," and ")+ ' target=blank > View homepage </a >]<br/>'


                node = {}
                node["type"] = "Document"
                node["label"] = nodeLabel
                node["color"] = color


                dacountry = self.scholars[idNode]["country"]
                code=inst.searchCode(dacountry)

                # country code
                if code: node["CC"] = code
                else: node["CC"]="-"

                # Affiliation
                # TODO restore with org_acronym
                # node["ACR"] = self.scholars[idNode]["ACR"]
                node["ACR"] = self.scholars[idNode]["org"]
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

        # print("scholars",nodesA)
        # print("concepts",nodesB)
        # print("nodes1",edgesA)
        # print("nodes2",edgesB)
        # print("bipartite",edgesAB)
        return graph
