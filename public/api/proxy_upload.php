<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");

// Disable error reporting for cleaner JSON output, check logs for errors
error_reporting(0);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["message" => "Method Not Allowed"]);
    exit;
}

if (!isset($_FILES['file']) || !isset($_POST['url']) || !isset($_POST['consumer_key']) || !isset($_POST['consumer_secret'])) {
    http_response_code(400);
    echo json_encode(["message" => "Missing required fields (file, url, keys)"]);
    exit;
}

$file = $_FILES['file'];
if ($file['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(["message" => "File upload error code: " . $file['error']]);
    exit;
}

$wpUrl = rtrim($_POST['url'], '/');
$consumerKey = $_POST['consumer_key'];
$consumerSecret = $_POST['consumer_secret'];

// WordPress Media Endpoint
$endpoint = $wpUrl . "/wp-json/wp/v2/media";

$ch = curl_init();

// Read file content to send as binary body
$fileContent = file_get_contents($file['tmp_name']);

curl_setopt($ch, CURLOPT_URL, $endpoint);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $fileContent);

// Set headers for WP REST API Media Upload
$headers = [
    'Content-Type: ' . $file['type'],
    'Content-Disposition: attachment; filename="' . $file['name'] . '"',
    'Authorization: Basic ' . base64_encode($consumerKey . ":" . $consumerSecret),
    'Cache-Control: no-cache'
];

curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Ignore SSL errors (helpful for local/dev servers)
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($curlError) {
    http_response_code(500);
    echo json_encode(["message" => "Curl Error: " . $curlError]);
    exit;
}

// Return the response from WordPress
http_response_code($httpCode >= 200 && $httpCode < 500 ? $httpCode : 500);

// Ensure we output valid JSON
$decoded = json_decode($response);
if ($decoded === null) {
    echo json_encode(["message" => "Invalid response from WordPress", "raw_response" => substr($response, 0, 200)]);
} else {
    echo $response;
}
?>