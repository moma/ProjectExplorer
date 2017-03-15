SELECT scholars.first_name, scholars.last_name,
       GROUP_CONCAT(labs.label SEPARATOR '/') AS labs_list,
       GROUP_CONCAT(insts.label SEPARATOR '/') AS insts_list
FROM scholars
LEFT JOIN sch_org AS map_labs
    ON map_labs.uid = luid
JOIN orgs AS labs
    ON map_labs.orgid = labs.orgid
LEFT JOIN sch_org AS map_insts
    ON map_insts.uid = luid
JOIN orgs AS insts
    ON map_insts.orgid = insts.orgid
WHERE labs.class = 'lab'
AND  insts.class = 'inst'
AND luid IN (3794,3779,2638,3704)
GROUP BY luid ;
--
-- +------------+-------------+-------------------------------------------------------------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------------------------------------+
-- | first_name | last_name   | labs_list                                                                                                                                       | insts_list                                                                                                                             |
-- +------------+-------------+-------------------------------------------------------------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------------------------------------+
-- | David      | Chavalarias | Institut des Systèmes Complexes de Paris Ile-de-France (ISCPIF), Paris, France                                                                  | Centre National de la Recherche Scientifique (CNRS), France                                                                            |
-- | Paul       | Bourgine    | Centre de Recherche en Epistémologie Appliquée (CREA), /Centre de Recherche en Epistémologie Appliquée (CREA),                                  | Ecole Polytechnique (X), Palaiseau, France/Centre National de la Recherche Scientifique (CNRS), France                                 |
-- | Pierre     | Magistry    | Analyse Linguistique Profonde A Grande Echelle  (ALPAGE), Paris, France/Analyse Linguistique Profonde A Grande Echelle  (ALPAGE), Paris, France | Université Paris 7 – Diderot (Paris 7), Paris, France/Institut National de Recherche en Informatique et Automatique (INRIA), France    |
-- | Samuel     | Castillo    | Institut des Systèmes Complexes de Paris Ile-de-France (ISCPIF), Paris, France                                                                  | Centre National de la Recherche Scientifique (CNRS), France                                                                            |
-- +------------+-------------+-------------------------------------------------------------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------------------------------------------------+
