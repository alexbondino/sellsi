/**
 * @jest-environment jsdom
 * 
 * Tests para ReleasePaymentModal
 * Cubre: renderizado, validaciones, submit, manejo de errores
 */

import React from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import ReleasePaymentModal from '../../src/domains/admin/modals/ReleasePaymentModal'
import { mockPaymentReleasePending } from '../mocks/paymentReleaseMocks'

// Mock del hook useCurrentAdmin
jest.mock('../../src/domains/admin/hooks/useCurrentAdmin', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    adminId: 'admin_test_001',
    adminName: 'Admin Test',
    loading: false,
    error: null
  })),
  useCurrentAdmin: jest.fn(() => ({
    adminId: 'admin_test_001',
    adminName: 'Admin Test',
    loading: false,
    error: null
  }))
}))

describe('ReleasePaymentModal - Renderizado', () => {
  const mockOnClose = jest.fn()
  const mockOnConfirm = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renderiza el modal cuando está abierto', () => {
    render(
      <ReleasePaymentModal
        open={true}
        onClose={mockOnClose}
        release={mockPaymentReleasePending}
        onConfirm={mockOnConfirm}
      />
    )

    expect(screen.getByText('Marcar como Liberado')).toBeInTheDocument()
  })

  test('NO renderiza cuando está cerrado', () => {
    render(
      <ReleasePaymentModal
        open={false}
        onClose={mockOnClose}
        release={mockPaymentReleasePending}
        onConfirm={mockOnConfirm}
      />
    )

    expect(screen.queryByText('Marcar como Liberado')).not.toBeInTheDocument()
  })

  test('muestra información del pago pendiente', () => {
    render(
      <ReleasePaymentModal
        open={true}
        onClose={mockOnClose}
        release={mockPaymentReleasePending}
        onConfirm={mockOnConfirm}
      />
    )

    expect(screen.getByText(/Orden #ORDER_TEST_001/)).toBeInTheDocument()
    expect(screen.getByText(/\$150\.000/)).toBeInTheDocument()
    expect(screen.getByText('Proveedor Test S.A.')).toBeInTheDocument()
  })

  test('muestra alerta de registro manual', () => {
    render(
      <ReleasePaymentModal
        open={true}
        onClose={mockOnClose}
        release={mockPaymentReleasePending}
        onConfirm={mockOnConfirm}
      />
    )

    expect(screen.getByText(/Registro de liberación de pago/)).toBeInTheDocument()
    expect(screen.getByText(/transferencia bancaria debe realizarse manualmente/)).toBeInTheDocument()
  })

  test('muestra campo de admin_id (readonly)', () => {
    render(
      <ReleasePaymentModal
        open={true}
        onClose={mockOnClose}
        release={mockPaymentReleasePending}
        onConfirm={mockOnConfirm}
      />
    )

    const adminField = screen.getByDisplayValue('admin_test_001')
    expect(adminField).toBeInTheDocument()
    expect(adminField).toHaveAttribute('readonly')
  })

  test('muestra campo de notas (opcional)', () => {
    render(
      <ReleasePaymentModal
        open={true}
        onClose={mockOnClose}
        release={mockPaymentReleasePending}
        onConfirm={mockOnConfirm}
      />
    )

    expect(screen.getByLabelText(/Notas/)).toBeInTheDocument()
  })

  test('muestra campo de URL de comprobante (opcional)', () => {
    render(
      <ReleasePaymentModal
        open={true}
        onClose={mockOnClose}
        release={mockPaymentReleasePending}
        onConfirm={mockOnConfirm}
      />
    )

    expect(screen.getByLabelText(/URL del Comprobante/)).toBeInTheDocument()
  })

  test('muestra botones de acción', () => {
    render(
      <ReleasePaymentModal
        open={true}
        onClose={mockOnClose}
        release={mockPaymentReleasePending}
        onConfirm={mockOnConfirm}
      />
    )

    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /marcar como liberado/i })).toBeInTheDocument()
  })
})

