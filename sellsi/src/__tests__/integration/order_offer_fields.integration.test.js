import fs from 'fs';
import path from 'path';
import { parseOrderItems } from '../../domains/orders/shared/parsing';
import { mapBuyerOrderFromServiceObject } from '../../domains/orders/infra/mappers/orderMappers';

// This integration test verifies that a real example order (Documentacion/order.json)
// preserves offer-related fields after passing through the parsing and mapping pipeline.

test('order.json preserves offer fields through normalization', async () => {
  const filePath = path.resolve(__dirname, '../../../Documentacion/order.json');
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsedJson = JSON.parse(raw);
  // The file contains an array of orders; pick the first one for this test
  const row = Array.isArray(parsedJson) ? parsedJson[0] : parsedJson;
  const items = parseOrderItems(row.items);
  expect(Array.isArray(items)).toBe(true);
  expect(items.length).toBeGreaterThan(0);
  // pick first item that contains offer metadata in the raw example (sanity)
  const rawItem = items.find(i => i.metadata?.isOffered || i.offer_id || i.offered_price);
  expect(rawItem).toBeDefined();
  // Simulate GetBuyerPaymentOrders normalization step by invoking the use-case with a fake repo call
  // Because GetBuyerPaymentOrders reads from DB via repository, we call the mapper directly on a constructed service object.
  const serviceOrder = {
    order_id: row.id || row.order_id || 'fake-order',
    items: items
  };
  const domain = mapBuyerOrderFromServiceObject(serviceOrder);
  // domain.items should be an array and preserve offer fields
  expect(Array.isArray(domain.items)).toBe(true);
  const mappedItem = domain.items.find(it => it.offer_id || it.offered_price || it.metadata?.isOffered || it.isOffered);
  expect(mappedItem).toBeDefined();
  // Assert core fields
  expect(mappedItem.metadata?.isOffered || mappedItem.isOffered).toBeTruthy();
  expect(mappedItem.offer_id || mappedItem.metadata?.offer_id).toBeTruthy();
  expect(mappedItem.offered_price || mappedItem.offeredPrice).toBeGreaterThanOrEqual(0);
});
