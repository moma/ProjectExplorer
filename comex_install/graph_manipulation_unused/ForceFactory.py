import math

def buildRepulsion(adjustBySize,coefficient):
	if adjustBySize:
		return linRepulsion_antiCollision(coefficient)
	else:
		return linRepulsion(coefficient)


def getStrongGravity(coefficient):
	return strongGravity(coefficient)

def buildAttraction(logAttr,distributedAttr,adjustBySize,c):
	if adjustBySize:
		if logAttr:
			if distributedAttr:
				return logAttraction_degreeDistributed_antiCollision(c)
			else:
				return logAttraction_antiCollision(c)
		else:
			if distributedAttr:
				return linAttraction_degreeDistributed_antiCollision(c)
			else:
				return linAttraction_antiCollision(c)
	else:
		if logAttr:
			if distributedAttr:
				return logAttraction_degreeDistributed(c)
			else:
				return logAttraction(c)
		else:
			if distributedAttr:
				return linAttraction_massDistributed(c)
			else:
				return linAttraction(c)


class linRepulsion:
	def __init__(self,c):
		self.coefficient=c

	def apply_nn(self,n1,n2):
		if n1["fa2"] and n2["fa2"]:
		#Get the distance
			xDist = n1["x"] - n2["x"]
			yDist = n1["y"] - n2["y"]
			distance = math.sqrt(xDist * xDist + yDist * yDist)

			if (distance > 0):
			#NB: factor = force / distance
				factor=self.coefficient * n1["fa2"]["mass"] * n2["fa2"]["mass"]/math.pow(distance, 2)
				n1["fa2"]["dx"] += xDist * factor
				n1["fa2"]["dy"] += yDist * factor
				n2["fa2"]["dx"] -= xDist * factor
				n2["fa2"]["dy"] -= yDist * factor

	def apply_nr(self,n,r):
		#not used?
		'''
		xDist = n["x"] - r.config('massCenterX')
		yDist = n["y"] - r.config('massCenterY')
		distance = math.sqrt(xDist * xDist + yDist * yDist)
		if (distance > 0):
			factor = self.coefficient * n["fa2"]["mass"] * r.config('mass') /math.pow(distance, 2)
			n["fa2"]["dx"] += xDist * factor
			n["fa2"]["dy"] += yDist * factor
		'''

	def apply_g(self,n,g):
		xDist = n["x"]
		yDist = n["y"]
		distance = math.sqrt(xDist*xDist + yDist*yDist)
		if (distance > 0):
          	#NB: factor = force / distance
			factor = self.coefficient * n["fa2"]["mass"] * g / distance
			n["fa2"]["dx"] -= xDist * factor
			n["fa2"]["dy"] -= yDist * factor


class linRepulsion_antiCollision:
	def __init__(self,c):
		self.coefficient = c

	def apply_nn(self,n1,n2):
		if n1["fa2"] and n2["fa2"]:
		#Get the distance
			xDist = n1["x"] - n2["x"]
			yDist = n1["y"] - n2["y"]
			distance = math.sqrt(xDist * xDist + yDist * yDist) - n1["size"] - n2["size"]

			if (distance > 0):
			#NB: factor = force / distance
				factor=self.coefficient * n1["fa2"]["mass"] * n2["fa2"]["mass"]/math.pow(distance, 2)
				n1["fa2"]["dx"] += xDist * factor
				n1["fa2"]["dy"] += yDist * factor
				n2["fa2"]["dx"] -= xDist * factor
				n2["fa2"]["dy"] -= yDist * factor
			elif (distance < 0):
				factor = 100 * self.coefficient * n1["fa2"]["mass"] * n2["fa2"]["mass"]
				n1["fa2"]["dx"] += xDist * factor
				n1["fa2"]["dy"] += yDist * factor
				n2["fa2"]["dx"] -= xDist * factor
				n2["fa2"]["dy"] -= yDist * factor

	def apply_nr(self,n,r):
		#not used?
		'''
		xDist = n["x"] - r.config('massCenterX')
		yDist = n["y"] - r.config('massCenterY')
		distance = math.sqrt(xDist * xDist + yDist * yDist)
		if (distance > 0):
			factor = self.coefficient * n["fa2"]["mass"] * r.config('mass') /math.pow(distance, 2)
			n["fa2"]["dx"] += xDist * factor
			n["fa2"]["dy"] += yDist * factor
		elif(distance<0):
			factor = -self.coefficient * n["fa2"]["mass"] * r.getMass() / distance
			n["fa2"]["dx"] += xDist * factor
			n["fa2"]["dy"] += yDist * factor
		'''

	def apply_g(self,n,g):
		xDist = n["x"]
		yDist = n["y"]
		distance = math.sqrt(xDist*xDist + yDist*yDist)
		if (distance > 0):
          	#NB: factor = force / distance
			factor = self.coefficient * n["fa2"]["mass"] * g / distance
			n["fa2"]["dx"] -= xDist * factor
			n["fa2"]["dy"] -= yDist * factor

class strongGravity:
	def __init__(self,c):
		self.coefficient = c

	def apply_nn(self,n1,n2):
		pass

	def apply_nr(self,n,r):
		pass

	def apply_g(self,n,g):
		xDist = n["x"]
		yDist = n["y"]
		distance = math.sqrt(xDist*xDist + yDist*yDist)
		if (distance > 0):
          	#NB: factor = force / distance
			factor = self.coefficient * n["fa2"]["mass"] * g
			n["fa2"]["dx"] -= xDist * factor
			n["fa2"]["dy"] -= yDist * factor


