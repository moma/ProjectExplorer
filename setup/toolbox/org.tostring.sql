
-- if serialization must be parsable, separators need to be absent tokens
SELECT
    -- our convention (eg in dbdatapi.extract)
    CONCAT(name, '((', acro, '))', ";;", locname)
FROM orgs
ORDER BY RAND()
LIMIT 10;



-- if serialization is just for display : for human-readable labels
-- with CONCAT_WS => nice because removes null segments eg '('+NULL+')'
SELECT
    name,
    acro,
    locname,
    CONCAT_WS( '',
               CONCAT(name, ' '),
               CONCAT('(',acro,')'),
               CONCAT(', ', locname) )
FROM orgs
ORDER BY RAND()
LIMIT 10;



-- with CASE
SELECT
    name,
    acro,
    locname,

    -- 3 vars NULL or not => 8 cases
    -- but by def either acro or name is not null => 7 cases
    CASE
        WHEN name IS NULL AND acro IS NULL AND locname IS NULL
        THEN "_NULL"

        WHEN name IS NULL AND locname IS NULL
        THEN acro

        WHEN acro IS NULL AND locname IS NULL
        THEN name

        WHEN locname IS NULL
        THEN CONCAT (acro, ' (' ,name,')')

        -- locname cases
        WHEN name IS NULL
        THEN CONCAT (acro, ', ', locname)

        WHEN acro IS NULL
        THEN CONCAT (name, ', ', locname)

        -- eg "I3S (Laboratoire d'Informatique, Signaux et Systèmes), Sophia Antipolis, France"
        ELSE CONCAT (acro, ' (' ,name,'), ', locname)
    END AS tostring
FROM orgs
ORDER BY RAND()
LIMIT 10;


-- EXEMPLES:
-- +-----------------------------------------------------+-------------+--------------------------+----------------------------------------------------------------------------------+
-- | name                                                | acro        | locname                  | tostring                                                                         |
-- +-----------------------------------------------------+-------------+--------------------------+----------------------------------------------------------------------------------+
-- | Dynamiques et écologie des paysages agroforestiers  | DYNAFOR     | NULL                     | DYNAFOR (Dynamiques et écologie des paysages agroforestiers)                     |
-- | University of Waterloo                              | NULL        | Waterloo, Canada         | University of Waterloo, Waterloo, Canada                                         |
-- | University of Arizona                               | NULL        | Tucson, Arizona, USA     | University of Arizona, Tucson, Arizona, USA                                      |
-- | Laboratoire d'Informatique, Signaux et Systèmes     | I3S         | Sophia Antipolis, France | I3S (Laboratoire d'Informatique, Signaux et Systèmes), Sophia Antipolis, France  |
-- | Visvesvaraya National Institute of Technology       | NULL        | NULL                     | Visvesvaraya National Institute of Technology                                    |
-- | Sciences Po                                         | NULL        | Paris, France            | Sciences Po, Paris, France                                                       |
-- | School of Human Evolution and Social Change         | SHESC       | NULL                     | SHESC (School of Human Evolution and Social Change)                              |
-- | NULL                                                | DSSCQ       | NULL                     | DSSCQ                                                                            |
-- +-----------------------------------------------------+-------------+--------------------------+----------------------------------------------------------------------------------+
