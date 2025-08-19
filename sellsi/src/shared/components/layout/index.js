// src/shared/components/layout/index.js
export { default as SuspenseLoader } from './SuspenseLoader';
// AppShell no se re-exporta para reducir ciclos; importar directamente desde './AppShell'
export { default as NotFound } from './NotFound';
export { default as Widget } from './Widget';

// Bannedpage components
export { default as BannedPageUI } from './bannedpage/BannedPageUI';
export { default as BanInfo } from './bannedpage/BanInfo';

// Footer component
export { BottomBar } from './BottomBar';
