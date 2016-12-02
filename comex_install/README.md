#### Structure
  - `main.py`: exposes the web app and routes to the correct functions according to request's GET parameters
  - `extractDataCustom.py`: starting from a query or a scholar's id, retrieves all related kw+neighbors data from DB, and builds a graph's json with the metadata and custom html in node's `content` property
  - `converter.py`: normalizes country names and codes

#### Requirements
  - flask
  - networkx

#### History

Several modules related to graph community region extraction and graph force atlas layout have been moved to `graph_manipulation_unused` dir, because they are replaced by a client-side FA2 in tinawebJS.

Extraction logic originally developed by [S. Castillo](https://github.com/PkSM3/)  
python3 port by [R. Loth](https://github.com/rloth/)

Copyright 2014-2016 ISCPIF/CNRS - UPS 3611
