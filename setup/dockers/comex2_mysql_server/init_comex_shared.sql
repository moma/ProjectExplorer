/******************************
** File: init_comex_shared.sql
** Desc: Creates comex tables
         => docker-entrypoint-initdb.d
** Date: 2017-01-19
*******************************/

CREATE DATABASE comex_shared CHARACTER SET utf8 COLLATE utf8_general_ci ;
USE comex_shared ;
CREATE TABLE scholars (
    -- local uid necessary for users who still have no doors_uid
    luid                 int(15) not null auto_increment unique primary key,
    -- doors uid common to all lab's services
    doors_uid            char(36) unique,
    last_modified_date   char(24) not null,
    email                varchar(255) not null unique,
    country              varchar(60) not null,
    first_name           varchar(30) not null,
    middle_name          varchar(30),
    last_name            varchar(50) not null,
    initials             varchar(7) not null,
    affiliation_id       int(15) not null,
    position             varchar(120),            -- eg Director
    hon_title            varchar(30),            -- eg Doctor
    interests_text       varchar(3500),
    gender               char(1),
    job_looking_date     char(24),       -- null if not looking for a job
    home_url             varchar(180),   -- homepage
    pic_url              varchar(180),   -- remote pic... (full url)
    pic_fname            varchar(120),   -- ...or locally saved pic (basename)
    record_status        varchar(25),  -- "active|test|legacy|closed_legacy"
    valid_date           date,   -- when user will be ignored, if legacy status
    old_itemid           varchar(30),  -- eg imported id from CSS originals
    future_reserved      varchar(30),  -- eg for an imported id or temp status

    INDEX duid_index_sch (doors_uid),
    INDEX affs_index_sch (affiliation_id),
    INDEX country_index_sch (country),
    INDEX rstatus_index_sch (record_status)
) ;

-- affiliations: institutions and labs
CREATE TABLE affiliations(
    affid               int(15) not null auto_increment,
    org                 varchar(120),
    org_type            varchar(50),
    team_lab            varchar(120) not null,
    org_city            varchar(50),
    reserved            varchar(30),
    PRIMARY KEY (affid),
    UNIQUE KEY full_affiliation (org, team_lab, org_city, org_type)
    -- NB org_type should be entailed by other 3 in business logic
);

ALTER TABLE scholars ADD FOREIGN KEY (affiliation_id) REFERENCES affiliations(affid) ;

-- keyword/subject terms
CREATE TABLE keywords(
    kwid                int(15) not null auto_increment,
    kwstr               char(70) not null unique,   -- eg 'complex networks'
    occs                int(15) default 0,
    INDEX kwstr_index_kws (kwstr),
    PRIMARY KEY (kwid)
);

-- relationship scholars <n=n> keywords
CREATE TABLE sch_kw(
    uid            int(15) not null,
    kwid           int(15) not null,
    PRIMARY KEY (uid, kwid),
    FOREIGN KEY (uid)  REFERENCES scholars(luid) ON DELETE CASCADE,
    FOREIGN KEY (kwid) REFERENCES keywords(kwid)
);


-- normal triggers
-- ===============
-- (+1) to occs on INSERT in sch_kw
CREATE TRIGGER incr_kwoccs_sum AFTER INSERT ON sch_kw
FOR EACH ROW UPDATE keywords SET occs = occs + 1
WHERE keywords.kwid = NEW.kwid ;

-- (-1) to occs on DELETE in sch_kw
CREATE TRIGGER decr_kwoccs_sum AFTER DELETE ON sch_kw
FOR EACH ROW UPDATE keywords SET occs = occs - 1
WHERE keywords.kwid = OLD.kwid ;


-- bug workaround trigger
-- ======================
-- NB this 3rd trigger below is additionally needed to reproduce the -1 effect when deleting entire scholar, because of INNODB bug "Cascaded foreign key actions do not activate triggers." (cf bugs.mysql.com/bug.php?id=11472)
-- TODO remove it if the bug is fixed !
-- (also it must be BEFORE otherwise sch_kw already affected by cascade)
CREATE TRIGGER decr_all_kwoccs_of_a_scholar BEFORE DELETE ON scholars
FOR EACH ROW UPDATE keywords JOIN sch_kw ON keywords.kwid = sch_kw.kwid SET occs = occs - 1 WHERE sch_kw.uid = OLD.luid ;


-- hashtag/workgroup terms
CREATE TABLE hashtags(
    htid                int(15) not null auto_increment,
    htstr               char(50) not null unique,   -- eg '#dataviz'
    INDEX htstr_index_hts (htstr),
    PRIMARY KEY (htid)
);

-- relationship scholars <n=n> hashtags
CREATE TABLE sch_ht(
    uid            int(15) not null,
    htid           int(15) not null,
    PRIMARY KEY (uid, htid),
    FOREIGN KEY (uid)  REFERENCES scholars(luid) ON DELETE CASCADE,
    FOREIGN KEY (htid) REFERENCES hashtags(htid)
);

-- linked identities (various users' ids on soc. media and research networks)
-- TODO use this :)
CREATE TABLE linked_ids(
    linkid              int(15) not null auto_increment,
    uid                 int(15) not null,
    ext_id_type         char(50) not null,   -- eg 'orcid','LinkedIn','Twitter'
    ext_id              char(50) not null,   -- eg "0000-0002-1825-0097"
    PRIMARY KEY (linkid),
    FOREIGN KEY (uid) REFERENCES scholars(luid) ON DELETE CASCADE
);

-- separate buffer table for incoming doors users without a profile in scholars
-- (allows us to avoid reasking them for their doors info like email)
CREATE TABLE doors_temp_user (
    doors_uid            char(36) not null unique,
    email                varchar(255) not null unique,
    PRIMARY KEY(doors_uid)
) ;

-- separate buffer table for rettoks
-- (return tokens associated to a legacy user)
CREATE TABLE legacy_temp_rettoks (
    luid             int(15) not null unique,
    rettok           char(36) not null unique,
    PRIMARY KEY (luid),
    INDEX rettok_index_ltempt (rettok)
) ;