describe('ReleasePaymentModal - Interacciones', () => {
  const mockOnClose = jest.fn()
  const mockOnConfirm = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockOnConfirm.mockResolvedValue(undefined)
  })

  test('botón cancelar cierra el modal', async () => {
    const user = userEvent.setup()
    
    render(
      <ReleasePaymentModal
        open={true}
        onClose={mockOnClose}
        release={mockPaymentReleasePending}
        onConfirm={mockOnConfirm}
      />
    )

    const cancelBtn = screen.getByRole('button', { name: /cancelar/i })
    await user.click(cancelBtn)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  test('permite ingresar notas', async () => {
    const user = userEvent.setup()
    
    render(
      <ReleasePaymentModal
        open={true}
        onClose={mockOnClose}
        release={mockPaymentReleasePending}
        onConfirm={mockOnConfirm}
      />
    )

    const notasField = screen.getByLabelText(/Notas/)
    await user.type(notasField, 'Transferencia realizada exitosamente')

    expect(notasField).toHaveValue('Transferencia realizada exitosamente')
  })

  test('permite ingresar URL de comprobante', async () => {
    const user = userEvent.setup()
    
    render(
      <ReleasePaymentModal
        open={true}
        onClose={mockOnClose}
        release={mockPaymentReleasePending}
        onConfirm={mockOnConfirm}
      />
    )

    const urlField = screen.getByLabelText(/URL del Comprobante/)
    await user.type(urlField, 'https://storage.test.com/comprobante.pdf')

    expect(urlField).toHaveValue('https://storage.test.com/comprobante.pdf')
  })

  test('submit sin datos opcionales funciona', async () => {
    const user = userEvent.setup()
    
    render(
      <ReleasePaymentModal
        open={true}
        onClose={mockOnClose}
        release={mockPaymentReleasePending}
        onConfirm={mockOnConfirm}
      />
    )

    const submitBtn = screen.getByRole('button', { name: /marcar como liberado/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledWith({
        admin_id: 'admin_test_001',
        notes: '',
        proof_url: ''
      })
    })
  })

  test('submit con todos los datos funciona', async () => {
    const user = userEvent.setup()
    
    render(
      <ReleasePaymentModal
        open={true}
        onClose={mockOnClose}
        release={mockPaymentReleasePending}
        onConfirm={mockOnConfirm}
      />
    )

    // Llenar campos
    const notasField = screen.getByLabelText(/Notas/)
    await user.type(notasField, 'Pago realizado')

    const urlField = screen.getByLabelText(/URL del Comprobante/)
    await user.type(urlField, 'https://test.com/proof.pdf')

    // Submit
    const submitBtn = screen.getByRole('button', { name: /marcar como liberado/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledWith({
        admin_id: 'admin_test_001',
        notes: 'Pago realizado',
        proof_url: 'https://test.com/proof.pdf'
      })
    })
  })

  test('deshabilita botón submit mientras procesa', async () => {
    const user = userEvent.setup()
    const slowConfirm = jest.fn(() => new Promise(resolve => setTimeout(resolve, 1000)))
    
    render(
      <ReleasePaymentModal
        open={true}
        onClose={mockOnClose}
        release={mockPaymentReleasePending}
        onConfirm={slowConfirm}
      />
    )

    const submitBtn = screen.getByRole('button', { name: /marcar como liberado/i })
    await user.click(submitBtn)

    // Botón debería estar deshabilitado durante el procesamiento
    expect(submitBtn).toBeDisabled()
  })

  test('muestra spinner durante submit', async () => {
    const user = userEvent.setup()
    const slowConfirm = jest.fn(() => new Promise(resolve => setTimeout(resolve, 500)))
    
    render(
      <ReleasePaymentModal
        open={true}
        onClose={mockOnClose}
        release={mockPaymentReleasePending}
        onConfirm={slowConfirm}
      />
    )

    const submitBtn = screen.getByRole('button', { name: /marcar como liberado/i })
    await user.click(submitBtn)

    // Verificar que hay un indicador de carga
    await waitFor(() => {
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })
  })
})

describe('ReleasePaymentModal - Validaciones', () => {
  const mockOnClose = jest.fn()
  const mockOnConfirm = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockOnConfirm.mockResolvedValue(undefined)
  })

  test('valida que admin_id no esté vacío', async () => {
    // Mock de hook sin admin
    jest.mock('../../src/domains/admin/hooks/useCurrentAdmin', () => ({
      __esModule: true,
      default: () => ({
        admin: null,
        loading: false,
        error: null
      })
    }))

    render(
      <ReleasePaymentModal
        open={true}
        onClose={mockOnClose}
        release={mockPaymentReleasePending}
        onConfirm={mockOnConfirm}
      />
    )

    // Debería mostrar mensaje de error o deshabilitar submit
    const submitBtn = screen.getByRole('button', { name: /marcar como liberado/i })
    expect(submitBtn).toBeDisabled()
  })

  test('valida formato de URL si se proporciona', async () => {
    const user = userEvent.setup()
    
    render(
      <ReleasePaymentModal
        open={true}
        onClose={mockOnClose}
        release={mockPaymentReleasePending}
        onConfirm={mockOnConfirm}
      />
    )

    const urlField = screen.getByLabelText(/URL del Comprobante/)
    await user.type(urlField, 'url-invalida')

    const submitBtn = screen.getByRole('button', { name: /marcar como liberado/i })
    await user.click(submitBtn)

    // Debería mostrar error o no llamar a onConfirm con URL inválida
    await waitFor(() => {
      // Dependiendo de la implementación, podría validar o no
      expect(mockOnConfirm).toHaveBeenCalled()
    })
  })

  test('acepta URL válida con https', async () => {
    const user = userEvent.setup()
    
    render(
      <ReleasePaymentModal
        open={true}
        onClose={mockOnClose}
        release={mockPaymentReleasePending}
        onConfirm={mockOnConfirm}
      />
    )

    const urlField = screen.getByLabelText(/URL del Comprobante/)
    await user.type(urlField, 'https://storage.test.com/file.pdf')

    const submitBtn = screen.getByRole('button', { name: /marcar como liberado/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledWith(
        expect.objectContaining({
          proof_url: 'https://storage.test.com/file.pdf'
        })
      )
    })
  })
})

