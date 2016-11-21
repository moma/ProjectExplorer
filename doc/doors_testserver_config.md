#### Why and what?
After comex-reg setup, one may want to run a doors server to interact with.

Doors is served by a jetty server so we need to do a few things

### If nginx
see more info in the [nginx doc for a jetty](https://www.nginx.com/resources/wiki/start/topics/examples/javaservers)

####
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

```
