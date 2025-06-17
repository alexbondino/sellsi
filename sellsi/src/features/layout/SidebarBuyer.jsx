// 📁 components/SidebarBuyer.jsx
import React from 'react'
import UnifiedSidebar from './UnifiedSidebar'

const menuItems = [
  { text: 'Marketplace', path: '/buyer/marketplace' },
  { text: 'Mis Pedidos', path: '/buyer/orders' },
  { text: 'Mi Performance', path: '/buyer/performance' },
]

const SidebarBuyer = () => {
  return <UnifiedSidebar menuItems={menuItems} width="210px" />
}

export default SidebarBuyer
