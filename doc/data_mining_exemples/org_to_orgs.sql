-- we pass through scholars
--   org1 => scholars => orgs2
-- (for suggestions and/or than mapping)

SELECT orgs.*,
       GROUP_CONCAT( tgt_label ORDER BY tgt_freq DESC SEPARATOR '%%%')
        AS related_insts
FROM orgs
LEFT JOIN (
    SELECT sch_org.orgid AS src_orgid,
          sch_org2.orgid AS tgt_orgid,
          orgs2.label AS tgt_label,
          count(*) AS tgt_freq
    FROM sch_org
    LEFT JOIN sch_org AS sch_org2
        ON sch_org.uid = sch_org2.uid
    JOIN orgs AS orgs2
        ON sch_org2.orgid = orgs2.orgid
    WHERE orgs2.class = 'inst'
    AND  sch_org.orgid != sch_org2.orgid
    GROUP BY sch_org.orgid, sch_org2.orgid
    ) AS lab_relationship_to_inst_via_scholars ON src_orgid = orgs.orgid
WHERE orgs.orgid IN ( {$ids_str} )
AND orgs.name != '_NULL'
GROUP BY orgs.orgid
ORDER BY orgs.name, orgs.acro
;



-- a POSSible alternative would be create an org_org tabls
-- relationship organizations <=> organizations
-- formally many-to-many but one could say many-to-few :)
CREATE TABLE org_org(
   orgid_src          int(15) not null,   -- @class 'lab'
   orgid_tgt          int(15) not null,   -- @class 'inst'
   sch_freq           int(15) default 0,  -- how often declared in sch records
                                          -- (useful if unsure main parent org)
   PRIMARY KEY (orgid_src, orgid_tgt),
   FOREIGN KEY (orgid_src) REFERENCES orgs(orgid) ON DELETE CASCADE,
   FOREIGN KEY (orgid_tgt) REFERENCES orgs(orgid) ON DELETE CASCADE
);
-- NB +/-1 to org -> org freq in org_org would be triggered indirectly by new scholars rows so made in profile saving at middle-ware lvl (dbcrud.py)
