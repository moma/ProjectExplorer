-- When we want all scholars info as one row
-- (typically in generic filters/directories),
-- then we need to use this kind of CASCADED left joins
-- because we have several one-to-many relationships in normal form

SELECT * FROM (
    SELECT
        scholars_orgs_and_keywords.*,
        GROUP_CONCAT(htstr) AS hashtags_list
    FROM (
        SELECT
            scholars_and_orgs.*,
            GROUP_CONCAT(kwstr) AS keywords_list
        FROM (
            SELECT
                scholars_and_labs.*,
                -- GROUP_CONCAT(insts.orgid SEPARATOR ',') AS insts_ids,
                GROUP_CONCAT(insts.tostring SEPARATOR '%%%') AS insts_list

                FROM (
                    SELECT
                        scholars.*,
                        -- GROUP_CONCAT(labs.orgid SEPARATOR ',') AS labs_ids,
                        GROUP_CONCAT(labs.tostring SEPARATOR '%%%') AS labs_list
                    FROM scholars
                    LEFT JOIN sch_org AS map_labs
                        ON map_labs.uid = luid
                    LEFT JOIN (
                        -- class constraint can't appear later,
                        -- it would give no scholar when empty
                        SELECT * FROM orgs WHERE class='lab'
                    ) AS labs
                        ON map_labs.orgid = labs.orgid
                    WHERE (record_status = 'active'
                            OR (record_status = 'legacy' AND valid_date >= NOW()))
                    GROUP BY luid
                    ) AS scholars_and_labs
                LEFT JOIN sch_org AS map_insts
                    ON map_insts.uid = luid
                LEFT JOIN (
                    SELECT * FROM orgs WHERE class='inst'
                ) AS insts
                    ON map_insts.orgid = insts.orgid

                GROUP BY luid
        ) AS scholars_and_orgs

        LEFT JOIN sch_kw
            ON sch_kw.uid = scholars_and_orgs.luid
        LEFT JOIN keywords
            ON sch_kw.kwid = keywords.kwid
        GROUP BY luid

    ) AS scholars_orgs_and_keywords
    LEFT JOIN sch_ht
        ON sch_ht.uid = luid
    LEFT JOIN hashtags
        ON sch_ht.htid = hashtags.htid
    GROUP BY luid
) AS full_scholars_info

WHERE luid = 2299 ;
