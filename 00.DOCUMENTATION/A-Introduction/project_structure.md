Résumé de la structure globale
----------------------------------

Après commits de la semaine 26-30 juin 2017, une structure plus facile pour les déploiements
  - les settings sont le seul élément à part
  - les sous-dossiers respectent la "separation of concerns"
  - une valeur dans les settings et un script bash à lancer 1 fois (adapt_html_paths.sh) suffisent à reconfigurer toute l'appli pour des routes de déploiement spécifiques (par exemple ajouter un prefixe comme 'static/tinawebJS' à tous les liens internes)
  - un nouveau dossier twpresets contient des configurations toutes faites pour les cas de déploiement les plus fréquents
  - les librairies tierces-parties ont été groupées permettant de les substituer avec plus de facilité lors de factorisation avec les mêmes libs déjà déployées autrement, ou lors de màj de ces librairies

```
├── 00.DOCUMENTATION
│   └── (fusionné avec ./doc)
├── data
│   └── (graphes par sous-projets)
├── db.json
├── explorerjs.html         <= point d'entrée lancement
├── settings_explorerjs.js  <= point d'entrée config
├── favicon.ico
├── LICENSE
├── README.md
├── twbackends              <= APIS externes
│   ├── phpAPI              <= api CSV et CortextDB
│   └── twitterAPI2
├── twlibs                  <= librairies développées chez nous
│   ├── css
│   ├── fonts
│   ├── img
│   └── README.md
├── twlibs3                 <= librairies tierces-parties
│   ├── bootstrap-3
│   ├── bootstrap-native
│   ├── freshslider
│   ├── jquery-3
│   ├── readmore.js
│   ├── sigma_v1.2
│   ├── sigma_v1.5
│   └── tweets
|
├── twmain                  <=   ancien dossier tinawebJS
│   ├── main.js
│   ├── extras_explorerjs.js  <= ajouté à l'intérieur
│   ├── (etc)
│   └── Tinaweb.js
|
├── twmodules              <= modules internes
│   ├── crowdsourcingModule
│   └── histogramModule
├── twpresets               <= variantes de settings
│   ├── README.md
│   └── settings_explorerjs.comex.js
└── twtools
    |
    └── adapt_html_paths.sh  <= "compile" un nouvel explorerjs.prod.html
                                avec les routes utilisées au déploiement
```
