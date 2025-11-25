<?php
// Configuración de la base de datos
$host = 'localhost';
$username = 'root';  
$password = '';

try {
    // Primero conectar sin base de datos
    $pdo = new PDO("mysql:host=$host;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Crear la base de datos si no existe
    $pdo->exec("CREATE DATABASE IF NOT EXISTS kiosco_incade");
    
    // Ahora conectar a la base de datos
    $pdo->exec("USE kiosco_incade");
    
} catch(PDOException $e) {
    die("Error de conexión: " . $e->getMessage());
}
?>