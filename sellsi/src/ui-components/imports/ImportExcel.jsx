// Mapeo de regiones numéricas a texto
const REGION_MAP = {
  1: 'tarapaca',
  2: 'antofagasta',
  3: 'atacama',
  4: 'coquimbo',
  5: 'valparaiso',
  6: 'ohiggins',
  7: 'maule',
  8: 'biobio',
  9: 'araucania',
  10: 'los-lagos',
  11: 'aysen',
  12: 'magallanes',
  13: 'metropolitana',
  14: 'los-rios',
  15: 'arica-parinacota',
  16: 'nuble',
};

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
const PRODUCT_IMAGES_TABLE = 'product_images'; // si lo usas en otro lado

// Utilidad para descargar una imagen desde una URL y devolver un Blob (robusto)
async function fetchImageAsBlob(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `No se pudo descargar la imagen (status: ${response.status})`
    );
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.startsWith('image/')) {
    throw new Error(
      `La URL no apunta directamente a una imagen (content-type: ${contentType}).`
    );
  }

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
      const deliveryByProduct = {}; // productId -> [{ region, price, delivery_days }]

      // 🔹 Flags de validación generales
      let missingCategoryColumn = false;
      let hasEmptyCategory = false;
      let hasNonNumberCategory = false;
      let hasNonIntegerCategory = false;
      let hasUnknownCategory = false;
      let hasInvalidNumericField = false;
      let hasMissingProductName = false;

      // 🔹 Flags específicos para envío
      let hasInvalidDeliveryRegions = false;
      let hasInvalidDeliveryLengths = false;
      let hasInvalidDeliveryValues = false;
      let hasDuplicateDeliveryRegions = false; // NUEVO: regiones repetidas por fila

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
      json.forEach((row, rowIndex) => {
        const rowNumber = rowIndex + 2; // considerando encabezado en fila 1

        // -------- VALIDACIÓN PRODUCTNM (OBLIGATORIO) ----------
        if (!row.productnm || String(row.productnm).trim() === '') {
          hasMissingProductName = true;
        }

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

        // -------- MAPEO PRODUCTO ----------
        const obj = {};
        const productId = uuidv4();
        obj.productid = productId;

        fields.forEach(f => {
          // Excluir campos que no pertenecen a la tabla products
          if (
            f === 'image_url' ||
            f === 'image_urls' ||
            f === 'productid' ||
            f === 'regions' ||
            f === 'delivery_regions' ||
            f === 'delivery_prices' ||
            f === 'delivery_days'
          ) {
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
            .split(';')
            .map(u => u.trim())
            .filter(Boolean)
            .forEach(u => urls.push(u));
        }
        if (urls.length > 0) {
          imagesByProduct[productId] = urls;
        }

        // -------- CAPTURAR REGIONES DE ENTREGA + VALIDACIÓN ROBUSTA ----------
        // Listas crudas desde el Excel, separadas por ";"
        // 🔹 Ahora usamos delivery_regions en vez de regions
        const deliveryRegionsRaw = row.delivery_regions
          ? String(row.delivery_regions)
              .split(';')
              .map(r => r.trim())
              .filter(Boolean)
          : [];

        const deliveryPricesRaw = row.delivery_prices
          ? String(row.delivery_prices)
              .split(';')
              .map(p => p.trim())
              .filter(Boolean)
          : [];

        const deliveryDaysRaw = row.delivery_days
          ? String(row.delivery_days)
              .split(';')
              .map(d => d.trim())
              .filter(Boolean)
          : [];

        // Validar y mapear regiones numéricas a texto
        const validatedRegions = [];
        let rowHasRegionError = false;

        deliveryRegionsRaw.forEach(value => {
          // debe ser número entero válido
          if (isNaN(value)) {
            rowHasRegionError = true;
            hasInvalidDeliveryRegions = true;
            return;
          }

          const num = Number(value);

          if (!Number.isInteger(num)) {
            rowHasRegionError = true;
            hasInvalidDeliveryRegions = true;
            return;
          }

          if (!REGION_MAP[num]) {
            rowHasRegionError = true;
            hasInvalidDeliveryRegions = true;
            return;
          }

          validatedRegions.push(REGION_MAP[num]);
        });

        // 🔹 NUEVO: validar que no haya regiones repetidas en la misma fila
        if (validatedRegions.length > 0) {
          const uniqueRegions = new Set(validatedRegions);
          if (uniqueRegions.size !== validatedRegions.length) {
            hasDuplicateDeliveryRegions = true;
            rowHasRegionError = true;
          }
        }

        // Si había valores en delivery_regions pero ninguna región válida
        if (deliveryRegionsRaw.length > 0 && validatedRegions.length === 0) {
          hasInvalidDeliveryRegions = true;
          mapped.push(obj);
          return;
        }

        const regions = validatedRegions;
        const deliveryPrices = deliveryPricesRaw;
        const deliveryDays = deliveryDaysRaw;

        // Si hay algún dato de envío en la fila, validamos coherencia y tipos
        if (
          !rowHasRegionError &&
          (regions.length > 0 ||
            deliveryPrices.length > 0 ||
            deliveryDays.length > 0)
        ) {
          // Longitudes deben coincidir y no estar vacías
          if (
            regions.length === 0 ||
            deliveryPrices.length === 0 ||
            deliveryDays.length === 0 ||
            regions.length !== deliveryPrices.length ||
            regions.length !== deliveryDays.length
          ) {
            hasInvalidDeliveryLengths = true;
            // No intentamos crear deliveries si ya hay error de longitudes
          } else {
            const deliveries = [];
            let rowHasValueError = false;

            for (let i = 0; i < regions.length; i++) {
              const region = regions[i];
              const rawPrice = deliveryPrices[i];
              const rawDays = deliveryDays[i];

              const priceNum = Number(rawPrice);
              const daysNum = Number(rawDays);

              if (!Number.isFinite(priceNum) || priceNum < 0) {
                rowHasValueError = true;
                hasInvalidDeliveryValues = true;
                break;
              }

              if (!Number.isInteger(daysNum) || daysNum <= 0) {
                rowHasValueError = true;
                hasInvalidDeliveryValues = true;
                break;
              }

              deliveries.push({
                region,
                price: priceNum,
                delivery_days: daysNum,
              });
            }

            if (!rowHasValueError && deliveries.length > 0) {
              deliveryByProduct[productId] = deliveries;
            }
          }
        }

        // -------- FIN REGIONES / ENVÍO --------

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

      // -------- VALIDACIÓN: ERRORES CATEGORY / NUMÉRICOS / DELIVERY ----------
      const genericErrors = [];

      if (hasMissingProductName) {
        genericErrors.push(
          'Hay productos sin nombre. La columna "productnm" es obligatoria y no puede estar vacía en ninguna fila.'
        );
      }
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

      // 🔹 Mensajes genéricos de envío
      if (hasInvalidDeliveryRegions) {
        genericErrors.push(
          'Hay problemas en las regiones de entrega. Asegúrate de que la columna "delivery_regions" use solo números de región válidos (1–16), separados por ";".'
        );
      }
      if (hasInvalidDeliveryLengths) {
        genericErrors.push(
          'Hay filas donde "delivery_regions", "delivery_prices" y "delivery_days" no tienen la misma cantidad de valores. Todas las listas deben estar completas y alineadas.'
        );
      }
      if (hasInvalidDeliveryValues) {
        genericErrors.push(
          'Hay filas donde "delivery_prices" o "delivery_days" contienen valores inválidos. Los precios deben ser numéricos mayores o iguales a 0 y los días deben ser enteros positivos.'
        );
      }
      if (hasDuplicateDeliveryRegions) {
        genericErrors.push(
          'Hay filas donde "delivery_regions" contiene regiones repetidas. Cada región de entrega solo puede aparecer una vez por producto.'
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

      // -------- SUBIR REGIONES DE ENTREGA (product_delivery_regions) --------
      const deliveryErrors = [];
      let totalDeliveries = 0;
      let successfulDeliveries = 0;

      for (const [productId, deliveries] of Object.entries(deliveryByProduct)) {
        for (const delivery of deliveries) {
          totalDeliveries++;

          const { error: deliveryError } = await supabase
            .from('product_delivery_regions')
            .insert({
              product_id: productId,
              region: delivery.region,
              price: delivery.price,
              delivery_days: delivery.delivery_days,
              // Si tu tabla tiene supplier_id y RLS, descomenta:
              // supplier_id: userId || null,
            });

          if (deliveryError) {
            console.error(
              'Error insertando región de entrega:',
              productId,
              delivery,
              deliveryError
            );
            deliveryErrors.push(
              `Producto ${productId} - región "${delivery.region}": ${deliveryError.message}`
            );
          } else {
            successfulDeliveries++;
          }
        }
      }

      if (totalDeliveries > 0 && successfulDeliveries === 0) {
        reportError(
          'No se pudo registrar ninguna región de entrega. Verifica que la tabla "product_delivery_regions" tenga las columnas correctas y que las políticas de seguridad (RLS) permitan insertar.'
        );
        return;
      }

      // -------- SUBIR IMÁGENES --------
      const imageErrors = [];
      let successfulUploads = 0;

      for (const [productId, urls] of Object.entries(imagesByProduct)) {
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
              successfulUploads += 1;
            }
          } catch (err) {
            console.error('Error al procesar imagen', url, err);
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

      // -------- REPORTES FINALES --------
      const finalMessages = [];

      if (deliveryErrors.length > 0) {
        finalMessages.push(
          `Productos importados, pero algunas regiones de entrega fallaron:\n${deliveryErrors.join(
            '\n'
          )}`
        );
      }

      if (imageErrors.length > 0) {
        finalMessages.push(
          `Productos importados, pero algunas imágenes fallaron:\n${imageErrors.join(
            '\n'
          )}`
        );
      }

      if (finalMessages.length > 0) {
        reportError(finalMessages.join('\n\n'));
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
