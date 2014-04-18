<?php

function curl_get_contents($url) {
        // Initiate the curl session
        $ch = curl_init();
        
        // Set the URL
        curl_setopt($ch, CURLOPT_URL, $url);
        
        // Removes the headers from the output
        curl_setopt($ch, CURLOPT_HEADER, 0);
        
        // Return the output instead of displaying it directly
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        
        // Execute the curl session
        $output = curl_exec($ch);
        
        // Close the curl session
        curl_close($ch);
        
        // Return the output as a variable
        return $output;
}

// Get remote file contents, preferring faster cURL if available
function remote_get_contents($url) {
        if (function_exists('curl_get_contents') AND function_exists('curl_init')) {
                return curl_get_contents($url);
        }
        else {
                // A litte slower, but (usually) gets the job done
                return file_get_contents($url);
        }
}

?>
