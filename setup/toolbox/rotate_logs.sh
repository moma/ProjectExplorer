#! /bin/bash

# rotate the logs

# ex: 'logs/services.log' -> 'logs/archived/2017-03-10_services.log'
# 'logs/nginx_access.log' -> 'logs/archived/2017-03-10_nginx_access.log'

# nb: afterwards, it's good to do an app + nginx restart to recreate them

export PATH_TO_LOGDIR="./logs"

mkdir -p $PATH_TO_LOGDIR/archived
export curdate=`date +"%Y-%m-%d"`
echo $curdate
ls $PATH_TO_LOGDIR/*.log | while read fname
    do
         bname=`basename $fname`
         newname="${curdate}_${bname}"
         mv -bv $fname $PATH_TO_LOGDIR/archived/$newname
    done
