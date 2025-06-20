// 📁 components/SidebarProvider.jsx
import React from 'react'
import UnifiedSidebar from './UnifiedSidebar'

const menuItems = [
  { text: 'Inicio', path: '/supplier/home' },
  { text: 'Mis Productos', path: '/supplier/myproducts' },
  { text: 'Mis Pedidos', path: '/supplier/myorders' },
  { text: 'Mi Performance', path: '/supplier/myperformance' },
  { text: 'Marketplace', path: '/buyer/marketplace' },
]

const SidebarProvider = () => {
  return <UnifiedSidebar menuItems={menuItems} width="210px" />
}

export default SidebarProvider
