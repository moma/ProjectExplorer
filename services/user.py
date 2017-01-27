"""
Simple user class to provide login

cf. https://flask-login.readthedocs.io/en/latest/#how-it-works
    https://flask-login.readthedocs.io/en/latest/_modules/flask_login/mixins.html#UserMixin
"""
__author__    = "CNRS"
__copyright__ = "Copyright 2016 ISCPIF-CNRS"
__email__     = "romain.loth@iscpif.fr"

from re          import match
from requests    import post
from json        import dumps, loads
from datetime    import date
from flask_login import LoginManager

if __package__ == 'services':
    from services.db    import connect_db, get_full_scholar
    from services.tools import mlog, REALCONFIG
else:
    from db             import connect_db, get_full_scholar
    from tools          import mlog, REALCONFIG

# will be exported to main for initialization with app
login_manager = LoginManager()

# scholar User objects cache
UCACHE = {}

@login_manager.user_loader
def load_user(uid):
    """
    Used by flask-login to bring back user object from uid stored in session
    """
    u = None
    if uid in UCACHE:
        u = UCACHE[uid]
        mlog("DEBUG", "load_user: user re-loaded by cache")
    else:
        try:
            u = User(uid)
            UCACHE[uid] = u
            mlog("DEBUG", "load_user: user re-loaded from DB")
        except Exception as err:
            mlog("ERROR", "User(%s) init error:" % str(uid), err)
    return u


def doors_login(email, password, config):
    """
    Remote query to Doors API to login a user

    Doors responses look like this:
        {'status': 'login ok',
          'userInfo': {
            'hashAlgorithm': 'PBKDF2',
            'password': '8df55dde7b1a2cc013afe5ed2d20ae22',
            'id': {'id': '9e30ce89-72a1-46cf-96ca-cf2713b7fe9d'},
            'name': 'Corser, Peter',
            'hashParameters': {
              'iterations' : 1000,
              'keyLenght' : 128
            }
          }
        }
    """
    uid = None

    # £TODO https here !! + certificate for doors
    doors_base_url = 'http://'+config['DOORS_HOST']+':'+config['DOORS_PORT']
    doors_response = post(doors_base_url+'/api/user', data=dumps({'login':email, 'password':password}))


    print("doors_response",doors_response)
    mlog("INFO", "doors_response",doors_response)
    if doors_response.ok:
        login_info = loads(doors_response.content.decode())

        if login_info['status'] == "login ok":
            uid = login_info['userInfo']['id']['id']

    return uid


def jsonize_uinfo(uinfo_dict):
    """
    Dumps user_info in json format for client-side needs
    """

    # most fields are already serializable
    serializable_dict = {k:v for k,v in uinfo_dict.items() if k not in ['pic_file', 'valid_date']}

    if 'pic_file' in uinfo_dict and type(uinfo_dict['pic_file']) == bytes and len(uinfo_dict['pic_file']):
        serializable_dict['pic_file'] = "<blob_not_copied>"

    if 'valid_date' in uinfo_dict and uinfo_dict['valid_date'] is not None:
        d = uinfo_dict['valid_date']
        if type(d) != date:
            raise TypeError("Incorrect type for valid_date: '%s' instead of 'date'" % type(d))
        else:
            # "YYYY-MM-DD"
            serializable_dict['valid_date'] = d.isoformat()

    return dumps(serializable_dict)


class User(object):

    def __init__(self, uid):
        self.uid = uid

        user_info = get_full_scholar(uid)

        if user_info is None:
            # user exists in doors but has nothing in DB yet
            self.info = {}
            self.json_info = "{}"
            self.empty = True
        else:
            # normal user has a nice info dict
            self.info = user_info
            self.json_info = jsonize_uinfo(user_info)
            self.empty = False

    def get_id(self):
        return str(self.uid)

    @property
    def is_active(self):
        """
        :boolean flag:

        uses scholars.status
        and self.empty <=> is also active a user who exists
                           in doors db but not in comex_db

              STATUS STR           RESULT
               "active"          flag active
                "test"           flag active if DEBUG
               "legacy"          flag active if validity_date >= NOW()
        """
        if self.empty:
            # the user has a doors uid so he's entitled to a login
            return True
        else:
            # ... or has a record_status in comex_db
            sirstatus = self.info['record_status']
            sivdate = self.info['valid_date']

            # boolean result
            return (sirstatus == "active"
                        or (
                            sirstatus == "legacy"
                            and
                            sivdate <= date.today()
                        )
                        or (
                            sirstatus == "test"
                            and
                            REALCONFIG['LOG_LEVEL'] == "DEBUG"
                        )
                    )

    @property
    def is_anonymous(self):
        """
        POSS in the future we can use it for demo users
        """
        return False

    @property
    def is_authenticated(self):
        """
        We assume user object only exists if user was authenticated or has cookie
        POSS: re-test each time with doors
        """
        return True

    def __eq__(self, other):
        return self.uid == other.uid
