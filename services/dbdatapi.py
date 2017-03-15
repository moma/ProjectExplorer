"""
DB data querying (mostly aggs + subset selections orginally made by Samuel)
"""
__author__    = "CNRS"
__copyright__ = "Copyright 2016 ISCPIF-CNRS"
__email__     = "romain.loth@iscpif.fr"

from MySQLdb          import connect, cursors
from MySQLdb.cursors  import DictCursor

from networkx  import Graph, DiGraph
from random    import randint
from math      import floor, log, log1p
from cgi       import escape
from re        import sub, match
from traceback import format_tb
from json      import loads

if __package__ == 'services':
    from services.tools import mlog, REALCONFIG
    from services.dbcrud  import connect_db
    from services.text.utils import CountryConverter
else:
    from tools          import mlog, REALCONFIG
    from dbcrud         import connect_db
    from text.utils     import CountryConverter


# col are for str stats api
# grouped is for full_scholar filters
FIELDS_FRONTEND_TO_SQL = {
    "keywords":      {'col':"keywords.kwstr",
                      'type': "LIKE_relation",
                      'grouped': "keywords_list"},
    "tags":          {'col':"hashtags.htstr",
                      'type': "LIKE_relation",
                      'grouped': "hashtags_list"},
    "hashtags":      {'col':"hashtags.htstr",
                      'type': "LIKE_relation",
                      'grouped': "hashtags_list"},

    "countries":     {'col':"scholars.country",
                      'type': "EQ_relation",
                      'grouped': "country"},
    "gender":        {'col':"scholars.gender",
                      'type': "EQ_relation",
                      'grouped': "gender"},

    "organizations": {'col':"orgs.label",
                      'class': "*",                 # all organizations
                      'type': "LIKE_relation",
                      'grouped': "orgs_list"},
    "institutions": {'col':"orgs.label",
                      'class': "inst",              #  <= local where clause
                      'type': "LIKE_relation",
                      'grouped': "orgs_list"},
    "laboratories":  {'col':"orgs.label",
                      'class': "lab",               #  <= idem
                      'type': "LIKE_relation",
                      'grouped': "orgs_list"},
    # TODO use
    "cities":        {'col':"orgs.locname",
                      'type': "LIKE_relation",
                      'grouped': "locnames_list",
                      'class': "*"},

    "linked":          {'col':"linked_ids.ext_id_type", 'type': "EQ_relation"}
}


# TODO also add paging as param and to postfilters
def get_field_aggs(a_field,
                   hapax_threshold = None,
                   search_filter_str = None,
                   users_status = "ALL"):
    """
    Use case: /services/api/aggs?field=a_field
             ---------------------------------
       => Retrieves distinct field values and count having it

       => about *n* vs *occs*:
           - for tables != keywords count is scholar count
           - for table keywords count is occurrences count

    Parameters
    ----------
        a_field: str
            a front-end fieldname to aggregate, like "keywords" "countries"
            (allowed values cf. FIELDS_FRONTEND_TO_SQL)

            POSS: allow other fields than those in the mapping
                  if they are already in sql table.col format?

        search_filter_str: str
            if present, select only results LIKE this %%str%%

        hapax_threshold: int
            for all data_types, categories with a total equal or below this will be excluded from results
            TODO: put them in an 'others' category
            POSS: have a different threshold by type


        POSSible:
            pre-filters
                ex: users_status : str
            shoudl define the perimeter (set of scholars over which we work),
    """

    agg_rows = []

    if a_field in FIELDS_FRONTEND_TO_SQL:

        sql_col = FIELDS_FRONTEND_TO_SQL[a_field]['col']
        sql_tab = sql_col.split('.')[0]

        mlog('INFO', "AGG API sql_col", sql_col)

        db = connect_db()
        db_c = db.cursor(DictCursor)

        # constraints 2, if any
        postfilters = []

        if search_filter_str is not None and len(search_filter_str):
            search_filter_str = quotestr(search_filter_str)
            postfilters.append( "x LIKE '%%%s%%'" % search_filter_str)

        if hapax_threshold > 0:
            count_col = 'occs' if sql_tab in ['keywords', 'hashtags'] else 'n'
            postfilters.append( "%s > %i" % (count_col, hapax_threshold) )

        if len(postfilters):
            post_where = "WHERE "+" AND ".join(
                                                ['('+f+')' for f in postfilters]
                                                    )
        else:
            post_where = ""


        # retrieval cases
        if sql_tab == 'scholars':
            stmt = """
                SELECT x, n FROM (
                    SELECT %(col)s AS x, COUNT(*) AS n
                    FROM scholars
                    GROUP BY %(col)s
                ) AS allcounts
                %(post_filter)s
                ORDER BY n DESC
            """ % {'col': sql_col, 'post_filter': post_where}

        elif sql_tab == 'orgs':
            sql_class = FIELDS_FRONTEND_TO_SQL[a_field]['class']
            sql_class_clause = ""
            if len(sql_class) and sql_class != "*":
                sql_class_clause = "WHERE class='%s'" % sql_class
            stmt = """
                SELECT x, n FROM (
                    SELECT %(col)s AS x, COUNT(*) AS n
                    FROM sch_org
                    -- 0 or 1
                    LEFT JOIN orgs
                        ON sch_org.orgid = orgs.orgid
                    %(class_clause)s
                    GROUP BY %(col)s
                ) AS allcounts
                %(post_filter)s
                ORDER BY n DESC
            """ % {'col': sql_col, 'class_clause': sql_class_clause,
                   'post_filter': post_where}

        elif sql_tab == 'linked_ids':
            stmt = """
                SELECT x, n FROM (
                    SELECT %(col)s AS x, COUNT(*) AS n
                    FROM scholars
                    -- 0 or 1
                    LEFT JOIN linked_ids
                        ON scholars.luid = linked_ids.uid
                    GROUP BY %(col)s
                ) AS allcounts
                %(post_filter)s
                ORDER BY n DESC
            """ % {'col': sql_col, 'post_filter': post_where}

        elif sql_tab == 'keywords':
            stmt = """
                SELECT x, occs FROM (
                    SELECT %(col)s AS x, COUNT(*) AS occs
                    FROM scholars
                    -- 0 or many
                    LEFT JOIN sch_kw
                        ON scholars.luid = sch_kw.uid
                    LEFT JOIN keywords
                        ON sch_kw.kwid = keywords.kwid
                    GROUP BY %(col)s
                ) AS allcounts
                %(post_filter)s
                ORDER BY occs DESC
            """ % {'col': sql_col, 'post_filter': post_where}

        elif sql_tab == 'hashtags':
            stmt = """
                SELECT x, occs FROM (
                    SELECT %(col)s AS x, COUNT(*) AS occs
                    FROM scholars
                    -- 0 or many
                    LEFT JOIN sch_ht
                        ON scholars.luid = sch_ht.uid
                    LEFT JOIN hashtags
                        ON sch_ht.htid = hashtags.htid
                    GROUP BY %(col)s
                ) AS allcounts
                %(post_filter)s
                ORDER BY occs DESC
            """ % {'col': sql_col, 'post_filter': post_where}

        mlog("DEBUGSQL", "get_field_aggs STATEMENT:\n-- SQL\n%s\n-- /SQL" % stmt)

        # do it
        n_rows = db_c.execute(stmt)

        if n_rows > 0:
            agg_rows = db_c.fetchall()

        db.close()

    # mlog('DEBUG', "aggregation over %s: result rows =" % a_field, agg_rows)

    return agg_rows


