Résumé de la structure globale
----------------------------------

Après commits de la semaine 26-30 juin 2017, une structure plus facile pour les déploiements
  - les settings sont le seul élément à part
  - les sous-dossiers respectent la "separation of concerns"
  - une valeur dans les settings et un script bash à lancer 1 fois (adapt_html_paths.sh) suffisent à reconfigurer toute l'appli pour des routes de déploiement spécifiques (par exemple ajouter un prefixe comme 'static/tinawebJS' à tous les liens internes)
  - un nouveau dossier twpresets contient des configurations toutes faites pour les cas de déploiement les plus fréquents
  - les librairies tierces-parties ont été groupées permettant de les substituer avec plus de facilité lors de factorisation avec les mêmes libs déjà déployées autrement, ou lors de màj de ces librairies
  - la structure "projet" gouverne l'organisation des données sous `data` selon le principe: un sous-dossier de `data` = un projet

```
|
├── 00.DOCUMENTATION
|
├── explorerjs.html         <= **le point d'entrée / lancement**
|
├── settings_explorerjs.js  <= la config générale
|
├── data                    <= les données (graphes par sous-projets)
│   │
│   ├── exemplemini                  <= nom d'un "projet"
│   │    │
│   │    └─ unfichiergraphe.gexf
│   │
|   └── exemplemaxi                  <= un autre "projet"
│        │
│        ├─ unfichiergraphe.json     <= les graphes peuvent être json ou gexf
│        │
│        ├─ unebaseassociee.csv      <= on peut associer des bases de docs liés
│        │
│        ├─ unfichiergraphe2.gexf
│        │
│        ├─ unebaseassociee2.sql
│        │
│        ├─ hit_templates            <= dossier des templates de résultats
│        │    │
│        │    └─ ma_template.html    <= pour faire apparaitre les docs liés
│        │                          (exemples sous twlibs/default_hit_templates)
│        ├─ (etc.)
│        │
│        └─ project_conf.json  <= pour déclarer:
│                                 - types de nodes
│                                 - colorations/légendes des attributs des nodes
|                                 - les bases associées pour les requêtes
|                                   (et les templates de résultats ad hoc)
|
├── server_menu.json        <= liste des sources gexf/json par projet (optionnelle: sert à afficher un menu)
├── favicon.ico
├── LICENSE
├── README.md
|
├── twbackends              <= APIS externes
│   ├── phpAPI              <= api CSV et CortextDB
│   └── twitterAPI2
|
├── twlibs                  <= librairies développées chez nous
│   ├── css
│   ├── fonts
│   ├── img
│   └── README.md
|
├── twlibs3                 <= librairies tierces-parties
│   ├── bootstrap-3
│   ├── bootstrap-native
│   ├── freshslider
│   ├── jquery-3
│   ├── readmore.js
│   ├── sigma_v1.2
│   └── tweets
|
├── twmain                  <=   ancien dossier tinawebJS
|   |                            (contient l'essentiel des scripts)
│   ├── main.js
│   ├── extras_explorerjs.js  <= ajouté à l'intérieur
│   ├── (etc)
│   └── Tinaweb.js
|
├── twmodules              <= modules internes
│   ├── crowdsourcingModule
│   └── histogramModule
|
├── twpresets               <= variantes de settings pour déploiement
│   ├── README.md
│   └── settings_explorerjs.comex.js
|
└── twtools
    |
    └── adapt_html_paths.sh  <= "compile" un nouvel explorerjs.prod.html
                                avec les routes utilisées au déploiement
```
