# -*- coding: utf-8 -*-
import sqlite3
#import pprint
import networkx as nx
import random
import math
import cgi

import sys
reload(sys)
sys.setdefaultencoding('utf-8')

class extract:

    def __init__(self):
	self.connection=sqlite3.connect('../community.db')
	self.connection.row_factory = sqlite3.Row# Magic line!
	self.cursor=self.connection.cursor()
	self.scholars = {}
	self.scholars_colors = {}
	self.terms_colors = {}
	self.Graph = nx.DiGraph()
	self.min_num_friends=0
	self.imsize=80
	self.terms_array = {}


    def jaccard(self,occ1,occ2,cooc):
	if occ1==0 or occ2==0:
		return 0
	else:
		return cooc*cooc/float(occ1*occ2)


    def getScholarsList(self,qtype,query):
	scholar_array = {}
	if qtype == "unique_id":
		try:
			sql1="SELECT keywords_ids FROM scholars where unique_id='"+query+"'"
			self.cursor.execute(sql1)
			res1=self.cursor.fetchone()
			while res1 is not None:
				keywords_ids = res1['keywords_ids'].split(',')
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
							print "sql2:\t"+sql2
							print error

				res1 = self.cursor.fetchone()#res1++
			return scholar_array
		except Exception as error:
			print "sql1:\t"+sql1
			print error

	if qtype == "filter":
		try:
			self.cursor.execute(query)
			res1=self.cursor.fetchall()
#			print res1
			for unique_id in res1:
				scholar_array[ unique_id[0] ] = 1
			return scholar_array
		except Exception as error:
			print "qtype filter sql:\t"+sql1
			print error





    def chunks(self,l, n):
	for i in xrange(0, len(l), n):
		yield l[i:i+n]




    def testSQLimit(self,scholar_array):
	for scholar_id in scholar_array:
		sql3='SELECT * FROM scholars where unique_id="'+scholar_id+'"'
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
			print "sql3:\t"+sql3
			print error


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
			if scholar_keywords[k] != None and scholar_keywords[k]!="":
				#print scholar_keywords[k]
				if termsMatrix.has_key(scholar_keywords[k]):
					termsMatrix[scholar_keywords[k]]['occ'] = termsMatrix[scholar_keywords[k]]['occ'] + 1

					for l in range(len(scholar_keywords)):
						if termsMatrix[scholar_keywords[k]]['cooc'].has_key(scholar_keywords[l]):
							termsMatrix[scholar_keywords[k]]['cooc'][scholar_keywords[l]] += 1
						else:
							termsMatrix[scholar_keywords[k]]['cooc'][scholar_keywords[l]] = 1;
					
				else:
					termsMatrix[scholar_keywords[k]]={}
					termsMatrix[scholar_keywords[k]]['occ'] = 1;
					termsMatrix[scholar_keywords[k]]['cooc'] = {};
					for l in range(len(scholar_keywords)):
						if termsMatrix[scholar_keywords[k]]['cooc'].has_key(scholar_keywords[l]):
							termsMatrix[scholar_keywords[k]]['cooc'][scholar_keywords[l]] += 1
						else:
							termsMatrix[scholar_keywords[k]]['cooc'][scholar_keywords[l]] = 1;
	sql='select login from jobs';
	for res in self.cursor.execute(sql):
		if res['login'].strip() in self.scholars_colors:
			self.scholars_colors[res['login'].strip()]+=1;

	sql="SELECT term,id,occurrences FROM terms"
	#self.cursor.execute(sql)
	cont=0
	
	for t in termsMatrix:
		if cont==0: 
			sql+=' where id='+t
			cont+=1
		else: sql+=' or id='+t
	print "before crash"
	print len(termsMatrix)
	
#	sql="SELECT term,id,occurrences FROM terms where id=123 OR id=343 ... or id=978"


	sqlarray = []
	chunkedTerms = list(self.chunks(termsMatrix.keys(), 500))
	for chunk_i in chunkedTerms:
		if len(chunk_i)>0:
			query = "SELECT term,id,occurrences FROM terms where id="
			conditions = " or id=".join(chunk_i)
			sqlarray.append(query+conditions)

