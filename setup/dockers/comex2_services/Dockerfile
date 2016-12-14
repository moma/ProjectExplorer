# Comex2 minimal dockerfile
# --------------------------
# based on https://github.com/egeland/docker-gunicorn-python3-flask by F Egeland

FROM ubuntu:xenial

# Base
ENV HOST 0.0.0.0
ENV DEBUG_FLAG false
ENV LANG fr_FR.UTF-8
ENV DEBIAN_FRONTEND noninteractive

RUN locale-gen fr_FR fr_FR.UTF-8
RUN dpkg-reconfigure locales

# Install global dependencies and utilities
RUN apt update && apt autoclean
# if without nginx add php7.0-fpm php7.0-mysql
RUN apt install -y python3-pip libmysqlclient-dev git nano tree iputils-ping
RUN pip3 install --upgrade pip

# for comex2 itself ----------------------------------------------------------
# pull the comex server from repository
RUN echo "updating git"
RUN git clone https://github.com/moma/comex2.git

# Install project dependencies
RUN pip3 install -r comex2/setup/requirements.txt

# main CMD to start the app
WORKDIR /comex2

# flask dev server
# CMD python3 server_comex_registration.py

# gunicorn production server
CMD bash run.sh

# ports ------------------------------------------------------------------------
# flask dev server
# EXPOSE 5000

# gunicorn production server
EXPOSE 9090
