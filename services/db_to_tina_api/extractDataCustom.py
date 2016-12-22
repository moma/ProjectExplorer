from MySQLdb   import connect, cursors
from networkx  import Graph, DiGraph
from random    import randint
from math      import floor
from cgi       import escape
from re        import sub
from traceback import format_tb

from .converter import CountryConverter

if __package__ == "services.db_to_tina_api":
    from services.tools import mlog, restparse
else:
    from tools          import mlog, restparse


whoswhofilters_to_sqlnames = {
    "keywords": "keywords.kwstr",
    "countries": "scholars.country",
    "organizations": "affiliations.org",
    "laboratories": "affiliations.team_lab",
    "tags": "scholars.community_hashtags"
}

class MyExtractor:

    def __init__(self,dbhost):
        self.connection=connect(
            host=dbhost, db="comex_shared",
            user="root", passwd="very-safe-pass"
        )
        mlog("DEBUG", "MySQL connected:", self.connection)
        self.cursor=self.connection.cursor(cursors.DictCursor)
        mlog("DEBUG", "MySQL gotcursor:", self.cursor)
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

    def getScholarsList(self,qtype,queryargs):
        """
        select one or more scholars to map in the graph

        returns a dict of scholar's uids

        method1 (case unique_id)
          - unique_id defines our starting point (scholar_0)
          - we follow all 2 step coupling paths (scholar_0 <=> keyword_X <=> scholar_i)

        method2 (case filter constraints)
          - in progress
        """
        scholar_array = {}
        sql_query = None

        # debug
        # mlog("DEBUG", "=> getScholarsList.qtype", qtype)
        # mlog("DEBUG", "=> getScholarsList.queryargs", queryargs)

        try:
            if qtype == "unique_id":
                # remove quotes from id
                unique_id = sub(r'^"|"$', '', queryargs)


                # old way
                # sql1="SELECT * FROM scholars WHERE doors_uid='"+unique_id+"'"       ## <= starting point (scholar_0)
                # sql2 = "SELECT * FROM scholars2terms where term_id="+keywords_id    ## <= coupling edges (scholar_0 <=> keyword_X <=> scholar_i)

                # new way (using scholars<=>kw map to do only one sql query)
                sql_query="""
                SELECT
                    neighbors_by_kw.uid,
                    COUNT(matching.kwid) AS cooc

                FROM scholars
                -- step 1
                JOIN sch_kw AS matching
                            ON matching.uid = scholars.doors_uid
                -- step 2
                JOIN sch_kw AS neighbors_by_kw
                            ON neighbors_by_kw.kwid = matching.kwid

                WHERE doors_uid = "%s"
                GROUP BY neighbors_by_kw.uid
                ORDER BY cooc DESC
                """ % unique_id

                self.cursor.execute(sql_query)
                results=self.cursor.fetchall()

                # debug
                # mlog("DEBUG", "getScholarsList<== len(all 2-step neighbors) =", len(results))

                if len(results) == 0:
                    # should never happen if input unique_id is valid
                    return []

                if len(results)>0:
                    for row in results:
                        # mlog("DEBUG", "the row:", row)
                        node_uid = row['uid']
                        node_shortid = "D::"+node_uid[0:8]

                        #    old way: candidate = ( integerID , realSize , #keywords )
                        #    new way: scholars_array[uid] = ( ID , occ size )

                        scholar_array[node_uid] = 1
                # debug
                # mlog("DEBUG", "getScholarsList<==scholar_array", scholar_array)

            elif qtype == "filter":
                sql_query = None

                filter_dict = restparse(queryargs)

                # debug
                mlog("DEBUG", "filter: REST query is", filter_dict)

                if "query" in filter_dict and filter_dict["query"] == "*":
                    # query is "*" <=> all scholars
                    sql_query = """
                        SELECT doors_uid
                        FROM scholars
                    """

                else:
                    # query is a set of filters like: key <=> array of values
                    # (expressed as rest parameters: "keyA[]=valA1&keyB[]=valB1&keyB[]=valB2")

                    # 1. we receive the original request.query_string
                    #    and restparse rebuilds the corresponding dict

                    # 2. we map it to an sql conjunction of alternatives
                    #    ==> WHERE colA IN ("valA1") AND colB IN ("valB1", "valB2")

                    # build constraints from the args
                    # ================================
                    sql_constraints = []
                    for key in filter_dict:
                        known_filter = None
                        sql_column = None

                        if key not in whoswhofilters_to_sqlnames:
                            continue
                        else:
                            known_filter = key
                            sql_column = whoswhofilters_to_sqlnames[key]

                        val = filter_dict[known_filter]

                        if len(val):
                            clause = ""
                            if isinstance(val, list) or isinstance(val, tuple):
                                tested_array = [x for x in val if x != '']
                                mlog("DEBUG", "tested_array", tested_array)
                                if len(tested_array):
                                    qwliststr = repr(tested_array)
                                    qwliststr = sub(r'^\[', '(', qwliststr)
                                    qwliststr = sub(r'\]$', ')', qwliststr)
                                    clause = 'IN '+qwliststr
                            elif isinstance(val, int):
                                clause = '= %i' % val
                            elif isinstance(val, float):
                                clause = '= %f' % val
                            elif isinstance(val, str):
                                clause = '= "%s"' % val

                            if len(clause):
                                sql_constraints.append("(%s %s)" % (sql_column, clause))

                    # debug
                    mlog("DEBUG", "sql_constraints", sql_constraints)

                    # use constraints as WHERE-clause
                    sql_query = """
                        SELECT
                            scholars.doors_uid,

                            -- kws info
                            COUNT(keywords.kwid) AS keywords_nb,
                            GROUP_CONCAT(keywords.kwstr) AS keywords_list,
                            GROUP_CONCAT(keywords.kwid) AS keywords_ids

                        FROM scholars

                        -- two step JOIN for keywords
                        JOIN sch_kw
                            ON doors_uid = uid
                        JOIN keywords
                            ON sch_kw.kwid = keywords.kwid
                        LEFT JOIN affiliations
                            ON affiliation_id = affid

                        -- our filtering constraints fit here
                        WHERE  %s
                        GROUP BY doors_uid

                    """ % (" AND ".join(sql_constraints))

                # in both cases "*" or constraints
                self.cursor.execute(sql_query)
                scholar_rows=self.cursor.fetchall()
                for row in scholar_rows:
                    scholar_array[ row['doors_uid'] ] = 1

            return scholar_array

        except Exception as error:
            mlog("ERROR", "===== getScholarsList SQL ERROR ====")
            if queryargs != None:
                mlog("ERROR", "qtype "+qtype+" received REST queryargs:\t"+str(queryargs))
            if sql_query != None:
                mlog("ERROR", "qtype filter attempted SQL query:\t"+sql_query)
            mlog("ERROR", repr(error) + "("+error.__doc__+")")
            mlog("ERROR", "stack (\n\t"+"\t".join(format_tb(error.__traceback__))+"\n)")
            mlog("ERROR", "==== /getScholarsList SQL ERROR ====")


    def extract(self,scholar_array):
        """
        Adding each connected scholar per unique_id
        """
        # debug
        # mlog("DEBUG", "MySQL extract scholar_array:", scholar_array)

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
            # mlog("DEBUG", "db.extract: sql3="+sql3)

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
                mlog("ERROR", "sql3:\t"+sql3)
                mlog("ERROR", error)


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
                    # mlog("DEBUG", kw_k)
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
        # mlog("DEBUG", "SQL query ===============================")
        # mlog("DEBUG", query+conditions)
        # mlog("DEBUG", "/SQL query ==============================")

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
                        #mlog("DEBUG", "\t"+source+","+target+" = "+str(weight))
                        self.Graph.add_edge( source , target , {'weight':weight,'type':"nodes1"})


    def toHTML(self,string):
        escaped = escape(string).encode("ascii", "xmlcharrefreplace").decode()
        return escaped


    def buildJSON_sansfa2(self,graph,coordsRAW=None):

        inst = CountryConverter("","","","")
        ISO=inst.getCountries("services/db_to_tina_api/countries_ISO3166.txt")
        Alternatives=inst.getCountries("services/db_to_tina_api/countries_alternatives.txt")
        inst.createInvertedDicts(ISO,Alternatives)

        nodesA=0
        nodesB=0
        edgesA=0
        edgesB=0
        edgesAB=0
        # mlog("DEBUG", "printing in buildJSON_sansfa2()")
        nodes = {}
        edges = {}
        if coordsRAW:
            xy = coordsRAW #For FA2.java: loads(coordsRAW)
            #mlog("DEBUG", xy)
            coords = {}
            for i in xy:
                coords[i['sID']] = {}
                coords[i['sID']]['x'] = i['x']
                coords[i['sID']]['y'] = i['y']
            #mlog("DEBUG", coords)

        for idNode in graph.nodes_iter():
            if idNode[0]=="N":#If it is NGram

                # debug
                # mlog("DEBUG", "terms idNode:", idNode)

                numID=int(idNode.split("::")[1])
                try:
                    nodeLabel= self.terms_dict[numID]['kwstr'].replace("&"," and ")
                    colorg=max(0,180-(100*self.terms_colors[numID]))

                    # TODO restore keywords.occurrences
                    # term_occ = self.terms_dict[numID]['occurrences']
                    term_occ = 1

                except KeyError:
                    mlog("WARNING", "couldn't find label and meta for term " + str(numID))
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

