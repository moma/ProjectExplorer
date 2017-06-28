### About deployment of ProjectExplorer

This directory contains the copy of "tina2" from the ProjectExplorer repo:
https://github.com/moma/ProjectExplorer


#### Sub-tree creation
It was added via:
```
git remote add subtreeProjectExplorer https://github.com/moma/ProjectExplorer
git subtree add --squash --prefix=static/tinawebJS subtreeProjectExplorer master
```

#### Configuration

We generated the production html file:
```
cd static/tinawebJS
bash twtools/adapt_html_paths.sh 'static/tinawebJS/'
cd ../..
ln -s static/tinawebJS/explorerjs.prod.html explorerjs.html
```

And we used the adapted settings file (comex branding and no relatedDoc):
```
cd static/tinawebJS/
cp twpresets/settings_explorerjs.comex.js settings_explorerjs.js
```


### Utilisation en développement quotidien

Il n'y a plus rien de particulier à faire du côté de l'appli déployée. Le dossier contient les éléments de tina qui nous sont nécessaires. On peut ignorer l'existence du subtree et travailler normalement, dans ce dossier et ailleurs.

**=> nos opérations de commit / pull quotidiennes ne sont pas affectées**

Il n'est pas non plus nécessaire de prendre en compte la présence ou l'absence de la "remote" (lien extérieur) dans son travail.

### Utilisation avancée: pour propager les résultats entre dépôts

A présent le dépôt tina peut être vu comme une sorte de dépôt upstream circonscrit à un seul sous-dossier **`static/lib/graphExplorer`** !

Mais si des changements interviennent dans le dépôt tina, ils ne seront pas automatiquement intégrés dans sa copie intégrée à garg ou comex. Pour opérer des A/R entre les dépôts le plus simple est une 1ère fois d'ajouter le même pointeur extérieur :
```
git remote add subtreeProjectExplorer https://github.com/moma/ProjectExplorer
```

A partir de là, il devient très simple de faire des opérations push/pull entre dépôts si besoin est..

  1. Récupération de mises à jour tina => comex ou garg.
     Pour intégrer des changements upstream de tina vers garg ou comex, il suffit de lancer la commande suivante:

    ```
    git subtree pull --prefix=static/lib/graphExplorer subtreeProjectExplorer master --squash
    ```

  2. Inversement, les changements effectués dans le dossier **`static/lib/graphExplorer`** par les développeurs garg ou comex peuvent aussi être poussés du dépôt garg ou comex vers le dépôt tina par un subtree push
    ```
    git subtree push --prefix=static/lib/graphExplorer subtreeProjectExplorer master
    ```
