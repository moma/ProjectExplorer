UPDATE keywords
JOIN (
  SELECT kwid, count(uid) AS n FROM sch_kw GROUP BY kwid
) AS mycounts ON keywords.kwid = mycounts.kwid
SET occs = mycounts.n ;
