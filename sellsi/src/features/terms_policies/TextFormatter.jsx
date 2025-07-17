// 📁 features/terms_policies/TextFormatter.jsx
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
                ...sx.termLabel,
              }}
            >
              {term}:
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: '0.95rem', md: '1rem' },
                lineHeight: 1.6,
                color: '#333',
                flex: 1,
                ...sx.termDefinition,
              }}
            >
              {definition}
            </Typography>
          </Box>
        );
      }
      
      // Numeración jerárquica (1.1.1, 1.2.1, etc.)
      if (/^\d+\.\d+\.\d+\./.test(trimmedLine)) {
        const [number, ...textParts] = trimmedLine.split(' ');
        const text = textParts.join(' ');
        return (
          <Box key={index} sx={{ display: 'flex', mb: 1, alignItems: 'flex-start', ml: 4 }}>
            <Typography
              sx={{
                color: '#000',
                fontWeight: 700,
                mr: 1,
                mt: 0.2,
                fontSize: '0.9rem',
                minWidth: '40px',
                ...sx.numberThird,
              }}
            >
              {number}
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: '0.95rem', md: '1rem' },
                lineHeight: 1.6,
                color: '#333',
                flex: 1,
                ...sx.textThird,
              }}
            >
              {text}
            </Typography>
          </Box>
        );
      }
      
      // Numeración de segundo nivel (10.1, 10.2, etc.)
      if (/^\d+\.\d+\./.test(trimmedLine)) {
        const [number, ...textParts] = trimmedLine.split(' ');
        const text = textParts.join(' ');
        return (
          <Box key={index} sx={{ display: 'flex', mb: 1, alignItems: 'flex-start', ml: 2 }}>
            <Typography
              sx={{
                color: '#000',
                fontWeight: 700,
                mr: 1,
                mt: 0.2,
                fontSize: '0.95rem',
                minWidth: '35px',
                ...sx.numberSecond,
              }}
            >
              {number}
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: '0.95rem', md: '1rem' },
                lineHeight: 1.6,
                color: '#333',
                flex: 1,
                ...sx.textSecond,
              }}
            >
              {text}
            </Typography>
          </Box>
        );
      }
      
      // Texto normal
      return (
        <Typography
          key={index}
          sx={{
            fontSize: { xs: '0.95rem', md: '1rem' },
            lineHeight: 1.6,
            color: '#444',
            mb: 1,
            ...sx.normalText,
          }}
        >
          {trimmedLine}
        </Typography>
      );
    });
  };

  return (
    <Box
      sx={{
        '& > *:first-of-type': {
          mt: 0,
        },
        ...sx.container,
      }}
    >
      {renderFormattedText(text)}
    </Box>
  );
};

export default TextFormatter;
