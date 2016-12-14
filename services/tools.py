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
            {"sec": 'backends',   "var":'SQL_HOST',     "def": '172.17.0.2' },
            {"sec": 'backends',   "var":'SQL_PORT',     "def": '3306'       },
            {"sec": 'backends',   "var":'DOORS_HOST',   "def": '0.0.0.0'    },
            {"sec": 'backends',   "var":'DOORS_PORT',   "def": '8989'       }
          ]


def home_path():
    """
    returns ./../..
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

    # check sections
    if len(ini.keys()) <= 1:
        print("WARNING: the config file at '%s' seems empty, I will use env or default values" % inipath)

    for k in ini.keys():
        if k not in ['DEFAULT', 'backends', 'main', 'routes']:
            print("WARNING: ignoring section  '%s'")

    # read ini file and use 2 fallbacks: env or default
    for citem in CONFIGMENU:
        section = citem['sec']
        varname = citem['var']
        default = citem['def']
        is_bool = (type(default) == bool)

        if varname in environ:
            if is_bool:
                out_dict[varname] = (environ[varname] == 'true')
            else:
                out_dict[varname] = environ[varname]

            print("ini debug: '%10s' ok from env" % varname)

        elif section in ini and varname in ini[section]:
            if is_bool:
                out_dict[varname] = ini.getboolean(section, varname)
            else:
                out_dict[varname] = ini.get(section, varname)

            print("ini debug: '%10s' ok from file" % varname)

        else:
            out_dict[varname] = default

            print("ini debug: '%10s' ok from default" % varname)

    # also add our project home since we have it and we'll need it
    out_dict['HOME'] = our_home

    return out_dict


def restparse(paramstr):
    """
    "keyA[]=valA1&keyB[]=valB1&keyB[]=valB2&keyC=valC"

    => {
        "keyA": [valA1],
        "keyB": [valB1, valB2],
        "keyC": valC
        }

    NB better than flask's request.args (aka MultiDict)
       because we remove the '[]' and we rebuild the arrays
    """
    resultdict = {}
    components = paramstr.split('&')
    for comp in components:
        (keystr, valstr) = comp.split('=')

        # type array
        if len(keystr) > 2 and keystr[-2:] == "[]":
            key = unquote(keystr[0:-2])

            if key in resultdict:
                resultdict[key].append(unquote(valstr))
            else:
                resultdict[key] = [unquote(valstr)]

        # atomic type
        else:
            key = unquote(keystr)
            resultdict[key]=unquote(valstr)

    return resultdict
