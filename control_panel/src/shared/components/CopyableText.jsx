import React, { useState, useCallback } from 'react';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

/**
 * CopyableText - small copy-to-clipboard utility component used across control panel
 * Props:
 *  - text: string (required)
 *  - label: optional label shown before text
 *  - variant: typography variant
 *  - showLabel: boolean
 *  - showIcon: boolean
 *  - iconSize: 'small'|'medium'|... (passed to icon fontSize)
 *  - onCopySuccess: callback
 */
const CopyableText = ({
  text,
  label,
  variant = 'body2',
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
      if (!text) return;
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onCopySuccess?.(text);
      setTimeout(() => setCopied(false), 1200);
    } catch (err) {
      console.error('Error copying:', err);
    }
  }, [text, onCopySuccess]);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ...sx }}>
      {showLabel && label && (
        <Typography variant="body2" color="text.secondary">
          {label}:
        </Typography>
      )}

      <Typography variant={variant} sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', ...textSx }}>
        {text}
      </Typography>

      {showIcon && (
        <Tooltip title={copied ? '¡Copiado!' : 'Copiar'} arrow placement={tooltipPlacement}>
          <IconButton
            size="small"
            onClick={handleCopy}
            sx={{ color: copied ? 'success.main' : 'text.secondary', p: 0.5, ml: 0.5, ...iconSx }}
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
