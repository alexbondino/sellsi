// Función para generar cotización PDF con importación dinámica
export const generateQuotationPDF = async ({
  product,
  quantity,
  unitPrice,
  tiers,
}) => {
  // 🔧 MODO DESARROLLO: Mostrar preview HTML en lugar de PDF
  if (import.meta.env.DEV) {
    showHTMLPreview({ product, quantity, unitPrice, tiers });
    return true;
  }

  // 🚀 MODO PRODUCCIÓN: Generar PDF real
  try {
    // Importación dinámica de las dependencias PDF solo cuando se necesitan
    const { pdf } = await import('@react-pdf/renderer');
    const { Document, Page, Text, View, StyleSheet, Image } = await import(
      '@react-pdf/renderer'
    );
    const React = await import('react');
    const { supabase } = await import('../../../../services/supabase');
    const { downloadBlobWithRateLimit } = await import('../../../../shared/utils/downloads/download');

    // Definir estilos - ACTUALIZADOS PARA COINCIDIR CON HTML
    const styles = StyleSheet.create({
      page: {
        fontFamily: 'Helvetica',
        fontSize: 11,
        paddingTop: 30,
        paddingLeft: 30,
        paddingRight: 30,
        paddingBottom: 30,
        lineHeight: 1.5,
      },
      header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 20,
        paddingBottom: 15,
      },
      logo: {
        width: 120,
        height: 'auto',
      },
      headerRight: {
        alignItems: 'flex-end',
      },
      title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2E52B2',
        marginBottom: 8,
      },
      subtitle: {
        fontSize: 10,
        color: '#000',
        marginBottom: 3,
      },
      // Estilos para tabla (idénticos a HTML)
      table: {
        width: '85%',
        marginBottom: 20,
        border: '1px solid #000',
      },
      tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f5f5f5',
        borderBottom: '1px solid #000',
        padding: '8px 5px',
      },
      tableRow: {
        flexDirection: 'row',
        borderBottom: '1px solid #000',
        padding: '8px 5px',
      },
      tableCell: {
        flex: 1,
        textAlign: 'center',
        borderRight: '0.5px solid #ccc',
        paddingRight: 5,
      },
      // Estilos para totales (idénticos a HTML)
      totalsSection: {
        marginTop: 20,
        flexDirection: 'column',
        alignItems: 'flex-end',
      },
      totalRow: {
        flexDirection: 'row',
        width: 200,
        justifyContent: 'space-between',
        marginBottom: 5,
      },
      totalLabel: {
        fontSize: 11,
        color: '#000',
      },
      totalValue: {
        fontSize: 11,
        color: '#000',
      },
      footer: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        textAlign: 'center',
        fontSize: 10,
        color: '#999',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 10,
      },
    });

    // Datos del producto
    const productName = product?.productnm || product?.name || 'Producto';
    const supplier = product?.proveedor || product?.supplier || 'Proveedor';

    // Cálculos
    const totalBruto = quantity * unitPrice;
    const iva = Math.trunc(totalBruto * 0.19); // IVA truncado sin decimales
    const totalNeto = Math.trunc(totalBruto) - iva; // Total Neto es el total bruto truncado menos el IVA truncado
    const totalFinal = totalBruto;

    // Obtener información del usuario actual
    let currentUserName = 'Usuario';
    let currentUserId = null;
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        currentUserId = user.id;
        const { data: profile } = await supabase
          .from('users')
          .select('user_nm')
          .eq('user_id', user.id)
          .single();
        currentUserName = profile?.user_nm || 'Usuario';
      }
    } catch (e) {
      // Si hay error, dejar 'Usuario'
      console.log('No se pudo obtener el nombre del usuario:', e);
    }

    // Componente del documento PDF - ESTRUCTURA IDÉNTICA A DEV HTML
    const QuotationDocument = () =>
      React.createElement(
        Document,
        null,
        React.createElement(
          Page,
          { size: 'A4', style: styles.page },
          // Header con logo (replicando estructura HTML)
          React.createElement(
            View,
            { style: styles.header },
            React.createElement(Image, {
              style: styles.logo,
              src: `${window.location.origin}/pdf/logopdf.jpg`,
            }),
            React.createElement(
              View,
              { style: styles.headerRight },
              React.createElement(Text, { style: styles.title }, 'Cotización'),
              React.createElement(
                Text,
                { style: styles.subtitle },
                `Fecha: ${new Date().toLocaleDateString('es-CL')}`
              ),
              React.createElement(
                Text,
                { style: styles.subtitle },
                `Proveedor: ${supplier}`
              )
            )
          ),

          // Información del cliente
          React.createElement(
            View,
            { style: { marginBottom: 8 } },
            React.createElement(
              Text,
              { style: { fontSize: 11, color: '#000' } },
              `Estimado: ${currentUserName}`
            )
          ),
          React.createElement(
            View,
            { style: { marginBottom: 15 } },
            React.createElement(
              Text,
              { style: { fontSize: 11, color: '#000' } },
              'Adjuntamos cotización para el siguiente producto adjunto:'
            )
          ),

          // Tabla de productos (replicando estructura HTML)
          React.createElement(
            View,
            { style: styles.table },
            // Header de tabla
            React.createElement(
              View,
              { style: styles.tableHeader },
              React.createElement(
                View,
                { style: [styles.tableCell, { fontWeight: 'bold' }] },
                React.createElement(
                  Text,
                  { style: { fontSize: 11, fontWeight: 'bold' } },
                  'Ítem'
                )
              ),
              React.createElement(
                View,
                { style: [styles.tableCell, { fontWeight: 'bold' }] },
                React.createElement(
                  Text,
                  { style: { fontSize: 11, fontWeight: 'bold' } },
                  'Cantidad'
                )
              ),
              React.createElement(
                View,
                { style: [styles.tableCell, { fontWeight: 'bold' }] },
                React.createElement(
                  Text,
                  { style: { fontSize: 11, fontWeight: 'bold' } },
                  'Precio Unitario'
                )
              ),
              React.createElement(
                View,
                { style: [styles.tableCell, { fontWeight: 'bold' }] },
                React.createElement(
                  Text,
                  { style: { fontSize: 11, fontWeight: 'bold' } },
                  'Total'
                )
              )
            ),
            // Fila de datos
            React.createElement(
              View,
              { style: styles.tableRow },
              React.createElement(
                View,
                { style: styles.tableCell },
                React.createElement(
                  Text,
                  { style: { fontSize: 10 } },
                  productName
                )
              ),
              React.createElement(
                View,
                { style: styles.tableCell },
                React.createElement(
                  Text,
                  { style: { fontSize: 10 } },
                  quantity?.toLocaleString('es-CL')
                )
              ),
              React.createElement(
                View,
                { style: styles.tableCell },
                React.createElement(
                  Text,
                  { style: { fontSize: 10 } },
                  `$${Math.trunc(unitPrice).toLocaleString('es-CL')}`
                )
              ),
              React.createElement(
                View,
                { style: styles.tableCell },
                React.createElement(
                  Text,
                  { style: { fontSize: 10 } },
                  `$${Math.trunc(totalBruto).toLocaleString('es-CL')}`
                )
              )
            )
          ),

          // Totales (estructura idéntica a HTML)
          React.createElement(
            View,
            { style: styles.totalsSection },
            React.createElement(
              View,
              { style: styles.totalRow },
              React.createElement(
                Text,
                { style: styles.totalLabel },
                'Total Neto'
              ),
              React.createElement(
                Text,
                { style: styles.totalValue },
                `$${totalNeto.toLocaleString('es-CL')}`
              )
            ),
            React.createElement(
              View,
              { style: styles.totalRow },
              React.createElement(
                Text,
                { style: styles.totalLabel },
                'IVA (19%)'
              ),
              React.createElement(
                Text,
                { style: styles.totalValue },
                `$${iva.toLocaleString('es-CL')}`
              )
            ),
            React.createElement(
              View,
              {
                style: [
                  styles.totalRow,
                  { borderTopWidth: 1, borderTopColor: '#000', paddingTop: 5 },
                ],
              },
              React.createElement(
                Text,
                {
                  style: [
                    styles.totalLabel,
                    { fontSize: 12, fontWeight: 'bold' },
                  ],
                },
                'Total:'
              ),
              React.createElement(
                Text,
                {
                  style: [
                    styles.totalValue,
                    { fontSize: 12, fontWeight: 'bold' },
                  ],
                },
                `$${Math.trunc(totalFinal).toLocaleString('es-CL')}`
              )
            )
          ),

          // Notas (idénticas a HTML - 48 horas)
          React.createElement(
            View,
            { style: { marginTop: 15 } },
            React.createElement(
              Text,
              {
                style: {
                  fontSize: 10,
                  color: '#000',
                  fontStyle: 'italic',
                  marginBottom: 3,
                },
              },
              '* La presente cotización tendrá una vigencia de 48 horas, y estará sujeta a la disponibilidad del proveedor.'
            )
          ),
          React.createElement(
            View,
            { style: { marginBottom: 30 } },
            React.createElement(
              Text,
              { style: { fontSize: 10, color: '#000', fontStyle: 'italic' } },
              '* Valores expresados en pesos chilenos (CLP).'
            )
          ),

          // Firma (idéntica a HTML)
          React.createElement(
            View,
            { style: { textAlign: 'right', marginTop: 30 } },
            React.createElement(
              Text,
              { style: { fontSize: 12, color: '#000' } },
              'Atentamente,'
            )
          ),
          React.createElement(
            View,
            { style: { textAlign: 'right', marginTop: 5 } },
            React.createElement(
              Text,
              { style: { fontSize: 12, fontWeight: 'bold', color: '#2E52B2' } },
              'Equipo Sellsi'
            )
          ),
          React.createElement(
            View,
            { style: { textAlign: 'right', marginTop: 3 } },
            React.createElement(
              Text,
              { style: { fontSize: 10, color: '#000' } },
              '+569 6310 9665'
            )
          ),
          React.createElement(
            View,
            { style: { textAlign: 'right', marginTop: 3 } },
            React.createElement(
              Text,
              { style: { fontSize: 10, color: '#000' } },
              'contacto@sellsi.com'
            )
          )
        )
      );

    // Generar y descargar el PDF
    const blob = await pdf(React.createElement(QuotationDocument)).toBlob();
    const friendlyFilename = `cotizacion-${productName
      .replace(/\s+/g, '-')
      .toLowerCase()}-${Date.now()}.pdf`;

    try {
      await downloadBlobWithRateLimit({
        blob,
        filename: friendlyFilename,
        rateKey: `quotation_pdf:${product?.id || product?.productid || product?.product_id || productName}`,
      });
    } catch (e) {
      const msg = String(e?.message || e || '');
      if (msg.startsWith('RATE_LIMITED:')) {
        const seconds = msg.split(':')[1] || '';
        alert(`Límite de descargas alcanzado. Intenta nuevamente en ${seconds}s.`);
        return;
      }
      throw e;
    }

    // Persistir en Supabase (no bloquear descarga)
    try {
      const productId = product?.id || product?.productid || product?.product_id;
      if (productId && blob && currentUserId) {
        void (async () => {
          const quotationId = crypto.randomUUID();
          const storagePath = `${currentUserId}/${productId}/${quotationId}.pdf`;

          const totalAmount = Math.round(Number(quantity) * Number(unitPrice));

          const { error: uploadErr } = await supabase.storage
            .from('quotations')
            .upload(storagePath, blob, {
              contentType: 'application/pdf',
              upsert: false,
            });

          if (uploadErr) {
            console.warn('[quotation] upload failed', uploadErr);
            return;
          }

          const { data, error } = await supabase.functions.invoke('save-quotation', {
            body: {
              productId,
              storagePath,
              metadata: {
                product_name: productName,
                supplier_name: supplier,
                amount: totalAmount,
                document_name: friendlyFilename,
                file_size: blob.size,
              },
            },
          });
          if (error) {
            console.warn('[quotation] save-quotation failed', error);
            return;
          }
          if (import.meta.env.DEV) console.debug('[quotation] saved', data);
        })().catch((e) => console.warn('[quotation] persist exception', e));
      }
    } catch (e) {
      // Nunca romper la descarga por falla de persistencia
      console.warn('[quotation] persist skipped', e);
    }

    console.log('PDF generado y descargado exitosamente');
    return true;
  } catch (error) {
    console.error('Error generando PDF:', error);

    // Si estamos en desarrollo y hay error con base64-js o módulos ES, mostrar mensaje específico
    if (
      import.meta.env.DEV &&
      (error.message?.includes('base64-js') ||
        error.message?.includes('does not provide an export named') ||
        error.message?.includes('module.mjs'))
    ) {
      alert(
        '⚠️ Generación de PDF no disponible en desarrollo\n\nEl PDF funcionará correctamente en producción (npm run build).\n\nEsto es un problema conocido de @react-pdf/renderer en modo desarrollo con Vite.'
      );
      return;
    }

    throw new Error('Error al generar la cotización PDF: ' + error.message);
  }
};