def find_scholar(some_key, some_str_value, cmx_db = None):
    """
    Get the luid of a scholar based on some str value

    To make sense, the key should be a unique one
    but this function doesn't check it !
    """
    luid = None

    if cmx_db:
        db = cmx_db
    else:
        db = connect_db()
    db_c = db.cursor(DictCursor)

    try:
        db_c.execute('''SELECT luid
                        FROM scholars
                        WHERE %s = "%s"
                        ''' % (some_key, some_str_value))
        first_row = db_c.fetchone()
        if first_row:
            luid = first_row['luid']
    except:
        mlog('WARNING', 'unsuccessful attempt to identify a scholar on key %s' % some_key)

    if not cmx_db:
        db.close()

    return luid


class Org:
    " tiny helper class to serialize/deserialize orgs TODO use more OOP :) "

    def __init__(self, org_array, org_class=None):
        if len(org_array) < 3:
            raise ValueError("Org is implemented for at least [name, acr, loc]")
        self.name = org_array[0]
        self.acro = org_array[1]
        self.locname = org_array[2]
        self.org_class = org_class

        # DB specifications say that at least one of name||acr is NOT NULL
        self.any = self.acro if self.acro else self.name
        self.label  = (  ( self.name if self.name else "")
                        + ((' ('+self.acro+')') if self.acro else "")
                        + ((', '+self.locname) if self.locname else "")
                        )


