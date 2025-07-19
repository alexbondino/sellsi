src/services/
├── README.md                          # Documentación general
├── index.js                          # Barrel exports para importaciones limpias
├── supabase.js                       # Cliente base de Supabase
│
├── 🔐 auth/                          # Servicios de autenticación
│   ├── index.js
│   ├── authService.js                # Login, logout, registro general
│   ├── sessionService.js             # Manejo de sesiones
│   └── recoveryService.js            # Recuperación de cuentas
│
├── 👤 user/                          # Servicios de usuario final
│   ├── index.js
│   ├── profileService.js             # Gestión de perfiles
│   ├── cartService.js                # Carrito de compras
│   └── orderService.js               # Pedidos de usuarios
│
├── 🏪 marketplace/                   # Servicios del marketplace
│   ├── index.js
│   ├── productService.js             # CRUD de productos
│   ├── productSpecificationsService.js
│   ├── productDeliveryRegionsService.js
│   └── searchService.js              # Búsqueda y filtros
│
├── 💳 payment/                       # Servicios de pago
│   ├── index.js
│   └── khipuService.js               # Integración con Khipu
│
├── 📦 media/                         # Servicios de archivos multimedia
│   ├── index.js
│   ├── uploadService.js              # Subida de archivos
│   └── thumbnailService.js           # Generación de thumbnails
│
├── 🔒 security/                      # Servicios de seguridad
│   ├── index.js
│   ├── banService.js                 # Sistema de baneos
│   └── ipTrackingService.js          # Tracking de IPs
│
└── 👑 admin/                         # Servicios administrativos (ya existente)
    ├── index.js
    ├── auth/
    ├── users/
    ├── products/
    ├── audit/
    ├── core/
    ├── files/
    ├── requests/
    └── accounts/