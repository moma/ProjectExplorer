a dir for uploaded user pics
============================

This dir is the default path in the function saving the custom pic from registration. (`services.tools.pic_blob_to_filename`)

It is also referenced by functions accessing the pic
  - `services.user.User` for the profile
  - `services.db_to_tina_api.extractDataCustom.extract` for explorer graphs
  - `php_library/directory_content.php` for legacy stats