class BipartiteExtractor:
    """
    JSON FILTERS => SQL SELECT => scholars subset
                                       ||
                                       VV
                                     keywords
                                       ||
                                       VV
                                     neighboors
    """

    def __init__(self,dbhost):
        self.connection=connect(
            host=dbhost, db="comex_shared",
            user="root", passwd="very-safe-pass",
            charset="utf8"
        )
        mlog("DEBUGSQL", "MyExtractor connected:", self.connection)
        self.cursor=self.connection.cursor(cursors.DictCursor)
        mlog("DEBUGSQL", "MyExtractor gotcursor:", self.cursor)
        self.scholars = {}
        self.scholars_colors = {}
        self.terms_colors = {}
        self.Graph = DiGraph()
        self.min_num_friends=0
        self.imsize=80
        self.terms_dict = {}
        self.unique_id = {}


    def jaccard(self,cooc,occ1,occ2):
        """
        Was used for SOC edges (aka nodes1 or edgesA)

        (Cooc normalized by total scholars occs)
        """
        if occ1==0 or occ2==0:
            return 0
        else:
            return cooc*cooc/float(occ1*occ2)

    def log_sim(self,cooc,occ1,occ2):
        """
        Newly used for SOC edges
            => preserves monotony
            => + log scale (=> good for display !!)
        """
        return log1p(self.jaccard(cooc,
                                  occ1,occ2))

    def getScholarsList(self,qtype,filter_dict):
        """
        select one or more scholars to map in the graph

        the filters take only active scholars or legacy with date <= 3 months

        returns a dict of scholar's uids

        method1 (qtype "uid")
          - filter_dict['unique_id'] defines our starting point (scholar_0)
          - we follow all 2 step coupling paths (scholar_0 <=> keyword_X <=> scholar_i)

        method2 (qtype "filters" constraints)
          - filter_thing is a dict of all the whoswho filters
            ex: {'countries':[France,USA], 'keywords':[blabla]}
          - they are converted to WHERE-clauses in an SQL query

        TODO factorize someday with services.db.get_full_scholar
        """
        scholar_array = {}
        sql_query = None

        # debug
        mlog("DEBUG", "=> getScholarsList.qtype", qtype)
        mlog("DEBUG", "=> getScholarsList.filter_dict", filter_dict)

        try:
            if qtype == "uid":
                # remove quotes from id
                unique_id = sub(r'^"|"$', '', filter_dict['unique_id'])

                # we use the sch_kw table (scholars <=> kw map)
                sql_query="""
                SELECT
                    neighbors_by_kw.uid,
                    scholars.initials,
                    COUNT(matching.kwid) AS cooc

                FROM scholars

                -- step 1
                JOIN sch_kw AS matching
                            ON matching.uid = scholars.luid
                -- step 2
                JOIN sch_kw AS neighbors_by_kw
                            ON neighbors_by_kw.kwid = matching.kwid

                WHERE luid = "%s"

                AND (
                    record_status = 'active'
                    OR
                    (record_status = 'legacy' AND valid_date >= NOW())
                )
                GROUP BY neighbors_by_kw.uid
                ORDER BY cooc DESC
                """ % unique_id

                self.cursor.execute(sql_query)
                results=self.cursor.fetchall()

                # debug
                mlog("DEBUG", "getScholarsList<== len(all 2-step neighbors) =", len(results))

                if len(results) == 0:
                    # should never happen if input unique_id is valid
                    return []

                if len(results)>0:
                    for row in results:
                        # mlog("DEBUG", "the row:", row)
                        node_uid = row['uid']
                        node_shortid = "D::"+row['initials']+"/%05i"%int(node_uid);

                        #    old way: candidate = ( integerID , realSize , #keywords )
                        #    new way: scholars_array[uid] = ( ID , occ size )

                        scholar_array[node_uid] = 1
                # debug
                # mlog("DEBUG", "getScholarsList<==scholar_array", scholar_array)

            elif qtype == "filters":
                sql_query = None

                mlog("INFO", "filters: REST query is", filter_dict)

                if "query" in filter_dict and filter_dict["query"] == "*":
                    # query is "*" <=> all scholars
                    sql_query = """
                        SELECT luid
                        FROM scholars
                        WHERE (
                            record_status = 'active'
                            OR
                            (record_status = 'legacy' AND valid_date >= NOW())
                        )
                    """
                else:
                    # query is a set of filters like: key <=> array of values
                    # (expressed as rest parameters: "keyA[]=valA1&keyB[]=valB1&keyB[]=valB2")

                    # 1. we receive it as a dict of arrays
                    # 2. we map it to an sql conjunction of alternatives
                    #    ==> WHERE colA IN ("valA1") AND colB IN ("valB1", "valB2")

                    # build constraints from the args
                    # ================================
                    sql_constraints = []

                    for key in filter_dict:
                        known_filter = None
                        sql_column = None

                        if key not in FIELDS_FRONTEND_TO_SQL:
                            continue
                        else:
                            known_filter = key
                            sql_field = FIELDS_FRONTEND_TO_SQL[key]['grouped']

                            # "LIKE_relation" or "EQ_relation"
                            rel_type = FIELDS_FRONTEND_TO_SQL[key]['type']

                        # now create the constraints
                        val = filter_dict[known_filter]

                        if len(val):
                            # clause exemples
                            # "col IN (val1, val2)"
                            # "col = val"
                            # "col LIKE '%escapedval%'"

                            if (not isinstance(val, list)
                              and not isinstance(val, tuple)):
                                mlog("WARNING", "direct graph api query without tina")
                                clause = sql_field + type_to_sql_filter(val)

                            # normal case
                            # tina sends an array of str filters
                            else:
                                tested_array = [x for x in val if x]
                                mlog("DEBUG", "tested_array", tested_array)
                                if len(tested_array):
                                    if rel_type == "EQ_relation":
                                        qwliststr = repr(tested_array)
                                        qwliststr = sub(r'^\[', '(', qwliststr)
                                        qwliststr = sub(r'\]$', ')', qwliststr)
                                        clause = sql_field + ' IN '+qwliststr
                                        # ex: country IN ('France', 'USA')

                                    elif rel_type == "LIKE_relation":
                                        like_clauses = []
                                        for singleval in tested_array:
                                            if type(singleval) == str and len(singleval):
                                                like_clauses.append(
                                                   sql_field+" LIKE '%"+quotestr(singleval)+"%'"
                                                )
                                        clause = " OR ".join(like_clauses)

                            if len(clause):
                                sql_constraints.append("(%s)" % clause)

                    # debug
                    # £TODO_ORG rm
                    mlog("INFO", "SELECTing active users with sql_constraints", sql_constraints)

                    # use constraints as WHERE-clause

                    # NB we must cascade join because
                    #    orgs, hashtags and keywords are one-to-many
                    #   => it renames tables into 'full_scholar'
                    sql_query = """
                    SELECT * FROM (
                        SELECT
                            sch_org_n_tags.*,

                            -- kws info
                            GROUP_CONCAT(keywords.kwstr) AS keywords_list

                        FROM (
                            SELECT
                                scholars_and_orgs.*,
                                -- hts info
                                GROUP_CONCAT(hashtags.htstr) AS hashtags_list

                            FROM (
                              SELECT scholars.*,
                                     -- org info
                                     -- GROUP_CONCAT(orgs.orgid) AS orgs_ids_list,
                                     GROUP_CONCAT(orgs_set.label) AS orgs_list
                              FROM scholars
                              LEFT JOIN sch_org ON luid = sch_org.uid
                              LEFT JOIN (
                                SELECT * FROM orgs
                              ) AS orgs_set ON sch_org.orgid = orgs_set.orgid
                              GROUP BY luid
                            ) AS scholars_and_orgs
                            LEFT JOIN sch_ht
                                ON uid = luid
                            JOIN hashtags
                                ON sch_ht.htid = hashtags.htid
                            GROUP BY luid
                        ) AS sch_org_n_tags

                        -- two step JOIN for keywords
                        LEFT JOIN sch_kw
                            ON uid = luid
                        JOIN keywords
                            ON sch_kw.kwid = keywords.kwid

                        WHERE (
                            record_status = 'active'
                            OR
                            (record_status = 'legacy' AND valid_date >= NOW())
                        )

                        GROUP BY luid

                    ) AS full_scholar
                    -- our filtering constraints fit here
                    WHERE  %s

                    """ % " AND ".join(sql_constraints)

                mlog("DEBUGSQL", "getScholarsList SELECT:  ", sql_query)

                # in both cases "*" or constraints
                self.cursor.execute(sql_query)
                scholar_rows=self.cursor.fetchall()
                for row in scholar_rows:
                    scholar_array[ row['luid'] ] = 1

            return scholar_array

        except Exception as error:
            mlog("ERROR", "===== getScholarsList SQL ERROR ====")
            if filter_dict != None:
                mlog("ERROR", "qtype "+qtype+" received REST queryargs:\t"+str(filter_dict))
            if sql_query != None:
                mlog("ERROR", "qtype filter attempted SQL query:\t"+sql_query)
            mlog("ERROR", repr(error) + "("+error.__doc__+")")
            mlog("ERROR", "stack (\n\t"+"\t".join(format_tb(error.__traceback__))+"\n)")
            mlog("ERROR", "==== /getScholarsList SQL ERROR ====")


    def extract(self,scholar_array):
        """
        Adding each connected scholar per unique_id

        (getting details for selected scholars into graph object)
        # POSS if filters, could do it along with previous step getScholarsList
        # (less modular but a lot faster)

        NB here scholar_array is actually a dict :/ ...
        """
        # debug
        # mlog("DEBUG", "MySQL extract scholar_array:", scholar_array)
        # scholar_array = list(scholar_array.keys())[0:3]

        # TODO loop could be after SELECT
        for scholar_id in scholar_array:
            sql3='''
                SELECT
                    scholars_and_orgs.*,
                    COUNT(keywords.kwid) AS keywords_nb,
                    GROUP_CONCAT(keywords.kwid) AS keywords_ids,
                    GROUP_CONCAT(kwstr) AS keywords_list
                FROM (
                    SELECT
                        scholars_and_insts.*,
                        -- small serializations here to avoid 2nd query
                        GROUP_CONCAT(
                          JSON_ARRAY(labs.name, labs.acro, labs.locname)
                        ) AS labs_list
                    FROM (
                        SELECT
                            scholars.*,
                            GROUP_CONCAT(
                              JSON_ARRAY(insts.name, insts.acro, insts.locname)
                            ) AS insts_list
                        FROM
                            scholars
                            LEFT JOIN sch_org ON luid = sch_org.uid
                            LEFT JOIN (
                                SELECT * FROM orgs WHERE class = 'inst'
                            ) AS insts ON sch_org.orgid = insts.orgid
                        WHERE (record_status = 'active'
                            OR (record_status = 'legacy' AND valid_date >= NOW()))
                        GROUP BY luid
                    ) AS scholars_and_insts
                    LEFT JOIN sch_org ON luid = sch_org.uid
                    LEFT JOIN (
                        SELECT * FROM orgs WHERE class = 'lab'
                    ) AS labs ON sch_org.orgid = labs.orgid
                    GROUP BY luid
                ) AS scholars_and_orgs

                LEFT JOIN sch_kw
                    ON sch_kw.uid = scholars_and_orgs.luid
                LEFT JOIN keywords
                    ON sch_kw.kwid = keywords.kwid
                WHERE luid = %s
                GROUP BY luid ;
            ''' % scholar_id

            # debug
            # mlog("DEBUG", "db.extract: sql3="+sql3)

            try:
                self.cursor.execute(sql3)
                res3=self.cursor.fetchone()
                info = {};

                # semantic short ID
                # ex "D::JFK/00001"

                if 'pic_fname' in res3 and res3['pic_fname']:
                    pic_src = '/data/shared_user_img/'+res3['pic_fname']
                elif 'pic_url' in res3 and res3['pic_url']:
                    pic_src = res3['pic_url']
                else:
                    pic_src = ''

                # NB instead of secondary query for orgs.*, we can
                # simply parse orgs infos
                # and take labs[0] and insts[0]
                labs  = list(map(
                        lambda arr: Org(arr, org_class='lab'),
                        loads('['+res3['labs_list'] +']')
                ))
                insts = list(map(
                        lambda arr: Org(arr, org_class='insts'),
                        loads('['+res3['insts_list']+']')
                ))
                mlog("DEBUGSQL", "main lab:", labs[0])
                mlog("DEBUGSQL", "main inst:", insts[0])
                # each lab is an array [name, acronym, location]


                # all detailed node data
                ide="D::"+res3['initials']+("/%05i"%int(res3['luid']));
                info['id'] = ide;
                info['luid'] = res3['luid'];
                info['doors_uid'] = res3['doors_uid'];
                info['pic_src'] = pic_src ;
                info['first_name'] = res3['first_name'];
                info['mid_initial'] = res3['middle_name'][0] if res3['middle_name'] else ""
                info['last_name'] = res3['last_name'];
                info['keywords_nb'] = res3['keywords_nb'];
                info['keywords_ids'] = res3['keywords_ids'].split(',') if res3['keywords_ids'] else [];
                info['keywords_list'] = res3['keywords_list'];
                info['country'] = res3['country'];
                info['ACR'] = labs[0].acro if labs[0].acro else labs[0].any
                #info['CC'] = res3['norm_country'];
                info['home_url'] = res3['home_url'];
                info['team_lab'] = labs[0].label;
                info['org'] = insts[0].label;

                if len(labs) > 1:
                    info['lab2'] = labs[1].label
                if len(insts) > 1:
                    info['affiliation2'] = insts[1].label
                info['hon_title'] = res3['hon_title'] if res3['hon_title'] else ""
                info['position'] = res3['position'];
                info['job_looking'] = res3['job_looking'];
                info['job_looking_date'] = res3['job_looking_date'];
                info['email'] = res3['email'];
                if info['keywords_nb']>0:
                    self.scholars[ide] = info;

            except Exception as error:
                mlog("ERROR", "=====  extract ERROR ====")
                mlog("ERROR", "extract on scholar no %s" % str(scholar_id))
                if sql3 != None:
                    mlog("ERROR", "extract attempted SQL query:\t"+sql3)
                mlog("ERROR", repr(error) + "("+error.__doc__+")")
                mlog("ERROR", "stack (\n\t"+"\t".join(format_tb(error.__traceback__))+"\n)")
                mlog("ERROR", "===== /extract ERROR ====")



        # génère le gexf
        # include('gexf_generator.php');
        imsize=80;
        termsMatrix = {};
        scholarsMatrix = {};
        scholarsIncluded = 0;

        for i in self.scholars:
            mlog('DEBUG', 'extractDataCustom:'+self.scholars[i]['email'])
            self.scholars_colors[self.scholars[i]['email'].strip()]=0;
            scholar_keywords = self.scholars[i]['keywords_ids'];
            for k in range(len(scholar_keywords)):
                kw_k = scholar_keywords[k]

                # TODO join keywords and count to do this part already via sql
                # mlog('DEBUG', 'extractDataCustom:keyword '+kw_k)

                if kw_k != None and kw_k!="":
                    # mlog("DEBUG", kw_k)
                    if kw_k in termsMatrix:
                        termsMatrix[kw_k]['occ'] = termsMatrix[kw_k]['occ'] + 1

                        for l in range(len(scholar_keywords)):
                            kw_l = scholar_keywords[l]
                            if kw_l in termsMatrix[kw_k]['cooc']:
                                termsMatrix[kw_k]['cooc'][kw_l] += 1
                            else:
                                termsMatrix[kw_k]['cooc'][kw_l] = 1;

                    else:
                        termsMatrix[kw_k]={}
                        termsMatrix[kw_k]['occ'] = 1;
                        termsMatrix[kw_k]['cooc'] = {};
                        for l in range(len(scholar_keywords)):
                            kw_l = scholar_keywords[l]
                            if kw_l in termsMatrix[kw_k]['cooc']:
                                termsMatrix[kw_k]['cooc'][kw_l] += 1
                            else:
                                termsMatrix[kw_k]['cooc'][kw_l] = 1;


        # ------- debug -------------------------------
        # print(">>>>>>>>>termsMatrix<<<<<<<<<")
        # print(termsMatrix)
        # ------- /debug ------------------------------

        # TODO restore job snippet 1
        # sql='select login from jobs';
        # for res in self.cursor.execute(sql):
        #     if res['login'].strip() in self.scholars_colors:
        #         self.scholars_colors[res['login'].strip()]+=1;

        query = "SELECT kwstr,kwid,occs FROM keywords WHERE kwid IN "
        conditions = ' (' + ','.join(sorted(list(termsMatrix))) + ')'

        # debug
        # mlog("DEBUG", "SQL query ===============================")
        # mlog("DEBUG", query+conditions)
        # mlog("DEBUG", "/SQL query ==============================")

        self.cursor.execute(query+conditions)
        results4 = self.cursor.fetchall()

        for res in results4:
            idT = res['kwid']
            info = {}
            info['kwid'] = idT
            info['occurrences'] = res['occs']
            info['kwstr'] = res['kwstr']
            self.terms_dict[idT] = info
        count=1

        for term in self.terms_dict:
            self.terms_colors[term]=0

        # TODO restore job snippet 2
        # sql='select term_id from jobs2terms'
        # for row in self.cursor.execute(sql):
        #     if row['term_id'] in self.terms_colors:
        #         self.terms_colors[row['term_id']]+=1

        cont=0
        for term_id in self.terms_dict:
            sql="SELECT uid, initials FROM sch_kw JOIN scholars ON uid=luid WHERE kwid=%i" % term_id
            term_scholars=[]
            self.cursor.execute(sql)
            rows = self.cursor.fetchall()
            for row in rows:
                term_scholars.append("D::"+row['initials']+"/%05i"%int(row['uid']))

            for k in range(len(term_scholars)):
                if term_scholars[k] in scholarsMatrix:
                    scholarsMatrix[term_scholars[k]]['occ'] = scholarsMatrix[term_scholars[k]]['occ'] + 1
                    for l in range(len(term_scholars)):
                        if term_scholars[l] in self.scholars:
                            if term_scholars[l] in scholarsMatrix[term_scholars[k]]['cooc']:
                                scholarsMatrix[term_scholars[k]]['cooc'][term_scholars[l]] += 1
                            else:
                                scholarsMatrix[term_scholars[k]]['cooc'][term_scholars[l]] = 1;

                else:
                    scholarsMatrix[term_scholars[k]]={}
                    scholarsMatrix[term_scholars[k]]['occ'] = 1;
                    scholarsMatrix[term_scholars[k]]['cooc'] = {};

                    for l in range(len(term_scholars)):
                        if term_scholars[l] in self.scholars:
                            if term_scholars[l] in scholarsMatrix[term_scholars[k]]['cooc']:
                                scholarsMatrix[term_scholars[k]]['cooc'][term_scholars[l]] += 1
                            else:
                                scholarsMatrix[term_scholars[k]]['cooc'][term_scholars[l]] = 1;

            nodeId = "N::"+str(term)
            self.Graph.add_node(nodeId)

        for scholar in self.scholars:
            if scholar in scholarsMatrix:
                if len(scholarsMatrix[scholar]['cooc']) >= self.min_num_friends:
                    scholarsIncluded += 1;
                    nodeId = str(scholar);
                    self.Graph.add_node(nodeId, weight=3)

        edgeid = 0
        for scholar in self.scholars:
            if scholar in scholarsMatrix:
                if len(scholarsMatrix[scholar]['cooc']) >= 1:
                    for keyword in self.scholars[scholar]['keywords_ids']:
                        if keyword:
                            source= str(scholar)
                            target="N::"+str(keyword)
                            self.Graph.add_edge( source , target , {'weight':1,'type':"bipartite"})
                            #Some bipartite relations are missing (just the 1%)

        for term in self.terms_dict:
            nodeId1 = self.terms_dict[term]['kwid'];
            if str(nodeId1) in termsMatrix:
                neighbors = termsMatrix[str(nodeId1)]['cooc'];
                for i, neigh in enumerate(neighbors):
                    if neigh != str(term):
                        source="N::"+str(term)
                        target="N::"+neigh

                        weight=neighbors[str(neigh)]/float(self.terms_dict[term]['occurrences'])
                        # TODO ^^^ check formula ^^^

                        # # detailed debug
                        # if neighbors[str(neigh)] != 1:
                        #     mlog("DEBUG", "extractDataCustom.extract edges b/w terms====")
                        #     mlog("DEBUG", "term:", self.terms_dict[int(term)]['kwstr'], "<===> neighb:", self.terms_dict[int(neigh)]['kwstr'])
                        #     mlog("DEBUG", "kwoccs:", self.terms_dict[term]['occurrences'])
                        #     mlog("DEBUG", "neighbors[neigh]:", neighbors[str(neigh)])
                        #     mlog("DEBUG", "edge w", weight)

                        self.Graph.add_edge( source , target , {'weight':weight,'type':"nodes2"})

        for scholar in self.scholars:
            nodeId1 = scholar;
            if str(nodeId1) in scholarsMatrix:

                # weighted list of other scholars
                neighbors=scholarsMatrix[str(nodeId1)]['cooc'];

                for i, neigh in enumerate(neighbors):
                    if neigh != str(scholar):
                        source=str(scholar)
                        target=str(neigh)
                        # weight=self.log_sim(neighbors[str(neigh)],
                        #                         scholarsMatrix[nodeId1]['occ'],
                        #                         scholarsMatrix[neigh]['occ'])
                        weight=self.jaccard(neighbors[str(neigh)],
                                                scholarsMatrix[nodeId1]['occ'],
                                                scholarsMatrix[neigh]['occ'])
                        #mlog("DEBUG", "\t"+source+","+target+" = "+str(weight))
                        self.Graph.add_edge( source , target , {'weight':weight,'type':"nodes1"})

        # ------- debug nodes1 -------------------------
        # print(">>>>>>>>>scholarsMatrix<<<<<<<<<")
        # print(scholarsMatrix)

        # exemple:
        # {'D::PFC/00002': {'occ': 6,
        #                   'cooc': {'D::PFC/00002': 6,
        #                            'D::fl/00009': 1,
        #                            'D::DC/00010': 1}
        #                   },
        #   'D::fl/00009': {'occ': 9,
        #                   'cooc': {'D::fl/00009': 9,
        #                            'D::PFC/00002': 1}
        #                  }
        # ------- /debug ------------------------------



    def toHTML(self,string):
        escaped = escape(string).encode("ascii", "xmlcharrefreplace").decode()
        return escaped


    def buildJSON(self,graph,coordsRAW=None):

        inst = CountryConverter("","","","")
        ISO=inst.getCountries("services/text/countries_ISO3166.txt")
        Alternatives=inst.getCountries("services/text/countries_alternatives.txt")
        inst.createInvertedDicts(ISO,Alternatives)

        nodesA=0
        nodesB=0
        edgesA=0
        edgesB=0
        edgesAB=0
        # mlog("DEBUG", "printing in buildJSON_sansfa2()")
        nodes = {}
        edges = {}
        if coordsRAW:
            xy = coordsRAW #For FA2.java: loads(coordsRAW)
            #mlog("DEBUG", xy)
            coords = {}
            for i in xy:
                coords[i['sID']] = {}
                coords[i['sID']]['x'] = i['x']
                coords[i['sID']]['y'] = i['y']
            #mlog("DEBUG", coords)

        for idNode in graph.nodes_iter():
            if idNode[0]=="N":#If it is NGram

                # debug
                # mlog("DEBUG", "terms idNode:", idNode)

                numID=int(idNode.split("::")[1])
                try:
                    nodeLabel= self.terms_dict[numID]['kwstr'].replace("&"," and ")
                    colorg=max(0,180-(100*self.terms_colors[numID]))

                    term_occ = self.terms_dict[numID]['occurrences']

                except KeyError:
                    mlog("WARNING", "couldn't find label and meta for term " + str(numID))
                    nodeLabel = "UNKNOWN"
                    colorg = 0
                    term_occ = 1

                node = {}
                node["type"] = "NGram"
                node["label"] = nodeLabel
                node["color"] = "19,"+str(colorg)+",244"
                node["term_occ"] = term_occ
                if coordsRAW: node["x"] = str(coords[idNode]['x'])
                if coordsRAW: node["y"] = str(coords[idNode]['y'])

                nodes[idNode] = node

