# -*- encoding: utf-8 -*-
country={}
country["afghanistan"]="AF"
country["armenia"]="AM"
country["argentina"]="AR"
country["austria"]="AT"
country["australia"]="AU"
country["bosnia and herzegovina"]="BA"
country["bangladesh"]="BD"
country["belgium"]="BE"
country["burkina faso"]="BF"
country["bulgaria"]="BG"
country["burundi"]="BI"
country["benin"]="BJ"
country["la paz - bolivia"]="BO"
country["325 - bethânia - ipatinga - minas gerais - brasil"]="BR"
country["883 fundos sidil divinópolis mg brasil"]="BR"
country["883 sidil divinópolis mg brasil"]="BR"
country["avenida josé assis de vasconcelos"]="BR"
country["brasil"]="BR"
country["brazil"]="BR"
country["rio de janeiro"]="BR"
country["rua itapecerica"]="BR"
country["rua meaipe . condominio valparaiso i. bloco c1. apt 204. laranjeiras - serra- es"]="BR"
country["viçosa mg"]="BR"
country["botswana"]="BW"
country["btbswb"]="BW"
country["belarus"]="BY"
country["canada"]="CA"
country["congo democratic republic of"]="CG"
country["democratic republic of congo"]="CG"
country["democratic republic of the congo"]="CG"
country["geneva"]="CH"
country["switzerland"]="CH"
country["chile"]="CL"
country["cameroon"]="CM"
country["cameroun"]="CM"
country["china"]="CN"
country["hong kong"]="CN"
country["shanghai"]="CN"
country["中国"]="CN"
country["colombia"]="CO"
country["costa rica"]="CR"
country["germany"]="DE"
country["denmark"]="DK"
country["dominican republic"]="DO"
country["egypt"]="EG"
country["spain"]="ES"
country["ethiopia"]="ET"
country["france"]="FR"
country["britain"]="GB"
country["england"]="GB"
country["u.k."]="GB"
country["uk"]="GB"
country["united kingdom"]="GB"
country["united kingdon"]="GB"
country["accraghana"]="GH"
country["ghana"]="GH"
country["the gambia"]="GM"
country["greece"]="GR"
country["guatemala"]="GT"
country["guatemala city"]="GT"
country["honduras"]="HN"
country["haiti"]="HT"
country["indonesia"]="ID"
country["yogyakarta"]="ID"
country["ireland"]="IE"
country["israel"]="IL"
country["184-1 thiruvikanagar street"]="IN"
country["184/1 thiruvikanagar .harur tk.dharmapuri.tamilnadu st"]="IN"
country["dharmapuri dt"]="IN"
country["dist.udalguri.p.o. dimakuchi.vill.no 2 sonajuli"]="IN"
country["harur tk & po"]="IN"
country["india"]="IN"
country["nagaland india"]="IN"
country["state assam"]="IN"
country["tamilnadu st.india"]="IN"
country["italy"]="IT"
country["jordan"]="JO"
country["kenya"]="KE"
country["kenya."]="KE"
country["kenyan"]="KE"
country["kyrgyzstan"]="KG"
country["cambodia"]="KH"
country["lebanon"]="LB"
country["sri lanka"]="LK"
country["lithuania"]="LT"
country["moldova"]="MD"
country["mali"]="ML"
country["malawi"]="MW"
country["dona ana"]="MX"
country["mexico"]="MX"
country["méxico"]="MX"
country["osvaldoalbuquerque65@hotmail.com"]="MX"
country["malaysia"]="MY"
country["mozambique"]="MZ"
country["namibia"]="NA"
country["abuja-nigeria"]="NG"
country["nigeria"]="NG"
country["nigeria/australia"]="NG"
country["netherlands"]="NL"
country["the netherlands"]="NL"
country["the netherlands and egypt"]="NL"
country["norway"]="NO"
country["nepal"]="NP"
country["new zealand"]="NZ"
country["oman"]="OM"
country["panama"]="PA"
country["peru"]="PE"
country["papua new guinea"]="PG"
country["philippines"]="PH"
country["pakistan"]="PK"
country["palestine"]="PS"
country["paraguay"]="PY"
country["qatar"]="QA"
country["romania"]="RO"
country["republic of serbia"]="RS"
country["serbia"]="RS"
country["russian federation"]="RU"
country["rwanda"]="RW"
country["sverige"]="SE"
country["sweden"]="SE"
country["singapore"]="SG"
country["slovenia"]="SI"
country["somalia"]="SO"
country["united state somalia diaspora"]="SO"
country["el salvador"]="SV"
country["swaziland"]="SZ"
country["togo"]="TG"
country["thailand"]="TH"
country["turkey"]="TR"
country["tanzania"]="TZ"
country["tanzania in east africa"]="TZ"
country["usa & tanzania"]="TZ"
country["Украина.Одесса"]="UA"
country["uganda"]="UG"
country["uganda-africa"]="UG"
country["17 dennison st"]="US"
country["america"]="US"
country["atlanta ga"]="US"
country["u.s.a."]="US"
country["united state of america"]="US"
country["united states"]="US"
country["united states of america"]="US"
country["us"]="US"
country["usa"]="US"
country["waltham ma"]="US"
country["venezuela"]="VE"
country["vietnam"]="VN"
country["kosovo"]="XK"
country["republic of south africa"]="ZA"
country["south africa"]="ZA"
country["zambia"]="ZM"
country["uftu"]="TR"
country["zambia and south africa"]="ZM"
country["zimbabwe"]="ZW"
#print country
project='nci'
import sqlite3
connDBLP=sqlite3.connect('data/'+project+'/graph.db')
connDBLP.row_factory = sqlite3.Row# Magic line!
cursorDBLP=connDBLP.cursor()

query="ALTER TABLE ISIKeyword ADD COLUMN old_data char(250)"
cursorDBLP.execute(query)
connDBLP.commit()


query="SELECT rowid,data FROM ISIkeyword"
cursorDBLP.execute(query)
rows = cursorDBLP.fetchall()

for i in rows:
	q2='UPDATE ISIkeyword SET old_data="'+i["data"]+'" WHERE rowid='+`i["rowid"]`
	cursorDBLP.execute(q2)
	connDBLP.commit()

	ind=i["data"].encode("UTF-8")
	if country.has_key(ind):   
		q3='UPDATE ISIkeyword SET data="'+ country[ind]+'" WHERE rowid='+`i["rowid"]`
		cursorDBLP.execute(q3)
		connDBLP.commit()
	print i["rowid"]

print "finish"


#newdict={}

#x=1
#for pub in rows:
#	ind=pub[0].encode("UTF-8")
#	if not country.has_key(ind):
#		newdict[pub[0]]=1
#	else:
#		p

#for i in newdict:
#	print i

connDBLP.close()
