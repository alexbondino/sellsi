import React from 'react';
import { Box, TextField } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const VerificationCodeInput = ({ 
  codigo, 
  setCodigo, 
  length = 5, 
  size = 'medium' 
}) => {
  const theme = useTheme();
  const isLarge = size === 'large';
  
  const handleCodeChange = (idx, value) => {
    if (!/^[0-9]?$/.test(value)) return;
    
    const nuevoCodigo = [...codigo];
    nuevoCodigo[idx] = value;
    setCodigo(nuevoCodigo);
    
    if (value && idx < length - 1) {
      const next = document.getElementById(`codigo-input-${idx + 1}`);
      if (next) next.focus();
    }
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace') {
      if (codigo[idx] === '') {
        if (idx > 0) {
          const nuevoCodigo = [...codigo];
          nuevoCodigo[idx - 1] = '';
          setCodigo(nuevoCodigo);
          const prev = document.getElementById(`codigo-input-${idx - 1}`);
          if (prev) prev.focus();
          e.preventDefault();
        }
      }
    } else if (e.key === 'Delete') {
      if (codigo[idx] !== '') {
        const nuevoCodigo = [...codigo];
        nuevoCodigo[idx] = '';
        setCodigo(nuevoCodigo);
        e.preventDefault();
      } else if (idx < length - 1) {
        const nuevoCodigo = [...codigo];
        nuevoCodigo[idx + 1] = '';
        setCodigo(nuevoCodigo);
        const next = document.getElementById(`codigo-input-${idx + 1}`);
        if (next) next.focus();
        e.preventDefault();
      }
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      const prev = document.getElementById(`codigo-input-${idx - 1}`);
      if (prev) prev.focus();
      e.preventDefault();
    } else if (e.key === 'ArrowRight' && idx < length - 1) {
      const next = document.getElementById(`codigo-input-${idx + 1}`);
      if (next) next.focus();
      e.preventDefault();
    }
  };

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData('Text').replace(/[^0-9]/g, '');
    if (paste.length > 0) {
      const nuevoCodigo = [...codigo];
      for (let i = 0; i < length; i++) {
        nuevoCodigo[i] = paste[i] || '';
      }
      setCodigo(nuevoCodigo);
      const lastIdx = Math.min(paste.length - 1, length - 1);
      setTimeout(() => {
        const last = document.getElementById(`codigo-input-${lastIdx}`);
        if (last) last.focus();
      }, 0);
      e.preventDefault();
    }
  };

  return (
    <Box display="flex" justifyContent="center" gap={isLarge ? 1 : 0.5}>
      {codigo.map((valor, idx) => (
        <TextField
          key={idx}
          id={`codigo-input-${idx}`}
          value={valor}
          onChange={(e) => handleCodeChange(idx, e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, idx)}
          onPaste={handlePaste}
          inputProps={{
            maxLength: 1,
            inputMode: 'numeric',
            pattern: '[0-9]*',
            style: {
              textAlign: 'center',
              fontSize: isLarge ? 32 : 24,
              padding: 0,
              color: theme.palette.text.primary,
              background: 'transparent',
            },
          }}
          sx={{
            width: isLarge ? 56 : 44,
            height: isLarge ? 56 : 44,
            '& .MuiOutlinedInput-root': {
              borderRadius: isLarge ? '28px' : '22px',
              bgcolor: theme.palette.background.default,
              borderColor: theme.palette.mode === 'dark' ? '#aaa' : '#888',
              height: isLarge ? 56 : 44,
              padding: 0,
            },
            '& input': {
              textAlign: 'center',
              fontSize: isLarge ? 32 : 24,
              height: isLarge ? 56 : 44,
              lineHeight: isLarge ? '56px' : '44px',
              padding: 0,
              margin: 0,
              boxSizing: 'border-box',
              verticalAlign: 'middle',
              background: 'transparent',
            },
          }}
          variant="outlined"
        />
      ))}
    </Box>
  );
};

export default VerificationCodeInput;