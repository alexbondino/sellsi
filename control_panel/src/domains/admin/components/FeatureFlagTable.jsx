import React, { useEffect, useState } from 'react';
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
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { toast } from 'react-hot-toast';

import {
  getAllFeatureFlags,
  updateFeatureFlag,
} from '../services/featureFlagService';

export default function FeatureFlagTable() {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchFlags();
  }, []);

  const fetchFlags = async () => {
    try {
      setLoading(true);
      const data = await getAllFeatureFlags();
      setFlags(data);
    } catch (e) {
      console.error('Error cargando feature flags', e);
      toast.error('Error al cargar feature flags');
      setFlags([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (flag) => {
    const newValue = !flag.enabled;
    
    try {
      setUpdating(true);
      await updateFeatureFlag(flag.workspace, flag.key, newValue);
      toast.success(`Feature flag ${newValue ? 'habilitado' : 'deshabilitado'}`);
      await fetchFlags();
    } catch (e) {
      console.error('Error actualizando feature flag', e);
      toast.error('Error al actualizar feature flag');
    } finally {
      setUpdating(false);
    }
  };

  // Agrupar flags por key
  const groupedFlags = flags.reduce((acc, flag) => {
    if (!acc[flag.key]) {
      acc[flag.key] = [];
    }
    acc[flag.key].push(flag);
    return acc;
  }, {});

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (flags.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          No hay feature flags configurados en el sistema
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Feature Flags del Sistema
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Administra las funcionalidades habilitadas/deshabilitadas por workspace
      </Typography>

      {Object.entries(groupedFlags).map(([key, flagsForKey]) => {
        const firstFlag = flagsForKey[0];
        const enabledCount = flagsForKey.filter(f => f.enabled).length;
        const totalCount = flagsForKey.length;

        return (
          <Accordion key={key} defaultExpanded sx={{ mb: 2 }}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                backgroundColor: 'grey.50',
                '&:hover': { backgroundColor: 'grey.100' },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                    {key}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {firstFlag.label || 'Sin descripción'}
                  </Typography>
                </Box>
                <Chip
                  label={`${enabledCount}/${totalCount} activos`}
                  color={enabledCount > 0 ? 'success' : 'default'}
                  size="small"
                />
              </Box>
            </AccordionSummary>

            <AccordionDetails>
              {firstFlag.description && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  {firstFlag.description}
                </Alert>
              )}

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Workspace</TableCell>
                      <TableCell>Label</TableCell>
                      <TableCell align="center">Estado</TableCell>
                      <TableCell align="center">Acciones</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {flagsForKey.map(flag => (
                      <TableRow key={`${flag.workspace}:${flag.key}`}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {flag.workspace}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {flag.label || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={flag.enabled ? 'Activo' : 'Inactivo'}
                            color={flag.enabled ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Switch
                            checked={flag.enabled}
                            onChange={() => handleToggle(flag)}
                            disabled={updating}
                            color="success"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
}
