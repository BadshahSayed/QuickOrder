<?php
// clear-logs.php - Optional: Clear logs from the server
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// In a real app, this should be password protected on the server side too
$file = 'server-logs.json';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (file_exists($file)) {
        file_put_contents($file, json_encode([]));
        echo json_encode(["status" => "success", "message" => "Logs cleared"]);
    } else {
        echo json_encode(["status" => "success", "message" => "No logs to clear"]);
    }
} else {
    // Handle other methods if necessary, or just return a method not allowed error
    http_response_code(405); // Method Not Allowed
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
}
?>
