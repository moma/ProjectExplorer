<?php

$doors_connect_params = '<form><input id="doors_connect" name="doors_connect" type="text" hidden="" value="doors.iscpif.fr"></form>';

$topbar = '
<div class="topbar" style="opacity: 0.9;">
    <div class="topbar-inner">
        <div class="container-fluid">
            <ul class="white nav navbar-nav navbar-left">
                <li>
                    <a class="brand" href="https://iscpif.fr/">
                      <img height="25px" style="max-width:30px;" src="/static/img/logo_m_bleu-header.png"></a>
                </li>
                <li>
                    <a class="brand" href="/">
                      <span class="glyphicon glyphicon-home white"></span>&nbsp;&nbsp;
                      Community Explorer
                    </a>
                </li>


              <!-- MAIN SEARCH/REFINE NAVBAR -->
              <li id="mapping" class="comex-nav-item">
                  <p class=\'topbarlink\'>
                      <strong>SELECT Keywords AND Scholars</strong>
                  </p>
              </li>
              <li id="refine" class="dropdown comex-nav-item">
                  <a class="btn-default nav-inline-selectable"
                     style="padding-top: 1em"
                     onclick=\'$(this).next(".dropdown-menu").toggle();\'
                     >refine<i class="caret"></i></a>
                  <ul class="dropdown-menu">
                      <li>
                          <a id="addfiltercountry" href="#"
                              onclick=\'$(this).parents(".dropdown-menu").toggle();\'>
                              Filter by country</a>
                      </li>
                      <li>
                          <a id="addfilterkeyword" href="#"
                             onclick=\'$(this).parents(".dropdown-menu").toggle();\'>
                             Filter by keyword</a>
                      </li>
                      <li>
                          <a id="addfiltertag" href="#"
                             onclick=\'$(this).parents(".dropdown-menu").toggle();\'>
                             Filter by community tags</a>
                      </li>
                      <li>
                          <a id="addfilterlaboratory" href="#"
                             onclick=\'$(this).parents(".dropdown-menu").toggle();\'>
                             Filter by laboratory</a>
                      </li>
                      <li>
                          <a id="addfilterinstitution" href="#"
                             onclick=\'$(this).parents(".dropdown-menu").toggle();\'>
                             Filter by organization</a>
                      </li>
                  </ul>
              </li>
              <li class="comex-nav-item">
                  <a class="topbarlink" id="print" href="#"> <i class="icon-arrow-right icon-white"></i> <strong>CREATE DIRECTORY</strong></a>
              </li>
              <li class="comex-nav-item">
                  <p class="topbarlink">
                      <strong>&nbsp;OR&nbsp;</strong>
                  </p>
              </li>
              <li class="comex-nav-item">
                  <a class="topbarlink" id="generate" href="#"> <i class="icon-arrow-right icon-white"></i> <strong>MAP</strong></a>
              </li>
            </ul>


            <ul class="white nav navbar-nav navbar-right">
            <!--
                <li class="comex-nav-item">
                    <a class="topbarlink" href=\'/print_scholar_directory.php?query={{ current_user.uid }}\'> Your Directory </a>
                </li>
            -->

              <!-- USER TOOLBARS (LOGIN/REGISTER/PROFILE/ETC) -->
              <li class="dropdown">
                <a href="#" class="navlink dropdown-toggle"
                   data-toggle="dropdown" role="button"
                   aria-haspopup="true" aria-expanded="false">
                   <span class="glyphicon glyphicon-user"></span>
                   User
                   <span class="caret"></span>
               </a>
                <ul class="dropdown-menu">
                    <li style="color:red;">
                        <a href="/services/user/register"> Register </a>
                    </li>
                    <li>
                        <div class="dropdown-a-like" id="poplogin"
                          data-toggle="dropdown"
                          onclick="cmxClt.elts.box.toggleBox(\'auth_modal\')">
                          Login </div>
                    </li>
                    <li>
                        <a href="/services/user/profile"> Your Profile </a>
                    </li>
                    <li>
                        <a href="/services/user/logout/"> Logout </a>
                    </li>
                </ul>
              </li>
            </ul>
        </div>
    </div>
</div>
';


?>
