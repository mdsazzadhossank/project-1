<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");

// Disable display errors to prevent HTML pollution in JSON response
ini_set('display_errors', 0);
error_reporting(0);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["message" => "Method Not Allowed"]);
    exit;
}

// 1. Validate Input
if (!isset($_FILES['file']) || !isset($_POST['url']) || !isset($_POST['consumer_key']) || !isset($_POST['consumer_secret'])) {
    http_response_code(400);
    echo json_encode(["message" => "Missing required fields (file, url, consumer_key, consumer_secret)"]);
    exit;
}

$file = $_FILES['file'];
if ($file['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(["message" => "File upload error code: " . $file['error']]);
    exit;
}

// 2. Prepare Variables
$wpUrl = rtrim($_POST['url'], '/');
$consumerKey = trim($_POST['consumer_key']);
$consumerSecret = trim($_POST['consumer_secret']);

// 3. Construct URL with Auth Params (Bypasses Header Stripping issues on shared hosting)
// We add consumer_key and consumer_secret to the URL instead of Authorization header
$endpoint = $wpUrl . "/wp-json/wp/v2/media?consumer_key=" . $consumerKey . "&consumer_secret=" . $consumerSecret;

// 4. Read file content
$fileContent = file_get_contents($file['tmp_name']);
$filename = $file['name'];
$mimeType = $file['type'];

// 5. Setup cURL
$ch = curl_init();

curl_setopt($ch, CURLOPT_URL, $endpoint);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $fileContent);

// 6. Set Headers
// Content-Disposition is crucial for WP to recognize the filename
// User-Agent mimics a browser to bypass security plugins (Wordfence, etc.)
$headers = [
    'Content-Type: ' . $mimeType,
    'Content-Disposition: attachment; filename="' . $filename . '"',
    'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Cache-Control: no-cache'
];

curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

// 7. Security/Environment Bypasses
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Allow self-signed certs
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 60); // 60s timeout for large uploads

// 8. Execute
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

// 9. Handle cURL Errors
if ($curlError) {
    http_response_code(500);
    echo json_encode(["message" => "cURL Communication Error: " . $curlError]);
    exit;
}

// 10. Handle HTTP Response Codes
// WordPress returns 201 for created resources
http_response_code($httpCode >= 200 && $httpCode < 300 ? 200 : $httpCode);

// 11. Decode and Return
$decoded = json_decode($response);

if ($decoded === null) {
    // If response isn't JSON, it might be an HTML error page (e.g. 403 Forbidden, 413 Payload Too Large)
    // We strip tags to make it safe for JSON inclusion
    $rawSafe = substr(strip_tags($response), 0, 300);
    echo json_encode([
        "message" => "Invalid JSON response from WordPress. HTTP Code: " . $httpCode,
        "raw_response" => $rawSafe,
        "hint" => "Check server logs, upload limits, or security plugins."
    ]);
} else {
    // Success or WP-formatted JSON error
    echo $response;
}
?>