#            mlog("DEBUG", "NGR","\t",idNode,"\t",nodeLabel,"\t",term_occ)

                nodesB+=1

            if idNode[0]=='D':#If it is Document (or scholar)
                nodeLabel= self.scholars[idNode]['hon_title']+" "+self.scholars[idNode]['first_name']+" "+self.scholars[idNode]['mid_initial']+" "+self.scholars[idNode]['last_name']
                color=""
                if self.scholars_colors[self.scholars[idNode]['email']]==1:
                    color='243,183,19'

                elif self.scholars[idNode]['job_looking']:
                    color = '139,28,28'
                else:
                    color = '78,193,127'

                 # content is an instance of #information.our-vcard
                 # --------------------------------------------------
                 #     <img src="....">
                 #     <ul>
                 #         <li class=bigger>
                 #             <b>{{ hon_title }}
                 #                 {{ first_name }}
                 #                 {{ mid_initials }}
                 #                 {{ last_name }}</b>
                 #                 <br/>
                 #                 <br/>
                 #         </li>
                 #         <li>
                 #             <b>Country: </b>{{ country }}<br>
                 #             <b>Position: </b>{{ position }}<br>
                 #             <b>Keywords: </b>{{ keywords }}<br>
                 #             [ <a href="{{ info.home_url }}" target="blank">
                 #                 View homepage
                 #             </a>]
                 #             <br>
                 #         </li>
                 #     </ul>


                content="<div class='information-vcard'>"


                # pic in vcard
                pic_src=self.scholars[idNode]['pic_src']
                if pic_src and pic_src != "":
                    content += '<img  src="'+pic_src+'" width=' + str(self.imsize) + 'px>';
                else:
                    if len(self.scholars)<2000:
                        im_id = int(floor(randint(0, 11)))
                        content += '<img src="static/img/'+str(im_id)+'.png" width='  + str(self.imsize) +  'px>'

                # label in vcard
                content += '<p class=bigger><b>'+nodeLabel+'</b></p>'

                # other infos in vcard
                content += '<p>'
                content += '<b>Country: </b>' + self.scholars[idNode]['country'] + '</br>'

                if self.scholars[idNode]['position'] and self.scholars[idNode]['position'] != "":
                    content += '<b>Position: </b>' +self.scholars[idNode]['position'].replace("&"," and ")+ '</br>'

                affiliation=""
                if self.scholars[idNode]['team_lab'] and self.scholars[idNode]['team_lab'] not in ["", "_NULL"]:
                    affiliation += self.scholars[idNode]['team_lab']+ ','
                if self.scholars[idNode]['org'] and self.scholars[idNode]['org'] != "":
                    affiliation += self.scholars[idNode]['org']

                if affiliation != "":
                    content += '<b>Affiliation: </b>' + escape(affiliation) + '</br>'

                if len(self.scholars[idNode]['keywords_list']) > 3:
                    content += '<b>Keywords: </b>' + self.scholars[idNode]['keywords_list'].replace(",",", ")+'.</br>'

                if self.scholars[idNode]['home_url']:
                    if self.scholars[idNode]['home_url'][0:3] == "www":
                        content += '[ <a href=http://' +self.scholars[idNode]['home_url'].replace("&"," and ")+ ' target=blank > View homepage </a ><br/>]'
                    elif self.scholars[idNode]['home_url'][0:4] == "http":
                        content += '[ <a href=' +self.scholars[idNode]['home_url'].replace("&"," and ")+ ' target=blank > View homepage </a >]<br/>'


                content += '</p></div>'

                node = {}
                node["type"] = "Document"
                node["label"] = nodeLabel
                node["color"] = color

                dacountry = self.scholars[idNode]["country"]
                code=inst.searchCode(dacountry)

                # country code
                if code: node["CC"] = code
                else: node["CC"]="-"

                # Affiliation
                node["ACR"] = self.scholars[idNode]["org"]
                if node["ACR"]=="": node["ACR"]="-"


                # /!\ Fixed weight for all SOC nodes /!\
                # cf. node.size in sigma.parseCustom.js
                node["term_occ"] = "12"
                if coordsRAW: node["x"] = str(coords[idNode]['x'])
                if coordsRAW: node["y"] = str(coords[idNode]['y'])
                node["content"] = str(self.toHTML(content))

                nodes[idNode] = node

