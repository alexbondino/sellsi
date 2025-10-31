import React, { memo } from 'react';
import { Grid } from '@mui/material';
import { Person as PersonIcon, VerifiedUser as VerifiedIcon, Block as BlockIcon, Store as StoreIcon } from '@mui/icons-material';
import AdminStatCard from '../../../components/AdminStatCard';

const UserStatsHeader = memo(function UserStatsHeader({ stats, sx }) {
  return (
    <Grid container spacing={3} sx={sx}>      
      <Grid item xs={12} sm={6} md={2.4}>
        <AdminStatCard title="Total Usuarios" value={stats.totalUsers || 0} icon={PersonIcon} color="primary" />
      </Grid>
      <Grid item xs={12} sm={6} md={2.4}>
        <AdminStatCard title="Usuarios Activos" value={stats.activeUsers || 0} icon={PersonIcon} color="success" />
      </Grid>
      <Grid item xs={12} sm={6} md={2.4}>
        <AdminStatCard title="Usuarios Verificados" value={stats.verifiedUsers || 0} icon={VerifiedIcon} color="info" />
      </Grid>
      <Grid item xs={12} sm={6} md={2.4}>
        <AdminStatCard title="Usuarios Baneados" value={stats.bannedUsers || 0} icon={BlockIcon} color="error" />
      </Grid>
      <Grid item xs={12} sm={6} md={2.4}>
        <AdminStatCard title="Proveedores" value={stats.suppliers || 0} icon={StoreIcon} color="warning" />
      </Grid>
    </Grid>
  );
});

export default UserStatsHeader;
