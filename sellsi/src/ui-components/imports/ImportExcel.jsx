// Mapeo de categorías numéricas a texto
const CATEGORY_MAP = {
  1: 'Tabaquería',
  2: 'Alcoholes',
  3: 'Alimentos',
  4: 'Bebidas',
  5: 'Accesorios',
  // Agrega más según tu sistema
};

import React, { useRef, useState } from 'react';
import { Button, Box, CircularProgress } from '@mui/material';
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
 * @param {function} [onErrorChange] - Callback para reportar errores al padre (MassiveProductImport)
 * @param {object} [buttonProps] - Props opcionales para estilizar el botón
 */
export default function ImportExcel({
  table,
  fields,
  userId,
  onSuccess,
  onErrorChange,
  buttonProps = {},
}) {
  const inputRef = useRef();
  const [loading, setLoading] = useState(false);
  // Mantengo error/success interno por si los quisieras reutilizar luego
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const reportError = msg => {
    setError(msg);
    if (onErrorChange) onErrorChange(msg || null);
  };

  const handleFile = async e => {
    reportError(null);
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
      const rowErrors = [];

      // 1) Recorremos cada fila del Excel y construimos los productos
      json.forEach((row, index) => {
        const excelRowNumber = index + 2; // Fila real (1 = header)

        // ✅ Validación estricta de category (si viene en el Excel)
        if ('category' in row) {
          const rawCategory = row.category;

          if (
            rawCategory === undefined ||
            rawCategory === null ||
            rawCategory === ''
          ) {
            rowErrors.push(
              `Fila ${excelRowNumber}: la columna "category" es obligatoria y no puede estar vacía.`
            );
          } else if (typeof rawCategory !== 'number') {
            rowErrors.push(
              `Fila ${excelRowNumber}: la columna "category" debe ser un número entero (no texto). Valor recibido: "${rawCategory}".`
            );
          } else if (!Number.isInteger(rawCategory)) {
            rowErrors.push(
              `Fila ${excelRowNumber}: la columna "category" debe ser un número entero. Valor recibido: ${rawCategory}.`
            );
          } else if (!CATEGORY_MAP[String(rawCategory)]) {
            rowErrors.push(
              `Fila ${excelRowNumber}: la categoría "${rawCategory}" no existe en el diccionario de categorías.`
            );
          }
        }

        const obj = {};

        // ✅ Generamos un UUID para este producto
        const productId = uuidv4();
        obj.productid = productId;

        // Mapear solo los campos definidos en `fields`, con mapeo de categoría
        fields.forEach(f => {
          // ❌ Nunca pisar productid, ni incluir columnas de imágenes crudas
          if (f === 'image_url' || f === 'image_urls' || f === 'productid') {
            return;
          }

          if (f === 'category') {
            const val = row[f];
            if (val && CATEGORY_MAP[String(val)]) {
              obj[f] = CATEGORY_MAP[String(val)];
            } else {
              obj[f] = val;
            }
          } else {
            obj[f] = row[f];
          }
        });

        if (userId) {
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
      });

      // ⛔ Si hubo errores de categorías, no insertamos nada
      if (rowErrors.length > 0) {
        reportError(rowErrors.join('\n'));
        return;
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
                p_supplier_id: userId,
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
        reportError(
          `Productos importados, pero hubo errores con algunas imágenes:\n${imageErrors.join(
            '\n'
          )}`
        );
      } else {
        reportError(null);
        setSuccess(true);
      }

      if (onSuccess) onSuccess(mapped);
    } catch (err) {
      console.error(err);
      reportError(err.message || 'Ocurrió un error al importar el archivo.');
    } finally {
      setLoading(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  return (
    <Box>
      <Button
        variant="contained"
        component="label"
        disabled={loading}
        {...buttonProps}
      >
        {loading ? <CircularProgress size={24} /> : 'Importar Excel'}
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          hidden
          onChange={handleFile}
        />
      </Button>
      {/* 👇 ya no mostramos Alert acá, el error vive en MassiveProductImport */}
    </Box>
  );
}