#	import pprint
#	pprint.pprint(sqlarray)

	for sql in sqlarray:
		for res in self.cursor.execute(sql):
			idT = res['id'] 	
			info = {}
			info['id'] = idT
			info['occurrences'] = res['occurrences']
			info['term'] = res['term']
			self.terms_array[idT] = info
	count=1










    def extract(self,scholar_array):
	for scholar_id in scholar_array:
		sql3='SELECT * FROM scholars where unique_id="'+scholar_id+'"'
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
			print "sql3:\t"+sql3
			print error


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
			if scholar_keywords[k] != None and scholar_keywords[k]!="":
				#print scholar_keywords[k]
				if termsMatrix.has_key(scholar_keywords[k]):
					termsMatrix[scholar_keywords[k]]['occ'] = termsMatrix[scholar_keywords[k]]['occ'] + 1

					for l in range(len(scholar_keywords)):
						if termsMatrix[scholar_keywords[k]]['cooc'].has_key(scholar_keywords[l]):
							termsMatrix[scholar_keywords[k]]['cooc'][scholar_keywords[l]] += 1
						else:
							termsMatrix[scholar_keywords[k]]['cooc'][scholar_keywords[l]] = 1;
					
				else:
					termsMatrix[scholar_keywords[k]]={}
					termsMatrix[scholar_keywords[k]]['occ'] = 1;
					termsMatrix[scholar_keywords[k]]['cooc'] = {};
					for l in range(len(scholar_keywords)):
						if termsMatrix[scholar_keywords[k]]['cooc'].has_key(scholar_keywords[l]):
							termsMatrix[scholar_keywords[k]]['cooc'][scholar_keywords[l]] += 1
						else:
							termsMatrix[scholar_keywords[k]]['cooc'][scholar_keywords[l]] = 1;
	sql='select login from jobs';
	for res in self.cursor.execute(sql):
		if res['login'].strip() in self.scholars_colors:
			self.scholars_colors[res['login'].strip()]+=1;

#	sql="SELECT term,id,occurrences FROM terms"
#	#self.cursor.execute(sql)
#	cont=0
#	
##	for t in termsMatrix:
##		if cont==0: 
##			sql+=' where id='+t
##			cont+=1
##		else: sql+=' or id='+t
##	print "before crash"
##	print sql
##	print "nb terms:",len(termsMatrix)

	sqlarray = []
	chunkedTerms = list(self.chunks(termsMatrix.keys(), 500))
	for chunk_i in chunkedTerms:
		if len(chunk_i)>0:
			query = "SELECT term,id,occurrences FROM terms where id="
			conditions = " or id=".join(chunk_i)
			sqlarray.append(query+conditions)

