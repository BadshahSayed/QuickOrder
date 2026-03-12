<?php
// clear-logs.php - Optional: Clear logs from the server
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Content-Type: application/json");

// In a real app, this should be password protected on the server side too
$file = 'server-logs.json';

if (file_exists($file)) {
    file_put_contents($file, json_encode([]));
    echo json_encode(["status" => "success", "message" => "Logs cleared"]);
} else {
    echo json_encode(["status" => "success", "message" => "No logs to clear"]);
}
?>
