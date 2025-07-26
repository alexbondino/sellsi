// ============================================================================
// 🚀 REFACTORED APP - REDIRECTION TO NEW MODULAR STRUCTURE
// ============================================================================
// 
// Este archivo ahora es solo un wrapper que redirige al nuevo App.jsx modular
// ubicado en src/app/App.jsx
//
// El App.jsx original (1,079 LOC) ha sido refactorizado en múltiples módulos:
// - AuthProvider: Gestión de autenticación y sesión
// - RoleProvider: Gestión de roles buyer/supplier  
// - LayoutProvider: Gestión de layout y sidebar
// - AppRouter: Routing y lazy loading
// - AppShell: Layout principal con TopBar, SideBar, Content
// ============================================================================

import App from './app/App.jsx';

export default App;
