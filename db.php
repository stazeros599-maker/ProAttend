<?php
// db.php
$host = "127.0.0.1";
$user = "root";
$password = "";
$dbname = "proattend2.0"; // Matches your exact schema dump database name

$conn = new mysqli($host, $user, $password, $dbname);

if ($conn->connect_error) {
    die("Database Connection Failed: " . $conn->connect_error);
}
?>