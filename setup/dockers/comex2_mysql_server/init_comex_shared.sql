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
    last_modified        timestamp,
    email                varchar(255) not null unique,
    country              varchar(60) not null,
    first_name           varchar(30) not null,
    middle_name          varchar(30),
    last_name            varchar(50) not null,
    initials             varchar(7) not null,
    position             varchar(120),            -- eg Director
    hon_title            varchar(30),            -- eg Doctor
    interests_text       varchar(3500),
    gender               char(1),
    job_looking          boolean,
    job_looking_date     date,
    home_url             varchar(180),   -- homepage
    pic_url              varchar(180),   -- remote pic... (full url)
    pic_fname            varchar(120),   -- ...or locally saved pic (basename)
    record_status        varchar(25),  -- "active|test|legacy|closed_legacy"
    valid_date           date,   -- when user will be ignored, if legacy status
    old_itemid           varchar(30),  -- eg imported id from CSS originals
    future_reserved      varchar(30),  -- eg for an imported id or temp status

    INDEX duid_index_sch (doors_uid),
    INDEX country_index_sch (country),
    INDEX rstatus_index_sch (record_status),
    INDEX vdate_index_sch (valid_date)
) ;


CREATE TABLE locs(
    locname             varchar(120),
    lat                 float(6,4),
    lng                 float(7,4),  -- 4 decimals for lat & lng <=> 100m resol
    PRIMARY KEY (locname)
) ;

-- table for all organization classes (team, lab, large institution)
CREATE TABLE orgs(
    orgid               int(15) not null auto_increment,
    name                varchar(120),   -- full name
    acro                varchar(30),    -- acronym or short name

    class               varchar(25),   -- "team|lab|inst"
                                    -- like the calibre of the organization

    lab_code            varchar(25),   -- ex "UPS 3611" or "UMR 9221" (iff lab)
    inst_type           varchar(50),   -- ex "public org|private org" (iff inst)

    locname             varchar(120) null,  -- ex "Paris, France" or "France"
                                         -- (key to more info in table locs)

    url                 varchar(180),  -- the organisation's homepage
    contact_email       varchar(255),  -- if some email
    contact_name        varchar(80),   -- if some administrative contact person

    timestamp           timestamp,
    -- address...          (...)      -- address elements POSS NOT IMPLEMENTED
    reserved            varchar(30),


    -- 1 generated columns for common uses as label
    -- ex "Instituto de Fisica de Cantabria (IFCA)"
    -- searchable + human readable, often useful for autocompletes etc
    label              varchar(800)
        AS (CONCAT_WS( '',
                       CONCAT(name, ' '),
                       CONCAT('(',acro,')')) ),

    -- 1 generated column for serialize
    toarray            varchar(800)
        AS (JSON_ARRAY(name, acro, locname)),

    PRIMARY KEY (orgid),
    INDEX class_index_orgs (class),
    UNIQUE KEY full_org (class, name, acro, inst_type)
    -- POSS add locname to UNIQUE KEY (but handle variants!!)

    -- POSS FOREIGN KEY locname REFERENCES locs(locname)
    --  (useful when we use the locs more in the app)
) ;

-- relationship scholars <n=n> organizations
CREATE TABLE sch_org(
    uid            int(15) not null,
    orgid          int(15) not null,
    PRIMARY KEY (uid, orgid),
    FOREIGN KEY (uid)  REFERENCES scholars(luid) ON DELETE CASCADE,
    FOREIGN KEY (orgid) REFERENCES orgs(orgid)
);


-- POSS: relationship organizations <=> keywords
-- POSS: relationship organizations <=> organizations
-- cf. doc/data_mining_exemples/org_to_orgs.sql


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
