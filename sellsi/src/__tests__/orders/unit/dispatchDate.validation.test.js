// Minimal, isolated test of dispatch date validation logic (no React / no heavy mocks)

// Congelamos la fecha base
const FIXED_NOW = new Date('2025-09-02T10:00:00.000Z');
jest.useFakeTimers().setSystemTime(FIXED_NOW);

// Helpers simples (replican intención de producción sin dependencias)
const toYMD = (d) => d.toISOString().slice(0,10); // YYYY-MM-DD (UTC recorte)
const parseYMD = (s) => {
  const [y,m,d] = s.split('-').map(Number);
  return new Date(Date.UTC(y, m-1, d));
};
const addDays = (d, n) => new Date(d.getTime() + n*86400000);

/**
 * Reglas (S-3):
 * - Si usuario no provee fecha => asignar hoy + 3 días (autoAssigned=true) y permitir.
 * - Rechazar si fecha < hoy.
 * - Rechazar si fecha > límite (ETA límite del pedido) cuando existe.
 * Devuelve { ok, finalDate?, error?, autoAssigned? }
 */
const validateDispatchDate = ({ userDate, orderLimitYMD, todayYMD }) => {
  const todayDate = parseYMD(todayYMD);
  const limitDate = orderLimitYMD ? parseYMD(orderLimitYMD) : null;
  let chosen;
  let autoAssigned = false;

  if (!userDate) {
    chosen = toYMD(addDays(todayDate, 3));
    autoAssigned = true;
  } else {
    chosen = userDate;
  }

  const chosenDate = parseYMD(chosen);
  if (chosenDate < todayDate) {
    return { ok: false, error: 'La fecha estimada no puede ser anterior a hoy' };
  }
  if (limitDate && chosenDate > limitDate) {
    return { ok: false, error: 'Supera la Fecha Entrega Límite' };
  }

  return { ok: true, finalDate: chosen, autoAssigned };
};

// Infra mínima para simular banner + dispatch
const mockDispatch = jest.fn();
let banners = [];
const resetEnv = () => { mockDispatch.mockReset(); banners = []; };

const performDispatchFlow = ({ userDate, orderLimitISO }) => {
  const todayYMD = toYMD(FIXED_NOW);
  const limitYMD = orderLimitISO ? orderLimitISO.slice(0,10) : undefined;
  const r = validateDispatchDate({ userDate, orderLimitYMD: limitYMD, todayYMD });
  if (!r.ok) {
    banners.push({ type: 'error', message: r.error });
    return r;
  }
  if (r.autoAssigned) {
    banners.push({ type: 'info', message: 'La fecha estimada de entrega se asignó automáticamente (+3 días).' });
  }
  mockDispatch(r.finalDate);
  return r;
};

describe('Dispatch date validation (aislado)', () => {
  beforeEach(() => resetEnv());

  it('auto +3 días cuando no se ingresa fecha', () => {
    const res = performDispatchFlow({ userDate: undefined, orderLimitISO: null });
    const expected = toYMD(addDays(parseYMD(toYMD(FIXED_NOW)), 3));
    expect(res.ok).toBe(true);
    expect(res.autoAssigned).toBe(true);
    expect(mockDispatch).toHaveBeenCalledWith(expected);
    expect(banners.some(b => /asignó automáticamente/.test(b.message))).toBe(true);
  });

  it('rechaza fecha pasada (< hoy)', () => {
    const res = performDispatchFlow({ userDate: '2025-09-01', orderLimitISO: null });
    expect(res.ok).toBe(false);
    expect(mockDispatch).not.toHaveBeenCalled();
    expect(banners[banners.length - 1].message).toMatch(/anterior a hoy/);
  });

  it('rechaza fecha > límite', () => {
    const res = performDispatchFlow({ userDate: '2025-09-07', orderLimitISO: '2025-09-06T00:00:00.000Z' });
    expect(res.ok).toBe(false);
    expect(mockDispatch).not.toHaveBeenCalled();
    expect(banners[banners.length - 1].message).toMatch(/Límite/);
  });
});

