<?php
// save-log.php - Save order logs to a server-side JSON file
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    if ($data) {
        $file = 'server-logs.json';
        $logs = [];

        if (file_exists($file)) {
            $logs = json_decode(file_get_contents($file), true);
            if (!is_array($logs)) {
                $logs = [];
            }
        }

        // Avoid duplicates by Order ID
        $exists = false;
        foreach ($logs as $log) {
            if ($log['id'] === $data['id']) {
                $exists = true;
                break;
            }
        }

        if (!$exists) {
            array_unshift($logs, $data);
            // Keep last 1000 logs
            $logs = array_slice($logs, 0, 1000);
            file_put_contents($file, json_encode($logs, JSON_PRETTY_PRINT));
            echo json_encode(["status" => "success", "message" => "Log saved"]);
        } else {
            echo json_encode(["status" => "ignored", "message" => "Duplicate order ID"]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Invalid data"]);
    }
} else {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
}
?>
