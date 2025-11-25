<?php
require_once 'config.php';

// Crear base de datos y tablas
$sql = "
CREATE DATABASE IF NOT EXISTS kiosco_incade;
USE kiosco_incade;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    matricula VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(20) DEFAULT 'cliente',
    puntos INT DEFAULT 100,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de productos
CREATE TABLE IF NOT EXISTS productos (
    id VARCHAR(10) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    icono VARCHAR(10) NOT NULL
);

-- Tabla de favoritos
CREATE TABLE IF NOT EXISTS favoritos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    matricula VARCHAR(20) NOT NULL,
    producto_id VARCHAR(10) NOT NULL,
    FOREIGN KEY (matricula) REFERENCES usuarios(matricula),
    FOREIGN KEY (producto_id) REFERENCES productos(id),
    UNIQUE KEY unique_favorite (matricula, producto_id)
);

-- Tabla de carritos
CREATE TABLE IF NOT EXISTS carritos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    matricula VARCHAR(20) NOT NULL,
    producto_id VARCHAR(10) NOT NULL,
    cantidad INT NOT NULL,
    FOREIGN KEY (matricula) REFERENCES usuarios(matricula),
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- Tabla de historial de compras
CREATE TABLE IF NOT EXISTS historial_compras (
    id INT AUTO_INCREMENT PRIMARY KEY,
    matricula VARCHAR(20) NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total DECIMAL(10,2) NOT NULL,
    metodo_pago VARCHAR(50) NOT NULL,
    puntos_ganados INT NOT NULL,
    FOREIGN KEY (matricula) REFERENCES usuarios(matricula)
);

-- Tabla de items del historial
CREATE TABLE IF NOT EXISTS historial_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    historial_id INT NOT NULL,
    producto_id VARCHAR(10) NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (historial_id) REFERENCES historial_compras(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);
";

try {
    $pdo->exec($sql);
    echo "✅ Base de datos y tablas creadas exitosamente!<br>";
    
    // Insertar productos
    $productos = [
        ['p01', 'Agua 500ml', 'Bebidas', 1200.00, '💧'],
        ['p02', 'Gaseosa cola 500ml', 'Bebidas', 1700.00, '🥤'],
        ['p03', 'Jugo naranja 500ml', 'Bebidas', 1600.00, '🧃'],
        ['p04', 'Energética 473ml', 'Bebidas', 2200.00, '⚡'],
        ['p05', 'Galletitas Oreo', 'Snacks', 1500.00, '🍪'],
        ['p06', 'Galletitas de agua', 'Snacks', 1100.00, '🥠'],
        ['p07', 'Alfajor triple', 'Snacks', 1400.00, '🍫'],
        ['p08', 'Barrita de cereal', 'Snacks', 1300.00, '🥜'],
        ['p09', 'Papas fritas', 'Snacks', 1800.00, '🍟'],
        ['p10', 'Mix frutos secos', 'Snacks', 2100.00, '🥨'],
        ['p11', 'Sándwich JyQ', 'Snacks', 2500.00, '🥪'],
        ['p12', 'Yerba mate 500g', 'Infusiones', 4200.00, '🧉'],
        ['p13', 'Saquitos mate cocido x25', 'Infusiones', 2400.00, '🍵'],
        ['p14', 'Café instantáneo 50g', 'Infusiones', 2600.00, '☕'],
        ['p15', 'Cuaderno A5 rayado', 'Útiles', 3100.00, '📒']
    ];
    
    $stmt = $pdo->prepare("INSERT IGNORE INTO productos (id, nombre, categoria, precio, icono) VALUES (?, ?, ?, ?, ?)");
    
    foreach ($productos as $producto) {
        $stmt->execute($producto);
    }
    
    echo "✅ Productos insertados exitosamente!<br>";

    // Crear usuario administrador por defecto
    $adminUser = 'admin';
    $adminPassword = password_hash('admin123', PASSWORD_DEFAULT);
    
    $stmt = $pdo->prepare("INSERT IGNORE INTO usuarios (matricula, nombre, password, rol, puntos) VALUES (?, ?, ?, 'admin', 0)");
    $stmt->execute([$adminUser, 'Administrador', $adminPassword]);
    
    echo "✅ Usuario administrador creado (Usuario: admin, Contraseña: admin123)<br>";
    echo "🎉 ¡Base de datos lista! Ya puedes usar el sistema con MySQL.";
    
} catch (PDOException $e) {
    echo "❌ Error: " . $e->getMessage();
}
?>