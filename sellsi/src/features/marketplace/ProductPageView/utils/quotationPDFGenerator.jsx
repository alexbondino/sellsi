import React from 'react'
import { pdf } from '@react-pdf/renderer'
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import { supabase } from '../../../../services/supabase'

// Definir estilos
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
  quotationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1565c0',
    marginBottom: 8,
  },
  headerDate: {
    fontSize: 10,
    color: '#000',
    marginBottom: 3,
  },
  headerSupplier: {
    fontSize: 10,
    color: '#000',
  },
  headerSeparator: {
    borderBottomWidth: 2,
    borderBottomColor: '#1565c0',
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000',
  },
  clientInfo: {
    fontSize: 11,
    color: '#000',
    marginBottom: 8,
  },
  productDescription: {
    fontSize: 11,
    color: '#000',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  infoLabel: {
    width: 120,
    fontWeight: 'bold',
    fontSize: 10,
    color: '#000',
  },
  infoValue: {
    flex: 1,
    fontSize: 10,
    color: '#000',
  },
  table: {
    width: '85%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#000',
    borderStyle: 'solid',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingVertical: 8,
    paddingHorizontal: 5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingVertical: 8,
    paddingHorizontal: 5,
  },
  tableCell: {
    flex: 1,
    fontSize: 10,
    textAlign: 'center',
    color: '#000',
    borderRightWidth: 0.5,
    borderRightColor: '#ccc',
    paddingRight: 5,
  },
  tableCellCenter: {
    flex: 1,
    fontSize: 10,
    textAlign: 'center',
    color: '#000',
    borderRightWidth: 0.5,
    borderRightColor: '#ccc',
    paddingRight: 5,
  },
  tableCellRight: {
    flex: 1,
    fontSize: 10,
    textAlign: 'center',
    color: '#000',
    paddingRight: 5,
  },
  tableCellHeader: {
    flex: 1,
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#000',
    borderRightWidth: 0.5,
    borderRightColor: '#ccc',
    paddingRight: 5,
  },
  tableCellHeaderLast: {
    flex: 1,
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#000',
    paddingRight: 5,
  },
  totalsSection: {
    marginTop: 20,
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
    fontWeight: 'bold',
    color: '#000',
  },
  totalValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000',
  },
  finalTotal: {
    fontSize: 12,
    fontWeight: 'bold',
    borderTopWidth: 1,
    borderTopColor: '#000',
    paddingTop: 5,
  },
  noteText: {
    fontSize: 10,
    color: '#000',
    fontStyle: 'italic',
    marginTop: 15,
  },
  signature: {
    fontSize: 12,
    color: '#000',
    textAlign: 'center',
    marginTop: 30,
  },
  signatureCompany: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1565c0',
    textAlign: 'center',
    marginTop: 5,
  },
  contactInfo: {
    fontSize: 10,
    color: '#000',
    textAlign: 'center',
    marginTop: 3,
  },
})

// Función para obtener el nombre del usuario actual
const getCurrentUserName = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 'Usuario'
    
    const { data: profile } = await supabase
      .from('users')
      .select('user_nm')
      .eq('user_id', user.id)
      .single()
    
    return profile?.user_nm || 'Usuario'
  } catch (error) {
    console.error('Error obteniendo nombre del usuario:', error)
    return 'Usuario'
  }
}

// Función para obtener el nombre del proveedor desde el supplier_id
const getSupplierName = async (supplierId) => {
  try {
    if (!supplierId) return 'Proveedor no especificado'
    
    const { data: supplier } = await supabase
      .from('users')
      .select('user_nm')
      .eq('user_id', supplierId)
      .single()
    
    return supplier?.user_nm || 'Proveedor no especificado'
  } catch (error) {
    console.error('Error obteniendo nombre del proveedor:', error)
    return 'Proveedor no especificado'
  }
}

