import React from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

/**
 * Componente para la gestión de especificaciones técnicas del producto
 * Maneja la adición, edición y eliminación de especificaciones
 */
const ProductSpecs = ({
  formData,
  errors,
  onSpecificationChange,
  onAddSpecification,
  onRemoveSpecification,
}) => {
  return (
    <Box className="full-width">
      <Typography
        variant="h6"
        gutterBottom
        sx={{ fontWeight: 600, color: 'black', mb: 2 }}
      >
        Especificaciones Técnicas
      </Typography>
      <Grid container spacing={2}>
        {formData.specifications.map((spec, index) => (
          <React.Fragment key={index}>
            <Grid size={5}>
              <TextField
                fullWidth
                label="Clave"
                placeholder="Ej: Color"
                value={spec.key}
                onChange={e =>
                  onSpecificationChange(
                    index,
                    'key',
                    e.target.value
                  )
                }
                size="small"
              />
            </Grid>
            <Grid size={5}>
              <TextField
                fullWidth
                label="Valor"
                placeholder="Ej: Rojo"
                value={spec.value}
                onChange={e =>
                  onSpecificationChange(
                    index,
                    'value',
                    e.target.value
                  )
                }
                size="small"
              />
            </Grid>
            <Grid size={2}>
              {formData.specifications.length > 1 && (
                <IconButton
                  color="error"
                  onClick={() => onRemoveSpecification(index)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
            </Grid>
          </React.Fragment>
        ))}
        <Grid size={12}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={onAddSpecification}
            sx={{ mt: 1, textTransform: 'none' }}
          >
            Agregar Especificación
          </Button>
        </Grid>
        {errors.specifications && (
          <Grid size={12}>
            <Typography variant="caption" color="error">
              {errors.specifications}
            </Typography>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default ProductSpecs;
