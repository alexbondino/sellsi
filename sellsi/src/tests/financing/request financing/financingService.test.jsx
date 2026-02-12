/* eslint-env jest */
const { createSupabaseMock } = require('../../utils/supabaseMock');

describe('financingService (integration-like unit tests)', () => {
  let supabaseMock;
  let setTableResponse;
  let triggerAuth;
  let applyMock;
  let financingService;

  beforeEach(() => {
    // Ensure fresh module cache so our jest.doMock takes effect
    jest.resetModules();

    const helper = createSupabaseMock();
    supabaseMock = helper.supabase;
    setTableResponse = helper.setTableResponse;
    triggerAuth = helper.triggerAuth;
    applyMock = helper.applyMock;

    // attach storage mock placeholder (tests will override as needed)
    supabaseMock.storage = {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({ error: null }),
        getPublicUrl: jest.fn().mockResolvedValue({ data: { publicUrl: 'https://cdn.example/ok' } }),
      })),
    };

    // Provide a default RPC mock so tests that don't override rpc won't crash
    supabaseMock.rpc = jest.fn(() => Promise.resolve({ data: null, error: null }));

    // Apply the supabase jest mock and require the service after
    applyMock();
    // Now require the service under test (this will pick up the mocked supabase)
    financingService = require('../../../workspaces/buyer/my-financing/services/financingService');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('createExpressRequest: success path includes buyer_id, supplier_id and stringified metadata', async () => {
    const created = { id: 42, buyer_id: 'buyer-1', supplier_id: 7 };
    setTableResponse('financing_requests', { data: created, error: null });

    // Set current session user
    triggerAuth('SIGNED_IN', { user: { id: 'user-1', email: 'buyer@example.com' } });

    // Ensure a buyer exists for this user (service should derive buyer.id)
    setTableResponse('buyer', { data: { id: 'buyer-1' }, error: null });

    // Ensure supplier exists for the requested supplierId
    setTableResponse('supplier', { data: { id: 7 }, error: null });

    const formData = {
      amount: '5000000',
      term: '30',
      businessName: 'ACME S.A.',
      rut: '12.345.678-9',
      legalRepresentative: 'Juan Perez',
      legalRepresentativeRut: '11.111.111-1',
      legalAddress: 'Calle Falsa 123',
      legalCommune: 'Providencia',
      legalRegion: 'Metropolitana',
    };

    const metadata = { foo: 'bar' };

    const res = await financingService.createExpressRequest({ formData, supplierId: 7, metadata });

    // Should return the created row
    expect(res).toEqual(created);

    // Verify DB insert called with proper mapped payload and JSON-stringified metadata
    expect(supabaseMock.from).toHaveBeenCalledWith('financing_requests');

    // Find the chain corresponding to 'financing_requests' call and assert insert happened
    const frCallIndex = supabaseMock.from.mock.calls.findIndex(c => c[0] === 'financing_requests');
    const frChain = supabaseMock.from.mock.results[frCallIndex].value;
    expect(frChain.insert).toHaveBeenCalledTimes(1);

    const insertedArg = frChain.insert.mock.calls[0][0][0]; // insert([payload]) => first arg, first item

    expect(insertedArg).toMatchObject({
      buyer_id: 'buyer-1',
      supplier_id: 7,
      amount: 5000000,
      term_days: 30,
      legal_name: 'ACME S.A.',
      legal_rut: '12.345.678-9',
      buyer_legal_representative_rut: '11.111.111-1',
      buyer_legal_representative_name: 'Juan Perez',
      legal_address: 'Calle Falsa 123',
      legal_commune: 'Providencia',
      legal_region: 'Metropolitana',
      status: 'pending_supplier_review',
    });

    expect(insertedArg.metadata).toBe(JSON.stringify(Object.assign({}, metadata, {
      buyer_legal_representative_name: 'Juan Perez',
      buyer_legal_representative_rut: '11.111.111-1'
    })));

  });

  test('createExpressRequest: propagates DB insertion error as throw', async () => {
    const err = { message: 'db failure' };
    setTableResponse('financing_requests', { data: null, error: err });

    triggerAuth('SIGNED_IN', { user: { id: 'u1' } });

    const formData = { amount: '1', term: '1', businessName: 'X', rut: '1-9', legalRepresentative: 'A', legalRepresentativeRut: '1-9', legalAddress: 'a', legalCommune: 'c', legalRegion: 'r' };

    await expect(financingService.createExpressRequest({ formData })).rejects.toEqual(err);
  });

  test('createExpressRequest: when no session present buyer_id is null', async () => {
    const created = { id: 900 };
    setTableResponse('financing_requests', { data: created, error: null });

    // No triggerAuth -> no session

    const formData = { amount: '1000', term: '10', businessName: 'N', rut: '1-1', legalRepresentative: 'B', legalRepresentativeRut: '2-2', legalAddress: 'addr', legalCommune: 'com', legalRegion: 'reg' };

    const res = await financingService.createExpressRequest({ formData });
    expect(res).toEqual(created);

    const chain = supabaseMock.from.mock.results[0].value;
    const insertedArg = chain.insert.mock.calls[0][0][0];
    expect(insertedArg.buyer_id).toBeNull();
  });

  test('createExpressRequest: creates buyer when missing and uses its id via RPC', async () => {
    const created = { id: 777 };
    setTableResponse('financing_requests', { data: created, error: null });

    // Set current session user
    triggerAuth('SIGNED_IN', { user: { id: 'user-2', email: 'x@x.com' } });

    // Mock RPC to return the buyer id
    supabaseMock.rpc = jest.fn(() => Promise.resolve({ data: 'new-buyer-1', error: null }));

    const formData = { amount: '100', term: '10', businessName: 'X', rut: '1-1', legalRepresentative: 'A', legalRepresentativeRut: '1-1', legalAddress: 'a', legalCommune: 'c', legalRegion: 'r' };

    const res = await financingService.createExpressRequest({ formData });
    expect(res).toEqual(created);

    // Ensure RPC called and its value was used in the insert payload
    expect(supabaseMock.rpc).toHaveBeenCalledWith('ensure_buyer_for_user', { p_user_id: 'user-2' });

    const frCallIndex = supabaseMock.from.mock.calls.findIndex(c => c[0] === 'financing_requests');
    const frChain = supabaseMock.from.mock.results[frCallIndex].value;
    const insertedArg = frChain.insert.mock.calls[0][0][0];
    expect(insertedArg.buyer_id).toBe('new-buyer-1');
  });

  test('createExpressRequest: throws supplier_not_found when supplier missing', async () => {
    // Prepare: expect the supplier select to return no row
    triggerAuth('SIGNED_IN', { user: { id: 'user-3', email: 'c@c.com' } });
    setTableResponse('supplier', { data: null, error: null });

    const formData = { amount: '200', term: '30', businessName: 'Z', rut: '2-2', legalRepresentative: 'R', legalRepresentativeRut: '2-2', legalAddress: 'addr', legalCommune: 'com', legalRegion: 'reg' };

    await expect(financingService.createExpressRequest({ formData, supplierId: 'missing-supplier-1' })).rejects.toEqual({ message: 'supplier not found', code: 'supplier_not_found', details: 'supplier_id missing-supplier-1 does not exist' });
  });

  test('uploadFinancingDocument: successful upload returns public URL', async () => {
    // Prepare storage mock with spies
    const uploadMock = jest.fn().mockResolvedValue({ error: null });
    const getPublicUrlMock = jest.fn().mockResolvedValue({ data: { publicUrl: 'https://cdn.example/one.pdf' } });

    supabaseMock.storage = {
      from: jest.fn(() => ({ upload: uploadMock, getPublicUrl: getPublicUrlMock })),
    };

    // Re-require service to pick up modified storage mock
    jest.resetModules();
    const helper = createSupabaseMock();
    helper.supabase.storage = supabaseMock.storage;
    helper.applyMock();
    financingService = require('../../../workspaces/buyer/my-financing/services/financingService');

    const fileStub = { name: 'one.pdf', size: 123 };
    const url = await financingService.uploadFinancingDocument(123, fileStub, 'one.pdf');

    expect(url).toBe('https://cdn.example/one.pdf');
    expect(supabaseMock.storage.from).toHaveBeenCalledWith('financing-documents');
    expect(uploadMock).toHaveBeenCalled();
    expect(getPublicUrlMock).toHaveBeenCalled();
  });

  test('uploadFinancingDocument: upload error is thrown', async () => {
    const uploadErr = { message: 'cannot upload' };
    supabaseMock.storage = {
      from: jest.fn(() => ({ upload: jest.fn().mockResolvedValue({ error: uploadErr }) })),
    };

    jest.resetModules();
    const helper = createSupabaseMock();
    helper.supabase.storage = supabaseMock.storage;
    helper.applyMock();
    financingService = require('../../../workspaces/buyer/my-financing/services/financingService');

    await expect(financingService.uploadFinancingDocument(55, { name: 'x' }, 'x')).rejects.toEqual(uploadErr);
  });

  test('createExtendedRequest: uploads all provided files and returns created row', async () => {
    const created = { id: 999 };
    setTableResponse('financing_requests', { data: created, error: null });

    const uploadMock = jest.fn().mockResolvedValue({ error: null });
    const getPublicUrlMock = jest.fn().mockResolvedValue({ data: { publicUrl: 'https://cdn.example/doc.pdf' } });
    supabaseMock.storage = {
      from: jest.fn(() => ({ upload: uploadMock, getPublicUrl: getPublicUrlMock })),
    };

    // Re-require service with updated storage
    jest.resetModules();
    const helper = createSupabaseMock();
    helper.supabase.storage = supabaseMock.storage;
    helper.setTableResponse('financing_requests', { data: created, error: null });
    // Ensure supplier exists for this extended request
    helper.setTableResponse('supplier', { data: { id: 12 }, error: null });
    helper.applyMock();
    financingService = require('../../../workspaces/buyer/my-financing/services/financingService');

    const formData = {
      amount: '1500',
      term: '10',
      businessName: 'X',
      rut: '1-1',
      legalRepresentative: 'A',
      legalRepresentativeRut: '2-2',
      legalAddress: 'addr',
      legalCommune: 'c',
      legalRegion: 'r',
      powersCertificate: { name: 'pows.pdf' },
      powersValidityCertificate: { name: 'valid.pdf' },
      simplifiedTaxFolder: { name: 'tax.pdf' },
      others: { name: 'other.pdf' },
    };

    const res = await financingService.createExtendedRequest({ formData, supplierId: 12 });
    expect(res).toEqual(created);

    // Expect upload called 4 times (one per provided file)
    expect(uploadMock).toHaveBeenCalledTimes(4);
    expect(supabaseMock.storage.from).toHaveBeenCalledWith('financing-documents');
  });

  test('createExtendedRequest: if an upload fails, it propagates the error', async () => {
    const created = { id: 444 };
    setTableResponse('financing_requests', { data: created, error: null });

    const uploadMock = jest.fn()
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: { message: 'upload fail' } });
    supabaseMock.storage = {
      from: jest.fn(() => ({ upload: uploadMock, getPublicUrl: jest.fn().mockResolvedValue({ data: { publicUrl: 'x' } }) })),
    };

    jest.resetModules();
    const helper = createSupabaseMock();
    helper.supabase.storage = supabaseMock.storage;
    helper.setTableResponse('financing_requests', { data: created, error: null });
    helper.applyMock();
    financingService = require('../../../workspaces/buyer/my-financing/services/financingService');

    const formData = {
      amount: '1',
      term: '1',
      businessName: 'X',
      rut: '1-1',
      legalRepresentative: 'A',
      legalRepresentativeRut: '2-2',
      legalAddress: 'addr',
      legalCommune: 'c',
      legalRegion: 'r',
      powersCertificate: { name: 'a.pdf' },
      powersValidityCertificate: { name: 'b.pdf' },
    };

    await expect(financingService.createExtendedRequest({ formData })).rejects.toBeDefined();
  });
});
