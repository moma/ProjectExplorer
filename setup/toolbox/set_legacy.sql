USE comex shared;

-- 1) setting legacy status itself
UPDATE scholars
    SET record_status = 'legacy'
    WHERE old_itemid IS NOT NULL ;  -- or any needed subset criterion

UPDATE scholars
    SET valid_date = CURDATE() + INTERVAL 3 MONTH
    WHERE old_itemid IS NOT NULL ;  -- here the same criterion as before


-- 2) preparing a batch of secret return tokens
INSERT INTO legacy_temp_rettoks
    SELECT luid, UUID() FROM scholars
    WHERE record_status = "legacy" AND valid_date > CURDATE();


-- 3) outputing all the links to send by mailing list
SET @server_name = 'www.communityexplorer.org' ;
SET @page_route = '/services/user/claim_profile/?token=' ;

SELECT
    email,
    CONCAT('https://', @server_name, @page_route, rettok) AS link
    FROM legacy_temp_rettoks
    JOIN scholars
        ON scholars.luid = legacy_temp_rettoks.luid ;
