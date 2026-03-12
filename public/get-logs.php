<?php
// get-logs.php - Retrieve order logs from the server
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$file = 'server-logs.json';

if (file_exists($file)) {
    echo file_get_contents($file);
} else {
    echo json_encode([]);
}
?>
