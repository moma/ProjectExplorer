## This is the legacy comex app cleaned and ready for future refactoring

It contains:  
  - an html index based on old bootstrap
  - several php files specialized in retrieving custom lists of scholars, labs, jobs for directory showing
    - whoswho.js is used to GUIise the queries
    - legacy jquery and highcharts are used to GUIise the directories
  - a linked couple python server + tinawebJS to explore the same data in graph view
    - the python server is in comex_install/ dir
    - run it with `python3 main.py` and reverse-proxy its host:port to `/comexAPI` location
    - the twjs is in a legacy version, downloadable at [commit 11e7d77](https://github.com/moma/tinawebJS/tree/11e7d77b71ae096b7fad2cfbd716c3c724966ad2)

#### Installation
  1. clone this repo
  2. get the tinawebJS contents into `./tinawebJS`
  3. get the community.db sqlite3 database into `./`

#### TODOES for future refactoring
  1. remove the legacy links to csregistry.org
  2. replace the registration/profile pages with the new [regcomex app server](https://github.com/moma/regcomex)
  3. replace community.db PDO connections by the new comex_shared MySQL tables
