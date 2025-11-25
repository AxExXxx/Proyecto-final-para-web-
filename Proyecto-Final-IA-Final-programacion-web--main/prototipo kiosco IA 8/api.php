<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// Helper functions
function jsonResponse($data) {
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
}

function getBearerToken() {
    $headers = null;
    if (isset($_SERVER['Authorization'])) {
        $headers = trim($_SERVER['Authorization']);
    } elseif (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $headers = trim($_SERVER['HTTP_AUTHORIZATION']);
    } elseif (function_exists('apache_request_headers')) {
        $requestHeaders = apache_request_headers();
        if (isset($requestHeaders['Authorization'])) {
            $headers = trim($requestHeaders['Authorization']);
        }
    }
    
    if (!empty($headers)) {
        if (preg_match('/Bearer\s(\S+)/', $headers, $matches)) {
            return $matches[1];
        }
    }
    return null;
}

function verifyToken($pdo) {
    $token = getBearerToken();
    if (!$token) return null;
    
    $stmt = $pdo->prepare("SELECT matricula FROM usuarios WHERE matricula = ?");
    $stmt->execute([$token]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    return $user ? $user['matricula'] : null;
}

// API Routes
function isAdmin($pdo, $matricula) {
    $stmt = $pdo->prepare("SELECT rol FROM usuarios WHERE matricula = ?");
    $stmt->execute([$matricula]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    return $user && $user['rol'] === 'admin';
}

switch ($action) {
    case 'admin_stats':
        $matricula = verifyToken($pdo);
        if (!$matricula || !isAdmin($pdo, $matricula)) {
            jsonResponse(['success' => false, 'error' => 'Acceso no autorizado']);
            exit;
        }
        
        if ($method === 'GET') {
            $stats = [
                'total_sales' => 0,
                'total_users' => 0,
                'total_products' => 0,
                'total_orders' => 0
            ];
            
            // Obtener estadísticas
            $stmt = $pdo->query("SELECT COALESCE(SUM(total), 0) as total_sales FROM historial_compras");
            $stats['total_sales'] = floatval($stmt->fetch(PDO::FETCH_ASSOC)['total_sales']);
            
            $stmt = $pdo->query("SELECT COUNT(*) as total_users FROM usuarios WHERE rol = 'cliente'");
            $stats['total_users'] = intval($stmt->fetch(PDO::FETCH_ASSOC)['total_users']);
            
            $stmt = $pdo->query("SELECT COUNT(*) as total_products FROM productos");
            $stats['total_products'] = intval($stmt->fetch(PDO::FETCH_ASSOC)['total_products']);
            
            $stmt = $pdo->query("SELECT COUNT(*) as total_orders FROM historial_compras");
            $stats['total_orders'] = intval($stmt->fetch(PDO::FETCH_ASSOC)['total_orders']);
            
            jsonResponse(['success' => true, 'stats' => $stats]);
        }
        break;
        
    case 'admin_users':
        $matricula = verifyToken($pdo);
        if (!$matricula || !isAdmin($pdo, $matricula)) {
            jsonResponse(['success' => false, 'error' => 'Acceso no autorizado']);
            exit;
        }
        
        if ($method === 'GET') {
            $stmt = $pdo->query("SELECT matricula, nombre, rol, puntos, last_seen FROM usuarios");
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
            jsonResponse(['success' => true, 'users' => $users]);
        }
        elseif ($method === 'DELETE') {
            $data = json_decode(file_get_contents('php://input'), true);
            $targetMatricula = $data['matricula'] ?? '';
            
            if ($targetMatricula === $matricula) {
                jsonResponse(['success' => false, 'error' => 'No puedes eliminar tu propia cuenta']);
                exit;
            }
            
            $stmt = $pdo->prepare("DELETE FROM usuarios WHERE matricula = ? AND rol != 'admin'");
            $stmt->execute([$targetMatricula]);
            jsonResponse(['success' => true]);
        }
        break;
        
    case 'admin_sales':
        $matricula = verifyToken($pdo);
        if (!$matricula || !isAdmin($pdo, $matricula)) {
            jsonResponse(['success' => false, 'error' => 'Acceso no autorizado']);
            exit;
        }
        
        if ($method === 'GET') {
            $stmt = $pdo->query("
                SELECT h.*, u.nombre as usuario_nombre
                FROM historial_compras h
                JOIN usuarios u ON h.matricula = u.matricula
                ORDER BY h.fecha DESC
            ");
            $sales = $stmt->fetchAll(PDO::FETCH_ASSOC);
            jsonResponse(['success' => true, 'sales' => $sales]);
        }
        break;

    case 'login':
        if ($method === 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);
            $matricula = $data['matricula'] ?? '';
            $nombre = $data['nombre'] ?? '';
            $password = $data['password'] ?? '';
            $isAdmin = $data['isAdmin'] ?? false;
            
            // Validar formato de matrícula solo para estudiantes
            if (!$isAdmin && !preg_match('/^\d{4}-\d{3}$/', $matricula)) {
                jsonResponse(['success' => false, 'error' => 'Formato de matrícula inválido']);
                exit;
            }
            
            $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE matricula = ?");
            $stmt->execute([$matricula]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($user) {
                if (!password_verify($password, $user['password'])) {
                    jsonResponse(['success' => false, 'error' => 'Contraseña incorrecta']);
                    exit;
                }
                
                $stmt = $pdo->prepare("UPDATE usuarios SET last_seen = CURRENT_TIMESTAMP WHERE matricula = ?");
                $stmt->execute([$matricula]);
            } else {
                $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
                $stmt = $pdo->prepare("INSERT INTO usuarios (matricula, nombre, password) VALUES (?, ?, ?)");
                $stmt->execute([$matricula, $nombre, $hashedPassword]);
                
                $user = [
                    'matricula' => $matricula,
                    'nombre' => $nombre,
                    'puntos' => 100
                ];
            }
            
            jsonResponse(['success' => true, 'user' => $user]);
        }
        break;
        
    case 'products':
        if ($method === 'GET') {
            $stmt = $pdo->query("SELECT * FROM productos");
            $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
            jsonResponse(['success' => true, 'products' => $products]);
        }
        break;
        
    case 'cart':
        $matricula = verifyToken($pdo);
        if (!$matricula) {
            jsonResponse(['success' => false, 'error' => 'No autorizado']);
            exit;
        }
        
        if ($method === 'GET') {
            $stmt = $pdo->prepare("
                SELECT c.producto_id, c.cantidad, p.nombre, p.precio, p.icono, p.categoria 
                FROM carritos c 
                JOIN productos p ON c.producto_id = p.id 
                WHERE c.matricula = ?
            ");
            $stmt->execute([$matricula]);
            $cart = $stmt->fetchAll(PDO::FETCH_ASSOC);
            jsonResponse(['success' => true, 'cart' => $cart]);
        } 
        elseif ($method === 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);
            $producto_id = $data['producto_id'] ?? '';
            $cantidad = $data['cantidad'] ?? 1;
            
            $stmt = $pdo->prepare("SELECT id, cantidad FROM carritos WHERE matricula = ? AND producto_id = ?");
            $stmt->execute([$matricula, $producto_id]);
            $existing = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($existing) {
                $newQuantity = $existing['cantidad'] + $cantidad;
                $stmt = $pdo->prepare("UPDATE carritos SET cantidad = ? WHERE id = ?");
                $stmt->execute([$newQuantity, $existing['id']]);
            } else {
                $stmt = $pdo->prepare("INSERT INTO carritos (matricula, producto_id, cantidad) VALUES (?, ?, ?)");
                $stmt->execute([$matricula, $producto_id, $cantidad]);
            }
            
            jsonResponse(['success' => true]);
        }
        elseif ($method === 'DELETE') {
            $data = json_decode(file_get_contents('php://input'), true);
            $producto_id = $data['producto_id'] ?? '';
            
            if ($producto_id) {
                $stmt = $pdo->prepare("DELETE FROM carritos WHERE matricula = ? AND producto_id = ?");
                $stmt->execute([$matricula, $producto_id]);
            } else {
                $stmt = $pdo->prepare("DELETE FROM carritos WHERE matricula = ?");
                $stmt->execute([$matricula]);
            }
            
            jsonResponse(['success' => true]);
        }
        break;
        
    case 'favorites':
        $matricula = verifyToken($pdo);
        if (!$matricula) {
            jsonResponse(['success' => false, 'error' => 'No autorizado']);
            exit;
        }
        
        if ($method === 'GET') {
            $stmt = $pdo->prepare("
                SELECT p.* FROM favoritos f 
                JOIN productos p ON f.producto_id = p.id 
                WHERE f.matricula = ?
            ");
            $stmt->execute([$matricula]);
            $favorites = $stmt->fetchAll(PDO::FETCH_ASSOC);
            jsonResponse(['success' => true, 'favorites' => $favorites]);
        }
        elseif ($method === 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);
            $producto_id = $data['producto_id'] ?? '';
            
            try {
                $stmt = $pdo->prepare("INSERT IGNORE INTO favoritos (matricula, producto_id) VALUES (?, ?)");
                $stmt->execute([$matricula, $producto_id]);
                jsonResponse(['success' => true]);
            } catch (PDOException $e) {
                jsonResponse(['success' => false, 'error' => 'Error al agregar favorito']);
            }
        }
        elseif ($method === 'DELETE') {
            $data = json_decode(file_get_contents('php://input'), true);
            $producto_id = $data['producto_id'] ?? '';
            
            $stmt = $pdo->prepare("DELETE FROM favoritos WHERE matricula = ? AND producto_id = ?");
            $stmt->execute([$matricula, $producto_id]);
            jsonResponse(['success' => true]);
        }
        break;
        
    case 'checkout':
        $matricula = verifyToken($pdo);
        if (!$matricula) {
            jsonResponse(['success' => false, 'error' => 'No autorizado']);
            exit;
        }
        
        if ($method === 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);
            $metodo_pago = $data['metodo_pago'] ?? 'Efectivo';
            
            $stmt = $pdo->prepare("
                SELECT c.producto_id, c.cantidad, p.precio, p.nombre
                FROM carritos c 
                JOIN productos p ON c.producto_id = p.id 
                WHERE c.matricula = ?
            ");
            $stmt->execute([$matricula]);
            $cartItems = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (empty($cartItems)) {
                jsonResponse(['success' => false, 'error' => 'Carrito vacío']);
                exit;
            }
            
            $total = 0;
            foreach ($cartItems as $item) {
                $total += $item['precio'] * $item['cantidad'];
            }
            $puntos_ganados = floor($total / 100);
            
            $pdo->beginTransaction();
            
            try {
                $stmt = $pdo->prepare("
                    INSERT INTO historial_compras (matricula, total, metodo_pago, puntos_ganados) 
                    VALUES (?, ?, ?, ?)
                ");
                $stmt->execute([$matricula, $total, $metodo_pago, $puntos_ganados]);
                $historial_id = $pdo->lastInsertId();
                
                $stmt = $pdo->prepare("
                    INSERT INTO historial_items (historial_id, producto_id, cantidad, precio_unitario) 
                    VALUES (?, ?, ?, ?)
                ");
                foreach ($cartItems as $item) {
                    $stmt->execute([$historial_id, $item['producto_id'], $item['cantidad'], $item['precio']]);
                }
                
                $stmt = $pdo->prepare("UPDATE usuarios SET puntos = puntos + ? WHERE matricula = ?");
                $stmt->execute([$puntos_ganados, $matricula]);
                
                $stmt = $pdo->prepare("DELETE FROM carritos WHERE matricula = ?");
                $stmt->execute([$matricula]);
                
                $pdo->commit();
                
                jsonResponse([
                    'success' => true, 
                    'total' => $total,
                    'puntos_ganados' => $puntos_ganados,
                    'historial_id' => $historial_id,
                    'items' => $cartItems
                ]);
                
            } catch (Exception $e) {
                $pdo->rollBack();
                jsonResponse(['success' => false, 'error' => 'Error en el checkout: ' . $e->getMessage()]);
            }
        }
        break;
        
    case 'history':
        $matricula = verifyToken($pdo);
        if (!$matricula) {
            jsonResponse(['success' => false, 'error' => 'No autorizado']);
            exit;
        }
        
        if ($method === 'GET') {
            $stmt = $pdo->prepare("
                SELECT h.*, 
                       (SELECT GROUP_CONCAT(CONCAT(hi.cantidad, 'x ', p.nombre) SEPARATOR ', ') 
                        FROM historial_items hi 
                        JOIN productos p ON hi.producto_id = p.id 
                        WHERE hi.historial_id = h.id) as items
                FROM historial_compras h
                WHERE h.matricula = ?
                ORDER BY h.fecha DESC
            ");
            $stmt->execute([$matricula]);
            $history = $stmt->fetchAll(PDO::FETCH_ASSOC);
            jsonResponse(['success' => true, 'history' => $history]);
        }
        break;
        
    case 'stats':
        $matricula = verifyToken($pdo);
        if (!$matricula) {
            jsonResponse(['success' => false, 'error' => 'No autorizado']);
            exit;
        }
        
        if ($method === 'GET') {
            $stmt = $pdo->prepare("SELECT puntos FROM usuarios WHERE matricula = ?");
            $stmt->execute([$matricula]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $stmt = $pdo->prepare("SELECT COALESCE(SUM(total), 0) as total_gastado FROM historial_compras WHERE matricula = ?");
            $stmt->execute([$matricula]);
            $totalGastado = $stmt->fetch(PDO::FETCH_ASSOC)['total_gastado'];
            
            $stmt = $pdo->prepare("SELECT COUNT(*) as compras_realizadas FROM historial_compras WHERE matricula = ?");
            $stmt->execute([$matricula]);
            $comprasRealizadas = $stmt->fetch(PDO::FETCH_ASSOC)['compras_realizadas'];
            
            $stmt = $pdo->prepare("SELECT COUNT(*) as favoritos_count FROM favoritos WHERE matricula = ?");
            $stmt->execute([$matricula]);
            $favoritosCount = $stmt->fetch(PDO::FETCH_ASSOC)['favoritos_count'];
            
            jsonResponse([
                'success' => true,
                'stats' => [
                    'puntos' => $user['puntos'],
                    'total_gastado' => floatval($totalGastado),
                    'compras_realizadas' => intval($comprasRealizadas),
                    'favoritos_count' => intval($favoritosCount)
                ]
            ]);
        }
        break;
        
    default:
        jsonResponse(['error' => 'Acción no válida']);
        break;
}
?>