#            mlog("DEBUG", "SCH","\t",idNode,"\t",nodeLabel)

                nodesA+=1

        GG = Graph()
        for n in self.Graph.edges_iter():
            s = n[0]
            t = n[1]
            w = float(self.Graph[n[0]][n[1]]['weight'])
            tp = self.Graph[n[0]][n[1]]['type']

            if GG.has_edge(s,t):
                oldw = GG[s][t]['weight']
                avgw = (oldw+w)/2      # TODO this avg faster but not indifferent to sequence
                GG[s][t]['weight'] = avgw
            else:
                GG.add_edge( s , t , { "weight":w , "type":tp } )

        e = 0
        for n in GG.edges_iter():#Memory, what's wrong with you?
            wr = 0.0
            origw = GG[n[0]][n[1]]['weight']
            for i in range(2,10):
                wr = round( origw , i)
                if wr > 0.0: break
            edge = {}
            edge["s"] = n[0]
            edge["t"] = n[1]
            edge["w"] = str(wr)
#        edge["type"] = GG[n[0]][n[1]]['type']
            if GG[n[0]][n[1]]['type']=="nodes1": edgesA+=1
            if GG[n[0]][n[1]]['type']=="nodes2": edgesB+=1
            if GG[n[0]][n[1]]['type']=="bipartite": edgesAB+=1

