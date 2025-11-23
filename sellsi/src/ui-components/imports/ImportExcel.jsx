import React, { useRef, useState } from 'react';
import { Button, Box, CircularProgress, Alert } from '@mui/material';
import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../../services/supabase';
import { buildSafeFileNameFromUrl } from './uuidSafeFileName';

// --------- Constantes de storage / tablas ----------
const IMAGE_BUCKET = 'product-images';
const PRODUCT_IMAGES_TABLE = 'product_images';

// Utilidad para descargar una imagen desde una URL y devolver un Blob
async function fetchImageAsBlob(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error('No se pudo descargar la imagen');
  return await response.blob();
}

// Utilidad para subir una imagen al bucket y devolver la URL pública
async function uploadImageToBucket(blob, fileName, userId, productId) {
  if (!userId) {
    throw new Error('Falta userId para construir la ruta del storage.');
  }
  if (!productId) {
    throw new Error('Falta productId para construir la ruta del storage.');
  }

  const path = `${userId}/${productId}/${fileName}`;

  const { error } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(path, blob, { upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path);
  return {
    publicUrl: data.publicUrl,
    path,
  };
}

/**
 * ImportExcel
 * @param {string} table - Nombre de la tabla de Supabase a la que se suben los datos (ej: 'products')
 * @param {Array<string>} fields - Lista de campos/columnas a mapear desde el Excel
 * @param {string} [userId] - user_id / supplier_id a asociar a cada fila importada
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
      const imagesByProduct = {}; // productId -> [urls]

      // 1) Recorremos cada fila del Excel y construimos los productos
      for (const row of json) {
        const obj = {};

        // ✅ Generamos un UUID para este producto
        // Asegúrate de que tu tabla tenga una columna "productid" (uuid).
        const productId = uuidv4();
        obj.productid = productId;

        // Mapear solo los campos definidos en `fields`
        fields.forEach(f => {
          // ❌ Nunca pisar productid, ni incluir columnas de imágenes crudas
          if (f === 'image_url' || f === 'image_urls' || f === 'productid') {
            return;
          }
          obj[f] = row[f];
        });

        if (userId) {
          // Ajusta el nombre de columna si es distinto
          obj.supplier_id = userId;
        }

        // Construir lista de URLs a procesar
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

        if (urlsToProcess.length > 0) {
          imagesByProduct[productId] = urlsToProcess;
        }

        mapped.push(obj);
      }

      // 2) Insertar TODAS las filas mapeadas en la tabla indicada (productos)
      const { error: insertError } = await supabase.from(table).insert(mapped);

      if (insertError) {
        console.error(insertError);
        throw new Error(
          insertError.message || 'Error al insertar en la base de datos.'
        );
      }

      // 3) Subir imágenes y crear registros en product_images
      const imageErrors = [];

      for (const [productId, urls] of Object.entries(imagesByProduct)) {
        let order = 0;
        for (const url of urls) {
          try {
            const blob = await fetchImageAsBlob(url);
            const fileName = buildSafeFileNameFromUrl(url);

            const { publicUrl } = await uploadImageToBucket(
              blob,
              fileName,
              userId,
              productId
            );

            // Insertar registro usando función atómica (RLS)
            const { error: imgInsertError } = await supabase.rpc(
              'insert_image_with_order',
              {
                p_product_id: productId,
                p_image_url: publicUrl,
                p_supplier_id: userId, // aunque sea reservado, la función lo acepta
              }
            );

            if (imgInsertError) {
              console.error(
                '[ImportExcel] Error insertando en product_images:',
                imgInsertError
              );
              imageErrors.push(
                `Producto ${productId} - imagen ${url}: ${imgInsertError.message}`
              );
            }

            order += 1;
          } catch (imgErr) {
            console.error(
              '[ImportExcel] Error procesando imagen:',
              url,
              imgErr
            );
            imageErrors.push(
              `Producto ${productId} - imagen ${url}: ${imgErr.message}`
            );
          }
        }
      }

      if (imageErrors.length > 0) {
        // Productos creados pero algunas imágenes fallaron
        setError(
          `Productos importados, pero hubo errores con algunas imágenes:\n${imageErrors.join(
            '\n'
          )}`
        );
      } else {
        setSuccess(true);
      }

      if (onSuccess) onSuccess(mapped);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Ocurrió un error al importar el archivo.');
    } finally {
      setLoading(false);
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
        <Alert severity="error" sx={{ mt: 2, whiteSpace: 'pre-line' }}>
          {error}
        </Alert>
      )}

      {success && !error && (
        <Alert severity="success" sx={{ mt: 2 }}>
          ¡Importación exitosa!
        </Alert>
      )}
    </Box>
  );
}
