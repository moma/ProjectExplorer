### Set up the tables

```
# connect to your sql host or container
mysql -uroot -pvery-safe-pass -h $SQL_HOST -P 3306

# --- after connection to mysql
CREATE DATABASE comex_shared CHARACTER SET utf8 COLLATE utf8_general_ci ;
USE comex_shared ;
CREATE TABLE scholars (
    doors_uid            char(36) not null unique primary key,
    last_modified_date   char(24) not null,
    email                varchar(255) not null unique,
    country              varchar(60) not null,
    first_name           varchar(30) not null,
    middle_name          varchar(30),
    last_name            varchar(50) not null,
    initials             varchar(7) not null,
    affiliation_id       int(15) not null,
    position             varchar(30),            -- eg Director
    hon_title            varchar(30),            -- eg Doctor
    interests_text       varchar(1200),
    community_hashtags   varchar(350),
    gender               char(1),
    job_looking_date     char(24),       -- null if not looking for a job
    home_url             varchar(120),   -- homepage
    pic_url              varchar(120),   -- an alternative to pic_file blob
    pic_file             mediumblob,
    record_status        varchar(10),

    INDEX uid_index_sch (doors_uid),
    INDEX country_index_sch (country),
    INDEX affs_index_sch (affiliation_id)
) ;

-- affiliations: institutions and labs
CREATE TABLE affiliations(
    affid               int(15) not null auto_increment,
    org                 varchar(120) not null,
    org_type            varchar(50) not null,
    team_lab            varchar(120),
    org_city            varchar(50),
    INDEX affid_index_affs (affid),
    PRIMARY KEY (affid),

    -- we chose not to put org_type in unique key: should be entailed by other 3
    -- TODO doesn't yet prevent entering the same info twice !!
    UNIQUE KEY full_affiliation (org, team_lab, org_city)
);

ALTER TABLE scholars ADD FOREIGN KEY (affiliation_id) REFERENCES affiliations(affid) ;

-- keyword/subject terms
CREATE TABLE keywords(
    kwid                int(15) not null auto_increment,
    kwstr               char(50) not null unique,   -- eg 'complex networks'
    INDEX kwid_index_kws (kwid),
    INDEX kwstr_index_kws (kwstr),
    PRIMARY KEY (kwid)
);

-- relationship scholars <n=n> keywords
CREATE TABLE sch_kw(
    uid            char(36) not null,
    kwid           int(15) not null,
    INDEX uid_index_schkw (uid),
    INDEX kwid_index_schkw (kwid),
    PRIMARY KEY (uid, kwid),
    FOREIGN KEY (uid)  REFERENCES scholars(doors_uid) ON DELETE CASCADE,
    FOREIGN KEY (kwid) REFERENCES keywords(kwid)
);

-- linked identities (various users' ids on soc. media and research networks)
-- TODO use this :)
CREATE TABLE linked_ids(
    linkid              int(15) not null auto_increment,
    uid                 char(36) not null,
    ext_id_type         char(50) not null,   -- eg 'orcid','LinkedIn','Twitter'
    ext_id              char(50) not null,   -- eg "0000-0002-1825-0097"
    INDEX uid_index_eids (uid),
    PRIMARY KEY (linkid),
    FOREIGN KEY (uid) REFERENCES scholars(doors_uid) ON DELETE CASCADE
);
```
