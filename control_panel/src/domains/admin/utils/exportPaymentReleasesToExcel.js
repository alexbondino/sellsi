/**
 * 📊 Exportar Liberaciones de Pago a Excel
 * 
 * Genera un archivo Excel profesional con formato corporativo Sellsi
 * - Encabezados con color azul #2E52B2
 * - Formato detallado de todas las columnas
 * - Bordes y alineación profesional
 * 
 * @author Panel Administrativo Sellsi
 * @date 6 de Enero de 2026
 */

import * as XLSX from 'xlsx'
import { STATUS_LABELS } from '../services/adminPaymentReleaseService'

/**
 * Exporta las liberaciones de pago a un archivo Excel con formato profesional
 * @param {Array} releases - Array de liberaciones de pago
 * @returns {void}
 */
export const exportPaymentReleasesToExcel = (releases) => {
  if (!releases || releases.length === 0) {
    throw new Error('No hay datos para exportar')
  }

  // Preparar datos para Excel
  const excelData = releases.map((release, index) => ({
    'N°': index + 1,
    'ID Liberación': release.id,
    'N° Orden': release.order_id,
    'Proveedor': release.supplier_name || 'N/A',
    'Email Proveedor': release.supplier_email || 'N/A',
    'Comprador': release.buyer_name || 'N/A',
    'Email Comprador': release.buyer_email || 'N/A',
    'Monto': release.amount,
    'Moneda': release.currency,
    'Fecha Compra': release.purchased_at ? new Date(release.purchased_at).toLocaleString('es-CL') : 'N/A',
    'Fecha Entrega Confirmada': release.delivery_confirmed_at ? new Date(release.delivery_confirmed_at).toLocaleString('es-CL') : 'N/A',
    'Días desde Entrega': release.days_pending ?? 'N/A',
    'Estado': STATUS_LABELS[release.status] || release.status,
    'Fecha Liberación': release.released_at ? new Date(release.released_at).toLocaleString('es-CL') : 'N/A',
    'Liberado por': release.released_by_admin_name || 'N/A',
    'Usuario Admin': release.released_by_admin_username || 'N/A',
    'Notas Admin': release.admin_notes || '',
    'Comprobante de Pago': release.payment_proof_url || '',
    'Fecha Creación': new Date(release.created_at).toLocaleString('es-CL')
  }))

  // Crear workbook y worksheet
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(excelData)

  // Configurar anchos de columnas
  const colWidths = [
    { wch: 5 },  // N°
    { wch: 38 }, // ID Liberación
    { wch: 38 }, // N° Orden
    { wch: 25 }, // Proveedor
    { wch: 30 }, // Email Proveedor
    { wch: 25 }, // Comprador
    { wch: 30 }, // Email Comprador
    { wch: 15 }, // Monto
    { wch: 8 },  // Moneda
    { wch: 20 }, // Fecha Compra
    { wch: 20 }, // Fecha Entrega
    { wch: 18 }, // Días desde Entrega
    { wch: 15 }, // Estado
    { wch: 20 }, // Fecha Liberación
    { wch: 25 }, // Liberado por
    { wch: 20 }, // Usuario Admin
    { wch: 40 }, // Notas
    { wch: 50 }, // Comprobante
    { wch: 20 }  // Fecha Creación
  ]
  ws['!cols'] = colWidths

  // Aplicar estilos a los encabezados (primera fila)
  const range = XLSX.utils.decode_range(ws['!ref'])
  
  // Estilo para encabezados: fondo azul corporativo (#2E52B2), texto blanco, negrita
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const address = XLSX.utils.encode_col(C) + "1"
    if (!ws[address]) continue
    
    ws[address].s = {
      fill: {
        patternType: "solid",
        fgColor: { rgb: "FF2E52B2" } // Azul corporativo Sellsi (formato ARGB)
      },
      font: {
        bold: true,
        color: { rgb: "FFFFFFFF" }, // Texto blanco (formato ARGB)
        sz: 12,
        name: "Calibri"
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: false
      },
      border: {
        top: { style: "thin", color: { rgb: "FF000000" } },
        bottom: { style: "thin", color: { rgb: "FF000000" } },
        left: { style: "thin", color: { rgb: "FF000000" } },
        right: { style: "thin", color: { rgb: "FF000000" } }
      }
    }
  }

  // Aplicar formato a celdas de datos
  for (let R = range.s.r + 1; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_cell({ r: R, c: C })
      if (!ws[address]) continue
      
      ws[address].s = {
        alignment: {
          horizontal: C === 0 ? "center" : "left", // Centrar N°, resto a la izquierda
          vertical: "center",
          wrapText: true
        },
        border: {
          top: { style: "thin", color: { rgb: "FFCCCCCC" } },
          bottom: { style: "thin", color: { rgb: "FFCCCCCC" } },
          left: { style: "thin", color: { rgb: "FFCCCCCC" } },
          right: { style: "thin", color: { rgb: "FFCCCCCC" } }
        },
        font: {
          name: "Calibri",
          sz: 11
        }
      }

      // Formato especial para montos
      if (C === 7) { // Columna "Monto"
        ws[address].z = '#,##0'
      }
    }
  }

  // Añadir worksheet al workbook
  XLSX.utils.book_append_sheet(wb, ws, "Liberaciones de Pago")

  // Generar archivo Excel y descargarlo
  const fileName = `Liberaciones_Pago_${new Date().toISOString().split('T')[0]}.xlsx`
  XLSX.writeFile(wb, fileName, { cellStyles: true })
}