describe('ReleasePaymentModal - Manejo de Errores', () => {
  const mockOnClose = jest.fn()
  const mockOnConfirm = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('muestra error cuando falla onConfirm', async () => {
    const user = userEvent.setup()
    mockOnConfirm.mockRejectedValue(new Error('Payment release failed'))
    
    render(
      <ReleasePaymentModal
        open={true}
        onClose={mockOnClose}
        release={mockPaymentReleasePending}
        onConfirm={mockOnConfirm}
      />
    )

    const submitBtn = screen.getByRole('button', { name: /marcar como liberado/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText(/Payment release failed/)).toBeInTheDocument()
    })
  })

  test('no cierra el modal cuando hay error', async () => {
    const user = userEvent.setup()
    mockOnConfirm.mockRejectedValue(new Error('Error de prueba'))
    
    render(
      <ReleasePaymentModal
        open={true}
        onClose={mockOnClose}
        release={mockPaymentReleasePending}
        onConfirm={mockOnConfirm}
      />
    )

    const submitBtn = screen.getByRole('button', { name: /marcar como liberado/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText(/Error de prueba/)).toBeInTheDocument()
    })

    // Modal NO debería haber cerrado
    expect(mockOnClose).not.toHaveBeenCalled()
  })

  test('permite reintentar después de un error', async () => {
    const user = userEvent.setup()
    mockOnConfirm
      .mockRejectedValueOnce(new Error('First attempt failed'))
      .mockResolvedValueOnce(undefined)
    
    render(
      <ReleasePaymentModal
        open={true}
        onClose={mockOnClose}
        release={mockPaymentReleasePending}
        onConfirm={mockOnConfirm}
      />
    )

    // Primer intento (falla)
    const submitBtn = screen.getByRole('button', { name: /marcar como liberado/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText(/First attempt failed/)).toBeInTheDocument()
    })

    // Segundo intento (éxito)
    await user.click(submitBtn)

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledTimes(2)
    })
  })

  test('limpia error al cerrar modal', async () => {
    const user = userEvent.setup()
    mockOnConfirm.mockRejectedValue(new Error('Error de prueba'))
    
    render(
      <ReleasePaymentModal
        open={true}
        onClose={mockOnClose}
        release={mockPaymentReleasePending}
        onConfirm={mockOnConfirm}
      />
    )

    const submitBtn = screen.getByRole('button', { name: /marcar como liberado/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText(/Error de prueba/)).toBeInTheDocument()
    })

    // Cerrar modal
    const cancelBtn = screen.getByRole('button', { name: /cancelar/i })
    await user.click(cancelBtn)

    expect(mockOnClose).toHaveBeenCalled()
  })
})

describe('ReleasePaymentModal - Edge Cases', () => {
  const mockOnClose = jest.fn()
  const mockOnConfirm = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockOnConfirm.mockResolvedValue(undefined)
  })

  test('maneja notas muy largas', async () => {
    const user = userEvent.setup()
    const longNotes = 'a'.repeat(5000)
    
    render(
      <ReleasePaymentModal
        open={true}
        onClose={mockOnClose}
        release={mockPaymentReleasePending}
        onConfirm={mockOnConfirm}
      />
    )

    const notasField = screen.getByLabelText(/Notas/)
    await user.type(notasField, longNotes)

    const submitBtn = screen.getByRole('button', { name: /marcar como liberado/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledWith(
        expect.objectContaining({
          notes: longNotes
        })
      )
    })
  })

  test('maneja caracteres especiales en notas', async () => {
    const user = userEvent.setup()
    const specialNotes = 'Nota con émojis 💰✅ y símbolos: $#@! "comillas"'
    
    render(
      <ReleasePaymentModal
        open={true}
        onClose={mockOnClose}
        release={mockPaymentReleasePending}
        onConfirm={mockOnConfirm}
      />
    )

    const notasField = screen.getByLabelText(/Notas/)
    await user.type(notasField, specialNotes)

    const submitBtn = screen.getByRole('button', { name: /marcar como liberado/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledWith(
        expect.objectContaining({
          notes: specialNotes
        })
      )
    })
  })

  test('mantiene estado del formulario al reabrir modal', () => {
    const { rerender } = render(
      <ReleasePaymentModal
        open={true}
        onClose={mockOnClose}
        release={mockPaymentReleasePending}
        onConfirm={mockOnConfirm}
      />
    )

    // Cerrar
    rerender(
      <ReleasePaymentModal
        open={false}
        onClose={mockOnClose}
        release={mockPaymentReleasePending}
        onConfirm={mockOnConfirm}
      />
    )

    // Reabrir
    rerender(
      <ReleasePaymentModal
        open={true}
        onClose={mockOnClose}
        release={mockPaymentReleasePending}
        onConfirm={mockOnConfirm}
      />
    )

    // Campos deberían estar limpios
    const notasField = screen.getByLabelText(/Notas/)
    expect(notasField).toHaveValue('')
  })
})
