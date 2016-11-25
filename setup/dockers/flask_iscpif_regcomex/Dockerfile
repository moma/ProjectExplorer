# Regcomex minimal dockerfile
# ----------------------------
# based on https://github.com/egeland/docker-gunicorn-python3-flask by F Egeland

FROM ubuntu:xenial

# Base
ENV HOST 0.0.0.0
ENV DEBUG_FLAG false
ENV LANG fr_FR.UTF-8
ENV DEBIAN_FRONTEND noninteractive

RUN locale-gen fr_FR fr_FR.UTF-8
RUN dpkg-reconfigure locales

RUN apt-get update && apt-get autoclean
RUN apt-get install -y python3-pip git nano

# Install global dependencies
RUN pip3 install --upgrade pip
RUN pip3 install gunicorn flask

# for regcomex itself ----------------------------------------------------------
# pull the comex server from repository
RUN git clone https://github.com/moma/regcomex.git

# main CMD to start the app
WORKDIR /regcomex
CMD bash run.sh

# Ports
EXPOSE 5000
EXPOSE 9090
