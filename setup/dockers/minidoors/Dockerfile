# Doors minimal dockerfile
# -------------------------
# based on scala and sbt Dockerfile (https://github.com/hseeberger/scala-sbt)

# Pull base image
FROM java:8

# cf. doors/application/build.sbt for correct version
ENV SCALA_VERSION 2.11.8
ENV SBT_VERSION 0.13.12
ENV DOORS_COMMIT ef7c5e0

# Install Scala
## Piping curl directly in tar
RUN \
  curl -fsL http://downloads.typesafe.com/scala/$SCALA_VERSION/scala-$SCALA_VERSION.tgz | tar xfz - -C /root/ && \
  echo >> /root/.bashrc && \
  echo 'export PATH=~/scala-$SCALA_VERSION/bin:$PATH' >> /root/.bashrc

# Install sbt
RUN \
  curl -L -o sbt-$SBT_VERSION.deb http://dl.bintray.com/sbt/debian/sbt-$SBT_VERSION.deb && \
  dpkg -i sbt-$SBT_VERSION.deb && \
  rm sbt-$SBT_VERSION.deb && \
  apt-get update && \
  apt-get install sbt && \
  sbt sbtVersion

WORKDIR /root

# Build Doors ------------------------------------------------------------------
RUN git clone https://github.com/ISCPIF/doors.git
WORKDIR /root/doors
RUN git checkout $DOORS_COMMIT
WORKDIR /root/doors/application

# build and compile it once so it downloads dependencies
RUN sbt "project lab" compile test package

# sset docker run command to run doors servers
CMD sbt "project lab" run

# ports
EXPOSE 8989
