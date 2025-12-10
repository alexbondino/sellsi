import React from 'react'
import PropTypes from 'prop-types'
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Chip,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import FilterListIcon from '@mui/icons-material/FilterList'

/**
 * MobileFilterAccordion - Componente de filtro para mobile
 * Reemplaza el Select tradicional por un Accordion más touch-friendly
 *
 * @param {string} currentFilter - Filtro actual seleccionado
 * @param {function} onFilterChange - Callback al cambiar filtro
 * @param {array} filterOptions - Array de opciones [{value: 'all', label: 'Todas', count: 5}]
 * @param {string} label - Etiqueta del filtro (ej: "Estado")
 */
const MobileFilterAccordion = ({
  currentFilter,
  onFilterChange,
  filterOptions,
  label = 'Filtro',
}) => {
  // Encontrar la opción actual para mostrar en el summary
  const currentOption = filterOptions.find((opt) => opt.value === currentFilter)
  const currentLabel = currentOption?.label || 'Todos'

  return (
    <Accordion
      defaultExpanded={false}
      sx={{
        mb: 2,
        boxShadow: 1,
        '&:before': {
          display: 'none', // Remover línea divisoria por defecto
        },
        borderRadius: 1,
        overflow: 'hidden',
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          minHeight: 56, // Touch target mínimo
          '& .MuiAccordionSummary-content': {
            alignItems: 'center',
            gap: 1.5,
          },
        }}
      >
        <FilterListIcon color="action" />
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: '0.75rem' }}
          >
            {label}
          </Typography>
          <Typography variant="body1" fontWeight={600}>
            {currentLabel}
          </Typography>
        </Box>
        {currentFilter !== 'all' && (
          <Chip
            label="Activo"
            color="primary"
            size="small"
            sx={{ height: 20, fontSize: '0.7rem' }}
          />
        )}
      </AccordionSummary>

      <AccordionDetails sx={{ pt: 0, pb: 2 }}>
        <RadioGroup
          value={currentFilter}
          onChange={(e) => onFilterChange(e.target.value)}
        >
          {filterOptions.map((option) => (
            <FormControlLabel
              key={option.value}
              value={option.value}
              control={
                <Radio
                  sx={{
                    '& .MuiSvgIcon-root': {
                      fontSize: 24, // Touch target adecuado
                    },
                  }}
                />
              }
              label={
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    width: '100%',
                    pr: 1,
                  }}
                >
                  <Typography variant="body1">{option.label}</Typography>
                  {option.count !== undefined && (
                    <Chip
                      label={option.count}
                      size="small"
                      variant="outlined"
                      sx={{
                        height: 20,
                        minWidth: 28,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                      }}
                    />
                  )}
                </Box>
              }
              sx={{
                minHeight: 48, // Touch target WCAG
                mx: 0,
                width: '100%',
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
                borderRadius: 1,
              }}
            />
          ))}
        </RadioGroup>
      </AccordionDetails>
    </Accordion>
  )
}

MobileFilterAccordion.propTypes = {
  currentFilter: PropTypes.string.isRequired,
  onFilterChange: PropTypes.func.isRequired,
  filterOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      count: PropTypes.number, // Opcional: mostrar cantidad de items
    })
  ).isRequired,
  label: PropTypes.string,
}

export default MobileFilterAccordion
