import React from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  InputAdornment,
} from '@mui/material';
import {
  CountrySelector,
  TaxDocumentSelector,
} from '../../../../shared/components';
import { validatePhone } from '../../../../utils/validators';

/**
 * Sección de Información General del perfil
 * Layout: 2 columnas - campos a la izquierda, descripciones a la derecha
 */
const CompanyInfoSection = ({
  formData,
  onFieldChange,
  onPasswordModalOpen,
}) => {
  return (
    <Box sx={{ p: 3, height: 'fit-content' }}>
      {/* Header de la sección */}
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Información General
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          Configura los datos básicos de tu cuenta
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
          {/* Función primaria */}
          <Box>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
              Función Primaria
            </Typography>
            <ToggleButtonGroup
              value={formData.role || 'supplier'}
              exclusive
              onChange={(e, value) => value && onFieldChange('role', value)}
              sx={{
                '& .MuiToggleButton-root': {
                  textTransform: 'none',
                  minWidth: 103,
                  borderColor: 'rgba(0,0,0,0.23)',
                  transition: 'all 120ms ease',
                },
                '& .MuiToggleButton-root:hover': {
                  borderColor: '#000',
                },
                '& .MuiToggleButton-root.Mui-selected': {
                  borderColor: '#000',
                  backgroundColor: 'rgba(0,0,0,0.04)',
                  fontWeight: 700,
                  boxShadow: 'inset 0 0 0 1px #000, 0 1px 2px rgba(0,0,0,0.08)',
                },
              }}
            >
              <ToggleButton value="buyer">Comprador</ToggleButton>
              <ToggleButton value="supplier">Proveedor</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Correo Electrónico */}
          <TextField
            label="Correo Electrónico"
            value={formData.email || ''}
            placeholder="No especificado"
            fullWidth
            variant="outlined"
            size="small"
            disabled
            InputProps={{ readOnly: true }}
            sx={{
              '& .MuiOutlinedInput-root.Mui-disabled': {
                backgroundColor: 'rgba(0,0,0,0.04)',
              },
            }}
          />

          {/* Contraseña */}
          <Box>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
              Contraseña
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={onPasswordModalOpen}
            >
              Cambiar contraseña
            </Button>
          </Box>

          {/* País + Teléfono */}
          <Box sx={{ display: 'flex', gap: 1.5 }} autoComplete="off">
            <Box sx={{ minWidth: 140 }}>
              <CountrySelector
                value={formData.country || ''}
                onChange={e => onFieldChange('country', e.target.value)}
                label="País"
                size="small"
                fullWidth
              />
            </Box>
            <TextField
              label="Teléfono"
              value={formData.phone || ''}
              onChange={e => {
                const digitsOnly = (e.target.value || '').replace(/\D+/g, '');
                onFieldChange('phone', digitsOnly);
              }}
              fullWidth
              variant="outlined"
              size="small"
              name="phone_no_autocomplete"
              placeholder={
                formData.country === 'CL' || !formData.country
                  ? '912345678'
                  : 'Teléfono'
              }
              inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
              error={
                !validatePhone(formData.country || 'CL', formData.phone || '')
                  .isValid
              }
              helperText={
                validatePhone(formData.country || 'CL', formData.phone || '')
                  .reason || ''
              }
            />
          </Box>

          {/* Tipo de Documento */}
          <Box>
            <TaxDocumentSelector
              documentTypes={formData.documentTypes || []}
              onDocumentTypesChange={value =>
                onFieldChange('documentTypes', value)
              }
              showTitle={false}
              size="small"
            />
          </Box>

          {/* Compra Mínima - Solo suppliers */}
          {formData.role === 'supplier' && (
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                Compra Mínima
              </Typography>
              {(() => {
                const raw = formData.minimumPurchaseAmount ?? '';
                const digits = String(raw).replace(/\D+/g, '');
                const display =
                  digits === '' ? '' : Number(digits).toLocaleString('es-CL');
                return (
                  <TextField
                    label="Monto mínimo (CLP)"
                    value={display}
                    onChange={e => {
                      const onlyDigits = (e.target.value || '').replace(
                        /\D+/g,
                        ''
                      );
                      const normalized = onlyDigits.replace(/^0+(?=\d)/, '');
                      onFieldChange(
                        'minimumPurchaseAmount',
                        normalized === '' ? '' : normalized
                      );
                    }}
                    fullWidth
                    variant="outlined"
                    size="small"
                    type="text"
                    placeholder="0"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">$</InputAdornment>
                      ),
                      inputMode: 'numeric',
                    }}
                  />
                );
              })()}
            </Box>
          )}

          {/* Descripción proveedor - Solo suppliers */}
          {formData.role === 'supplier' && (
            <TextField
              label="Descripción breve"
              variant="outlined"
              fullWidth
              multiline
              rows={3}
              value={formData.descripcionProveedor || ''}
              onChange={e => {
                const value = e.target.value;
                if (value.length <= 200) {
                  onFieldChange('descripcionProveedor', value);
                }
              }}
              placeholder="Describe brevemente tu negocio..."
              helperText={`${
                (formData.descripcionProveedor || '').length
              }/200 caracteres`}
            />
          )}
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
              Función Primaria
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}
            >
              Esta será tu vista predeterminada al iniciar sesión. Puedes
              cambiar entre roles desde el menú superior en cualquier momento.
            </Typography>
          </Box>

          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Correo y Contraseña
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}
            >
              Tu correo es tu identificador único en la plataforma. Mantén tu
              contraseña segura y cámbiala periódicamente.
            </Typography>
          </Box>

          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Teléfono de Contacto
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}
            >
              Se usará para notificaciones importantes y comunicación con
              compradores/proveedores.
            </Typography>
          </Box>

          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Documentos Tributarios
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}
            >
              Selecciona los tipos de documentos que ofrecerás al vender en el
              Marketplace (boleta, factura, etc.).
            </Typography>
          </Box>

          {formData.role === 'supplier' && (
            <>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Compra Mínima
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}
                >
                  Monto mínimo que deben alcanzar los compradores para finalizar
                  un pedido contigo.
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Descripción del Proveedor
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}
                >
                  Ayuda a los compradores a identificar rápidamente tu oferta y
                  tipo de productos.
                </Typography>
              </Box>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default CompanyInfoSection;
