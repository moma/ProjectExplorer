## TinawebJS ProjectExplorer

This package is:
  - a JS client-side data explorer based on a graph-view of terms and the vizualisation of related information (word stats, search in a document base).
  - complemented with a few companion backends and tools


#### Basic usage
The app can be tested by simply opening explorerjs.html and providing a graph in `json` or `gexf` format (see exemples in the `data/` dir.)


#### Basic integration policy
As a client-side lib, **tinawebJS can entirely reside in the `static` directory of your app**.

So the procedure to integrate is basically just to extract the tinawebJS distribution in your `static` directory

There are two exceptions are:
  - the html starting point itself:  
    - to use it as is:

      1) just link to it from your html dir or templates dir
      ```
      ~/yourapp > ln -s static/tinawebJS/explorerjs.html
      ~/yourapp > ls -l
      4,0K 2030-03-15 16:49 HTML ELEMENTS OF YOUR APP
        32 2030-06-28 10:14 explorerjs.html -> static/tinawebJS/explorerjs.html
      ```
      2) apply the changing paths tool from `twtools/adapt_html_paths.sh`

    - to use it within a different GUI layout: take our html as an exemple and create your own html importing the same libs and exposing the same div ids.

  - optionally, the backends under `twbackends`:
    - they are the only server-side elements of the tina distribution
    - they contain their own readme as to how to run them on a server



#### Advanced usage

cf. developer_manual.md


#### old TODO update

- "JS Mode": TinawebJS est utilisé juste a niveau Javascript (HTML+CSS+JS), sans aide des modules php/python. C'est la version standalone, ça veut dire "lecture d'un fichier GEXF ou JSON".
	- Graph uni-partite.  http://localhost/TinawebJS_2015/explorerjs.html?file=data/0-terms-terms-MainNodes.gexf

	- Graph bi-partite.   http://localhost/TinawebJS_2015/explorerjs.html?file=data/cnrsfolder/2015-11-06T15:15:02.121958_graph.json



- "JS+PHP Mode": Quand il y a des GEXF|JSON et en plus une BD en sqlite en format CorText (manager.cortext.net). En ce mode on dois declarer une db.json avec l'info necessaire.
	- Graph bi-partite.   http://localhost/TinawebJS_2015/explorerjs.html
