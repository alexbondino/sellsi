import React from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  Select,
  MenuItem,
} from '@mui/material';
import { validateRut, validateEmail } from '../../../../utils/validators';
import { BANKS, ACCOUNT_TYPES } from '../../../../shared/constants/profile';
import {
  getHighlightFieldStyle,
  getHighlightHelperText,
  getHighlightLabelStyle,
} from '../../../../utils/fieldHighlightStyles';

/**
 * Sección de Información de Transferencia del perfil
 * Layout: 2 columnas - campos a la izquierda, descripciones a la derecha
 */
const TransferInfoSection = ({
  formData,
  onFieldChange,
  showSensitiveData,
  toggleSensitiveData,
  getSensitiveFieldValue,
  shouldHighlight = false,
  id,
}) => {
  return (
    <Box id={id} sx={{ p: 3, height: 'fit-content' }}>
      {/* Header de la sección */}
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Información de Transferencia
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          Datos bancarios para recibir pagos de tus ventas
        </Typography>
        <Box sx={{ mt: 1.5, borderBottom: 2, borderColor: 'primary.main' }} />
      </Box>

      {/* Layout 2 columnas */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 3,
        }}
      >
        {/* Columna izquierda - Campos */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Nombre Titular */}
          <TextField
            label="Nombre Titular"
            value={formData.accountHolder || ''}
            onChange={e => onFieldChange('accountHolder', e.target.value)}
            fullWidth
            variant="outlined"
            size="small"
            error={shouldHighlight && !formData.accountHolder?.trim()}
            helperText={getHighlightHelperText(
              formData.accountHolder,
              shouldHighlight,
              '',
              'Nombre titular es obligatorio'
            )}
            sx={getHighlightFieldStyle(formData.accountHolder, shouldHighlight)}
          />

          {/* RUT */}
          <TextField
            label="RUT"
            value={formData.transferRut || ''}
            onChange={e => {
              const raw = e.target.value.replace(/[^0-9kK]/g, '');
              const formatted = raw.replace(
                /(\d{1,2})(\d{3})(\d{3})([\dkK])?$/,
                (match, p1, p2, p3, p4) => {
                  let rut = p1 + '.' + p2 + '.' + p3;
                  if (p4) rut += '-' + p4;
                  return rut;
                }
              );
              onFieldChange('transferRut', formatted);
            }}
            fullWidth
            variant="outlined"
            size="small"
            placeholder="12.345.678-9"
            error={
              !validateRut(formData.transferRut) ||
              (shouldHighlight && !formData.transferRut?.trim())
            }
            helperText={getHighlightHelperText(
              formData.transferRut,
              shouldHighlight,
              !validateRut(formData.transferRut)
                ? 'Formato de RUT inválido'
                : '',
              'RUT es obligatorio'
            )}
            sx={getHighlightFieldStyle(formData.transferRut, shouldHighlight)}
          />

          {/* Banco */}
          <FormControl
            fullWidth
            size="small"
            error={shouldHighlight && !formData.bank?.trim()}
          >
            <Typography
              variant="body2"
              sx={{
                mb: 1,
                fontWeight: 500,
                ...getHighlightLabelStyle(formData.bank, shouldHighlight),
              }}
            >
              Banco
            </Typography>
            <Select
              value={formData.bank || ''}
              onChange={e => onFieldChange('bank', e.target.value)}
              displayEmpty
              sx={getHighlightFieldStyle(formData.bank, shouldHighlight)}
              MenuProps={{
                disableScrollLock: true,
                PaperProps: { style: { maxHeight: 48 * 5 + 8 } },
              }}
            >
              <MenuItem value="">
                <em>Seleccionar banco</em>
              </MenuItem>
              {BANKS.map(bank => (
                <MenuItem key={bank} value={bank}>
                  {bank}
                </MenuItem>
              ))}
            </Select>
            {shouldHighlight && !formData.bank?.trim() && (
              <Typography variant="caption" color="error">
                Banco es obligatorio
              </Typography>
            )}
          </FormControl>

          {/* Tipo de Cuenta */}
          <Box>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
              Tipo de Cuenta
            </Typography>
            <FormControl size="small" fullWidth>
              <Select
                value={formData.accountType || 'corriente'}
                onChange={e => onFieldChange('accountType', e.target.value)}
                MenuProps={{
                  disableScrollLock: true,
                  PaperProps: { style: { maxHeight: 48 * 5 + 8 } },
                }}
              >
                {ACCOUNT_TYPES.map(type => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Número de Cuenta */}
          <TextField
            label="Número de Cuenta"
            value={formData.accountNumber || ''}
            onChange={e => onFieldChange('accountNumber', e.target.value)}
            fullWidth
            variant="outlined"
            size="small"
            error={shouldHighlight && !formData.accountNumber?.trim()}
            helperText={getHighlightHelperText(
              formData.accountNumber,
              shouldHighlight,
              '',
              'Número de cuenta es obligatorio'
            )}
            sx={getHighlightFieldStyle(formData.accountNumber, shouldHighlight)}
          />

          {/* Correo de Confirmación */}
          <TextField
            label="Correo de Confirmación"
            value={formData.confirmationEmail || ''}
            onChange={e => onFieldChange('confirmationEmail', e.target.value)}
            fullWidth
            variant="outlined"
            size="small"
            type="email"
            placeholder="correo@ejemplo.com"
            error={
              !validateEmail(formData.confirmationEmail) ||
              (shouldHighlight && !formData.confirmationEmail?.trim())
            }
            helperText={getHighlightHelperText(
              formData.confirmationEmail,
              shouldHighlight,
              !validateEmail(formData.confirmationEmail)
                ? 'Formato de email inválido'
                : '',
              'Correo es obligatorio'
            )}
            sx={getHighlightFieldStyle(
              formData.confirmationEmail,
              shouldHighlight
            )}
          />
        </Box>

        {/* Columna derecha - Descripciones */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            p: 2,
            backgroundColor: 'rgba(0,0,0,0.02)',
            borderRadius: 2,
            height: 'fit-content',
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 600, color: 'primary.main', mb: 1 }}
          >
            ℹ️ Información de ayuda
          </Typography>

          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              ¿Para qué son estos datos?
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}
            >
              Usaremos esta información para transferirte el dinero de tus
              ventas o devoluciones en el Marketplace.
            </Typography>
          </Box>

          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Nombre del Titular
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}
            >
              Debe coincidir exactamente con el nombre registrado en tu cuenta
              bancaria.
            </Typography>
          </Box>

          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              RUT del Titular
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}
            >
              El RUT asociado a la cuenta bancaria. Puede ser diferente al RUT
              de facturación si la cuenta es de otra persona o empresa.
            </Typography>
          </Box>

          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Banco y Cuenta
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}
            >
              Selecciona tu banco y tipo de cuenta (corriente, vista o ahorro).
              Ingresa el número de cuenta completo sin guiones.
            </Typography>
          </Box>

          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Correo de Confirmación
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}
            >
              Recibirás notificaciones de transferencias realizadas a este
              correo electrónico.
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default TransferInfoSection;