#	import pprint
#	pprint.pprint(sqlarray)

	for sql in sqlarray:
		for res in self.cursor.execute(sql):
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
			if scholarsMatrix.has_key(term_scholars[k]):
				scholarsMatrix[term_scholars[k]]['occ'] = scholarsMatrix[term_scholars[k]]['occ'] + 1
				for l in range(len(term_scholars)):
					if self.scholars.has_key(term_scholars[l]):
						if scholarsMatrix[term_scholars[k]]['cooc'].has_key(term_scholars[l]):
							scholarsMatrix[term_scholars[k]]['cooc'][term_scholars[l]] += 1
						else:
							scholarsMatrix[term_scholars[k]]['cooc'][term_scholars[l]] = 1;
					
			else:
				scholarsMatrix[term_scholars[k]]={}
				scholarsMatrix[term_scholars[k]]['occ'] = 1;
				scholarsMatrix[term_scholars[k]]['cooc'] = {};

				for l in range(len(term_scholars)):
					if self.scholars.has_key(term_scholars[l]):
						if scholarsMatrix[term_scholars[k]]['cooc'].has_key(term_scholars[l]):
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
		if termsMatrix.has_key(str(nodeId1)):
			neighbors = termsMatrix[str(nodeId1)]['cooc'];
			for i, neigh in enumerate(neighbors):
				if neigh != str(term):					
					source="N::"+str(term)
					target="N::"+neigh
					weight=neighbors[str(neigh)]/float(self.terms_array[term]['occurrences'])
					self.Graph.add_edge( source , target , {'weight':weight,'type':"nodes2"})

	for scholar in self.scholars:
		nodeId1 = scholar;
		if scholarsMatrix.has_key(str(nodeId1)):
			neighbors=scholarsMatrix[str(nodeId1)]['cooc']; 
			for i, neigh in enumerate(neighbors):
				if neigh != str(scholar):				
					source=str(scholar)
					target=str(neigh)
					weight=self.jaccard(scholarsMatrix[nodeId1]['occ'],scholarsMatrix[neigh]['occ'],neighbors[str(neigh)])
					#print "\t"+source+","+target+" = "+str(weight)
					self.Graph.add_edge( source , target , {'weight':weight,'type':"nodes1"})


    def toHTML(self,string):
	return cgi.escape(string).encode("ascii", "xmlcharrefreplace")

    def iterNodeAtts(self):
	print "asdf"



    def buildJSON_sansfa2(self,graph,coordsRAW=None):
	nodesA=0
	nodesB=0
	edgesA=0
	edgesB=0
	edgesAB=0
	print "printing in buildJSON_sansfa2()"
	nodes = {}
	edges = {}
	if coordsRAW:
		import json
		xy = coordsRAW #For FA2.java: json.loads(coordsRAW)
		#print xy
		coords = {}
		for i in xy:
			coords[i['sID']] = {}
			coords[i['sID']]['x'] = i['x']
			coords[i['sID']]['y'] = i['y']
		#print coords

	for idNode in graph.nodes_iter():
		if idNode[0]=="N":#If it is NGram
			numID=int(idNode.split("::")[1])
			nodeLabel= self.terms_array[numID]['term'].replace("&"," and ")
			colorg=max(0,180-(100*self.terms_colors[numID]))
			term_occ = self.terms_array[numID]['occurrences']

			node = {}
			node["type"] = "NGram"
			node["label"] = nodeLabel
			node["color"] = "19,"+str(colorg)+",244"
			node["term_occ"] = term_occ
			if coordsRAW: node["x"] = str(coords[idNode]['x'])
			if coordsRAW: node["y"] = str(coords[idNode]['y'])
			
			nodes[idNode] = node
			
#			print "NGR","\t",idNode,"\t",nodeLabel,"\t",term_occ
			
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
					im_id = int(math.floor(random.randint(0, 11)))
					content += '<img src=http://communityexplorer.csregistry.org/img/'  + str(im_id) +  '.png width='  + str(self.imsize) +  'px   style=float:left;margin:5px>'

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
			node["term_occ"] = "12"
			if coordsRAW: node["x"] = str(coords[idNode]['x'])
			if coordsRAW: node["y"] = str(coords[idNode]['y'])
			node["content"] = self.toHTML(content)

			nodes[idNode] = node
			
#			print "SCH","\t",idNode,"\t",nodeLabel
			
			nodesA+=1
	
	GG = nx.Graph()
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
		edge["type"] = GG[n[0]][n[1]]['type']
		if edge["type"]=="nodes1": edgesA+=1
		if edge["type"]=="nodes2": edgesB+=1
		if edge["type"]=="bipartite": edgesAB+=1
		
#		print edge["type"],"\t",nodes[n[0]]["label"],"\t",nodes[n[1]]["label"],"\t",edge["w"]
		
#		if edge["type"]=="nodes1": print wr
		edges[str(e)] = edge
		e+=1
		#if e%1000 == 0:
		#	print e
