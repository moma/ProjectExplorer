# ProjectExplorer: a graph client-side engine

### Presentation

Thank you for using ProjectExplorer/TinawebJS.

This work is lead by the Complex Systems Institute of Paris Ile-de-France ([ISCPIF](http://iscpif.fr)) and the [Centre d'Analyse et de Mathématique Sociales](http://cams.ehess.fr/), both [CNRS](http://www.cnrs.fr/) entities.

###### Source code repository
    https://github.com/moma/ProjectExplorer

###### Authors

Researchers and engineers of the [ISCPIF/CNRS - UPS 3611](http://iscpif.fr)
 - Dr. David Chavalarias
 - Samuel Castillo
 - Romain Loth

You can contact the authors by email (<firstname.lastname@iscpif.fr>).

###### Acknowledgements
 - TinawebJS is build on top of Alexis Jacomy and Guillaume Plique's [sigmaJS](http://sigmajs.org)
 - This work is the continuation of the TINA project, an European Union FP7 project - FP7-ICT-2009-C
 - Former Tina developpers (java based software from which tinawebJS is adapted)
  - [Elias Showk](https://github.com/elishowk)
  - [Julian Bilcke](https://github.com/jbilcke)


### Usage

ProjectExplorer is a versatile app that can be used as standalone or as a client library. The documentation concerning the different setup cases is being updated after a major refactoring and will grow in time.

Here are the main points.

###### Getting started
In the simplest setup, just clone the repository and open explorerjs.html in a modern browser.
```
git clone https://github.com/moma/ProjectExplorer.git
cd ProjectExplorer
firefox explorerjs.html
```
=> An input in the upper right side allows you to open any gexf file.

###### Usage on a web server
To activate all features, you should:
  1. configure a web server like apache or nginx, for instance on your localhost
  2. define a new "location" in your apache or nginx conf, pointing to the directory you cloned


Now you can already use ProjectExplorer as a showcase for a given file
  - Put a mono or bipartite gexf, e.g.: `Somemap.gexf`, inside the `data/` folder.
  - And then see it in your browser:  
        http://localhost/explorerjs.html?sourcemode=serverfile&file=data/Somemap.gexf

Once you have this webserver running and some source data files, you may also configure a "sources list":
  - it will be shown as a **menu** to select graphs in the interface
  - it allows to define associated **node types** for each source
  - it allows to define associated **search backends** for each source
  - to use this, follow the guidelines in the **[Servermenu HOWTO](https://github.com/moma/ProjectExplorer/blob/master/00.DOCUMENTATION/A-Introduction/servermenu_config.md)**

###### Integration in a larger app
To integrate ProjectExplorer in a larger web application, you may have several locations with subdirectories defined on your server. In this case, you'll need to use the provided path modification tool (see this [integration procedure example](https://github.com/moma/ProjectExplorer/tree/master/00.DOCUMENTATION/A-Introduction#integration-policy))
###### Advanced settings
For more information about other ProjectExplorer's settings (settings file, input modes, attribute processing options), please refer to the [developer's manual](https://github.com/moma/ProjectExplorer/blob/master/00.DOCUMENTATION/C-advanced/developer_manual.md).

### Copyright and license

Copyright (c) 2013-2017 **ISCPIF** --
 **CAMS** -- **Centre National de la Recherche Scientifique**

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with this program.  If not, see http://www.gnu.org/licenses/gpl.html.
