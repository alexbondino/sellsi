import { jest } from '@jest/globals';

export const orderService = {
  getOrdersForSupplier: jest.fn(),
  getPaymentOrdersForBuyer: jest.fn(),
  updateOrderStatus: jest.fn(),
  updateSupplierPartStatus: jest.fn(),
  getPaymentStatusesForBuyer: jest.fn(),
};

export const resetOrderServiceMock = () => {
  Object.values(orderService).forEach(fn => typeof fn.mockReset === 'function' && fn.mockReset());
};
