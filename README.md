README - Kiosco IA Incade
🏪 Kiosco IA Incade - Sistema Interactivo Inteligente
https://img.shields.io/badge/version-1.0.0-blue.svg
https://img.shields.io/badge/license-MIT-green.svg

📋 Descripción del Proyecto
Kiosco IA Incade es un sistema de kiosco interactivo inteligente desarrollado para ofrecer una experiencia de usuario moderna y eficiente. Combina tecnologías web frontend con un backend robusto para gestionar productos, pedidos y interacciones con los clientes.

✨ Características Principales
🎯 Interfaz intuitiva y responsive diseñada para pantallas táctiles

🤖 Asistente virtual inteligente para ayudar a los usuarios

📱 Diseño adaptable para diferentes tamaños de pantalla

🛒 Sistema de carrito de compras en tiempo real

📊 Panel de administración para gestión de productos

🔍 Búsqueda inteligente de productos

📄 Generación de tickets y comprobantes

🔐 Sistema de autenticación seguro

🛠️ Tecnologías Utilizadas
Frontend
HTML5 - Estructura semántica

CSS3 - Estilos y animaciones

JavaScript (ES6+) - Interactividad y lógica del cliente

Bootstrap 5 - Framework CSS responsivo

Font Awesome - Iconografía

Backend
PHP 7.4+ - Lógica del servidor

MySQL 8.0+ - Base de datos

Apache - Servidor web

Librerías y Dependencias
Chart.js - Gráficos y estadísticas

jQuery - Manipulación del DOM

Axios - Peticiones HTTP

📁 Estructura del Proyecto
text
kiosco-ia-incade/
├── frontend/
│   ├── index.html
│   ├── css/
│   │   ├── style.css
│   │   ├── responsive.css
│   │   └── animations.css
│   ├── js/
│   │   ├── main.js
│   │   ├── cart.js
│   │   ├── products.js
│   │   └── ai-assistant.js
│   ├── img/
│   └── assets/
├── backend/
│   ├── api/
│   │   ├── products.php
│   │   ├── cart.php
│   │   ├── orders.php
│   │   └── auth.php
│   ├── config/
│   │   ├── database.php
│   │   └── config.php
│   ├── models/
│   │   ├── ProductModel.php
│   │   ├── OrderModel.php
│   │   └── UserModel.php
│   ├── controllers/
│   └── admin/
│       ├── dashboard.php
│       ├── products.php
│       └── reports.php
├── database/
│   ├── schema.sql
│   └── sample_data.sql
└── docs/
    ├── manual_usuario.pdf
    └── manual_tecnico.pdf
🚀 Instalación y Configuración
Prerrequisitos
Servidor web Apache

PHP 7.4 o superior

MySQL 8.0 o superior

Navegador web moderno

Pasos de Instalación
Clonar o descargar el proyecto

bash
git clone [url-del-repositorio]
Configurar la base de datos

sql
-- Crear base de datos
CREATE DATABASE kiosco_incade;

-- Importar esquema
mysql -u usuario -p kiosco_incade < database/schema.sql

-- Insertar datos de ejemplo (opcional)
mysql -u usuario -p kiosco_incade < database/sample_data.sql
Configurar conexión a la base de datos

php
// backend/config/database.php
define('DB_HOST', 'localhost');
define('DB_USER', 'tu_usuario');
define('DB_PASS', 'tu_contraseña');
define('DB_NAME', 'kiosco_incade');
Configurar permisos de directorios

bash
chmod 755 backend/uploads/
chmod 644 backend/config/
Acceder al sistema

Frontend: http://localhost/kiosco-ia-incade/frontend/

Admin: http://localhost/kiosco-ia-incade/backend/admin/

🗃️ Base de Datos
Tablas Principales
usuarios - Gestión de administradores

categorias - Categorías de productos

productos - Catálogo de productos

pedidos - Registro de pedidos

detalles_pedido - Detalles de cada pedido

configuraciones - Configuraciones del sistema

🔧 Configuración
Variables de Entorno
Crear archivo backend/config/config.php:

php
<?php
// Configuración general
define('APP_NAME', 'Kiosco IA Incade');
define('APP_VERSION', '1.0.0');
define('CURRENCY', 'MXN');

// Configuración de la IA
define('AI_ENABLED', true);
define('AI_API_KEY', 'tu_api_key_aqui');

// Configuración de impresión
define('PRINTER_ENABLED', true);
define('PRINTER_NAME', 'POS-80');
?>
🎮 Uso del Sistema
Para Clientes
Navegar por categorías de productos

Usar el asistente virtual para búsquedas

Agregar productos al carrito

Realizar pedido

Generar ticket de compra

Para Administradores
Iniciar sesión en el panel de administración

Gestionar productos y categorías

Ver reportes de ventas

Configurar el sistema

🔐 Seguridad
Validación de datos en frontend y backend

Protección contra SQL injection

Sanitización de entradas

Autenticación segura con hash de contraseñas

Protección CSRF en formularios

📈 Características de IA
El sistema incluye un asistente virtual con las siguientes capacidades:

Reconocimiento de voz para búsqueda de productos

Recomendaciones inteligentes basadas en preferencias

Procesamiento de lenguaje natural para consultas

Análisis de sentimientos en reseñas

🐛 Solución de Problemas
Problemas Comunes
Error de conexión a la base de datos

Verificar credenciales en database.php

Confirmar que MySQL esté ejecutándose

Permisos denegados

Asegurar permisos adecuados en directorios de uploads

Asistente IA no funciona

Verificar conexión a internet

Confirmar API key de servicios de IA

🤝 Contribución
Fork el proyecto

Crear una rama para la feature (git checkout -b feature/AmazingFeature)

Commit los cambios (git commit -m 'Add some AmazingFeature')

Push a la rama (git push origin feature/AmazingFeature)

Abrir un Pull Request

📄 Licencia
Distribuido bajo la Licencia MIT. Ver LICENSE para más información.

📞 Soporte
Para soporte técnico:

Email: soporte@incade.com

Teléfono: +52 555-123-4567

Documentación: docs.incade.com/kiosco-ia

👥 Desarrolladores
Desarrollador Principal - [Nombre] - [email@incade.com]

Diseñador UI/UX - [Nombre] - [design@incade.com]

Administrador de Base de Datos - [Nombre] - [dba@incade.com]

🗓️ Historial de Versiones
v1.0.0 - 2024

Versión inicial del Kiosco IA Incade

Sistema básico de pedidos

Integración de asistente virtual

Panel de administración

Kiosco IA Incade - Transformando la experiencia de compra con inteligencia artificial ⚡
