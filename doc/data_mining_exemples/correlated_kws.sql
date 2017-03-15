

-- keywords
SELECT orgs.label,
       keywords.kwstr,
       keywords.occs

FROM orgs

-- transition via scholars
LEFT JOIN sch_org ON sch_org.orgid = orgs.orgid
JOIN scholars ON sch_org.uid = luid

-- linked keywords
LEFT JOIN sch_kw
    ON sch_kw.uid = luid
JOIN keywords
    ON sch_kw.kwid = keywords.kwid

WHERE orgs.orgid = 3476

GROUP BY orgs.orgid,keywords.kwid
ORDER BY orgs.name, orgs.acro, keywords.occs DESC, keywords.kwstr
;


-- *champion keywords*
-- =====================

-- same with LOCAL threshold (ie > local avg) on occs and concat
-- !!! THIS IS REALLY INTERESTING IN ANY context <=> word occs SITUATION !!!
SELECT orgs.label,
       keywords.kwstr,
       keywords.occs,
       thresholds.thr

FROM orgs
-- transition via scholars
LEFT JOIN sch_org ON sch_org.orgid = orgs.orgid
JOIN scholars ON sch_org.uid = luid

-- linked keywords
LEFT JOIN sch_kw
   ON sch_kw.uid = luid
JOIN keywords
   ON sch_kw.kwid = keywords.kwid

LEFT JOIN (
    -- create the threshold
    SELECT orgs.orgid,
           avg(keywords.occs) AS thr
    FROM orgs
    -- transition via scholars
    LEFT JOIN sch_org ON sch_org.orgid = orgs.orgid
    JOIN scholars ON sch_org.uid = luid

    -- linked keywords
    LEFT JOIN sch_kw
        ON sch_kw.uid = luid
    JOIN keywords
        ON sch_kw.kwid = keywords.kwid
    GROUP BY orgs.orgid
) AS thresholds
  ON thresholds.orgid = orgs.orgid

WHERE orgs.orgid IN (3466, 3476, 3668, 3669,
                     3191, 3175, 3167)
    AND keywords.occs >= MAX(2,thresholds.thr)
GROUP BY orgs.orgid
        , keywords.kwid
ORDER BY orgs.name, orgs.acro, keywords.occs DESC, keywords.kwstr
;



-- *correlated keywords*
-- POSSIBLE same technique as champion keywords
--          but with normalization (like tfidf)
--          to nerf down tags that are common champions overall

-- TODO
