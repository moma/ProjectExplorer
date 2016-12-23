"""
Simple user class to provide login

cf. https://flask-login.readthedocs.io/en/latest/#how-it-works
    https://flask-login.readthedocs.io/en/latest/_modules/flask_login/mixins.html#UserMixin
"""
__author__    = "CNRS"
__copyright__ = "Copyright 2016 ISCPIF-CNRS"
__email__     = "romain.loth@iscpif.fr"

from requests    import post
from json        import dumps, loads
from flask_login import LoginManager

# for fill_in_local
from MySQLdb     import connect, ProgrammingError


# will be exported to main for initialization with app
login_manager = LoginManager()

@login_manager.user_loader
def load_user(user_id):
    """
    Used by flask-login to bring back user object from uid stored in session
    """
    # TODO retrieve from a cache or lazily from DB
    return User(user_id)


def doors_login(email, password, config):
    """
    Query to Doors API to login a user

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

    # TODO https here + certificate for doors
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

    def get_id(self):
        return str(self.uid)

    @property
    def is_active(self):
        """
        TODO use scholars.status
        """
        return True

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
