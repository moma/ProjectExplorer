
-- we copy the informations from an old_luid to a new row with a new email
SET @old_luid = '1234' ;
SET @new_email = 'some_testing_email@domain.org' ;

-- copy all scholar-table info except mail and uids
INSERT INTO scholars(email,country,first_name,middle_name,last_name,initials,affiliation_id,position,hon_title,interests_text,gender,job_looking,job_looking_date,home_url,pic_url,pic_fname,valid_date,record_status)
SELECT @new_email,country,first_name,middle_name,last_name,initials,affiliation_id,position,hon_title,interests_text,gender,job_looking,job_looking_date,home_url,pic_url,pic_fname,valid_date,record_status FROM scholars WHERE luid = @old_luid ;

-- we have a new UID
SET @new_luid = LAST_INSERT_ID() ;

-- copy all keywords & hashtags
INSERT INTO sch_kw SELECT @new_luid, kwid FROM sch_kw WHERE uid = @old_luid ;
INSERT INTO sch_ht SELECT @new_luid, htid FROM sch_ht WHERE uid = @old_luid ;
