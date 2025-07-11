import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Close as CloseIcon, Gavel as GavelIcon } from '@mui/icons-material';

const TermsAndConditionsModal = ({ open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const termsContent = `
**Términos y Condiciones Generales de Sellsi**

El presente documento (en adelante, los "Términos") establece las condiciones que rigen el uso de la plataforma digital Sellsi (en adelante, la "Plataforma"). Al registrarse o utilizar nuestros servicios, usted acepta y se obliga por estos Términos en su totalidad.

**1. Disposiciones Generales**

**1.1. Definiciones**

• **Plataforma:** El sitio web y las herramientas tecnológicas proporcionadas por Sellsi para facilitar transacciones B2B.

• **Usuario:** Término que engloba a Proveedores y Compradores.

• **Proveedor:** Toda persona natural o jurídica que, utilizando la Plataforma, publica, ofrece y vende sus productos o servicios.

• **Comprador:** Toda persona natural o jurídica que utiliza la Plataforma para explorar, cotizar y adquirir productos o servicios de un Proveedor.

**1.2. Acerca de Sellsi y Nuestro Rol**

Sellsi es un marketplace B2B (Business-to-Business) que actúa exclusivamente como un intermediario tecnológico. Nuestra función es conectar a Proveedores con Compradores, proveyendo el espacio digital y las herramientas para facilitar sus transacciones.

El contrato de compraventa se celebra siempre y exclusivamente entre el Proveedor y el Comprador. Sellsi no es propietario, no tiene posesión, no almacena, no despacha ni vende directamente ninguno de los productos ofrecidos.

**2. Términos Aplicables a Proveedores**

**2.1. Registro y Cuenta del Proveedor**

El Proveedor deberá registrarse entregando información corporativa y de contacto que sea veraz, completa y actualizada. El Proveedor es el único responsable de la seguridad y confidencialidad de su cuenta.

**2.2. Obligaciones y Responsabilidades del Proveedor**

• Publicar información exacta y fidedigna sobre sus productos, incluyendo descripciones, especificaciones técnicas, precios, stock y condiciones de venta.

• Garantizar que posee todas las facultades, licencias y permisos legales para comercializar los productos que ofrece en la Plataforma.

• Cumplir con toda la legislación aplicable a su actividad, incluyendo, pero no limitándose a, leyes de protección al consumidor, normativa tributaria y regulaciones comerciales.

• Ser el responsable directo y exclusivo de la logística de envío, la entrega oportuna, la calidad del producto y la gestión de garantías post-venta.

**3. Términos Aplicables a Compradores**

**3.1. Registro y Cuenta del Comprador**

El Comprador deberá registrarse con información fidedigna. Es su responsabilidad verificar la información y reputación del Proveedor antes de confirmar una compra.

**3.2. Obligaciones del Comprador**

• Utilizar la Plataforma para fines lícitos y comerciales, de acuerdo con estos Términos.

• Realizar el pago de los productos a través de los medios habilitados en la Plataforma.

• Seguir el procedimiento de reclamo establecido en la cláusula 4.4 en caso de disconformidad con el producto recibido.

**4. Proceso de Transacción, Pagos y Disputas**

**4.1. Proceso de Compra**

El Comprador selecciona los productos, los añade a su carrito virtual y procede al pago a través del procesador habilitado en la Plataforma (actualmente, Khipu).

**4.2. Retención de Fondos para Seguridad**

Para proteger la transacción, Sellsi retendrá el monto pagado por el Comprador por un plazo de 5 (cinco) días hábiles, contados desde la confirmación del pago por parte del procesador. Este mecanismo busca garantizar la satisfacción del Comprador y el cumplimiento del Proveedor.

**4.3. Liberación del Pago al Proveedor**

Si transcurrido el plazo de 5 días hábiles no se ha recibido ningún reclamo por parte del Comprador, Sellsi procederá a transferir los fondos al Proveedor, descontando la comisión por servicio detallada en la sección 5.

**4.4. Proceso de Reclamo y Mediación**

• Si durante el plazo de retención de 5 días hábiles el Comprador no recibe el producto, o este llega defectuoso, dañado o es sustancialmente distinto a lo publicado, deberá iniciar un reclamo formal a través de los canales de contacto de Sellsi.

• Al recibir un reclamo, Sellsi suspenderá inmediatamente la liberación del pago al Proveedor y notificará a ambas partes para iniciar un proceso de mediación.

• Sellsi podrá solicitar pruebas a ambas partes (fotografías, guías de despacho, comunicaciones, etc.) para evaluar la situación de manera justa.

• Dependiendo del resultado de la mediación, Sellsi podrá:
  - Liberar el pago al Proveedor si el reclamo es desestimado.
  - Gestionar un reembolso parcial o total al Comprador, utilizando los fondos retenidos.
  - Instar al Proveedor a reponer el producto o encontrar otra solución satisfactoria.

**4.5. Disputas Posteriores a la Liberación del Pago**

Si un reclamo se presenta después de que los fondos han sido liberados al Proveedor, Sellsi podrá seguir mediando, pero no puede garantizar un reembolso, ya que la responsabilidad recae en el Proveedor.

**5. Comisiones por Servicio**

Por el uso de la Plataforma, la intermediación tecnológica y los servicios de gestión de pagos y seguridad, Sellsi cobrará al Proveedor una comisión equivalente al 2% (dos por ciento) sobre el valor total de cada transacción completada exitosamente. Esta comisión será descontada automáticamente antes de la liberación de los fondos.

**6. Limitación de Responsabilidad y Sanciones**

**6.1. Limitación General de Responsabilidad**

Dado su rol de intermediario, Sellsi no es responsable por incumplimientos contractuales entre los Usuarios, daños indirectos, pérdidas de negocio, lucro cesante, problemas logísticos o la calidad de los productos. Nuestra responsabilidad se limita estrictamente a la correcta operación de la Plataforma y a la gestión de fondos según lo descrito en estos Términos.

**6.2. Sanciones por Incumplimiento**

Sellsi se reserva el derecho de suspender, limitar o dar de baja de forma temporal o permanente las cuentas de aquellos Usuarios (Proveedores o Compradores) que incurran en conductas fraudulentas, incumplan grave o reiteradamente estos Términos, o afecten la confianza y el buen funcionamiento del ecosistema.

**7. Disposiciones Finales**

**7.1. Modificaciones a los Términos**

Sellsi podrá modificar estos Términos en cualquier momento. Los cambios serán notificados a través de la Plataforma o por correo electrónico y entrarán en vigencia 10 días hábiles después de su publicación. El uso continuado del servicio implica la aceptación de las nuevas condiciones.

**7.2. Legislación Aplicable y Jurisdicción**

Este acuerdo se rige por las leyes vigentes en la República de Chile. Para cualquier controversia, las partes se someten a la jurisdicción de los tribunales ordinarios de justicia de la ciudad de Santiago, renunciando a cualquier otro fuero que pudiera corresponderles.

**7.3. Contacto**

Para cualquier duda, reclamo o solicitud, puede contactarnos a través de contacto@sellsi.cl.
  `;

  const renderFormattedText = (text) => {
    const lines = text.trim().split('\n');
    
    return lines.map((line, index) => {
      const trimmedLine = line.trim();
      
      if (!trimmedLine) {
        return <Box key={index} sx={{ height: '16px' }} />;
      }
      
      // Títulos principales (con **)
      if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
        const title = trimmedLine.slice(2, -2);
        return (
          <Typography
            key={index}
            variant="h6"
            sx={{
              fontWeight: 700,
              color: '#1565C0',
              mb: 2,
              mt: index === 0 ? 0 : 3,
              fontSize: { xs: '1.1rem', md: '1.25rem' },
            }}
          >
            {title}
          </Typography>
        );
      }
      
      // Elementos de lista (con •)
      if (trimmedLine.startsWith('•')) {
        const bulletText = trimmedLine.slice(1).trim();
        return (
          <Box key={index} sx={{ display: 'flex', mb: 1.5, alignItems: 'flex-start' }}>
            <Typography
              sx={{
                color: '#41B6E6',
                fontWeight: 'bold',
                mr: 1,
                mt: 0.2,
                fontSize: '1.2rem',
                lineHeight: 1,
              }}
            >
              •
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: '0.95rem', md: '1rem' },
                lineHeight: 1.6,
                color: '#333',
                flex: 1,
              }}
            >
              {bulletText}
            </Typography>
          </Box>
        );
      }
      
      // Sub-elementos de lista (con -)
      if (trimmedLine.startsWith('-')) {
        const subBulletText = trimmedLine.slice(1).trim();
        return (
          <Box key={index} sx={{ display: 'flex', mb: 1, alignItems: 'flex-start', ml: 3 }}>
            <Typography
              sx={{
                color: '#666',
                mr: 1,
                mt: 0.2,
                fontSize: '1rem',
                lineHeight: 1,
              }}
            >
              -
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: '0.9rem', md: '0.95rem' },
                lineHeight: 1.6,
                color: '#555',
                flex: 1,
              }}
            >
              {subBulletText}
            </Typography>
          </Box>
        );
      }
      
      // Texto normal
      return (
        <Typography
          key={index}
          sx={{
            fontSize: { xs: '0.95rem', md: '1rem' },
            lineHeight: 1.7,
            mb: 1.5,
            color: '#333',
            textAlign: 'justify',
          }}
        >
          {trimmedLine}
        </Typography>
      );
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '90vh',
          width: { xs: '95vw', md: '80vw' },
          maxWidth: '900px',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: '#f8f9fa',
          borderBottom: '2px solid #41B6E6',
          p: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <GavelIcon sx={{ color: '#41B6E6', fontSize: '2rem' }} />
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: '#1565C0',
              fontSize: { xs: '1.3rem', md: '1.5rem' },
            }}
          >
            Términos y Condiciones
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          sx={{
            color: '#666',
            '&:hover': {
              bgcolor: 'rgba(0, 0, 0, 0.04)',
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          p: { xs: 2, md: 4 },
          bgcolor: '#fff',
        }}
      >
        <Box
          sx={{
            '& > *:first-of-type': {
              mt: 0,
            },
          }}
        >
          {renderFormattedText(termsContent)}
        </Box>
      </DialogContent>

      <Divider sx={{ borderColor: '#e0e0e0' }} />

      <DialogActions
        sx={{
          p: 3,
          bgcolor: '#f8f9fa',
          justifyContent: 'center',
        }}
      >
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            bgcolor: 'primary',
            color: 'white',
            px: 4,
            py: 1.5,
            borderRadius: 2,
            fontWeight: 600,
            fontSize: '1rem',
            textTransform: 'none',
            '&:hover': {
              bgcolor: '#1976d2',
            },
          }}
        >
          Entendido
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TermsAndConditionsModal;