#            mlog("DEBUG", "NGR","\t",idNode,"\t",nodeLabel,"\t",term_occ)

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
                        content += '<img src="static/img/'+str(im_id)+'.png" width='  + str(self.imsize) +  'px   style=float:left;margin:5px>'

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

#            mlog("DEBUG", "SCH","\t",idNode,"\t",nodeLabel)

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

#        mlog("DEBUG", edge["type"],"\t",nodes[n[0]]["label"],"\t",nodes[n[1]]["label"],"\t",edge["w"])

#        if edge["type"]=="nodes1": mlog("DEBUG", wr)
            edges[str(e)] = edge
            e+=1
            #if e%1000 == 0:
            #    mlog("INFO", e)
#    for n in GG.nodes_iter():
#        if nodes[n]["type"]=="NGram":
#            concepto = nodes[n]["label"]
#            nodes2 = []
#            neigh = GG.neighbors(n)
#            for i in neigh:
#                if nodes[i]["type"]=="NGram":
#                    nodes2.append(nodes[i]["label"])
#            mlog("DEBUG", concepto,"\t",", ".join(nodes2))

        graph = {}
        graph["nodes"] = nodes
        graph["links"] = edges
        graph["stats"] = { "sch":nodesA,"kw":nodesB,"n1":edgesA,"n2":edgesB,"nbi":edgesAB ,  }
        graph["ID"] = self.unique_id

        mlog("INFO", graph["stats"])

        # mlog("DEBUG", "scholars",nodesA)
        # mlog("DEBUG", "concepts",nodesB)
        # mlog("DEBUG", "nodes1",edgesA)
        # mlog("DEBUG", "nodes2",edgesB)
        # mlog("DEBUG", "bipartite",edgesAB)
        return graph
