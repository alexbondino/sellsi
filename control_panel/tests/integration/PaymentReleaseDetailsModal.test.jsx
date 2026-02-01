/**
 * @jest-environment jsdom
 *
 * Tests para PaymentReleaseDetailsModal
 * Cubre: renderizado y visualización de información de transferencia (bank_info)
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import PaymentReleaseDetailsModal from '../../src/domains/admin/modals/PaymentReleaseDetailsModal'
import { mockPaymentReleaseReleased } from '../mocks/paymentReleaseMocks'

jest.mock('../../src/domains/admin/services/adminPaymentReleaseService', () => {
  const actual = jest.requireActual('../../src/domains/admin/services/adminPaymentReleaseService')
  return {
    ...actual,
    getSupplierBankInfo: jest.fn(async () => ({
      success: true,
      data: {
        user_id: 'sup_test_001',
        account_holder: 'Proveedor Test S.A.',
        bank: 'Banco Test',
        account_number: '12345678',
        transfer_rut: '12.345.678-9',
        confirmation_email: 'pagos@proveedortest.cl',
        account_type: 'corriente'
      }
    }))
  }
})

describe('PaymentReleaseDetailsModal', () => {
  test('muestra información de transferencia cuando existe bank_info', async () => {
    render(
      <PaymentReleaseDetailsModal
        open={true}
        onClose={() => {}}
        release={mockPaymentReleaseReleased}
      />
    )

    expect(screen.getByText('Detalles de Liberación de Pago')).toBeInTheDocument()
    expect(screen.getByText('Información de Transferencia')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Banco Test')).toBeInTheDocument()
      expect(screen.getByText('12345678')).toBeInTheDocument()
      expect(screen.getByText('12.345.678-9')).toBeInTheDocument()
      // Comisión y monto a liberar visibles
      expect(screen.getByText(/\$7\.500/)).toBeInTheDocument()
      expect(screen.getByText(/\$242\.500/)).toBeInTheDocument()
    })
  })
})
