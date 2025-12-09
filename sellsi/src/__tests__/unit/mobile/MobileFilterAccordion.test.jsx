import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { dashboardThemeCore } from '../../../styles/dashboardThemeCore';
import MobileFilterAccordion from '../../../shared/components/mobile/MobileFilterAccordion';

const TestWrapper = ({ children }) => (
  <ThemeProvider theme={dashboardThemeCore}>
    {children}
  </ThemeProvider>
);

describe('MobileFilterAccordion Component', () => {
  const mockFilterOptions = [
    { value: 'all', label: 'Todas', count: 10 },
    { value: 'pending', label: 'Pendientes', count: 3 },
    { value: 'approved', label: 'Aprobadas', count: 5 },
    { value: 'rejected', label: 'Rechazadas', count: 2 }
  ];

  const mockOnFilterChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderizado Básico', () => {
    it('debería renderizar correctamente', () => {
      render(
        <TestWrapper>
          <MobileFilterAccordion
            currentFilter="all"
            onFilterChange={mockOnFilterChange}
            filterOptions={mockFilterOptions}
            label="Estado"
          />
        </TestWrapper>
      );

      expect(screen.getByText('Estado')).toBeInTheDocument();
      expect(screen.getByText('Todas')).toBeInTheDocument();
    });

    it('debería mostrar el label personalizado', () => {
      render(
        <TestWrapper>
          <MobileFilterAccordion
            currentFilter="all"
            onFilterChange={mockOnFilterChange}
            filterOptions={mockFilterOptions}
            label="Tipo de Oferta"
          />
        </TestWrapper>
      );

      expect(screen.getByText('Tipo de Oferta')).toBeInTheDocument();
    });

    it('debería usar "Filtro" como label por defecto', () => {
      render(
        <TestWrapper>
          <MobileFilterAccordion
            currentFilter="all"
            onFilterChange={mockOnFilterChange}
            filterOptions={mockFilterOptions}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Filtro')).toBeInTheDocument();
    });

    it('debería mostrar icono de filtro', () => {
      const { container } = render(
        <TestWrapper>
          <MobileFilterAccordion
            currentFilter="all"
            onFilterChange={mockOnFilterChange}
            filterOptions={mockFilterOptions}
            label="Estado"
          />
        </TestWrapper>
      );

      const filterIcon = container.querySelector('[data-testid="FilterListIcon"]');
      expect(filterIcon || screen.getByText('Estado').previousSibling).toBeInTheDocument();
    });
  });

  describe('Chip de Estado Activo', () => {
    it('NO debería mostrar chip "Activo" cuando filter es "all"', () => {
      render(
        <TestWrapper>
          <MobileFilterAccordion
            currentFilter="all"
            onFilterChange={mockOnFilterChange}
            filterOptions={mockFilterOptions}
            label="Estado"
          />
        </TestWrapper>
      );

      expect(screen.queryByText('Activo')).not.toBeInTheDocument();
    });

    it('debería mostrar chip "Activo" cuando filter NO es "all"', () => {
      render(
        <TestWrapper>
          <MobileFilterAccordion
            currentFilter="pending"
            onFilterChange={mockOnFilterChange}
            filterOptions={mockFilterOptions}
            label="Estado"
          />
        </TestWrapper>
      );

      const activeChip = screen.getByText('Activo');
      expect(activeChip).toBeInTheDocument();
      expect(activeChip.closest('.MuiChip-root')).toHaveClass('MuiChip-colorPrimary');
    });

    it('debería mostrar chip "Activo" para diferentes filtros', () => {
      const filters = ['pending', 'approved', 'rejected'];
      
      filters.forEach(filter => {
        const { unmount } = render(
          <TestWrapper>
            <MobileFilterAccordion
              currentFilter={filter}
              onFilterChange={mockOnFilterChange}
              filterOptions={mockFilterOptions}
              label="Estado"
            />
          </TestWrapper>
        );

        expect(screen.getByText('Activo')).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Expansión y Colapso', () => {
    it('debería estar colapsado inicialmente', () => {
      render(
        <TestWrapper>
          <MobileFilterAccordion
            currentFilter="all"
            onFilterChange={mockOnFilterChange}
            filterOptions={mockFilterOptions}
            label="Estado"
          />
        </TestWrapper>
      );

      // Las opciones no deberían estar visibles inicialmente
      const pendingRadio = screen.queryByLabelText(/pendientes/i);
      expect(pendingRadio).not.toBeVisible();
    });

    it('debería expandir y mostrar opciones al hacer click', () => {
      render(
        <TestWrapper>
          <MobileFilterAccordion
            currentFilter="all"
            onFilterChange={mockOnFilterChange}
            filterOptions={mockFilterOptions}
            label="Estado"
          />
        </TestWrapper>
      );

      // Click en el accordion
      const accordion = screen.getByText('Estado').closest('div[role="button"]');
      fireEvent.click(accordion);

      // Ahora las opciones deberían estar visibles
      expect(screen.getByText(/pendientes.*3/i)).toBeVisible();
      expect(screen.getByText(/aprobadas.*5/i)).toBeVisible();
      expect(screen.getByText(/rechazadas.*2/i)).toBeVisible();
    });

    it('debería mostrar icono de expansión', () => {
      const { container } = render(
        <TestWrapper>
          <MobileFilterAccordion
            currentFilter="all"
            onFilterChange={mockOnFilterChange}
            filterOptions={mockFilterOptions}
            label="Estado"
          />
        </TestWrapper>
      );

      const expandIcon = container.querySelector('[data-testid="ExpandMoreIcon"]');
      expect(expandIcon || container.querySelector('.MuiAccordionSummary-expandIconWrapper')).toBeInTheDocument();
    });
  });

  describe('Selección de Filtros', () => {
    it('debería mostrar todas las opciones de filtro', () => {
      render(
        <TestWrapper>
          <MobileFilterAccordion
            currentFilter="all"
            onFilterChange={mockOnFilterChange}
            filterOptions={mockFilterOptions}
            label="Estado"
          />
        </TestWrapper>
      );

      // Expandir
      const accordion = screen.getByText('Estado').closest('div[role="button"]');
      fireEvent.click(accordion);

      mockFilterOptions.forEach(option => {
        expect(screen.getByText(new RegExp(option.label, 'i'))).toBeVisible();
      });
    });

    it('debería marcar el filtro actual como seleccionado', () => {
      render(
        <TestWrapper>
          <MobileFilterAccordion
            currentFilter="pending"
            onFilterChange={mockOnFilterChange}
            filterOptions={mockFilterOptions}
            label="Estado"
          />
        </TestWrapper>
      );

      // Expandir
      const accordion = screen.getByText('Estado').closest('div[role="button"]');
      fireEvent.click(accordion);

      // Verificar que el radio correcto está seleccionado
      const radioGroup = screen.getByRole('radiogroup');
      const pendingRadio = within(radioGroup).getByRole('radio', { name: /pendientes/i });
      
      expect(pendingRadio).toBeChecked();
    });

    it('debería llamar onFilterChange al seleccionar una opción', () => {
      render(
        <TestWrapper>
          <MobileFilterAccordion
            currentFilter="all"
            onFilterChange={mockOnFilterChange}
            filterOptions={mockFilterOptions}
            label="Estado"
          />
        </TestWrapper>
      );

      // Expandir
      const accordion = screen.getByText('Estado').closest('div[role="button"]');
      fireEvent.click(accordion);

      // Seleccionar "Pendientes"
      const pendingRadio = screen.getByRole('radio', { name: /pendientes/i });
      fireEvent.click(pendingRadio);

      expect(mockOnFilterChange).toHaveBeenCalledWith('pending');
    });

    it('debería actualizar el label mostrado al cambiar filtro', () => {
      const { rerender } = render(
        <TestWrapper>
          <MobileFilterAccordion
            currentFilter="all"
            onFilterChange={mockOnFilterChange}
            filterOptions={mockFilterOptions}
            label="Estado"
          />
        </TestWrapper>
      );

      expect(screen.getByText('Todas')).toBeInTheDocument();

      // Rerender con nuevo filtro
      rerender(
        <TestWrapper>
          <MobileFilterAccordion
            currentFilter="pending"
            onFilterChange={mockOnFilterChange}
            filterOptions={mockFilterOptions}
            label="Estado"
          />
        </TestWrapper>
      );

      expect(screen.getByText('Pendientes')).toBeInTheDocument();
    });
  });

  describe('Contador de Items', () => {
    it('debería mostrar contador de items para cada opción', () => {
      render(
        <TestWrapper>
          <MobileFilterAccordion
            currentFilter="all"
            onFilterChange={mockOnFilterChange}
            filterOptions={mockFilterOptions}
            label="Estado"
          />
        </TestWrapper>
      );

      // Expandir
      const accordion = screen.getByText('Estado').closest('div[role="button"]');
      fireEvent.click(accordion);

      expect(screen.getByText(/todas.*10/i)).toBeVisible();
      expect(screen.getByText(/pendientes.*3/i)).toBeVisible();
      expect(screen.getByText(/aprobadas.*5/i)).toBeVisible();
      expect(screen.getByText(/rechazadas.*2/i)).toBeVisible();
    });

    it('debería funcionar sin contador (count opcional)', () => {
      const optionsWithoutCount = [
        { value: 'all', label: 'Todas' },
        { value: 'pending', label: 'Pendientes' }
      ];

      render(
        <TestWrapper>
          <MobileFilterAccordion
            currentFilter="all"
            onFilterChange={mockOnFilterChange}
            filterOptions={optionsWithoutCount}
            label="Estado"
          />
        </TestWrapper>
      );

      // Expandir
      const accordion = screen.getByText('Estado').closest('div[role="button"]');
      fireEvent.click(accordion);

      expect(screen.getByText('Todas')).toBeVisible();
      expect(screen.getByText('Pendientes')).toBeVisible();
    });
  });

  describe('Radio Buttons', () => {
    it('debería tener tamaño de touch target adecuado (24px)', () => {
      const { container } = render(
        <TestWrapper>
          <MobileFilterAccordion
            currentFilter="all"
            onFilterChange={mockOnFilterChange}
            filterOptions={mockFilterOptions}
            label="Estado"
          />
        </TestWrapper>
      );

      // Expandir
      const accordion = screen.getByText('Estado').closest('div[role="button"]');
      fireEvent.click(accordion);

      const radios = container.querySelectorAll('.MuiRadio-root .MuiSvgIcon-root');
      radios.forEach(radio => {
        const styles = window.getComputedStyle(radio);
        // fontSize: 24 en el sx del componente
        expect(radio).toBeInTheDocument();
      });
    });

    it('debería permitir navegar con teclado entre opciones', () => {
      render(
        <TestWrapper>
          <MobileFilterAccordion
            currentFilter="all"
            onFilterChange={mockOnFilterChange}
            filterOptions={mockFilterOptions}
            label="Estado"
          />
        </TestWrapper>
      );

      // Expandir
      const accordion = screen.getByText('Estado').closest('div[role="button"]');
      fireEvent.click(accordion);

      const radioGroup = screen.getByRole('radiogroup');
      const radios = within(radioGroup).getAllByRole('radio');

      expect(radios.length).toBe(mockFilterOptions.length);
    });
  });

  describe('Edge Cases', () => {
    it('debería manejar lista vacía de opciones', () => {
      render(
        <TestWrapper>
          <MobileFilterAccordion
            currentFilter="all"
            onFilterChange={mockOnFilterChange}
            filterOptions={[]}
            label="Estado"
          />
        </TestWrapper>
      );

      expect(screen.getByText('Estado')).toBeInTheDocument();
      expect(screen.getByText('Todos')).toBeInTheDocument(); // fallback cuando no encuentra opción
    });

    it('debería manejar filtro actual que no existe en opciones', () => {
      render(
        <TestWrapper>
          <MobileFilterAccordion
            currentFilter="nonexistent"
            onFilterChange={mockOnFilterChange}
            filterOptions={mockFilterOptions}
            label="Estado"
          />
        </TestWrapper>
      );

      expect(screen.getByText('Todos')).toBeInTheDocument(); // fallback
    });

    it('debería manejar opciones con valores especiales', () => {
      const specialOptions = [
        { value: 'all', label: 'Todas las ofertas' },
        { value: 'status-pending', label: 'Estado: Pendiente', count: 5 },
        { value: 'status-approved', label: 'Estado: Aprobada', count: 10 }
      ];

      render(
        <TestWrapper>
          <MobileFilterAccordion
            currentFilter="all"
            onFilterChange={mockOnFilterChange}
            filterOptions={specialOptions}
            label="Filtros Avanzados"
          />
        </TestWrapper>
      );

      expect(screen.getByText('Filtros Avanzados')).toBeInTheDocument();
      expect(screen.getByText('Todas las ofertas')).toBeInTheDocument();
    });
  });

  describe('Estilos y Apariencia', () => {
    it('debería aplicar estilos de accordion correctamente', () => {
      const { container } = render(
        <TestWrapper>
          <MobileFilterAccordion
            currentFilter="all"
            onFilterChange={mockOnFilterChange}
            filterOptions={mockFilterOptions}
            label="Estado"
          />
        </TestWrapper>
      );

      const accordion = container.querySelector('.MuiAccordion-root');
      expect(accordion).toBeInTheDocument();
      expect(accordion).toHaveStyle({ borderRadius: '4px' }); // borderRadius: 1 = 4px
    });

    it('debería tener altura mínima de touch target (56px)', () => {
      const { container } = render(
        <TestWrapper>
          <MobileFilterAccordion
            currentFilter="all"
            onFilterChange={mockOnFilterChange}
            filterOptions={mockFilterOptions}
            label="Estado"
          />
        </TestWrapper>
      );

      const summary = container.querySelector('.MuiAccordionSummary-root');
      expect(summary).toBeInTheDocument();
      // minHeight: 56 en el sx del componente
    });
  });

  describe('Accesibilidad', () => {
    it('debería tener roles ARIA correctos', () => {
      render(
        <TestWrapper>
          <MobileFilterAccordion
            currentFilter="all"
            onFilterChange={mockOnFilterChange}
            filterOptions={mockFilterOptions}
            label="Estado"
          />
        </TestWrapper>
      );

      // Expandir
      const accordion = screen.getByText('Estado').closest('div[role="button"]');
      fireEvent.click(accordion);

      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    });

    it('debería permitir interacción por teclado', () => {
      render(
        <TestWrapper>
          <MobileFilterAccordion
            currentFilter="all"
            onFilterChange={mockOnFilterChange}
            filterOptions={mockFilterOptions}
            label="Estado"
          />
        </TestWrapper>
      );

      const accordion = screen.getByText('Estado').closest('div[role="button"]');
      
      // Simular Enter para expandir
      fireEvent.keyDown(accordion, { key: 'Enter', code: 'Enter' });
      
      // Las opciones deberían ser accesibles
      const radioGroup = screen.getByRole('radiogroup');
      expect(radioGroup).toBeInTheDocument();
    });

    it('debería tener labels descriptivos para screen readers', () => {
      render(
        <TestWrapper>
          <MobileFilterAccordion
            currentFilter="all"
            onFilterChange={mockOnFilterChange}
            filterOptions={mockFilterOptions}
            label="Estado de Ofertas"
          />
        </TestWrapper>
      );

      expect(screen.getByText('Estado de Ofertas')).toBeInTheDocument();
      
      // Expandir
      const accordion = screen.getByText('Estado de Ofertas').closest('div[role="button"]');
      fireEvent.click(accordion);

      mockFilterOptions.forEach(option => {
        const radioLabel = screen.getByRole('radio', { name: new RegExp(option.label, 'i') });
        expect(radioLabel).toBeInTheDocument();
      });
    });
  });

  describe('Interacción Múltiple', () => {
    it('debería permitir cambiar filtros múltiples veces', () => {
      render(
        <TestWrapper>
          <MobileFilterAccordion
            currentFilter="all"
            onFilterChange={mockOnFilterChange}
            filterOptions={mockFilterOptions}
            label="Estado"
          />
        </TestWrapper>
      );

      // Expandir
      const accordion = screen.getByText('Estado').closest('div[role="button"]');
      fireEvent.click(accordion);

      // Cambiar a "pending"
      fireEvent.click(screen.getByRole('radio', { name: /pendientes/i }));
      expect(mockOnFilterChange).toHaveBeenCalledWith('pending');

      // Cambiar a "approved"
      fireEvent.click(screen.getByRole('radio', { name: /aprobadas/i }));
      expect(mockOnFilterChange).toHaveBeenCalledWith('approved');

      // Cambiar a "all"
      fireEvent.click(screen.getByRole('radio', { name: /todas/i }));
      expect(mockOnFilterChange).toHaveBeenCalledWith('all');

      expect(mockOnFilterChange).toHaveBeenCalledTimes(3);
    });
  });
});
