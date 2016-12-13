#### Structure
  - `extractDataCustom.py`: starting from a query or a scholar's id, retrieves all related kw+neighbors data from DB, and builds a graph's json with the metadata and custom html in node's `content` property
  - `converter.py`: normalizes country names and codes

#### Requirements
  see global documentation
  (this module no longer need to be ran independantly, now part of main run.sh)

#### History
Several modules related to graph community region extraction and graph force atlas layout have been moved to `graph_manipulation_unused` dir, because they are replaced by a client-side FA2 in tinawebJS.

Extraction logic originally developed by [S. Castillo](https://github.com/PkSM3/)  
python3 port and merge with regcomex into ../comex_main_backend by [R. Loth](https://github.com/rloth/)

Copyright 2014-2016 ISCPIF/CNRS - UPS 3611
