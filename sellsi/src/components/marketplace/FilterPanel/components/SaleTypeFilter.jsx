import React from 'react'
import {
  Box,
  Typography,
  FormControlLabel,
  Checkbox,
  Tooltip,
} from '@mui/material'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import {
  SALE_TYPES,
  SALE_TYPE_MESSAGES,
} from '../../../../utils/marketplace/constants'

const SaleTypeFilter = ({ filtros, onTipoVentaChange, styles }) => {
  const saleTypeOptions = [
    {
      value: SALE_TYPES.DIRECTA,
      label: 'Venta Directa',
      description: SALE_TYPE_MESSAGES[SALE_TYPES.DIRECTA],
    },
    {
      value: SALE_TYPES.INDIRECTA,
      label: 'Venta Indirecta',
      description: SALE_TYPE_MESSAGES[SALE_TYPES.INDIRECTA],
    },
  ]

  return (
    <Box sx={styles.filterGroup}>
      <Typography sx={styles.sectionTitle}>🏪 Tipo de Venta</Typography>

      {saleTypeOptions.map((option) => (
        <Box
          key={option.value}
          sx={{ display: 'flex', alignItems: 'center', mb: 1 }}
        >
          <FormControlLabel
            control={
              <Checkbox
                checked={filtros.tiposVenta.includes(option.value)}
                onChange={(e) =>
                  onTipoVentaChange(option.value, e.target.checked)
                }
                size="small"
              />
            }
            label={option.label}
            sx={{ flex: 1 }}
          />
          <Tooltip title={option.description} arrow>
            <InfoOutlinedIcon
              fontSize="small"
              color="action"
              sx={{ cursor: 'help' }}
            />
          </Tooltip>
        </Box>
      ))}
    </Box>
  )
}

export default SaleTypeFilter