// 🎨 FUNCIÓN PARA PREVIEW HTML EN DESARROLLO
const showHTMLPreview = async ({ product, quantity, unitPrice, tiers }) => {
  const getCurrentDate = () => {
    return new Date().toLocaleDateString('es-CL');
  };

  const calculateTotals = () => {
    const totalBruto = quantity * unitPrice;
    const iva = Math.trunc(totalBruto * 0.19); // IVA truncado sin decimales
    const totalNeto = Math.trunc(totalBruto) - iva; // Total Neto es el total bruto truncado menos el IVA truncado
    const totalConIva = totalBruto;

    return {
      totalBruto,
      totalNeto,
      iva,
      totalConIva,
    };
  };

  // Obtener nombre de usuario actual
  let currentUserName = 'Usuario';
  try {
    const { supabase } = await import('../../../../services/supabase');
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('user_nm')
        .eq('user_id', user.id)
        .single();
      currentUserName = profile?.user_nm || 'Usuario';
    }
  } catch (e) {
    // Si hay error, dejar 'Usuario'
  }

  const { totalBruto, totalNeto, iva, totalConIva } = calculateTotals();

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Preview Cotización - ${
        product?.productnm || product?.nombre || 'Producto'
      }</title>
      <style>
        /* Estilos que replican exactamente el PDF original de staging */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Helvetica', Arial, sans-serif;
          font-size: 11px;
          line-height: 1.5;
          padding: 30px;
          background: white;
          color: #000;
        }
        
        .page {
          max-width: 595px;
          margin: 0 auto;
          background: white;
          min-height: 842px;
          position: relative;
        }
        
        .header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 20px;
          padding-bottom: 15px;
        }
        
        .logo {
          width: 120px;
          height: auto;
        }
        
        .header-right {
          text-align: right;
        }
        
        .quotation-title {
          font-size: 20px;
          font-weight: bold;
          color: #2E52B2;
          margin-bottom: 8px;
        }
        
        .header-date {
          font-size: 10px;
          color: #000;
          margin-bottom: 3px;
        }
        
        .header-supplier {
          font-size: 10px;
          color: #000;
        }
        
        .header-separator {
          border-bottom: 2px solid #2E52B2;
          margin-bottom: 20px;
        }
        
        .client-info {
          font-size: 11px;
          color: #000;
          margin-bottom: 8px;
        }
        
        .product-description {
          font-size: 11px;
          color: #000;
          margin-bottom: 15px;
        }
        
        .table {
          width: 85%;
          margin-bottom: 20px;
          border: 1px solid #000;
          border-collapse: collapse;
        }
        
        .table-header {
          display: flex;
          background-color: #f5f5f5;
          border-bottom: 1px solid #000;
          padding: 8px 5px;
        }
        
        .table-row {
          display: flex;
          border-bottom: 1px solid #000;
          padding: 8px 5px;
        }
        
        .table-cell {
          flex: 1;
          font-size: 10px;
          text-align: center;
          color: #000;
          border-right: 0.5px solid #ccc;
          padding-right: 5px;
        }
        
        .table-cell:last-child {
          border-right: none;
        }
        
        .table-cell-header {
          flex: 1;
          font-size: 11px;
          font-weight: bold;
          text-align: center;
          color: #000;
          border-right: 0.5px solid #ccc;
          padding-right: 5px;
        }
        
        .table-cell-header:last-child {
          border-right: none;
        }
        
        .totals-section {
          margin-top: 20px;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }
        
        .total-row {
          display: flex;
          width: 200px;
          justify-content: space-between;
          margin-bottom: 5px;
        }
        
        .total-label {
          font-size: 11px;
          color: #000;
        }
        
        .total-value {
          font-size: 11px;
          color: #000;
        }
        
        .final-total {
          font-size: 12px;
          font-weight: bold;
          border-top: 1px solid #000;
          padding-top: 5px;
        }
        
        .note-text {
          font-size: 10px;
          color: #000;
          font-style: italic;
          margin-top: 15px;
        }
        
        .signature {
          font-size: 12px;
          color: #000;
          text-align: right;
          margin-top: 30px;
        }
        
        .signature-company {
          font-size: 12px;
          font-weight: bold;
          color: #2E52B2;
          text-align: right;
          margin-top: 5px;
        }
        
        .contact-info {
          font-size: 10px;
          color: #000;
          text-align: right;
          margin-top: 3px;
        }
        
        .dev-banner {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: linear-gradient(45deg, #ff6b35, #f7931e);
          color: white;
          padding: 8px;
          text-align: center;
          font-weight: bold;
          font-size: 12px;
          z-index: 1000;
          box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        }
        
        .page {
          margin-top: 50px;
        }
        
        @media print {
          .dev-banner { display: none; }
          .page { margin-top: 0; }
          body { padding: 0; }
        }
      </style>
    </head>
    <body>
      <!-- Banner de desarrollo -->
      <div class="dev-banner">
        🔧 PREVIEW DESARROLLO
        <button onclick="window.print()" style="margin-left: 20px; padding: 4px 8px; background: white; color: #333; border: none; border-radius: 3px; cursor: pointer;">
          🖨️ Imprimir Preview
        </button>
      </div>

      <div class="page">
        <!-- Header con logo y información -->
        <div class="header">
          <img src="/pdf/logopdf.jpg" alt="Logo Sellsi" class="logo" />
          <div class="header-right">
            <div class="quotation-title">Cotización</div>
            <div class="header-date">Fecha: ${getCurrentDate()}</div>
            <div class="header-supplier">Proveedor: ${
              product?.proveedor || 'Proveedor no especificado'
            }</div>
          </div>
        </div>

        <!-- Línea separatoria -->
        <div class="header-separator"></div>

        <!-- Información del cliente -->
        <div class="client-info">Estimado: ${currentUserName}</div>
        <div class="product-description">
          Adjuntamos cotización para el siguiente producto adjunto:
        </div>

        <!-- Tabla de productos -->
        <div class="table">
          <div class="table-header">
            <div class="table-cell-header">Ítem</div>
            <div class="table-cell-header">Cantidad</div>
            <div class="table-cell-header">Precio Unitario</div>
            <div class="table-cell-header">Total</div>
          </div>
          <div class="table-row">
            <div class="table-cell">
              ${
                product?.nombre ||
                product?.productnm ||
                product?.name ||
                'Producto'
              }
            </div>
            <div class="table-cell">
              ${quantity?.toLocaleString('es-CL')}
            </div>
            <div class="table-cell">
              $${Math.trunc(unitPrice).toLocaleString('es-CL')}
            </div>
            <div class="table-cell">
              $${Math.trunc(totalBruto).toLocaleString('es-CL')}
            </div>
          </div>
        </div>

        <!-- Totales -->
        <div class="totals-section">
          <div class="total-row">
            <div class="total-label">Total Neto</div>
            <div class="total-value">$${totalNeto.toLocaleString('es-CL')}</div>
          </div>
          <div class="total-row">
            <div class="total-label">IVA (19%)</div>
            <div class="total-value">$${iva.toLocaleString('es-CL')}</div>
          </div>
          <div class="total-row final-total">
            <div class="total-label">Total:</div>
            <div class="total-value">$${Math.trunc(totalConIva).toLocaleString(
              'es-CL'
            )}</div>
          </div>
        </div>

        <!-- Notas -->
        <div class="note-text">
          * La presente cotización tendrá una vigencia de 48 horas, y estará sujeta a la disponibilidad del proveedor.
        </div>
        <div class="note-text">
          * Valores expresados en pesos chilenos (CLP).
        </div>

        <!-- Firma -->
        <div class="signature">Atentamente,</div>
        <div class="signature-company">Equipo Sellsi</div>
        <div class="contact-info">+569 6310 9665</div>
        <div class="contact-info">contacto@sellsi.com</div>
      </div>
    </body>
    </html>
  `;

  // Abrir en nueva ventana
  const newWindow = window.open(
    '',
    '_blank',
    'width=800,height=900,scrollbars=yes,resizable=yes'
  );
  newWindow.document.write(htmlContent);
  newWindow.document.close();
  newWindow.focus();
};
