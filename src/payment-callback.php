<?php
// Hostinger (Apache/PHP) Handler for ICICI Payment Callback
// This file accepts the POST request from the bank and redirects to the Angular App as GET.

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get all POST data
    // ICICI sends data in POST body, but also sometimes query string? 
    // Usually they post FORM DATA.
    // However, the previous logic assumed they send params. 
    // Let's grab both POST and GET params to be safe and forward them.
    
    $params = [];
    foreach ($_POST as $key => $value) {
        $params[] = $key . '=' . urlencode($value);
    }
    // Also include any query string params if present
    foreach ($_GET as $key => $value) {
         $params[] = $key . '=' . urlencode($value);
    }
    
    $queryString = implode('&', $params);
    
    // Redirect to the root (Angular App) with these parameters
    // 303 See Other enforces GET
    header("Location: /?" . $queryString, true, 303);
    exit();
} else {
    // If accessed directly via GET, just redirect home
    // Pass through any existing query params
    $queryString = $_SERVER['QUERY_STRING'];
    header("Location: /?" . $queryString, true, 303);
    exit();
}
?>
