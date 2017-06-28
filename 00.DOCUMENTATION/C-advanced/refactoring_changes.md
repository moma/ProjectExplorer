## Liste des principaux changements effectués

... durant la refonte à l'occasion du passage à sigma 1.2

  1. refonte du début du `main` pour distinguer les choix initiaux (mode gexf et mode json, biparti ou pas) de la suite harmonisée (instanciation du graphe)
  2. réécriture accesseurs et actions d'affichage (suppression de certains rendus identiques consécutifs)
  3. préparation d'un index inversé par attributs
    - structure valeurs par attributs => liste des nodes
    - ou groupes de valeurs par attributs => liste des nodes
    - utile pour les filtres, les légendes et facettes de recherche
    - sait créer de façon configurable des "bins" (= paniers de valeurs) pour tout attribut à valeurs continues ou ayant un effectif très nombreux
  4. selection: code simplifié pour les évenements click, et rendu plus esthtique pour l'identification des voisins
  5. sélection sur zone beaucoup plus rapide grace au quadtree
  6. exploration plus fluide grace au précalcul des couleurs de base, alternatives, grisées
  7. optimisations mémoire
    - éviter dans une large mesure les copies implicites de l'ensemble des nodes
    - version sigma.noIndexes.js sans les indexs faisant doublons avec tina
         - par défaut ces indexs doublaient la signature RAM
         - ancien tina 60MB => nouveau 120MB
         - avec la version noIndexes ancien 60MB => nouveau 64MB
  8. nouvelle api topPapers pour l'interrogation directe de twitter
  9. meilleure stratégie pour les customizations du rendering (elles ne nécessitent plus de modifier le code de sigma lui-même)
  10. nouveau layout plus rapide lors des évenements resize
  11. reconnexion du mode biparti qui était fonctionnel dans les versions tina classiques (types nommés en durs "sem/soc" avant 2014) avec l'architecture SystemStates dans les tina après 2014 (qui préserve l'historique des types mais les encode d'une façon plus compliquée à base de "typestrings")
  12. plusieurs rangements
    - suppression des anciennes structures "localdb" inutilisées (héritées de cortext?)
    - portage vers les librairies bootstrap et jquery dans leurs nouvelles versions
    - ajout de namespaces pour limiter le nombre de variables globales
    - settings_explorer: suppression de settings non utilisés, reconnexion de settings présents
    - suppression de fonctions obsolètes
  13. debugFlags dans les settings
  14. intégration du plugin sigma noverlap: fonctionnalité très importante (mais coûteuse)
  15. mode 'standalone' (local), ajout d'un <input type='file'>

### Changements cours ou encore à faire:
  15. architecture générale
    - fonctions linéaires sur scénarios ==> objets d'interaction + évenements
      (serait beaucoup plus facile à maintenir et faciliterait la modularité)
  16. utilisation plus à fond des nouveaux plugins sigma
    - cf. http://twjs.org/sigma
    - `filters` très puissant
       - stratégie via la prop `hidden` (au lieu de del/add comme actuellement)
       - primitives combinables: nodesBy, edgesBy, neighborsOf
    - dragNodes: plus agréable de pouvoir déplacer les noeuds
  17. clarifications reverse api
    - specifications sur arguments en entrée (url) et possibilités bridge
    - specifications sur types de documents
      - noms des categories attendues, et attributs possibles
      - formats à savoir traiter
  18. clarifications API pour les serveurs de sources
    - serveur topPapers à inclure comme module ou projets à part
    - spécificités API gargantext (actions sur les Ngrammes/listes) : inclure ou à part ?
  19. cohérence de certains choix:
    - la selection des "opposite neighbors" n'est pas close: on ne retrouve que le voisinage local, mais on ne peut pas retomber sur le graphe d'origine sans recharger la page
    - pourquoi catSoc par défaut?  => FAIT
    - pourquoi ne pas intégrer fillGraph dans l'instance parseCustom ?
    - pourquoi ne pas intégrer env/listeners dans l'instance TW ?
  20. thèmes de couleurs possibles + effets canvas eg multiply => possibilités GUI



  // £TODO rendering optimization: reduce effort by looping only on previously selected and neighbors
  //       and having (!active && !highlight) tested instead of then useless grey flag
