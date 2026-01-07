import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
} from '@mui/material';

import {
  listWorkspacesFromFeatureFlags,
  getFeatureFlagsByKey,
  upsertFeatureFlag,
} from '../services/featureFlagService';

const FEATURE_KEY = 'my_offers_supplier';

export default function FeatureFlagTable() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const meta = useMemo(
    () => ({
      label: 'My Offers supplier',
      description: 'Habilita modo proveedor para el workspace My Offers',
    }),
    []
  );

  useEffect(() => {
    fetchFlags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchFlags = async () => {
    try {
      setLoading(true);

      // 1) Workspaces existentes en la tabla (distinct)
      const workspaces = await listWorkspacesFromFeatureFlags();

      // 2) Flags existentes SOLO para esta key
      const flagsForKey = await getFeatureFlagsByKey(FEATURE_KEY);

      // 3) Normalizar 1 fila por workspace
      const normalized = workspaces.map(workspace => {
        const found = flagsForKey.find(
          f => f.workspace === workspace && f.key === FEATURE_KEY
        );

        if (found) return { ...found, missing: false };

        return {
          workspace,
          key: FEATURE_KEY,
          enabled: false,
          missing: true,
        };
      });

      setRows(normalized);
    } catch (e) {
      console.error('Error cargando feature flags', e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (workspace, enabled) => {
    try {
      await upsertFeatureFlag({
        workspace,
        key: FEATURE_KEY,
        enabled,
        label: meta.label,
        description: meta.description,
      });

      await fetchFlags();
    } catch (e) {
      console.error('Error actualizando feature flag', e);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Feature Flag:{' '}
        <Box component="span" sx={{ fontFamily: 'monospace' }}>
          {FEATURE_KEY}
        </Box>
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Workspace</TableCell>
              <TableCell align="center">Activo</TableCell>
              <TableCell align="center">Estado</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  <CircularProgress size={22} />
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              rows.map(row => (
                <TableRow key={`${row.workspace}:${row.key}`}>
                  <TableCell>{row.workspace}</TableCell>

                  <TableCell align="center">
                    <Switch
                      checked={!!row.enabled}
                      onChange={e =>
                        handleToggle(row.workspace, e.target.checked)
                      }
                    />
                  </TableCell>

                  <TableCell align="center">
                    {row.missing ? 'Se creará al activar' : 'OK'}
                  </TableCell>
                </TableRow>
              ))}

            {!loading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  No hay workspaces configurados
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
