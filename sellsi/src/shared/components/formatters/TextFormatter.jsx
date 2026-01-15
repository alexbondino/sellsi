// 📁 shared/components/formatters/TextFormatter.jsx
// Migrado de features/terms_policies/TextFormatter.jsx

import React from 'react';

const TextFormatter = ({ text }) => {
  const renderFormattedText = (text) => {
    const lines = text.trim().split('\n');
    
    return lines.map((line, index) => {
      const trimmedLine = line.trim();
      
      if (!trimmedLine) {
        return <div key={index} className="h-2" />;
      }
      
      // Títulos principales con ** (ej: **Título Principal**)
      if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
        const title = trimmedLine.slice(2, -2);
        return (
          <h2 key={index} className="text-2xl font-bold text-gray-900 mt-8 mb-4 first:mt-0">
            {title}
          </h2>
        );
      }
      
      // Subtítulos numerados con ** (ej: **1.1. Título**)
      if (trimmedLine.startsWith('**') && /^\*\*\d+\.\d+\./.test(trimmedLine)) {
        const subtitle = trimmedLine.slice(2, -2);
        return (
          <h3 key={index} className="text-xl font-bold text-gray-900 mt-6 mb-3">
            {subtitle}
          </h3>
        );
      }
      
      // Sub-secciones con numeración triple y dos puntos (ej: 1.1.1. Término: descripción)
      // Solo el número y término van en negrita, la descripción en texto normal
      if (/^\d+\.\d+\.\d+\./.test(trimmedLine) && trimmedLine.includes(':')) {
        const colonIndex = trimmedLine.indexOf(':');
        const term = trimmedLine.substring(0, colonIndex); // "1.1.1. Término"
        const description = trimmedLine.substring(colonIndex + 1).trim(); // "descripción"
        return (
          <p key={index} className="text-gray-900 mb-3 mt-3 leading-relaxed">
            <span className="font-semibold">{term}:</span> {description}
          </p>
        );
      }
      
      // Sub-secciones con numeración doble y dos puntos (ej: 2.1. Término: descripción)
      // Solo el número y término van en negrita, la descripción en texto normal
      if (/^\d+\.\d+\./.test(trimmedLine) && trimmedLine.includes(':') && !trimmedLine.startsWith('**')) {
        const colonIndex = trimmedLine.indexOf(':');
        const term = trimmedLine.substring(0, colonIndex);
        const description = trimmedLine.substring(colonIndex + 1).trim();
        return (
          <p key={index} className="text-gray-900 mb-3 mt-4 leading-relaxed">
            <span className="font-semibold">{term}:</span> {description}
          </p>
        );
      }
      
      // Secciones principales sin ** (ej: 1. Título sin más texto)
      // Estas SÍ deben estar en negrita porque son encabezados de sección
      if (/^\d+\.\s+[A-Z]/.test(trimmedLine) && trimmedLine.split(' ').length <= 6 && !trimmedLine.includes(':')) {
        return (
          <h2 key={index} className="text-2xl font-bold text-gray-900 mt-8 mb-4 first:mt-0">
            {trimmedLine}
          </h2>
        );
      }
      
      // Listas con viñetas (- texto)
      if (trimmedLine.startsWith('- ')) {
        const listItem = trimmedLine.slice(2);
        return (
          <p key={index} className="text-gray-900 mb-2 ml-6 relative before:content-['•'] before:absolute before:-left-4 before:font-bold leading-relaxed">
            {listItem}
          </p>
        );
      }
      
      // Texto normal
      return (
        <p key={index} className="text-gray-900 mb-4 leading-relaxed">
          {trimmedLine}
        </p>
      );
    });
  };

  if (!text) {
    return null;
  }

  return (
    <div className="w-full">
      {renderFormattedText(text)}
    </div>
  );
};

export default TextFormatter;