// Componente principal del documento PDF
const QuotationDocument = ({ product, quantity, unitPrice, tiers, currentUserName, supplierName }) => {
  const totalNeto = quantity * unitPrice
  const iva = totalNeto * 0.19
  const totalConIva = totalNeto + iva
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header con logo y información */}
        <View style={styles.header}>
          <Image
            style={styles.logo}
            src="/pdf/logopdf.jpg"
          />
          <View style={styles.headerRight}>
            <Text style={styles.quotationTitle}>COTIZACIÓN</Text>
            <Text style={styles.headerDate}>FECHA: {new Date().toLocaleDateString('es-CL')}</Text>
            <Text style={styles.headerSupplier}>PROVEEDOR: {supplierName}</Text>
          </View>
        </View>

        {/* Línea separatoria */}
        <View style={styles.headerSeparator} />

        {/* Información del cliente */}
        <Text style={styles.clientInfo}>Estimado: {currentUserName}</Text>
        <Text style={styles.productDescription}>
          Adjuntamos cotización para el siguiente producto adjunto:
        </Text>

        {/* Tabla de productos */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableCellHeader}>Ítem</Text>
            <Text style={styles.tableCellHeader}>Cantidad</Text>
            <Text style={styles.tableCellHeader}>Precio Unitario</Text>
            <Text style={styles.tableCellHeaderLast}>Total</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>
              {product?.nombre || product?.productnm || product?.name || 'Producto'}
            </Text>
            <Text style={styles.tableCellCenter}>
              {quantity?.toLocaleString('es-CL')}
            </Text>
            <Text style={styles.tableCellCenter}>
              ${unitPrice?.toLocaleString('es-CL')}
            </Text>
            <Text style={styles.tableCellRight}>
              ${totalNeto?.toLocaleString('es-CL')}
            </Text>
          </View>
        </View>

        {/* Totales */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Neto:</Text>
            <Text style={styles.totalValue}>${totalNeto?.toLocaleString('es-CL')}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>IVA (19%):</Text>
            <Text style={styles.totalValue}>${iva?.toLocaleString('es-CL')}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, styles.finalTotal]}>Total:</Text>
            <Text style={[styles.totalValue, styles.finalTotal]}>${totalConIva?.toLocaleString('es-CL')}</Text>
          </View>
        </View>

        {/* Notas */}
        <Text style={styles.noteText}>
          * La presente cotización tendrá una vigencia de 48 horas, y estará sujeta a la disponibilidad del proveedor.
        </Text>
        <Text style={styles.noteText}>
          * Los precios están expresados en pesos chilenos (CLP).
        </Text>

        {/* Firma */}
        <Text style={styles.signature}>Atentamente,</Text>
        <Text style={styles.signatureCompany}>Equipo Sellsi</Text>
        <Text style={styles.contactInfo}>+569 6310 9665</Text>
        <Text style={styles.contactInfo}>contacto@sellsi.com</Text>
      </Page>
    </Document>
  )
}

// Función para generar y descargar el PDF
export const generateQuotationPDF = async ({ product, quantity, unitPrice, tiers }) => {
  try {
    // Obtener el nombre del usuario actual
    const currentUserName = await getCurrentUserName()
    
    // Obtener el nombre del proveedor
    const supplierName = await getSupplierName(product?.supplier_id)
    
    // Generar el PDF
    const doc = (
      <QuotationDocument 
        product={product} 
        quantity={quantity} 
        unitPrice={unitPrice} 
        tiers={tiers}
        currentUserName={currentUserName}
        supplierName={supplierName}
      />
    )
    
    const asPdf = pdf(doc)
    const blob = await asPdf.toBlob()
    
    // Crear enlace de descarga
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `cotizacion_${(product?.id || product?.supplier_id || 'codigo').toString().slice(0,6)}_${new Date().toISOString().slice(0,10).replace(/-/g,'')}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error generando PDF:', error)
    throw error
  }
}
