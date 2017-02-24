class RVUniformC:
	def __init__(self,seed):
		self.a=16807
		self.b=0
		self.m=2147483647
		self.u=0
		self.semilla=seed
		self.x = self.semilla


	def getRandom(self):
		x = ((self.x*self.a)+self.b)%self.m
		self.x = x
		self.u = self.x/float(self.m)
		return self.u


#instancia = RVUniformC(100000000)
#instancia.getUniform()
