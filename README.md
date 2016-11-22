Community explorer registration form
=====================================


### Overview
This folder contains nov 2016 registration form server

  - the form is served by [flask](http://flask.pocoo.org/) and uses [javascript functions](https://github.com/moma/regcomex/blob/master/static/js/comex_reg_form_controllers.js) for validation etc  
  - the registration credentials are transmitted to a doors prototype  
  - the answers are POSTed back to server that writes new users in a local DB  

More info in `docs/` directory



### Setting up the server on an nginx server

```
# in a virtualenv or a dedicated VM
pip3 install uwsgi flask




```


(c) 2016 ISCPIF-CNRS
