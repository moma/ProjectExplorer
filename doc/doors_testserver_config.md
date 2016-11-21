#### Why and what?
After comex-reg setup, one may want to run a doors server to interact with.

  1) To do that we need to install doors  
  2) Doors is served by a jetty server so we need to do a few things



## Doors installation

First you'll need to install sbt (for scala builds): see http://www.scala-sbt.org/


```bash
# any installation dir is ok...
cd /~  
git clone https://github.com/ISCPIF/doors.git
cd doors/application
sbt
```

Then we build and run the scala app in sbt command line
```sbt
project lab
run
```




## Server conf
### If nginx
see more info in the [nginx doc for a jetty](https://www.nginx.com/resources/wiki/start/topics/examples/javaservers)

#### gist
```
proxy_pass  http://localhost:8080;  # <== jetty app referenced by nginx
```




### If apache

see more info in the [jetty doc for apache](http://wiki.eclipse.org/Jetty/Tutorial/Apache#Configuring_Apache)

#### Required apache mod
```
sudo a2enmod proxy_ajp        # <= needed for proxy relay
```

#### Expected apache conf
```
TODO



## Doors status protocol

**TODO**

DOORS callDoors  
// need to handle the various return formats  
// then send one of 2 * 2 possibilities (+  unknown exceptions)  
//          action     |   response  
//           login           login ok  
//           login           can't login  
//           register        register ok  
//           register        can't register  
//           register        login exists        // ML remark : this is redundant  
// TODO verif protocole de statuts  


```
