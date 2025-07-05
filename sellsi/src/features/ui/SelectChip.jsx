import React from 'react';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  OutlinedInput,
  InputLabel,
  MenuItem,
  FormControl,
  Select,
  Chip,
} from '@mui/material';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

function getStyles(name, selectedValues, theme) {
  return {
    fontWeight: selectedValues.includes(name)
      ? theme.typography.fontWeightMedium
      : theme.typography.fontWeightRegular,
  };
}

const SelectChip = ({
  label,
  options = [],
  value = [],
  onChange,
  selectAllOption = null,
  width = '100%',
  ...props
}) => {
  const theme = useTheme();

  const handleChange = (event) => {
    const {
      target: { value: newValue },
    } = event;

    let selectedValues = typeof newValue === 'string' ? newValue.split(',') : newValue;

    // Si se selecciona la opción "Todo Chile" (o la opción selectAll configurada)
    if (selectAllOption && selectedValues.includes(selectAllOption.value)) {
      // Si "Todo Chile" no estaba seleccionado antes, deseleccionar todo lo demás y solo seleccionar "Todo Chile"
      if (!value.includes(selectAllOption.value)) {
        selectedValues = [selectAllOption.value];
      }
    } else {
      // Si se selecciona cualquier otra opción, quitar "Todo Chile" si estaba seleccionado
      if (selectAllOption && value.includes(selectAllOption.value)) {
        selectedValues = selectedValues.filter(val => val !== selectAllOption.value);
      }
    }

    onChange(selectedValues);
  };

  return (
    <FormControl fullWidth sx={{ minWidth: 350, width: width }} {...props}>
      <InputLabel id={`${label}-chip-label`}>{label}</InputLabel>
      <Select
        labelId={`${label}-chip-label`}
        id={`${label}-chip`}
        multiple
        value={value}
        onChange={handleChange}
        input={<OutlinedInput id={`select-multiple-${label}`} label={label} />}
        renderValue={(selected) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {selected.map((selectedValue) => {
              const option = options.find(opt => opt.value === selectedValue);
              return (
                <Chip 
                  key={selectedValue} 
                  label={option ? option.label : selectedValue}
                  size="small"
                />
              );
            })}
          </Box>
        )}
        MenuProps={MenuProps}
      >
        {options.map((option) => (
          <MenuItem
            key={option.value}
            value={option.value}
            style={getStyles(option.value, value, theme)}
          >
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default SelectChip;
