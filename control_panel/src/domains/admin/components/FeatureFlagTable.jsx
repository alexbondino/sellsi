import React, { useState, useEffect } from 'react';
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
  Button,
  TextField,
  Stack,
} from '@mui/material';
import {
  getFeatureFlags,
  setFeatureFlag,
  createFeatureFlag,
} from '../services/featureFlagService';

export default function FeatureFlagTable() {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newFlag, setNewFlag] = useState({
    key: '',
    label: '',
    workspace: 'supplier',
  });

  // Cargar flags al montar
  useEffect(() => {
    fetchFlags();
  }, []);

  const fetchFlags = async () => {
    setLoading(true);
    const data = await getFeatureFlags('supplier');
    setFlags(data);
    setLoading(false);
  };

  const handleToggle = async (key, enabled) => {
    await setFeatureFlag('supplier', key, enabled);
    fetchFlags();
  };

  const handleCreate = async () => {
    if (!newFlag.key || !newFlag.label) return;
    await createFeatureFlag(newFlag);
    setNewFlag({ key: '', label: '', workspace: 'supplier' });
    fetchFlags();
  };

  // Crear el primer flag si no existe
  useEffect(() => {
    if (!flags.find(f => f.key === 'my_offers_supplier')) {
      createFeatureFlag({
        workspace: 'supplier',
        key: 'my_offers_supplier',
        label: 'Mis Ofertas - Proveedor',
        description: 'Habilita la sección Mis Ofertas para proveedores',
      }).then(fetchFlags);
    }
  }, [flags]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Feature Flags
      </Typography>
      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Activo</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {flags.map(flag => (
              <TableRow key={flag.key}>
                <TableCell>{flag.label}</TableCell>
                <TableCell>
                  <Switch
                    checked={flag.enabled}
                    onChange={e => handleToggle(flag.key, e.target.checked)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <TextField
          label="Nombre del Feature"
          value={newFlag.label}
          onChange={e => setNewFlag(f => ({ ...f, label: e.target.value }))}
        />
        <TextField
          label="Key"
          value={newFlag.key}
          onChange={e => setNewFlag(f => ({ ...f, key: e.target.value }))}
        />
        <Button variant="contained" onClick={handleCreate}>
          Crear Feature
        </Button>
      </Stack>
    </Box>
  );
}
