import React, { useRef, useState } from 'react';
import {
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import * as XLSX from 'xlsx';
import { supabase } from '../../services/supabase';

/**
 * ImportExcel
 * @param {string} table - Nombre de la tabla de Supabase a la que se suben los datos
 * @param {Array<string>} fields - Lista de campos/columnas a mapear desde el Excel
 * @param {function} [onSuccess] - Callback opcional al terminar
 */
export default function ImportExcel({ table, fields, onSuccess }) {
  const inputRef = useRef();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleFile = async e => {
    setError(null);
    setSuccess(false);
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);
      // Mapear solo los campos requeridos
      const mapped = json.map(row => {
        const obj = {};
        fields.forEach(f => {
          obj[f] = row[f];
        });
        return obj;
      });
      // Subir a Supabase
      const { error: upsertError } = await supabase.from(table).upsert(mapped);
      if (upsertError) throw upsertError;
      setSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Error al importar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Button variant="contained" component="label" disabled={loading}>
        {loading ? <CircularProgress size={24} /> : 'Importar Excel'}
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          hidden
          onChange={handleFile}
        />
      </Button>
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mt: 2 }}>
          ¡Importación exitosa!
        </Alert>
      )}
    </Box>
  );
}
