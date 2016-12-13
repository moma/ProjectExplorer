### List of features that where deactivated

During rewrite we deactivated some retrieval to match the new sql tables from registration:

  - tables organizations, labs are not separated and their detailed addresses don't exist => TODO RESTORE in `directory_content.php` (and therefore incomplete info are passed to `labs_list.php` and `orga_list.php`)

  - in `print_directory.php`, all the following columns are now ignored: 'css_voter', 'css_member', 'status', 'lab2', 'affiliation2', 'address', 'city', 'postal_code', 'phone', 'mobile', 'fax', 'affiliation_acronym' => TODO RESTORE

  - in `print_scholar_directory.php`
    - similar changes as above
