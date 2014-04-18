import math

class Region:

	def __init__(self,nodes, depth):
		#print "the atributes"		
		self.depthLimit = 20
		self.size = 0
		self.nodes = nodes
		self.subregions = []
		self.depth = depth
		self.p = { "mass": 0, "massCenterX": 0, "massCenterY": 0 }
		self.updateMassAndGeometry()

	def updateMassAndGeometry(self):
		#print "updating mass and geometry"
		nds = self.nodes
		if len(nds) > 1:
			mass=0
			massSumX=0
			massSumY=0
			for n in range(len(nds)):
				mass += nds[n]['fa2']['mass']
				massSumX += nds[n]['x'] * nds[n]['fa2']['mass']
				massSumY += nds[n]['x'] * nds[n]['fa2']['mass']

			massCenterX = massSumX / mass
			massCenterY = massSumY / mass
			size=0
			for n in range(len(nds)):
				distance = math.sqrt( (nds[n]['x'] - massCenterX) *(nds[n]['x'] - massCenterX) +(nds[n]['y'] - massCenterY) *(nds[n]['y'] - massCenterY) )
				size = max((self.size or (2 * distance)), 2 * distance)
			
			self.p['mass'] = mass;
			self.p['massCenterX'] = massCenterX;nds
			self.p['massCenterY'] = massCenterY;
			self.size = size;



	def buildSubRegions(self):
		#print "buildSubRegions"
		nds = self.nodes
		if len(nds) > 1:
			subregions = []
			massCenterX = self.p['massCenterX']
			massCenterY = self.p['massCenterY']
			nextDepth = self.depth + 1
			leftNodes = []
			rightNodes = []
			for n in range(len(nds)):
				#nodesColumn = (nds[n]['x'] < massCenterX) ? (leftNodes) : (rightNodes);
				if (nds[n]['x'] < massCenterX):	nodesColumn= leftNodes
				else:	nodesColumn = rightNodes
				nodesColumn.append(nds[n])
			topleftNodes = []
			bottomleftNodes = []
			for n in range(len(nds)):
				#nodesLine = (n.y() < massCenterY) ? (topleftNodes) : (bottomleftNodes);
				if nds[n]['y'] < massCenterY:	nodesLine = topleftNodes
				else:	nodesLine = bottomleftNodes
				nodesLine.append(nds[n])

			bottomrightNodes = []
			toprightNodes = []
			for n in range(len(nds)):
				#nodesLine = (n.y() < massCenterY) ? (toprightNodes) : (bottomrightNodes);
				if nds[n]['y'] < massCenterY:	nodesLine = toprightNodes
				else:	nodesLine = bottomrightNodes
				nodesLine.append(nds[n])

			if (len(topleftNodes) > 0):
				if (len(topleftNodes) < len(nds) and nextDepth <= self.depthLimit):
					subregion = Region(topleftNodes,nextDepth)
					subregions.append(subregion)
				else:
					for n in range(len(topleftNodes)):
						oneNodeList = []
						oneNodeList.append(topleftNodes[n])
						subregion = Region(oneNodeList,nextDepth)
						subregions.append(subregion)

			if (len(bottomleftNodes) > 0):
				if (len(bottomleftNodes) < len(nds) and nextDepth <= self.depthLimit):
					subregion = Region(bottomleftNodes,nextDepth)
					subregions.append(subregion)
				else:
					for n in range(len(bottomleftNodes)):
						oneNodeList = []
						oneNodeList.append(bottomleftNodes[n])
						subregion = Region(oneNodeList,nextDepth)
						subregions.append(subregion)

			if (len(bottomrightNodes) > 0):
				if (len(bottomrightNodes) < len(nds) and nextDepth <= self.depthLimit):
					subregion = Region(bottomrightNodes,nextDepth)
					subregions.append(subregion)
				else:
					for n in range(len(bottomrightNodes)):
						oneNodeList = []
						oneNodeList.append(bottomrightNodes[n])
						subregion = Region(oneNodeList,nextDepth)
						subregions.append(subregion)

			if (len(toprightNodes) > 0):
				if (len(toprightNodes) < len(nds) and nextDepth <= self.depthLimit):
					subregion = Region(toprightNodes,nextDepth)
					subregions.append(subregion)
				else:
					for n in range(len(toprightNodes)):
						oneNodeList = []
						oneNodeList.append(toprightNodes[n])
						subregion = Region(oneNodeList,nextDepth)
						subregions.append(subregion)

			self.subregions = subregions
			for i in range(len(subregions)):
				subregions[i].buildSubRegions()



			

	def applyForce(self, n , Force , theta):
		if len(self.nodes) < 2:
			regionNode = self.nodes[0]
			Force.apply_nn(n, regionNode)
		else:
			distance = math.sqrt((n["x"] - self.p["massCenterX"]) * (n["x"] - self.p["massCenterX"]) + (n["y"] - self.p["massCenterY"]) * (n["y"] - self.p["massCenterY"]))
			if (distance * theta > self.size):
				Force.apply_nr(n, self)
			else:
				for i in range(len(self.subregions)):
					self.subregions[i].applyForce(n, Force, theta)

