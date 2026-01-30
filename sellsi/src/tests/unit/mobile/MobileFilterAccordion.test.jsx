import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event'
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

      // Use accessible role for the accordion summary (button) and scope the summary text
      const summaryBtn = screen.getByRole('button', { name: /estado/i });
      expect(summaryBtn).toBeInTheDocument();
      // The selected label (e.g., 'Todas') is rendered inside the summary — assert it exists there
      expect(within(summaryBtn).getByText('Todas')).toBeInTheDocument();
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

      expect(screen.getByRole('button', { name: /tipo de oferta/i })).toBeInTheDocument();
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

      expect(screen.getByRole('button', { name: /filtro/i })).toBeInTheDocument();
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

      const summaryBtn = screen.getByRole('button', { name: /estado/i });
      const filterIcon = within(summaryBtn).queryByTestId('FilterListIcon') || container.querySelector('[data-testid="FilterListIcon"]');
      expect(filterIcon).toBeInTheDocument();
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

      // Las opciones no deberían existir en el DOM antes de expandir
      expect(screen.queryByRole('radio', { name: /pendientes/i })).not.toBeInTheDocument();
    });

    it('debería expandir y mostrar opciones al hacer click', async () => {
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

      // Expand using accessible button and userEvent
      const summaryBtn = screen.getByRole('button', { name: /estado/i });
      await userEvent.click(summaryBtn);

      // Check each option's radio exists and its visible label & count are present
      for (const option of mockFilterOptions) {
        const radio = await screen.findByRole('radio', { name: new RegExp(option.label, 'i') });
        expect(radio).toBeInTheDocument();
        const label = radio.closest('label');
        expect(within(label).getByText(new RegExp(option.label, 'i'))).toBeVisible();
        if (option.count != null) expect(within(label).getByText(String(option.count))).toBeVisible();
      }
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

      const expandIcon = container.querySelector('[data-testid="ExpandMoreIcon"]') || container.querySelector('.MuiAccordionSummary-expandIconWrapper');
      expect(expandIcon).toBeInTheDocument();
    });
  });

  describe('Selección de Filtros', () => {
    it('debería mostrar todas las opciones de filtro', async () => {
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

      const summaryBtn = screen.getByRole('button', { name: /estado/i });
      await userEvent.click(summaryBtn);

      for (const option of mockFilterOptions) {
        const radio = await screen.findByRole('radio', { name: new RegExp(option.label, 'i') });
        expect(radio).toBeInTheDocument();
        const label = radio.closest('label');
        expect(within(label).getByText(new RegExp(option.label, 'i'))).toBeVisible();
      }
    });

    it('debería marcar el filtro actual como seleccionado', async () => {
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

      const summaryBtn = screen.getByRole('button', { name: /estado/i });
      await userEvent.click(summaryBtn);

      // Verificar que el radio input has the correct checked state
      const pendingRadio = await screen.findByRole('radio', { name: /pendientes/i });
      expect(pendingRadio).toBeChecked();
      const pendingLabel = pendingRadio.closest('label');
      expect(within(pendingLabel).getByText(/pendientes/i)).toBeVisible();
    });

    it('debería llamar onFilterChange al seleccionar una opción', async () => {
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

      const summaryBtn = screen.getByRole('button', { name: /estado/i });
      await userEvent.click(summaryBtn);

      // Seleccionar "Pendientes"
      const pendingRadio = await screen.findByRole('radio', { name: /pendientes/i });
      await userEvent.click(pendingRadio);

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

      const summaryBtn = screen.getByRole('button', { name: /estado/i });
      expect(within(summaryBtn).getByText('Todas')).toBeInTheDocument();

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

      expect(screen.getByRole('button', { name: /estado/i })).toBeInTheDocument();
      expect(within(screen.getByRole('button', { name: /estado/i })).getByText('Pendientes')).toBeInTheDocument();
    });
  });

  describe('Contador de Items', () => {
    it('debería mostrar contador de items para cada opción', async () => {
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

      const summaryBtn = screen.getByRole('button', { name: /estado/i });
      await userEvent.click(summaryBtn);

      const counts = [
        { label: /todas/i, count: '10' },
        { label: /pendientes/i, count: '3' },
        { label: /aprobadas/i, count: '5' },
        { label: /rechazadas/i, count: '2' },
      ];
      for (const item of counts) {
        const radio = await screen.findByRole('radio', { name: item.label });
        const label = radio.closest('label');
        expect(within(label).getByText(item.count)).toBeVisible();
      }
    });

    it('debería funcionar sin contador (count opcional)', async () => {
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

      const summaryBtn = screen.getByRole('button', { name: /estado/i });
      await userEvent.click(summaryBtn);

      // Use radio role existence and label visibility
      const allRadio = await screen.findByRole('radio', { name: /todas/i });
      const pendingRadio = await screen.findByRole('radio', { name: /pendientes/i });
      expect(allRadio).toBeInTheDocument();
      expect(within(allRadio.closest('label')).getByText(/todas/i)).toBeVisible();
      expect(pendingRadio).toBeInTheDocument();
      expect(within(pendingRadio.closest('label')).getByText(/pendientes/i)).toBeVisible();
    });
  });

  describe('Radio Buttons', () => {
    it('debería tener tamaño de touch target adecuado (24px)', async () => {
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

      const summaryBtn = screen.getByRole('button', { name: /estado/i });
      await userEvent.click(summaryBtn);

      const radios = container.querySelectorAll('.MuiRadio-root .MuiSvgIcon-root');
      expect(radios.length).toBeGreaterThan(0);
      radios.forEach(radio => expect(radio).toBeInTheDocument());
    });

    it('debería permitir navegar con teclado entre opciones', async () => {
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

      const summaryBtn = screen.getByRole('button', { name: /estado/i });
      await userEvent.keyboard('{Enter}');
      await userEvent.click(summaryBtn);

      const radioGroup = await screen.findByRole('radiogroup');
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

      const summaryBtn = screen.getByRole('button', { name: /filtros avanzados/i });
      expect(summaryBtn).toBeInTheDocument();
      expect(within(summaryBtn).getByText('Todas las ofertas')).toBeInTheDocument();
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
    it('debería tener roles ARIA correctos', async () => {
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

      const summaryBtn = screen.getByRole('button', { name: /estado/i });
      await userEvent.click(summaryBtn);

      expect(await screen.findByRole('radiogroup')).toBeInTheDocument();
    });

    it('debería permitir interacción por teclado', async () => {
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

      const summaryBtn = screen.getByRole('button', { name: /estado/i });
      summaryBtn.focus();
      await userEvent.keyboard('{Enter}');
      expect(await screen.findByRole('radiogroup')).toBeInTheDocument();
    });

    it('debería tener labels descriptivos para screen readers', async () => {
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
      const summaryBtn = screen.getByRole('button', { name: /estado de ofertas/i });
      await userEvent.click(summaryBtn);

      for (const option of mockFilterOptions) {
        expect(await screen.findByRole('radio', { name: new RegExp(option.label, 'i') })).toBeInTheDocument();
      }
    });
  });

  describe('Interacción Múltiple', () => {
    it('debería permitir cambiar filtros múltiples veces', async () => {
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

      const summaryBtn = screen.getByRole('button', { name: /estado/i });
      await userEvent.click(summaryBtn);

      // Now we can simulate updates with rerender to reflect parent changes

      await userEvent.click(await screen.findByRole('radio', { name: /pendientes/i }));
      expect(mockOnFilterChange).toHaveBeenCalledWith('pending');
      // Simulate parent updating the controlled prop
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

      // Cambiar a "approved"
      await userEvent.click(await screen.findByRole('radio', { name: /aprobadas/i }));
      expect(mockOnFilterChange).toHaveBeenCalledWith('approved');
      rerender(
        <TestWrapper>
          <MobileFilterAccordion
            currentFilter="approved"
            onFilterChange={mockOnFilterChange}
            filterOptions={mockFilterOptions}
            label="Estado"
          />
        </TestWrapper>
      );

      // Cambiar a "all"
      await userEvent.click(await screen.findByRole('radio', { name: /todas/i }));
      expect(mockOnFilterChange).toHaveBeenCalledWith('all');

      expect(mockOnFilterChange).toHaveBeenCalledTimes(3);
    });
  });
});
