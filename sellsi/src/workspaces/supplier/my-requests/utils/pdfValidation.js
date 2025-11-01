// Helper de validación PDF para dispatch modal.
// Reglas: MIME application/pdf y tamaño <= 500 KB (512000 bytes? especificado como 500KB exactos = 500*1024)
export const MAX_PDF_BYTES = 500 * 1024;
export const PDF_MIME = 'application/pdf';

/**
 * Valida un File (o shape similar) para documento tributario.
 * @param {File|{type?:string,size?:number,name?:string}|null|undefined} file
 * @returns {{ok:true} | {ok:false,error:string}}
 */
export function validateTaxPdf(file){
  if(!file) return { ok:false, error:'Archivo PDF requerido' };
  if(file.type !== PDF_MIME) return { ok:false, error:'Solo se permite PDF' };
  if(typeof file.size === 'number' && file.size > MAX_PDF_BYTES) return { ok:false, error:'Máximo 500KB' };
  return { ok:true };
}
