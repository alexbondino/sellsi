/**
 * CopyableText - Componente reutilizable para texto con funcionalidad de copiar
 *
 * @example
 * // Uso básico
 * <CopyableText text="SKU-12345" />
 *
 * // Con label
 * <CopyableText text="SKU-12345" label="SKU" />
 *
 * // Con callback
 * <CopyableText text="valor" onCopySuccess={(text) => console.log('Copiado:', text)} />
 */
import React, { useState, useCallback } from 'react';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

const CopyableText = ({
  text,
  label,
  variant = 'body1',
  showLabel = true,
  showIcon = true,
  iconSize = 'small',
  onCopySuccess,
  tooltipPlacement = 'right',
  sx = {},
  textSx = {},
  iconSx = {},
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onCopySuccess?.(text);

      // Reset después de 1.2 segundos
      setTimeout(() => setCopied(false), 1200);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  }, [text, onCopySuccess]);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        ...sx,
      }}
    >
      {showLabel && label && (
        <Typography variant="body2" color="text.secondary">
          {label}:
        </Typography>
      )}
      <Typography variant={variant} sx={textSx}>
        {text}
      </Typography>
      {showIcon && (
        <Tooltip
          title={copied ? '¡Copiado!' : 'Copiar'}
          arrow
          placement={tooltipPlacement}
        >
          <IconButton
            size="small"
            onClick={handleCopy}
            sx={{
              color: copied ? 'success.main' : 'text.secondary',
              p: 0.5,
              ml: 0.5,
              boxShadow: 'none',
              outline: 'none',
              bgcolor: 'transparent',
              '&:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.04)',
                boxShadow: 'none',
                outline: 'none',
              },
              '&:active, &:focus, &:focus-visible': {
                boxShadow: 'none !important',
                outline: 'none !important',
                background: 'rgba(25, 118, 210, 0.04) !important',
              },
              ...iconSx,
            }}
          >
            {copied ? (
              <CheckCircleOutlineIcon fontSize={iconSize} color="success" />
            ) : (
              <ContentCopyIcon fontSize={iconSize} />
            )}
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};

export default CopyableText;
