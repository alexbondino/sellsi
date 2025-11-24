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
  const [success, setSuccess] = useState(false);

  const reportError = msg => {
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

      // 🔹 Flags para errores genéricos
      let missingCategoryColumn = false;
      let hasEmptyCategory = false;
      let hasNonNumberCategory = false;
      let hasNonIntegerCategory = false;
      let hasUnknownCategory = false;

      let hasInvalidNumericField = false;

      // Verificar si existe la columna "category"
      const firstRow = json[0];
      const hasCategoryColumn = Object.prototype.hasOwnProperty.call(
        firstRow,
        'category'
      );
      if (!hasCategoryColumn) {
        missingCategoryColumn = true;
      }

      // 1) Recorrer filas
      json.forEach(row => {
        // -------- VALIDACIÓN CATEGORY ----------
        if (hasCategoryColumn) {
          const raw = row.category;

          if (raw === undefined || raw === null || raw === '') {
            hasEmptyCategory = true;
          } else if (typeof raw !== 'number') {
            hasNonNumberCategory = true;
          } else if (!Number.isInteger(raw)) {
            hasNonIntegerCategory = true;
          } else if (!CATEGORY_MAP[String(raw)]) {
            hasUnknownCategory = true;
          }
        }

        // -------- VALIDACIÓN NUMÉRICOS POSITIVOS ----------
        const numericFields = ['productqty', 'price', 'minimum_purchase'];

        numericFields.forEach(fieldName => {
          const val = row[fieldName];

          if (val === undefined || val === null || val === '') {
            hasInvalidNumericField = true;
            return;
          }

          if (typeof val !== 'number') {
            hasInvalidNumericField = true;
            return;
          }

          if (!Number.isInteger(val)) {
            hasInvalidNumericField = true;
            return;
          }

          if (val <= 0) {
            hasInvalidNumericField = true;
            return;
          }
        });

        // -------- MAPEO ----------
        const obj = {};
        const productId = uuidv4();
        obj.productid = productId;

        fields.forEach(f => {
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

        if (userId) obj.supplier_id = userId;

        // -------- CAPTURAR IMÁGENES ----------
        const urls = [];

        if (row.image_url) urls.push(String(row.image_url).trim());

        if (row.image_urls) {
          String(row.image_urls)
            .split(',')
            .map(u => u.trim())
            .filter(Boolean)
            .forEach(u => urls.push(u));
        }

        if (urls.length > 0) {
          imagesByProduct[productId] = urls;
        }

        mapped.push(obj);
      });

      // -------- VALIDACIÓN: NINGUNA URL DE IMAGEN EN TODO EL ARCHIVO ----------
      const totalImageUrls = Object.values(imagesByProduct).reduce(
        (acc, urls) => acc + urls.length,
        0
      );

      if (totalImageUrls === 0) {
        reportError(
          'Ningún producto contiene URLs de imágenes. Debes incluir al menos una URL de imagen en la columna "image_urls".'
        );
        return;
      }

      // -------- VALIDACIÓN: ERRORES CATEGORY / NUMÉRICOS ----------
      const genericErrors = [];

      if (missingCategoryColumn) {
        genericErrors.push(
          'El archivo no contiene la columna obligatoria "category".'
        );
      }
      if (hasEmptyCategory) {
        genericErrors.push(
          'La columna "category" tiene filas vacías y es obligatoria en todas las filas.'
        );
      }
      if (hasNonNumberCategory || hasNonIntegerCategory) {
        genericErrors.push(
          'La columna "category" debe contener solo números enteros (por ejemplo: 1, 2, 3).'
        );
      }
      if (hasUnknownCategory) {
        genericErrors.push(
          'La columna "category" contiene valores que no pertenecen a ninguna categoría válida.'
        );
      }
      if (hasInvalidNumericField) {
        genericErrors.push(
          'Las columnas "productqty", "price" y "minimum_purchase" deben contener solo números enteros positivos (ej: 1, 2, 3), sin texto ni decimales.'
        );
      }

      if (genericErrors.length > 0) {
        reportError(genericErrors.join('\n'));
        return;
      }

      // -------- INSERTAR PRODUCTOS --------
      const { error: insertError } = await supabase.from(table).insert(mapped);

      if (insertError) {
        console.error(insertError);
        throw new Error(
          insertError.message ||
            'Error al insertar los productos en la base de datos.'
        );
      }

      // -------- SUBIR IMÁGENES --------
      const imageErrors = [];
      let successfulUploads = 0; // 👈 cuántas imágenes se subieron bien

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

            const { error: imgInsertError } = await supabase.rpc(
              'insert_image_with_order',
              {
                p_product_id: productId,
                p_image_url: publicUrl,
                p_supplier_id: userId,
              }
            );

            if (imgInsertError) {
              imageErrors.push(
                `Producto ${productId} - imagen ${url}: ${imgInsertError.message}`
              );
            } else {
              successfulUploads += 1; // ✅ imagen subida + registro creado
            }

            order++;
          } catch (err) {
            imageErrors.push(
              `Producto ${productId} - imagen ${url}: ${err.message}`
            );
          }
        }
      }

      // -------- VALIDACIÓN: ¿SE SUBIÓ AL MENOS UNA IMAGEN REALMENTE? --------
      if (successfulUploads === 0) {
        reportError(
          'No se pudo subir ninguna imagen. Verifica que las URLs de imagen sean válidas, públicas y accesibles.'
        );
        return;
      }

      if (imageErrors.length > 0) {
        reportError(
          `Productos importados, pero algunas imágenes fallaron:\n${imageErrors.join(
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
      if (inputRef.current) inputRef.current.value = '';
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
    </Box>
  );
}
