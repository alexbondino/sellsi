/**
 * ============================================================================
 * UI COMPONENTS - TIPOS TYPESCRIPT COMUNES
 * ============================================================================
 *
 * Nota: Este archivo está preparado para cuando se implemente TypeScript
 */

// Para usar cuando se implemente TypeScript:

/*
// Tamaños de componentes
export type ComponentSize = 'small' | 'medium' | 'large' | 'xl';

// Variantes de componentes
export type ComponentVariant = 'primary' | 'secondary' | 'tertiary' | 'text' | 'outlined' | 'contained';

// Estados de componentes
export type ComponentState = 'default' | 'hover' | 'active' | 'disabled' | 'loading' | 'error' | 'success';

// Orientaciones
export type Orientation = 'horizontal' | 'vertical';

// Posiciones
export type Position = 'top' | 'bottom' | 'left' | 'right' | 'center';

// Colores del sistema
export type UIColor = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';

// Props base para todos los componentes UI
export interface BaseUIProps {
  className?: string;
  style?: React.CSSProperties;
  sx?: object; // Para MUI sx prop
  'data-testid'?: string;
}

// Props para componentes con tamaño
export interface SizableProps extends BaseUIProps {
  size?: ComponentSize;
}

// Props para componentes con variantes
export interface VariantProps extends BaseUIProps {
  variant?: ComponentVariant;
}

// Props para componentes con estado disabled
export interface DisableableProps extends BaseUIProps {
  disabled?: boolean;
}

// Props para componentes con loading
export interface LoadableProps extends BaseUIProps {
  loading?: boolean;
}

// Props para componentes clickeables
export interface ClickableProps extends BaseUIProps {
  onClick?: (event: React.MouseEvent) => void;
}

// Props combinadas más comunes
export interface ButtonLikeProps extends SizableProps, VariantProps, DisableableProps, LoadableProps, ClickableProps {
  children?: React.ReactNode;
}

// Props para componentes de formulario
export interface FormComponentProps<T = any> extends BaseUIProps {
  value?: T;
  onChange?: (value: T) => void;
  name?: string;
  id?: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
}
*/

// Por ahora exportamos un objeto vacío para mantener compatibilidad
export default {};