#	for n in GG.nodes_iter():
#		if nodes[n]["type"]=="NGram":
#			concepto = nodes[n]["label"]
#			nodes2 = []
#			neigh = GG.neighbors(n)
#			for i in neigh:
#				if nodes[i]["type"]=="NGram":
#					nodes2.append(nodes[i]["label"])
#			print concepto,"\t",", ".join(nodes2)
			
	graph = {}
	graph["nodes"] = nodes
	graph["edges"] = edges
	graph["stats"] = { "sch":nodesA,"kw":nodesB,"n1":edgesA,"n2":edgesB,"nbi":edgesAB }
	import pprint
	pprint.pprint(graph["stats"])
#	print "scholars",nodesA
#	print "concepts",nodesB
#	print "nodes1",edgesA
#	print "nodes2",edgesB
#	print "bipartite",edgesAB
	return graph



    def buildSimpleJSONFinal(self,graph):
	print "gonna build a mofo json in buildSimpleJSONFinal"	
	nodes = {}
	nodes2 = []
	edges = []
	countnodes=0
	
	#for n in graph.edges_iter():
	#	print n[0] + "," + n[1]
	#	pprint.pprint(  graph[n[0]][n[1]] )
	

	for idNode in graph.nodes_iter():
		if idNode[0]=="N":#If it is NGram
			numID=int(idNode.split("::")[1])
			nodeLabel= self.terms_array[numID]['term'].replace("&"," and ")
			colorg=max(0,180-(100*self.terms_colors[numID]))
			term_occ = self.terms_array[numID]['occurrences']

			node = {}
			#node["nID"] = countnodes
			#node["sID"] = idNode
			#node["id"] = countnodes
			node["id"] = idNode
			#node["group"] = 1
			#node["name"] = nodeLabel
			#node["color"] = "green"
			#node["occ"] = int(term_occ)
			node["degree"] = 0
			node["size"] = int(term_occ)
			#node["x"] = str(coords[idNode][0])
			#node["y"] = str(coords[idNode][1])

			nodes2.append(node)
			nodes[idNode] = countnodes

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
					im_id = int(math.floor(random.randint(0, 11)))
					content += '<img src=http://communityexplorer.csregistry.org/img/'  + str(im_id) +  '.png width='  + str(self.imsize) +  'px   style=float:left;margin:5px>'					
					#print '<img src=http://communityexplorer.csregistry.org/img/'  + str(im_id) +  '.png'

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
				content += '[ <a href=' +self.scholars[idNode]['homepage'].replace("&"," and ")+ ' target=blank > View homepage </a ><br/>]'

		
			node = {}
			#node["nID"] = countnodes
			#node["sID"] = idNode
			#node["id"] = countnodes
			#node["group"] = 2
			#node["name"] = '"'+nodeLabel+'"'
			#node["color"] = "orange"
			#node["occ"] = 12
			#node["x"] = str(coords[idNode][0])
			#node["y"] = str(coords[idNode][1])
			#node["content"] = self.toHTML(content)
			node["id"] = idNode
			node["degree"] = 0
			node["size"] = 12
			nodes2.append(node)
			nodes[idNode] = countnodes
		countnodes+=1
	e = 0
	for n in self.Graph.edges_iter():#Memory, what's wrong with you?
		weight = str("%.2f" % self.Graph[n[0]][n[1]]['weight'])
		edge = {}
		edge["source"] = n[0].encode('utf-8')
		edge["target"] = n[1].encode('utf-8')
		nodes2[nodes[edge["source"]]]['degree']+=1 # incrementing the degree
		nodes2[nodes[edge["target"]]]['degree']+=1
		edge["weight"] = str(self.Graph[n[0]][n[1]]['weight'])
		#edge["type"] = self.Graph[n[0]][n[1]]['type']
		edges.append(edge)
		e+=1
		#if e%1000 == 0:
		#	print e

	graph = {}
	graph["nodes"] = nodes2
	graph["edges"] = edges
	return graph