#        mlog("DEBUG", edge["type"],"\t",nodes[n[0]]["label"],"\t",nodes[n[1]]["label"],"\t",edge["w"])

#        if edge["type"]=="nodes1": mlog("DEBUG", wr)
            edges[str(e)] = edge
            e+=1
            #if e%1000 == 0:
            #    mlog("INFO", e)
#    for n in GG.nodes_iter():
#        if nodes[n]["type"]=="NGram":
#            concepto = nodes[n]["label"]
#            nodes2 = []
#            neigh = GG.neighbors(n)
#            for i in neigh:
#                if nodes[i]["type"]=="NGram":
#                    nodes2.append(nodes[i]["label"])
#            mlog("DEBUG", concepto,"\t",", ".join(nodes2))

        graph = {}
        graph["nodes"] = nodes
        graph["links"] = edges
        graph["stats"] = { "sch":nodesA,"kw":nodesB,"n1(soc)":edgesA,"n2(sem)":edgesB,"nbi":edgesAB ,  }
        graph["ID"] = self.unique_id

        mlog("INFO", graph["stats"])

        # mlog("DEBUG", "scholars",nodesA)
        # mlog("DEBUG", "concept_tags",nodesB)
        # mlog("DEBUG", "nodes1",edgesA)
        # mlog("DEBUG", "nodes2",edgesB)
        # mlog("DEBUG", "bipartite",edgesAB)
        return graph



def quotestr(a_str):
    "helper function if we need to quote values ourselves"
    return sub(r"(?<!\\)[']",r"\\'",a_str)


def type_to_sql_filter(val):
    "helper functions if we need to build test filters ourselves"

    if isinstance(val, int):
        rhs = '= %i' % val
    elif isinstance(val, float):
        rhs = '= %f' % val
    # elif isinstance(val, str):
    #     rhs = '= "%s"' % val
    elif isinstance(val, str):
        rhs = 'LIKE "%'+quotestr(val)+'%"'
    return rhs
