// 📁 shared/components/formatters/TextFormatter.jsx
// Migrado de features/terms_policies/TextFormatter.jsx

import React from 'react';
import { Typography, Box } from '@mui/material';

const TextFormatter = ({ text, sx = {} }) => {
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
              ...sx.title,
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
                ...sx.term,
              }}
            >
              {term}:
            </Typography>
            <Typography
              sx={{
                color: '#424242',
                fontSize: { xs: '0.95rem', md: '1rem' },
                lineHeight: 1.6,
                ...sx.definition,
              }}
            >
              {definition}
            </Typography>
          </Box>
        );
      }
      
      // Números de sección (ej: 1.1.1., 2.2.3.)
      if (/^\d+\.\d+\.\d+\./.test(trimmedLine)) {
        return (
          <Typography
            key={index}
            sx={{
              color: '#1976D2',
              fontWeight: 600,
              mb: 0.8,
              fontSize: { xs: '0.95rem', md: '1rem' },
              ...sx.subsection,
            }}
          >
            {trimmedLine}
          </Typography>
        );
      }
      
      // Subtítulos numerados (ej: **1.1. Registro**)
      if (/^\*\*\d+\.\d+\./.test(trimmedLine) && trimmedLine.endsWith('**')) {
        const subtitle = trimmedLine.slice(2, -2);
        return (
          <Typography
            key={index}
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              color: '#1976D2',
              mb: 1.2,
              mt: 1.5,
              fontSize: { xs: '1rem', md: '1.1rem' },
              ...sx.subtitle,
            }}
          >
            {subtitle}
          </Typography>
        );
      }
      
      // Listas con viñetas (- texto)
      if (trimmedLine.startsWith('- ')) {
        const listItem = trimmedLine.slice(2);
        return (
          <Typography
            key={index}
            sx={{
              color: '#424242',
              mb: 0.5,
              ml: 2,
              fontSize: { xs: '0.95rem', md: '1rem' },
              lineHeight: 1.6,
              position: 'relative',
              '&::before': {
                content: '"•"',
                position: 'absolute',
                left: '-16px',
                color: '#1976D2',
                fontWeight: 'bold',
              },
              ...sx.listItem,
            }}
          >
            {listItem}
          </Typography>
        );
      }
      
      // Texto normal
      return (
        <Typography
          key={index}
          sx={{
            color: '#424242',
            mb: 1.2,
            fontSize: { xs: '0.95rem', md: '1rem' },
            lineHeight: 1.6,
            textAlign: 'justify',
            ...sx.paragraph,
          }}
        >
          {trimmedLine}
        </Typography>
      );
    });
  };

  if (!text) {
    return null;
  }

  return (
    <Box sx={{ 
      maxWidth: '100%',
      '& > *:last-child': { mb: 0 },
      ...sx.container 
    }}>
      {renderFormattedText(text)}
    </Box>
  );
};

export default TextFormatter;
