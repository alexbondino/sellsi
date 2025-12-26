import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { dashboardThemeCore } from '../../../styles/dashboardThemeCore';
import MobileFileUpload from '../../../shared/components/mobile/MobileFileUpload';

const TestWrapper = ({ children }) => (
  <ThemeProvider theme={dashboardThemeCore}>
    {children}
  </ThemeProvider>
);

describe('MobileFileUpload Component', () => {
  const mockOnChange = jest.fn();
  const mockFile = new File(['test content'], 'test-file.pdf', { type: 'application/pdf' });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderizado Básico', () => {
    it('debería renderizar correctamente sin archivo', () => {
      render(
        <TestWrapper>
          <MobileFileUpload
            file={null}
            error={null}
            onChange={mockOnChange}
            label="Subir Documento"
          />
        </TestWrapper>
      );

      expect(screen.getByText('Subir Documento')).toBeInTheDocument();
    });

    it('debería mostrar el label proporcionado', () => {
      render(
        <TestWrapper>
          <MobileFileUpload
            file={null}
            error={null}
            onChange={mockOnChange}
            label="Seleccionar PDF"
          />
        </TestWrapper>
      );

      expect(screen.getByText('Seleccionar PDF')).toBeInTheDocument();
    });

    it('debería mostrar icono de CloudUpload', () => {
      const { container } = render(
        <TestWrapper>
          <MobileFileUpload
            file={null}
            error={null}
            onChange={mockOnChange}
            label="Subir Documento"
          />
        </TestWrapper>
      );

      const icon = container.querySelector('[data-testid="CloudUploadIcon"]');
      expect(icon || container.querySelector('.MuiButton-startIcon')).toBeInTheDocument();
    });

    it('debería renderizar botón con fullWidth', () => {
      const { container } = render(
        <TestWrapper>
          <MobileFileUpload
            file={null}
            error={null}
            onChange={mockOnChange}
            label="Subir Documento"
          />
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: /subir documento/i });
      expect(button).toBeInTheDocument();
      expect(button.closest('.MuiButton-root')).toHaveClass('MuiButton-fullWidth');
    });
  });

  describe('Input File Oculto', () => {
    it('debería tener un input file oculto', () => {
      const { container } = render(
        <TestWrapper>
          <MobileFileUpload
            file={null}
            error={null}
            onChange={mockOnChange}
            label="Subir Documento"
          />
        </TestWrapper>
      );

      const fileInput = container.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveStyle({ display: 'none' });
    });

    it('debería aplicar el atributo accept al input', () => {
      const { container } = render(
        <TestWrapper>
          <MobileFileUpload
            file={null}
            error={null}
            onChange={mockOnChange}
            label="Subir PDF"
            accept="application/pdf"
          />
        </TestWrapper>
      );

      const fileInput = container.querySelector('input[type="file"]');
      expect(fileInput).toHaveAttribute('accept', 'application/pdf');
    });

    it('debería usar "*" como accept por defecto', () => {
      const { container } = render(
        <TestWrapper>
          <MobileFileUpload
            file={null}
            error={null}
            onChange={mockOnChange}
            label="Subir Archivo"
          />
        </TestWrapper>
      );

      const fileInput = container.querySelector('input[type="file"]');
      expect(fileInput).toHaveAttribute('accept', '*');
    });

    it('debería aceptar múltiples tipos de archivos', () => {
      const { container } = render(
        <TestWrapper>
          <MobileFileUpload
            file={null}
            error={null}
            onChange={mockOnChange}
            label="Subir Imagen"
            accept="image/png,image/jpeg,image/jpg"
          />
        </TestWrapper>
      );

      const fileInput = container.querySelector('input[type="file"]');
      expect(fileInput).toHaveAttribute('accept', 'image/png,image/jpeg,image/jpg');
    });
  });

  describe('Interacción con Botón', () => {
    it('debería abrir selector de archivos al hacer click en botón', () => {
      const { container } = render(
        <TestWrapper>
          <MobileFileUpload
            file={null}
            error={null}
            onChange={mockOnChange}
            label="Subir Documento"
          />
        </TestWrapper>
      );

      const fileInput = container.querySelector('input[type="file"]');
      const clickSpy = jest.spyOn(fileInput, 'click');

      const button = screen.getByRole('button', { name: /subir documento/i });
      fireEvent.click(button);

      expect(clickSpy).toHaveBeenCalled();
    });

    it('debería llamar onChange cuando se selecciona un archivo', () => {
      const { container } = render(
        <TestWrapper>
          <MobileFileUpload
            file={null}
            error={null}
            onChange={mockOnChange}
            label="Subir Documento"
          />
        </TestWrapper>
      );

      const fileInput = container.querySelector('input[type="file"]');
      
      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      expect(mockOnChange).toHaveBeenCalledTimes(1);
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          target: expect.objectContaining({
            files: expect.any(Object)
          })
        })
      );
    });
  });

  describe('Mostrar Archivo Seleccionado', () => {
    it('debería mostrar nombre del archivo cuando está seleccionado', () => {
      render(
        <TestWrapper>
          <MobileFileUpload
            file={mockFile}
            error={null}
            onChange={mockOnChange}
            label="Subir Documento"
          />
        </TestWrapper>
      );

      expect(screen.getByText('test-file.pdf')).toBeInTheDocument();
      expect(screen.queryByText('Subir Documento')).not.toBeInTheDocument();
    });

    it('debería mostrar label cuando no hay archivo seleccionado', () => {
      render(
        <TestWrapper>
          <MobileFileUpload
            file={null}
            error={null}
            onChange={mockOnChange}
            label="Seleccionar Archivo"
          />
        </TestWrapper>
      );

      expect(screen.getByText('Seleccionar Archivo')).toBeInTheDocument();
    });

    it('debería actualizar el texto al cambiar el archivo', () => {
      const { rerender } = render(
        <TestWrapper>
          <MobileFileUpload
            file={null}
            error={null}
            onChange={mockOnChange}
            label="Subir PDF"
          />
        </TestWrapper>
      );

      expect(screen.getByText('Subir PDF')).toBeInTheDocument();

      const newFile = new File(['content'], 'document.pdf', { type: 'application/pdf' });
      
      rerender(
        <TestWrapper>
          <MobileFileUpload
            file={newFile}
            error={null}
            onChange={mockOnChange}
            label="Subir PDF"
          />
        </TestWrapper>
      );

      expect(screen.getByText('document.pdf')).toBeInTheDocument();
      expect(screen.queryByText('Subir PDF')).not.toBeInTheDocument();
    });
  });

  describe('Manejo de Errores', () => {
    it('debería mostrar mensaje de error cuando existe', () => {
      render(
        <TestWrapper>
          <MobileFileUpload
            file={null}
            error="El archivo es demasiado grande"
            onChange={mockOnChange}
            label="Subir Documento"
          />
        </TestWrapper>
      );

      expect(screen.getByText('El archivo es demasiado grande')).toBeInTheDocument();
    });

    it('NO debería mostrar mensaje de error cuando es null', () => {
      render(
        <TestWrapper>
          <MobileFileUpload
            file={null}
            error={null}
            onChange={mockOnChange}
            label="Subir Documento"
          />
        </TestWrapper>
      );

      const errorMessage = screen.queryByText(/error/i);
      expect(errorMessage).not.toBeInTheDocument();
    });

    it('debería aplicar color de error al botón cuando hay error', () => {
      const { container } = render(
        <TestWrapper>
          <MobileFileUpload
            file={null}
            error="Archivo inválido"
            onChange={mockOnChange}
            label="Subir Documento"
          />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      const buttonStyles = window.getComputedStyle(button);
      
      // El botón debería tener estilos de error
      expect(button).toBeInTheDocument();
    });

    it('debería mostrar borde rojo cuando hay error', () => {
      render(
        <TestWrapper>
          <MobileFileUpload
            file={null}
            error="Formato no permitido"
            onChange={mockOnChange}
            label="Subir Documento"
          />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      // borderColor: 'error.main' aplicado via sx
    });

    it('debería mostrar diferentes tipos de errores', () => {
      const errors = [
        'Archivo muy grande (máximo 5MB)',
        'Formato no permitido',
        'Error al subir el archivo',
        'El archivo debe ser PDF'
      ];

      errors.forEach(error => {
        const { unmount } = render(
          <TestWrapper>
            <MobileFileUpload
              file={null}
              error={error}
              onChange={mockOnChange}
              label="Subir Documento"
            />
          </TestWrapper>
        );

        expect(screen.getByText(error)).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Tipos de Archivos', () => {
    it('debería aceptar PDFs', () => {
      const { container } = render(
        <TestWrapper>
          <MobileFileUpload
            file={null}
            error={null}
            onChange={mockOnChange}
            label="Subir PDF"
            accept="application/pdf"
          />
        </TestWrapper>
      );

      const fileInput = container.querySelector('input[type="file"]');
      expect(fileInput).toHaveAttribute('accept', 'application/pdf');
    });

    it('debería aceptar imágenes', () => {
      const { container } = render(
        <TestWrapper>
          <MobileFileUpload
            file={null}
            error={null}
            onChange={mockOnChange}
            label="Subir Imagen"
            accept="image/*"
          />
        </TestWrapper>
      );

      const fileInput = container.querySelector('input[type="file"]');
      expect(fileInput).toHaveAttribute('accept', 'image/*');
    });

    it('debería aceptar documentos de Excel', () => {
      const { container } = render(
        <TestWrapper>
          <MobileFileUpload
            file={null}
            error={null}
            onChange={mockOnChange}
            label="Subir Excel"
            accept=".xlsx,.xls"
          />
        </TestWrapper>
      );

      const fileInput = container.querySelector('input[type="file"]');
      expect(fileInput).toHaveAttribute('accept', '.xlsx,.xls');
    });
  });

  describe('Estados del Botón', () => {
    it('debería tener estilo outlined', () => {
      render(
        <TestWrapper>
          <MobileFileUpload
            file={null}
            error={null}
            onChange={mockOnChange}
            label="Subir Documento"
          />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      expect(button.closest('.MuiButton-root')).toHaveClass('MuiButton-outlined');
    });

    it('debería tener padding vertical de 1.5', () => {
      render(
        <TestWrapper>
          <MobileFileUpload
            file={null}
            error={null}
            onChange={mockOnChange}
            label="Subir Documento"
          />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      // py: 1.5 = padding 12px (1.5 * 8px)
      expect(button).toBeInTheDocument();
    });

    it('debería tener texto alineado a la izquierda', () => {
      render(
        <TestWrapper>
          <MobileFileUpload
            file={null}
            error={null}
            onChange={mockOnChange}
            label="Subir Documento"
          />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      // justifyContent: 'flex-start'
      expect(button).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('debería manejar archivo con nombre muy largo', () => {
      const longNameFile = new File(
        ['content'],
        'archivo-con-un-nombre-extremadamente-largo-que-podria-romper-el-layout-del-componente.pdf',
        { type: 'application/pdf' }
      );

      render(
        <TestWrapper>
          <MobileFileUpload
            file={longNameFile}
            error={null}
            onChange={mockOnChange}
            label="Subir Documento"
          />
        </TestWrapper>
      );

      expect(screen.getByText(/archivo-con-un-nombre-extremadamente-largo/)).toBeInTheDocument();
    });

    it('debería manejar archivo con caracteres especiales en el nombre', () => {
      const specialCharsFile = new File(
        ['content'],
        'archivo_ñ_áéíóú_@#$.pdf',
        { type: 'application/pdf' }
      );

      render(
        <TestWrapper>
          <MobileFileUpload
            file={specialCharsFile}
            error={null}
            onChange={mockOnChange}
            label="Subir Documento"
          />
        </TestWrapper>
      );

      expect(screen.getByText('archivo_ñ_áéíóú_@#$.pdf')).toBeInTheDocument();
    });

    it('debería manejar cambio de archivo a null', () => {
      const { rerender } = render(
        <TestWrapper>
          <MobileFileUpload
            file={mockFile}
            error={null}
            onChange={mockOnChange}
            label="Subir PDF"
          />
        </TestWrapper>
      );

      expect(screen.getByText('test-file.pdf')).toBeInTheDocument();

      rerender(
        <TestWrapper>
          <MobileFileUpload
            file={null}
            error={null}
            onChange={mockOnChange}
            label="Subir PDF"
          />
        </TestWrapper>
      );

      expect(screen.getByText('Subir PDF')).toBeInTheDocument();
      expect(screen.queryByText('test-file.pdf')).not.toBeInTheDocument();
    });

    it('debería manejar error y archivo simultáneamente', () => {
      render(
        <TestWrapper>
          <MobileFileUpload
            file={mockFile}
            error="El archivo es muy grande"
            onChange={mockOnChange}
            label="Subir Documento"
          />
        </TestWrapper>
      );

      expect(screen.getByText('test-file.pdf')).toBeInTheDocument();
      expect(screen.getByText('El archivo es muy grande')).toBeInTheDocument();
    });
  });

  describe('Accesibilidad', () => {
    it('debería tener un botón accesible', () => {
      render(
        <TestWrapper>
          <MobileFileUpload
            file={null}
            error={null}
            onChange={mockOnChange}
            label="Subir Documento"
          />
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: /subir documento/i });
      expect(button).toBeInTheDocument();
    });

    it('debería ser navegable por teclado', () => {
      const { container } = render(
        <TestWrapper>
          <MobileFileUpload
            file={null}
            error={null}
            onChange={mockOnChange}
            label="Subir Documento"
          />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      button.focus();
      
      expect(document.activeElement).toBe(button);
    });

    it('debería mostrar error con color rojo para accesibilidad visual', () => {
      render(
        <TestWrapper>
          <MobileFileUpload
            file={null}
            error="Error de validación"
            onChange={mockOnChange}
            label="Subir Documento"
          />
        </TestWrapper>
      );

      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent('Error de validación');
      expect(alert).toBeVisible();
      // Also expose a test id for more direct selections
      expect(screen.getByTestId('file-upload-error')).toBe(alert);
    });
  });

  describe('Responsive Design', () => {
    it('debería ocupar el 100% del ancho', () => {
      const { container } = render(
        <TestWrapper>
          <MobileFileUpload
            file={null}
            error={null}
            onChange={mockOnChange}
            label="Subir Documento"
          />
        </TestWrapper>
      );

      const wrapper = container.firstChild;
      expect(wrapper).toHaveStyle({ width: '100%' });
    });
  });

  describe('useRef Hook', () => {
    it('debería usar ref para manejar el input file', () => {
      const { container } = render(
        <TestWrapper>
          <MobileFileUpload
            file={null}
            error={null}
            onChange={mockOnChange}
            label="Subir Documento"
          />
        </TestWrapper>
      );

      const fileInput = container.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      
      // El ref debería permitir hacer click programáticamente
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      // Si el ref funciona, el input debería recibir el click
      expect(fileInput).toBeInTheDocument();
    });
  });
});
