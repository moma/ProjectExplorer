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
from datetime    import time, timedelta
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

    if doors_response.ok:
        login_info = loads(doors_response.content.decode())

        if login_info['status'] == "login ok":
            uid = login_info['userInfo']['id']['id']

    return uid


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
            self.json_info = dumps({k:v for k,v in user_info.items() if k != 'pic_file'})
            self.empty = False

    def get_id(self):
        return str(self.uid)

    @property
    def is_active(self,
                  # 3 months ~ 91 days
                  legacy_time_active = timedelta(days=91.3125)):
        """
        :boolean flag:

        uses scholars.status
        and self.empty <=> is also active a user who exists
                           in doors db but not in comex_db


              STATUS STR           RESULT
               "active"          flag active
                "test"           flag active if DEBUG
    "legacy:sent_2017-01-01"     flag active until 2017/04/01
                                                   (ie 2017/01/01 + 3 months)
        """
        if self.empty:
            # the user has a doors uid so he's entitled to a login
            return True
        else:
            # ... or has a record_status in comex_db
            sirstatus = self.info['record_status']

            # maybe occasionaly legacy user
            legacystatus = match("legacy:sent_([\d-]{10})",sirstatus)

            # boolean result
            return (sirstatus == "active"
                        or (
                            legacystatus
                            and
                            date(*[int(tc) for tc in legacystatus.groups()[0].split('-')]) + legacy_time_active < date.today()
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
        TODO choose strategy
          - assume user object only exists if user was authenticated
          - or re-test each time with doors?
        """
        return True

    def __eq__(self, other):
        return self.uid == other.uid
