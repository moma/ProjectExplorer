## comex app with refactoring in progress

It contains:  
  - an html index based on old bootstrap
  - several php files specialized in retrieving custom lists of scholars, labs, jobs for directory showing
    - `whoswho.js` is used to GUIise the queries
    - legacy jquery and highcharts are used to GUIise the directories
  - a linked couple python server + tinawebJS to explore the same data in graph view
    - the python server is in `services/db_to_tina_api` dir
    - run it with `python3 main.py` and reverse-proxy its host:port to `/comexAPI` location
    - the twjs is in a legacy version, downloadable [via this subtree](https://github.com/moma/tinawebJS/tree/comex_wip)

------
### Installation
  1. clone this repo
  2. checkout the `mysql_refacto_prototype` branch
  3. set the correct MySQL host in `parametres_comex.ini`

#### TODOES for future refactoring
  - remove the legacy links to csregistry.org
  - merge the user services ([regcomex](https://github.com/moma/regcomex)) with the db_to_tina_api services (ex-comex_install)
  - merge the static files


------
### DB structure

###### Overview
  - `scholars` is the main table, with a **doors_uid** as primary key
     - email is also unique in this table
  - we have three related tables
    - `affiliations` (directly pointed by an **affiliation_id** in scholars table)
    - `keywords` (pointed by an intermediate user id <=> keyword id table `sch_kw`)
    - `linked_ids` (not used yet, to join the uid with external ids like ORCID)

###### More info
Full table structure is described in [this documentation file](https://github.com/moma/regcomex/blob/c5badbc/doc/table_specifications.md).

###### Exemple queries
```SQL

-- ==========================
-- FOR SCHOLAR + AFFILIATIONS
-- ==========================
SELECT
    scholars.*,
    affiliations.*,
FROM scholars
LEFT JOIN affiliations
    ON affiliation_id = affid


-- ==================================
-- FOR SCHOLAR + KEYWORDS IN ONE LINE
-- ==================================
SELECT
    scholars.*,
    COUNT(keywords.kwid) AS keywords_nb,
    GROUP_CONCAT(kwstr) AS keywords_list
FROM scholars
JOIN sch_kw
    ON doors_uid = uid
JOIN keywords
    ON sch_kw.kwid = keywords.kwid
GROUP BY uid ;
```

##### Copyright
###### Authors
  - Researchers and engineers of the ISC-PIF
     - David Chavalarias
     - Samuel Castillo
     - Romain Loth

###### Acknowledgments
  - Former Tina developers (java-based software from which tinawebJS is adapted)
     - Elias Showk
     - Julian Bilcke
