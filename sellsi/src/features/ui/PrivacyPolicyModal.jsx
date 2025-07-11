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
import { Close as CloseIcon, Security as SecurityIcon } from '@mui/icons-material';

const PrivacyPolicyModal = ({ open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const privacyContent = `
**Política de Privacidad de Sellsi**

**Fecha de última actualización:** Julio 2025

En Sellsi, nos comprometemos a proteger tu privacidad y manejar tus datos personales de manera responsable. Esta Política de Privacidad describe qué información recopilamos, cómo la utilizamos y cómo la protegemos.

Esta política se encuentra alineada con lo dispuesto en la Ley N° 19.628 sobre Protección de la Vida Privada de Chile, así como con principios generales del Reglamento General de Protección de Datos (GDPR), en cuanto resulten aplicables.

**1. Información que Recopilamos**

**1.1. Datos de Registro y Autenticación**
Durante el proceso de registro, recopilamos:
1.1.1. Correo electrónico para la cuenta y comunicaciones
1.1.2. Contraseña almacenada de forma encriptada
1.1.3. Tipo de cuenta (Proveedor o Comprador)
1.1.4. Registro de aceptación de términos y condiciones

**1.2. Información de Perfil Corporativo**
1.2.1. Información básica: Nombre de usuario, teléfono, país
1.2.2. RUT para identificación comercial en Chile
1.2.3. Rol: Supplier (proveedor) o Buyer (comprador)
1.2.4. Logo corporativo: Imagen de perfil de la empresa

**1.3. Información de Envío y Facturación**
1.3.1. Dirección de envío: Región, comuna, dirección, número, departamento
1.3.2. Información de facturación: Razón social, RUT, giro, dirección fiscal
1.3.3. Datos bancarios: Titular, banco, número de cuenta, RUT del titular, tipo de cuenta

**1.4. Información de Productos y Transacciones**
1.4.1. Productos: Nombre, descripción, precios, categorías, especificaciones
1.4.2. Imágenes: Fotografías de productos subidas por proveedores
1.4.3. Pedidos: Solicitudes de compra, cantidades, fechas de entrega
1.4.4. Carritos: Productos agregados y cantidades seleccionadas

**1.5. Información de Pagos**
1.5.1. Transacciones: Montos, fechas, métodos de pago
1.5.2. Comprobantes: Imágenes de transferencias bancarias
1.5.3. Referencias: Números de transferencia y confirmaciones

**1.6. Datos Técnicos**
1.6.1. Información de sesión: Tokens de autenticación
1.6.2. Logs de actividad: Fechas de creación y actualización de registros

**2. Cómo Utilizamos tu Información**

**2.1. Operación de la Plataforma**
2.1.1. Autenticación: Verificar identidad y mantener sesiones seguras
2.1.2. Perfiles: Mostrar información corporativa a otros usuarios
2.1.3. Marketplace: Facilitar la conexión entre proveedores y compradores
2.1.4. Transacciones: Procesar pedidos y gestionar pagos

**2.2. Comunicaciones**
2.2.1. Notificaciones: Alertas sobre pedidos, pagos y actividad de cuenta
2.2.2. Soporte: Responder consultas y resolver problemas técnicos
2.2.3. Actualizaciones: Informar sobre cambios en términos y funcionalidades

**2.3. Mejora del Servicio**
2.3.1. Análisis: Entender patrones de uso para optimizar la plataforma
2.3.2. Desarrollo: Crear nuevas funcionalidades basadas en necesidades de usuarios

**3. Compartición de Información**

**3.1. Entre Usuarios de la Plataforma**
3.1.1. Información visible: Nombre de empresa, teléfono, país, productos
3.1.2. Información de contacto: Compartida para facilitar transacciones
3.1.3. Datos privados: RUT, información bancaria y direcciones NO son visibles públicamente

**3.2. Con Proveedores de Servicios**
3.2.1. Supabase: Nuestro proveedor de base de datos y autenticación
3.2.2. Servicios de almacenamiento: Para imágenes de productos y comprobantes
3.2.3. Servicios de email: Para notificaciones y comunicaciones

**3.3. Requisitos Legales**
3.3.1. Autoridades: Cuando sea requerido por ley o para prevenir fraudes
3.3.2. Cumplimiento: Para resolver disputas comerciales

**4. Seguridad de los Datos**

**4.1. Medidas de Protección**
4.1.1. Encriptación: Contraseñas y datos sensibles almacenados de forma segura
4.1.2. Autenticación: Sistema de tokens seguros para acceso a cuentas
4.1.3. Acceso restringido: Solo personal autorizado puede acceder a datos personales
4.1.4. Validaciones: Verificación de RUT y formatos de datos

**4.2. Almacenamiento y Retención**
4.2.1. Ubicación: Datos almacenados en servidores con estándares de seguridad
4.2.2. Respaldo: Copias de seguridad regulares para prevenir pérdida de datos
4.2.3. Retención activa: Datos mantenidos mientras la cuenta esté activa
4.2.4. Conservación post-baja: Los datos asociados a transacciones completadas podrán mantenerse durante un período adicional de hasta 6 años por razones contables, tributarias o legales, incluso si la cuenta es eliminada

**5. Tus Derechos**

**5.1. Acceso y Control**
5.1.1. Visualización: Acceder a toda tu información personal desde tu perfil
5.1.2. Modificación: Actualizar datos de empresa, envío, facturación y bancarios
5.1.3. Eliminación: Solicitar la eliminación de tu cuenta y datos asociados

**5.2. Datos Sensibles**
5.2.1. Información bancaria: Protegida con visualización limitada
5.2.2. RUT: Validado pero no visible públicamente
5.2.3. Direcciones: Compartidas solo en el contexto de transacciones

**6. Cookies y Tecnologías de Seguimiento**

**6.1. Uso de Cookies**
6.1.1. Sesión: Para mantener usuarios autenticados
6.1.2. Preferencias: Recordar configuraciones de usuario
6.1.3. Seguridad: Prevenir accesos no autorizados

**6.2. Datos de Navegación**
6.2.1. Logs de acceso: Para seguridad y diagnóstico técnico
6.2.2. Preferencias de UI: Tema claro/oscuro y configuraciones de interfaz

**7. Transferencias Internacionales**

Los datos se procesan y almacenan principalmente en servidores ubicados en regiones con estándares adecuados de protección de datos, cumpliendo con regulaciones internacionales.

**8. Menores de Edad**

Sellsi es una plataforma B2B exclusivamente para empresas y profesionales mayores de edad. No recopilamos información de menores de 18 años.

**9. Actualizaciones de esta Política**

**9.1. Notificaciones**
9.1.1. Cambios significativos: Notificación por email y banner en la plataforma
9.1.2. Cambios menores: Actualización de fecha y publicación en la aplicación

**9.2. Historial**
9.2.1. Versiones: Mantenemos registro de cambios para transparencia
9.2.2. Consulta: Usuarios pueden acceder a versiones anteriores

**10. Contacto y Ejercicio de Derechos**

Para ejercer tus derechos de privacidad, realizar consultas o presentar reclamos:

10.1. Email de privacidad: privacidad@sellsi.cl
10.2. Soporte general: soporte@sellsi.cl
10.3. Tiempo de respuesta: Máximo 30 días hábiles

**11. Datos Específicos de Sellsi**

**11.1. Tablas de Datos**
11.1.1. Usuarios: Información básica, autenticación y preferencias
11.1.2. Productos: Catálogos, precios y especificaciones
11.1.3. Transacciones: Histórico de compras y ventas
11.1.4. Carritos: Productos en proceso de compra
11.1.5. Pedidos: Solicitudes y entregas
11.1.6. Pagos: Información financiera y comprobantes

**11.2. Integraciones**
11.2.1. Supabase Auth: Para autenticación segura
11.2.2. Supabase Storage: Para almacenamiento de imágenes
11.2.3. Supabase Database: Para datos estructurados

Esta Política de Privacidad complementa nuestros Términos y Condiciones y forma parte del acuerdo integral para el uso de la plataforma Sellsi.
  `;

  const renderFormattedText = (text) => {
    const lines = text.trim().split('\n');
    
    return lines.map((line, index) => {
      const trimmedLine = line.trim();
      
      if (!trimmedLine) {
        return <Box key={index} sx={{ height: '8px' }} />;
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
              mb: 1.5,
              mt: index === 0 ? 0 : 2,
              fontSize: { xs: '1.1rem', md: '1.25rem' },
            }}
          >
            {title}
          </Typography>
        );
      }
      
      // Definiciones y campos con formato (con **término:**)
      if (trimmedLine.startsWith('**') && trimmedLine.includes(':**')) {
        const parts = trimmedLine.split(':**');
        const term = parts[0].slice(2); // Remove **
        const definition = parts[1].trim();
        return (
          <Box key={index} sx={{ display: 'flex', mb: 1.5, alignItems: 'flex-start' }}>
            <Typography
              sx={{
                color: '#000',
                fontWeight: 700,
                mr: 2,
                fontSize: { xs: '0.95rem', md: '1rem' },
                minWidth: '200px',
                flexShrink: 0,
              }}
            >
              {term}:
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: '0.95rem', md: '1rem' },
                lineHeight: 1.6,
                color: '#333',
                flex: 1,
              }}
            >
              {definition}
            </Typography>
          </Box>
        );
      }
      
      // Numeración jerárquica (1.1.1, 1.2.1, etc.)
      if (/^\d+\.\d+\.\d+\./.test(trimmedLine)) {
        const [number, ...textParts] = trimmedLine.split(' ');
        const text = textParts.join(' ');
        return (
          <Box key={index} sx={{ display: 'flex', mb: 1, alignItems: 'flex-start', ml: 4 }}>
            <Typography
              sx={{
                color: '#000',
                fontWeight: 700,
                mr: 1,
                mt: 0.2,
                fontSize: '0.9rem',
                minWidth: '40px',
              }}
            >
              {number}
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: '0.95rem', md: '1rem' },
                lineHeight: 1.6,
                color: '#333',
                flex: 1,
              }}
            >
              {text}
            </Typography>
          </Box>
        );
      }
      
      // Numeración de segundo nivel (10.1, 10.2, etc.)
      if (/^\d+\.\d+\./.test(trimmedLine)) {
        const [number, ...textParts] = trimmedLine.split(' ');
        const text = textParts.join(' ');
        return (
          <Box key={index} sx={{ display: 'flex', mb: 1, alignItems: 'flex-start', ml: 2 }}>
            <Typography
              sx={{
                color: '#000',
                fontWeight: 700,
                mr: 1,
                mt: 0.2,
                fontSize: '0.95rem',
                minWidth: '35px',
              }}
            >
              {number}
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: '0.95rem', md: '1rem' },
                lineHeight: 1.6,
                color: '#333',
                flex: 1,
              }}
            >
              {text}
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
            lineHeight: 1.6,
            color: '#444',
            mb: 1,
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
          <SecurityIcon sx={{ color: '#41B6E6', fontSize: '2rem' }} />
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: '#1565C0',
              fontSize: { xs: '1.3rem', md: '1.5rem' },
            }}
          >
            Política de Privacidad
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
          {renderFormattedText(privacyContent)}
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
          color="primary"
          sx={{
            px: 4,
            py: 1.5,
            borderRadius: 2,
            fontWeight: 600,
            fontSize: '1rem',
            textTransform: 'none',
          }}
        >
          Entendido
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PrivacyPolicyModal;