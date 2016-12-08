## comex app ready for future refactoring

It contains:  
  - an html index based on old bootstrap
  - several php files specialized in retrieving custom lists of scholars, labs, jobs for directory showing
    - whoswho.js is used to GUIise the queries
    - legacy jquery and highcharts are used to GUIise the directories
  - a linked couple python server + tinawebJS to explore the same data in graph view
    - the python server is in comex_install/ dir
    - run it with `python3 main.py` and reverse-proxy its host:port to `/comexAPI` location
    - the twjs is in a legacy version, downloadable at [commit 11e7d77](https://github.com/moma/tinawebJS/tree/11e7d77b71ae096b7fad2cfbd716c3c724966ad2)
------
### Installation
  1. clone this repo
  2. get the tinawebJS contents into `./tinawebJS`
  3. get the community.db sqlite3 database into `./`

#### TODOES for future refactoring
  1. remove the legacy links to csregistry.org
  2. replace the registration/profile pages with the new [regcomex app server](https://github.com/moma/regcomex) [DONE]
  3. replace community.db PDO connections by the new comex_shared MySQL tables [IN PROGRESS]


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
