### List of features that where deactivated

During rewrite we deactivated some retrieval to match the new sql tables from registration:

  - tables organizations, labs don't exist => TODO RESTORE in `directory_content.php` (and therefore empty arrays are passed to `labs_list.php` and `orga_list.php`)

  - in `search_scholar.php`, column nb_keywords doesn't exist (and now keywords are never 0) => TODO RESTORE

  - in `print_directory.php`, all the following columns are now ignored: 'nb_keywords', 'css_voter', 'css_member', 'keywords_ids', 'status', 'homepage', 'lab2', 'affiliation2', 'homepage', **'position'** (used in `stats_prep_from_array.php`), 'photo_url', 'address', 'city', 'postal_code', 'phone', 'mobile', 'fax', 'affiliation_acronym' => TODO RESTORE
  - in `print_scholar_directory.php`
    - similar changes as above
    - additional change to keywords_ids search in old "scholars2terms" table => becomes `LIKE` search in keywords: TODO index
