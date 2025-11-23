import React, { useRef, useState } from 'react';
import { Button, Box, CircularProgress, Alert } from '@mui/material';
import * as XLSX from 'xlsx';
import { supabase } from '../../services/supabase';

// Utilidad para descargar una imagen desde una URL y devolver un Blob
async function fetchImageAsBlob(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error('No se pudo descargar la imagen');
  return await response.blob();
}

// Utilidad para subir una imagen al bucket y devolver la URL pública
async function uploadImageToBucket(blob, fileName, userId) {
  const bucket = 'product-images';
  const path = `${userId || 'import'}/${Date.now()}_${fileName}`;
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, blob, { upsert: true });

  if (error) throw error;

  // Obtener URL pública
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * ImportExcel
 * @param {string} table - Nombre de la tabla de Supabase a la que se suben los datos
 * @param {Array<string>} fields - Lista de campos/columnas a mapear desde el Excel
 * @param {string} [userId] - user_id a asociar a cada fila importada
 * @param {function} [onSuccess] - Callback opcional al terminar
 */
export default function ImportExcel({ table, fields, userId, onSuccess }) {
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

      if (!Array.isArray(json) || json.length === 0) {
        throw new Error('El archivo no tiene filas para importar.');
      }

      const mapped = [];

      // Recorremos cada fila del Excel
      for (const row of json) {
        const obj = {};

        // Mapear solo los campos definidos en `fields`
        fields.forEach(f => {
          // No incluir image_url ni image_urls en el objeto insertado
          if (f === 'image_url' || f === 'image_urls') return;
          obj[f] = row[f];
        });

        if (userId) {
          obj.supplier_id = userId;
        }

        // Juntar todas las URLs de imagen a procesar:
        // - image_url (una sola)
        // - image_urls (por ejemplo: "url1,url2,url3")
        const urlsToProcess = [];

        if (row.image_url) {
          urlsToProcess.push(String(row.image_url).trim());
        }

        if (row.image_urls) {
          const raw = String(row.image_urls);
          raw
            .split(',')
            .map(u => u.trim())
            .filter(Boolean)
            .forEach(u => urlsToProcess.push(u));
        }

        // Subir cada imagen al bucket
        for (const url of urlsToProcess) {
          try {
            const fileName =
              url.split('/').pop().split('?')[0] || `img_${Date.now()}`;
            const blob = await fetchImageAsBlob(url);

            await uploadImageToBucket(blob, fileName, userId);

            // Si quisieras guardar la URL pública en la tabla, podrías hacer:
            // const publicUrl = await uploadImageToBucket(blob, fileName, userId);
            // obj.image_url = publicUrl;
            // o manejar un array en image_urls_public, etc.
          } catch (imgErr) {
            console.error(imgErr);
            setError(`Error al procesar la imagen: ${url}. ${imgErr.message}`);
            setLoading(false);
            return;
          }
        }

        mapped.push(obj);
      }

      // Insertar todas las filas mapeadas en la tabla indicada
      const { error: insertError } = await supabase.from(table).insert(mapped);

      if (insertError) {
        console.error(insertError);
        throw new Error(
          insertError.message || 'Error al insertar en la base de datos.'
        );
      }

      setSuccess(true);
      if (onSuccess) onSuccess(mapped);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Ocurrió un error al importar el archivo.');
    } finally {
      setLoading(false);
      // Limpiar el input de archivo para permitir reimportar el mismo archivo si se quiere
      if (inputRef.current) {
        inputRef.current.value = '';
      }
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
