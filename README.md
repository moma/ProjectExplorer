# Flask-User starter app
This code base serves as a great starting point to write your next Flask application  


Official repo:
    git clone https://github.com/lingthio/Flask-User-starter-app   regcomex

export LC_ALL=C
sudo apt-get install postgresql-server-dev-9.4

export ENV_SETTINGS_FILE=.../regcomex/env_settings.py

virtualenv -p /usr/bin/python3 env
source env/bin/activate


pip install -r requirements.txt
pip list --outdated | sed 's/(.*//g' | xargs -n1 pip install -U

app/templates/layout.html           :29: change to    {% if current_user.is_authenticated %}
app/templates/core/home_page.html   : 8: change to    {% if not current_user.is_authenticated %}

python manage.py init_db

./runserver.sh





NGINX conf:


        location /a {
            proxy_pass http://127.0.0.1:5000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Scheme $scheme;
            proxy_set_header X-Script-Name /a;
        }



## Acknowledgements
With thanks to the following Flask extensions:

* [Alembic](alembic.readthedocs.org)
* [Flask-Migrate](flask-migrate.readthedocs.org)
* [Flask-User](pythonhosted.org/Flask-User/)

[Flask-User-starter-app](https://github.com/lingthio/Flask-User-starter-app) was used as a starting point for this code repository.

    # Please consider leaving the line above in your project's README file. Thank you.

