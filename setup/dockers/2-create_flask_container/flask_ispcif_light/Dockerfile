FROM ubuntu:xenial


# based on https://github.com/egeland/docker-gunicorn-python3-flask/blob/master/Dockerfile
# MAINTAINER Frode Egeland <egeland@gmail.com>

# Base
ENV LANG fr_FR.UTF-8
ENV DEBIAN_FRONTEND noninteractive

RUN locale-gen fr_FR fr_FR.UTF-8
RUN dpkg-reconfigure locales

# fine-tuning locales (src: gargantext)
# RUN sed -i -e 's/# en_GB.UTF-8 UTF-8/en_GB.UTF-8 UTF-8/' /etc/locale.gen && \
#     sed -i -e 's/# fr_FR.UTF-8 UTF-8/fr_FR.UTF-8 UTF-8/' /etc/locale.gen && \
#     dpkg-reconfigure --frontend=noninteractive locales && \
#     echo 'LANG="fr_FR.UTF-8"' > /etc/default/locale
# ENV LANG fr_FR.UTF-8
# ENV LANGUAGE fr_FR.UTF-8
# ENV LC_ALL fr_FR.UTF-8

RUN apt-get update && apt-get autoclean
RUN apt-get install -y python3-pip git

# Install global dependencies
RUN pip3 install --upgrade pip
RUN pip3 install gunicorn flask

# pull the comex server from repository
RUN git clone https://github.com/moma/regcomex.git

# don't do this ( start the app at image build XD )
# WORKDIR /regcomex
# RUN gunicorn -b 127.0.0.1:9090 server_comex_registration:app

# but use the running script instead

# if Install gunicorn running script
# ADD run /usr/local/bin/run
# RUN chmod +x /usr/local/bin/run


# if REALLY needed virtualenv (TODO avoid it)
# RUN apt install python3-virtualenv
# RUN virtualenv --python=/usr/bin/python3 setup/regcomex_venv
# RUN setup/regcomex_venv/bin/activate && pip3 install -r setup/requirements.txt


# Volumes
# VOLUME ["/root/app/logs"]

# Ports
EXPOSE 5000:5000
EXPOSE 9090:9090
