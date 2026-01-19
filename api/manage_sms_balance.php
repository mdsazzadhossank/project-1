
<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include 'db.php';

// 1. Auto-create table if it doesn't exist
$table_sql = "CREATE TABLE IF NOT EXISTS sms_balance_store (
    id INT(11) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    balance INT(11) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)";

if ($conn->query($table_sql) === TRUE) {
    // 2. Ensure default row exists
    $check_sql = "SELECT id FROM sms_balance_store WHERE id = 1";
    $result = $conn->query($check_sql);
    
    if ($result->num_rows == 0) {
        $conn->query("INSERT INTO sms_balance_store (id, balance) VALUES (1, 0)");
    }
} else {
    echo json_encode(["error" => "Error creating table: " . $conn->error]);
    exit;
}

// 3. Handle Requests
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $result = $conn->query("SELECT balance FROM sms_balance_store WHERE id = 1");
    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();
        echo json_encode(["balance" => (int)$row['balance']]);
    } else {
        echo json_encode(["balance" => 0]);
    }
} 
elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents("php://input"), true);
    
    if (isset($input['balance'])) {
        $new_balance = (int)$input['balance'];
        
        // Prevent negative balance
        if ($new_balance < 0) $new_balance = 0;

        $update_sql = "UPDATE sms_balance_store SET balance = $new_balance WHERE id = 1";
        
        if ($conn->query($update_sql) === TRUE) {
            echo json_encode(["success" => true, "balance" => $new_balance, "message" => "Balance updated"]);
        } else {
            echo json_encode(["success" => false, "message" => "Error updating record: " . $conn->error]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "Balance value missing"]);
    }
}

$conn->close();
?>
