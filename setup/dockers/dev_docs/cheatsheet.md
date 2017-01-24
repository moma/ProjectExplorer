** Docker commands for advanced testing **
```sh
# check ports redirection
docker inspect comex_test | jq '.[0].NetworkSettings'
docker exec -it comex_test bash


# start services without docker-compose
docker run --detach --name doors_test -p 8989:8989 -v /home/romain/comex/shared_minidoors_data:/root/.doors minidoors

docker run --detach --name comex_db -v /home/romain/comex/regcomex/data/shared_mysql_data:/var/lib/mysql            --env="MYSQL_ROOT_PASSWORD=very-safe-pass" mysql
```


** Useful mysql queries **
```SQL

SELECT sch_kw.kwid, kwstr, count(uid) AS occs
    FROM sch_kw JOIN keywords ON sch_kw.kwid = keywords.kwid
    GROUP by kwid ORDER BY occs DESC LIMIT 10  ;
-- +------+------------------------+------+
-- | kwid | kwstr                  | occs |
-- +------+------------------------+------+
-- |   14 | mathematical modelling |    5 |
-- |    4 | complexity             |    5 |
-- |   30 | complex networks       |    3 |
-- |    3 | multi_agent systems    |    3 |
-- |    9 | dynamical systems      |    3 |
-- |   44 | imitation              |    2 |
-- |   43 | text mining            |    2 |
-- |    1 | emergence              |    2 |
-- |   15 | calculus               |    2 |
-- |   53 | philosophy             |    2 |
-- +------+------------------------+------+
```


** Set up a sum column **

```SQL
-- add the sum column
ALTER TABLE keywords ADD occs INT DEFAULT 0;

-- SET it from a join with sch_kw counts
UPDATE keywords
    JOIN (
        SELECT sch_kw.kwid, count(sch_kw.uid) AS total
        FROM sch_kw
        GROUP BY kwid
    ) AS aggs_temp
    ON aggs_temp.kwid = keywords.kwid
SET keywords.occs = aggs_temp.total ;
```

** Set up a sum trigger **  
(just +/- 1 each time)

```SQL

-- *********
CREATE TRIGGER incr_kwoccs_sum AFTER INSERT ON sch_kw
FOR EACH ROW UPDATE keywords SET occs = occs + 1
WHERE keywords.kwid = NEW.kwid ;

CREATE TRIGGER decr_kwoccs_sum AFTER DELETE ON sch_kw
FOR EACH ROW UPDATE keywords SET occs = occs - 1
WHERE keywords.kwid = OLD.kwid ;
-- *********

-- NB this 3rd trigger below is needed to reproduce the -1 effect because of INNODB bug "Cascaded foreign key actions do not activate triggers."
--    (cf https://bugs.mysql.com/bug.php?id=11472)
--
-- (also it must be BEFORE otherwise sch_kw already affected by cascade)
CREATE TRIGGER decr_all_kwoccs_of_a_scholar BEFORE DELETE ON scholars
FOR EACH ROW UPDATE keywords JOIN sch_kw ON keywords.kwid = sch_kw.kwid SET occs = occs - 1 WHERE sch_kw.uid = OLD.luid ;
```
