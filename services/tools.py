"""
utility functions
"""
__author__    = "CNRS"
__copyright__ = "Copyright 2016 ISCPIF-CNRS"
__email__     = "romain.loth@iscpif.fr"

from configparser import ConfigParser
from os           import environ, path

CONFIGMENU = [
            {"sec": 'main',       "var":'DEBUG_FLAG',   "def": True         },
            {"sec": 'main',       "var":'COMEX_HOST',   "def": '0.0.0.0'    },
            {"sec": 'main',       "var":'COMEX_PORT',   "def": '9090'       },
            {"sec": 'routes',     "var":'PREFIX',       "def": '/services'  },
            {"sec": 'routes',     "var":'USR_ROUTE',    "def": '/user'      },
            {"sec": 'routes',     "var":'API_ROUTE',    "def": '/api'       },
            {"sec": 'services',   "var":'SQL_HOST',     "def": '172.17.0.2' },
            {"sec": 'services',   "var":'SQL_PORT',     "def": '3306'       },
            {"sec": 'services',   "var":'DOORS_HOST',   "def": '0.0.0.0'    },
            {"sec": 'services',   "var":'DOORS_PORT',   "def": '8989'       }
          ]


def home_path():
    """
    we are in ./services so project home is the dirname of the parent
    """
    return path.dirname(path.dirname(path.realpath(__file__)))


def read_config():
    """
    reads all global config vars trying in order:
        1) env variables of the same name
        2) the config file $HOME/parametres_comex.ini
        3) hard-coded default values

    output is a simple dict
    """
    out_dict = {}
    our_home = home_path()

    ini = ConfigParser()
    inipath = path.join(our_home, "config", "parametres_comex.ini")
    ini.read(inipath)

    # debug sections
    if "main" not in ini:
        print("WARNING: the config file at '%s' seems empty, I will use env or default values")

    # read ini file and use 2 fallbacks: env or default
    for citem in CONFIGMENU:
        section = citem['sec']
        varname = citem['var']
        default = citem['def']
        is_bool = (type(default) == bool)

        print("DEBUG: config for '%s'"%varname)

        if varname in environ:
            if is_bool:
                out_dict[varname] = (environ[varname] == 'true')
            else:
                out_dict[varname] = environ[varname]
            print("DEBUG: ok from env for '%s'"%varname)

        elif section in ini and varname in ini[section]:
            if is_bool:
                out_dict[varname] = ini.getboolean(section, varname)
            else:
                out_dict[varname] = ini.get(section, varname)
            print("DEBUG: ok from file for '%s'"%varname)

        else:
            out_dict[varname] = default
            print("DEBUG: ok from default for '%s'"%varname)

    # DEBUG FORCED
    out_dict['DEBUG_FLAG'] = True

    # also add our project home since we have it and we'll need it
    out_dict['HOME'] = our_home

    return out_dict
