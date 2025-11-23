import * as XLSX from 'xlsx';

/**
 * Genera y descarga un archivo Excel de template con las columnas indicadas.
 * @param {string[]} columns - Nombres de las columnas/campos
 * @param {string} filename - Nombre del archivo a descargar
 */
export function downloadExcelTemplate(columns, filename = 'template.xlsx') {
  // Crear una hoja con solo los encabezados
  const ws = XLSX.utils.aoa_to_sheet([columns]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template');
  XLSX.writeFile(wb, filename);
}