class linAttraction:
	def __init__(self,c):
		self.coefficient=c

	def apply_nn(self,n1, n2, e):
		if n1["fa2"] and n2["fa2"]:
			xDist = n1["x"] - n2["x"]
			yDist = n1["y"] - n2["y"]
			factor = -self.coefficient * float(e)
			n1["fa2"]["dx"] += xDist * factor
			n1["fa2"]["dy"] += yDist * factor
			n2["fa2"]["dx"] -= xDist * factor
			n2["fa2"]["dy"] -= yDist * factor

class linAttraction_massDistributed:
	def __init__(self,c):
		self.coefficient=c

	def apply_nn(self,n1, n2, e):
		if n1["fa2"] and n2["fa2"]:
			xDist = n1["x"] - n2["x"]
			yDist = n1["y"] - n2["y"]
			factor = -self.coefficient * e / n1["fa2"]["mass"]

			n1["fa2"]["dx"] += xDist * factor
			n1["fa2"]["dy"] += yDist * factor
			n2["fa2"]["dx"] -= xDist * factor
			n2["fa2"]["dy"] -= yDist * factor

class logAttraction:
	def __init__(self,c):
		self.coefficient=c

	def apply_nn(self,n1, n2, e):
		if n1["fa2"] and n2["fa2"]:
			xDist = n1["x"] - n2["x"]
			yDist = n1["y"] - n2["y"]
			distance = math.sqrt(xDist * xDist + yDist * yDist)

			if (distance > 0):
			#NB: factor = force / distance
				factor = -self.coefficient * e * math.log(1 + distance)/distance
				n1["fa2"]["dx"] += xDist * factor
				n1["fa2"]["dy"] += yDist * factor
				n2["fa2"]["dx"] -= xDist * factor
				n2["fa2"]["dy"] -= yDist * factor

class logAttraction_degreeDistributed:
	def __init__(self,c):
		self.coefficient=c

	def apply_nn(self,n1, n2, e):
		if n1["fa2"] and n2["fa2"]:
			xDist = n1["x"] - n2["x"]
			yDist = n1["y"] - n2["y"]
			distance = math.sqrt(xDist * xDist + yDist * yDist)

			if (distance > 0):
			#NB: factor = force / distance
				factor = -self.coefficient * e * math.log(1 + distance)/distance/n1["fa2"]["mass"]
				n1["fa2"]["dx"] += xDist * factor
				n1["fa2"]["dy"] += yDist * factor
				n2["fa2"]["dx"] -= xDist * factor
				n2["fa2"]["dy"] -= yDist * factor

class linAttraction_antiCollision:
	def __init__(self,c):
		self.coefficient=c

	def apply_nn(self,n1, n2, e):
		if n1["fa2"] and n2["fa2"]:
			xDist = n1["x"] - n2["x"]
			yDist = n1["y"] - n2["y"]
			distance = math.sqrt(xDist * xDist + yDist * yDist)

			if (distance > 0):
			#NB: factor = force / distance
				factor = -self.coefficient * e
				n1["fa2"]["dx"] += xDist * factor
				n1["fa2"]["dy"] += yDist * factor
				n2["fa2"]["dx"] -= xDist * factor
				n2["fa2"]["dy"] -= yDist * factor

class linAttraction_degreeDistributed_antiCollision:
	def __init__(self,c):
		self.coefficient=c

	def apply_nn(self,n1, n2, e):
		if n1["fa2"] and n2["fa2"]:
			xDist = n1["x"] - n2["x"]
			yDist = n1["y"] - n2["y"]
			distance = math.sqrt(xDist * xDist + yDist * yDist)

			if (distance > 0):
			#NB: factor = force / distance
				factor = -self.coefficient * e / n1["fa2"]["mass"]
				n1["fa2"]["dx"] += xDist * factor
				n1["fa2"]["dy"] += yDist * factor
				n2["fa2"]["dx"] -= xDist * factor
				n2["fa2"]["dy"] -= yDist * factor

class logAttraction_antiCollision:
	def __init__(self,c):
		self.coefficient=c

	def apply_nn(self,n1, n2, e):
		if n1["fa2"] and n2["fa2"]:
			xDist = n1["x"] - n2["x"]
			yDist = n1["y"] - n2["y"]
			distance = math.sqrt(xDist * xDist + yDist * yDist)

			if (distance > 0):
			#NB: factor = force / distance
				factor = -self.coefficient * e * math.log(1 + distance)/distance
				n1["fa2"]["dx"] += xDist * factor
				n1["fa2"]["dy"] += yDist * factor
				n2["fa2"]["dx"] -= xDist * factor
				n2["fa2"]["dy"] -= yDist * factor

class logAttraction_degreeDistributed_antiCollision:
	def __init__(self,c):
		self.coefficient=c

	def apply_nn(self,n1, n2, e):
		if n1["fa2"] and n2["fa2"]:
			xDist = n1["x"] - n2["x"]
			yDist = n1["y"] - n2["y"]
			distance = math.sqrt(xDist * xDist + yDist * yDist)

			if (distance > 0):
			#NB: factor = force / distance
				factor = -self.coefficient * e * math.log(1 + distance)/distance/n1["fa2"]["mass"]
				n1["fa2"]["dx"] += xDist * factor
				n1["fa2"]["dy"] += yDist * factor
				n2["fa2"]["dx"] -= xDist * factor
				n2["fa2"]["dy"] -= yDist * factor



