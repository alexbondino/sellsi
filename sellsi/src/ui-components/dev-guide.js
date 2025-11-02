/**
 * ============================================================================
 * UI COMPONENTS - GUÍA DE DESARROLLO
 * ============================================================================
 */

module.exports = {
  // Plantilla para crear un nuevo componente
  componentTemplate: {
    structure: [
      'ComponentName/',
      '├── ComponentName.jsx',
      '├── index.js',
      '├── ComponentName.stories.js (futuro)',
      '└── ComponentName.test.js (futuro)',
    ],

    // Plantilla base para un componente
    componentFile: `
import React from 'react';
import { Box } from '@mui/material';

/**
 * ComponentName - Descripción del componente
 * 
 * @param {Object} props - Props del componente
 * @param {React.ReactNode} props.children - Contenido del componente
 * @param {string} [props.variant='primary'] - Variante del componente
 * @param {string} [props.size='medium'] - Tamaño del componente
 * @param {boolean} [props.disabled=false] - Si está deshabilitado
 * @param {Object} [props.sx={}] - Estilos personalizados
 */
const ComponentName = ({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  sx = {},
  ...props
}) => {
  return (
    <Box
      sx={{
        // Estilos base aquí
        ...sx
      }}
      {...props}
    >
      {children}
    </Box>
  );
};

export default ComponentName;
    `,

    // Plantilla para index.js
    indexFile: `
export { default } from './ComponentName';
    `,

    // Plantilla para stories (Storybook)
    storiesFile: `
import ComponentName from './ComponentName';

export default {
  title: 'UI Components/CategoryName/ComponentName',
  component: ComponentName,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary']
    },
    size: {
      control: { type: 'select' },
      options: ['small', 'medium', 'large']
    }
  }
};

export const Default = {
  args: {
    children: 'Component content'
  }
};

export const AllVariants = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem' }}>
      <ComponentName variant="primary">Primary</ComponentName>
      <ComponentName variant="secondary">Secondary</ComponentName>
    </div>
  )
};
    `,
  },

  // Reglas para componentes UI
  rules: {
    naming: {
      components: 'PascalCase',
      files: 'PascalCase.jsx',
      directories: 'PascalCase/',
    },

    structure: {
      required: ['ComponentName.jsx', 'index.js'],
      optional: [
        'ComponentName.stories.js',
        'ComponentName.test.js',
        'ComponentName.md',
      ],
    },

    props: {
      // Props que todo componente UI debería aceptar
      common: ['className', 'style', 'sx', 'data-testid'],
      // Props que deben evitarse (lógica de negocio)
      forbidden: ['userId', 'productId', 'orderId', 'companyId'],
    },
  },

  // Categorías de componentes
  categories: {
    buttons: 'Componentes de acción y botones',
    forms: 'Componentes de formularios e inputs',
    feedback: 'Componentes de retroalimentación (modals, alerts, etc)',
    navigation: 'Componentes de navegación',
    display: 'Componentes de visualización de datos',
    layout: 'Componentes de estructura y layout',
  },
};
