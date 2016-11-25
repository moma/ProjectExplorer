
## Parameters for *`data/registered.db`*


registered.db is a sqlite3 db, with 2 tables:

```
-- test_table: used in debug
-- #########################
create table test_table (
    email varchar(255) unique,
    initials varchar(7),
    pic_file blob
) ;


-- real_table: used in prod
-- ########################
create table comex_registrations (
    doors_uid            char(36) not null unique,
    -- ISO stamp like 2016-11-16T17:47:07.308Z
    last_modified_date   char(24) not null,
    email                varchar(255) not null unique primary key,
    initials             varchar(7) not null,
    country              varchar(60) not null,
    first_name           varchar(30) not null,
    middle_name          varchar(30),
    last_name            varchar(50) not null,
    jobtitle             varchar(30) not null,
    keywords             varchar(350) not null,
    institution          varchar(120) not null,
    institution_type     varchar(50) not null,
    team_lab             varchar(50),
    institution_city     varchar(50),
    interests_text       varchar(1200),
    community_hashtags   varchar(350),
    gender               char(1),
    pic_file             mediumblob
) ;
```
