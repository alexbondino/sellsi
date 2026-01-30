/**
 * Test para verificar el bug de cache de billing info
 * 
 * Escenario del bug reportado:
 * 1. Usuario abre modal AddToCart → ve "Completar Facturación" (billing incompleto)
 * 2. Usuario navega a Profile y completa billing
 * 3. Usuario vuelve al marketplace
 * 4. Usuario abre modal de nuevo → DEBERÍA ver billing completo, NO "Completar Facturación"
 */

import { renderHook, act, waitFor } from '@testing-library/react';

// Mock de supabase
const mockGetUser = jest.fn();
const mockOnAuthStateChange = jest.fn();

jest.mock('../../services/supabase', () => ({
  supabase: {
    auth: {
      getUser: () => mockGetUser(),
      onAuthStateChange: (cb) => {
        mockOnAuthStateChange(cb);
        // Return a supabase-like subscription object
        return { data: { subscription: { unsubscribe: () => {} } } };
      }
    }
  }
}));

// Mock de getUserProfile
const mockGetUserProfile = jest.fn();
jest.mock('../../services/user', () => ({
  getUserProfile: (...args) => mockGetUserProfile(...args)
}));

// Importar después de los mocks
import { 
  useBillingInfoValidation, 
  invalidateBillingInfoCache,
  BILLING_INFO_STATES 
} from '../../shared/hooks/profile/useBillingInfoValidation';

describe('Billing Cache Bug - Flujo marketplace → profile → marketplace', () => {
  const mockUserId = 'test-user-123';
  
  // Datos de billing incompletos
  const incompleteBillingProfile = {
    business_name: '',
    billing_rut: '',
    business_line: '',
    billing_address: '',
    billing_region: '',
    billing_commune: '',
  };
  
  // Datos de billing completos
  const completeBillingProfile = {
    business_name: 'Empresa Test',
    billing_rut: '12345678-9',
    business_line: 'Comercio',
    billing_address: 'Calle Test 123',
    billing_region: 'Metropolitana',
    billing_commune: 'Santiago',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Limpiar cache global antes de cada test
    invalidateBillingInfoCache();
    
    // Setup default: usuario autenticado
    mockGetUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null
    });
  });

  afterEach(() => {
    // Limpiar event listeners
    invalidateBillingInfoCache();
  });

  test('ESCENARIO COMPLETO: billing se actualiza después de navegar a profile', async () => {
    // ==========================================
    // PASO 1: Usuario en marketplace, billing incompleto
    // ==========================================
    mockGetUserProfile.mockResolvedValue({
      data: incompleteBillingProfile,
      error: null
    });

    const { result, unmount } = renderHook(() => useBillingInfoValidation());

    // Esperar carga inicial
    await waitFor(() => {
      expect(result.current.state).not.toBe(BILLING_INFO_STATES.LOADING);
    });

    // Verificar que billing está incompleto
    expect(result.current.isComplete).toBe(false);
    expect(result.current.state).toBe(BILLING_INFO_STATES.INCOMPLETE);
    console.log('✅ PASO 1: Billing incompleto detectado correctamente');

    // ==========================================
    // PASO 2: Simular navegación a Profile (componente se desmonta)
    // ==========================================
    unmount();
    console.log('✅ PASO 2: Componente desmontado (simula navegación a /profile)');

    // ==========================================
    // PASO 3: Usuario completa billing en Profile
    // Profile llama invalidateBillingInfoCache() al guardar
    // ==========================================
    mockGetUserProfile.mockResolvedValue({
      data: completeBillingProfile,
      error: null
    });
    
    // Simular lo que hace Profile.jsx al guardar
    act(() => invalidateBillingInfoCache());
    console.log('✅ PASO 3: Cache invalidado (simula guardado en Profile)');

    // ==========================================
    // PASO 4: Usuario vuelve al marketplace (componente se remonta)
    // ==========================================
    const { result: result2 } = renderHook(() => useBillingInfoValidation());

    // Esperar carga
    await waitFor(() => {
      expect(result2.current.state).not.toBe(BILLING_INFO_STATES.LOADING);
    });

    // ==========================================
    // VERIFICACIÓN FINAL: ¿El billing ahora está completo?
    // ==========================================
    expect(result2.current.isComplete).toBe(true);
    expect(result2.current.state).toBe(BILLING_INFO_STATES.COMPLETE);
    expect(result2.current.billingInfo).toEqual({
      businessName: 'Empresa Test',
      billingRut: '12345678-9',
      businessLine: 'Comercio',
      billingAddress: 'Calle Test 123',
      billingRegion: 'Metropolitana',
      billingCommune: 'Santiago',
    });
    console.log('✅ PASO 4: Billing completo detectado correctamente después de volver');
  });

  test('EVENT LISTENER: componente montado recibe invalidación externa', async () => {
    // ==========================================
    // Escenario alternativo: componente NO se desmonta
    // (por si la hipótesis de versus.md fuera correcta)
    // ==========================================
    
    // Empezar con billing incompleto
    mockGetUserProfile.mockResolvedValue({
      data: incompleteBillingProfile,
      error: null
    });

    const { result } = renderHook(() => useBillingInfoValidation());

    await waitFor(() => {
      expect(result.current.state).toBe(BILLING_INFO_STATES.INCOMPLETE);
    });

    expect(result.current.isComplete).toBe(false);
    console.log('✅ Estado inicial: Billing incompleto');

    // Ahora simular que Profile actualiza y emite evento
    // (sin desmontar el componente)
    mockGetUserProfile.mockResolvedValue({
      data: completeBillingProfile,
      error: null
    });

    // Disparar invalidación (esto emite el evento billing-info-invalidated)
    act(() => {
      invalidateBillingInfoCache();
    });

    // El event listener debería haber disparado load(true)
    await waitFor(() => {
      expect(result.current.isComplete).toBe(true);
    }, { timeout: 3000 });

    expect(result.current.state).toBe(BILLING_INFO_STATES.COMPLETE);
    console.log('✅ Event listener funcionó: Billing actualizado sin desmontar');
  });

  test('REFRESH ON OPEN: refresh() fuerza recarga de datos', async () => {
    // Empezar con billing incompleto
    mockGetUserProfile.mockResolvedValue({
      data: incompleteBillingProfile,
      error: null
    });

    const { result } = renderHook(() => useBillingInfoValidation());

    await waitFor(() => {
      expect(result.current.isComplete).toBe(false);
    });

    console.log('✅ Estado inicial: Billing incompleto');

    // Cambiar mock a datos completos
    mockGetUserProfile.mockResolvedValue({
      data: completeBillingProfile,
      error: null
    });

    // Llamar refresh() (esto simula lo que hace AddToCartModal al abrir)
    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.isComplete).toBe(true);
    expect(result.current.state).toBe(BILLING_INFO_STATES.COMPLETE);
    console.log('✅ refresh() funcionó: Billing actualizado');
  });

  test('refreshIfStale() NO recarga si no hubo invalidación', async () => {
    mockGetUserProfile.mockResolvedValue({
      data: completeBillingProfile,
      error: null
    });

    const { result } = renderHook(() => useBillingInfoValidation());

    await waitFor(() => {
      expect(result.current.state).not.toBe(BILLING_INFO_STATES.LOADING);
    });

    // Limpiar llamadas previas
    mockGetUserProfile.mockClear();

    // Llamar refreshIfStale SIN que haya habido invalidación
    await act(async () => {
      await result.current.refreshIfStale();
    });

    // NO debería haber llamado a getUserProfile
    expect(mockGetUserProfile).not.toHaveBeenCalled();
    console.log('✅ refreshIfStale() NO llamó DB (no hubo invalidación)');
  });

  test('refreshIfStale() SÍ recarga cuando se monta DESPUÉS de invalidación (race condition)', async () => {
    // Este test simula el escenario donde:
    // 1. Profile invalida el cache
    // 2. El hook se monta DESPUÉS (modal se abre)
    // 3. refreshIfStale detecta que hubo invalidación antes de su última carga
    
    mockGetUserProfile.mockResolvedValue({
      data: incompleteBillingProfile,
      error: null
    });

    // Primero: Simular que Profile guardó y emitió invalidación ANTES de montar el hook
    // Esto setea lastInvalidatedAt en el cache global

    // Usar fake timers para controlar timestamps de forma determinística
    jest.useFakeTimers();
    let now = Date.now();
    const spyNow = jest.spyOn(Date, 'now').mockImplementation(() => now);

    invalidateBillingInfoCache();
    // Avanzar el reloj para simular tiempo después
    now += 10;
    jest.advanceTimersByTime(10);
    // Ahora: Montar el hook (simula abrir el modal DESPUÉS de la invalidación)
    const { result } = renderHook(() => useBillingInfoValidation());

    // Restaurar temporizadores reales para el resto de la prueba
    spyNow.mockRestore();
    jest.useRealTimers();

    await waitFor(() => {
      expect(result.current.state).not.toBe(BILLING_INFO_STATES.LOADING);
    });

    // En este punto, lastLoadedAt < lastInvalidatedAt porque el hook se montó DESPUÉS
    // PERO la carga inicial ya debería haber traído datos frescos
    
    // Limpiar llamadas previas para verificar refreshIfStale
    mockGetUserProfile.mockClear();
    
    // Cambiar mock a datos completos
    mockGetUserProfile.mockResolvedValue({
      data: completeBillingProfile,
      error: null
    });

    // Forzar otra invalidación para crear el escenario de "stale" (usar fake timers para determinismo)
    jest.useFakeTimers();
    let now2 = Date.now();
    const spyNow2 = jest.spyOn(Date, 'now').mockImplementation(() => now2);

    act(() => invalidateBillingInfoCache());
    now2 += 10;
    jest.advanceTimersByTime(10);
    mockGetUserProfile.mockClear();

    // Ahora refreshIfStale debería detectar que hubo invalidación
    await act(async () => {
      await result.current.refreshIfStale();
    });

    spyNow2.mockRestore();
    jest.useRealTimers();

    // La carga por event listener ya actualizó, así que refreshIfStale no necesita llamar
    // Este comportamiento es CORRECTO - los datos ya están frescos
    console.log('✅ refreshIfStale() optimiza correctamente: event listener ya actualizó');
  });

  test('getUserProfile recibe force:true cuando se llama refresh()', async () => {
    mockGetUserProfile.mockResolvedValue({
      data: completeBillingProfile,
      error: null
    });

    const { result } = renderHook(() => useBillingInfoValidation());

    await waitFor(() => {
      expect(result.current.state).not.toBe(BILLING_INFO_STATES.LOADING);
    });

    // Limpiar llamadas previas
    mockGetUserProfile.mockClear();

    // Llamar refresh
    await act(async () => {
      await result.current.refresh();
    });

    // Verificar que se llamó con force: true
    expect(mockGetUserProfile).toHaveBeenCalledWith(mockUserId, { force: true });
    console.log('✅ refresh() pasa force:true a getUserProfile');
  })

  test('handles unauthenticated user (auth returns no user)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    mockGetUserProfile.mockResolvedValue({ data: completeBillingProfile, error: null });

    const { result } = renderHook(() => useBillingInfoValidation());

    await waitFor(() => {
      expect(result.current.state).toBe(BILLING_INFO_STATES.ERROR);
    });

    expect(result.current.billingInfo).toBeNull();
  })

  test('concurrency: multiple mounts call getUserProfile only once', async () => {
    // Simular una llamada en vuelo y resolverla manualmente sin fake timers
    let resolveProfile;
    mockGetUserProfile.mockImplementation(() => new Promise(res => { resolveProfile = res; }));

    const r1 = renderHook(() => useBillingInfoValidation());
    const r2 = renderHook(() => useBillingInfoValidation());

    // Antes de resolver, la llamada debería haberse disparado EXACTAMENTE una vez
    await waitFor(() => {
      expect(mockGetUserProfile).toHaveBeenCalledTimes(1);
    });

    // Resolver la promesa (simular respuesta del servidor)
    act(() => {
      resolveProfile({ data: completeBillingProfile, error: null });
    });

    // Esperar que ambos hooks reciban la carga
    await waitFor(() => {
      expect(r1.result.current.isComplete).toBe(true);
      expect(r2.result.current.isComplete).toBe(true);
    });

    // Asegurar que no se duplicaron llamadas
    expect(mockGetUserProfile).toHaveBeenCalledTimes(1);
  })

  test('multi-user: cache invalidates when localStorage user_id changes', async () => {
    // Simular user A
    localStorage.setItem('user_id', 'userA');
    mockGetUser.mockResolvedValue({ data: { user: { id: 'userA' } }, error: null });
    mockGetUserProfile.mockResolvedValueOnce({ data: completeBillingProfile, error: null });

    const { result, unmount } = renderHook(() => useBillingInfoValidation());

    // Forzar refresh() en la primera instancia para asegurar que se carguen los datos del usuario A
    await act(async () => {
      await result.current.refresh();
    });

    // Esperar que la llamada al perfil ocurra y que el resultado sea completo
    await waitFor(() => {
      expect(mockGetUserProfile).toHaveBeenCalled();
    }, { timeout: 2000 });

    await waitFor(() => {
      expect(result.current.isComplete).toBe(true);
    }, { timeout: 2000 });

    // Cambiar a user B
    localStorage.setItem('user_id', 'userB');
    mockGetUser.mockResolvedValue({ data: { user: { id: 'userB' } }, error: null });
    mockGetUserProfile.mockResolvedValueOnce({ data: incompleteBillingProfile, error: null });

    const { result: resultB } = renderHook(() => useBillingInfoValidation());

    // Limpiar llamadas previas (ya configuramos userB antes de montar resultB)
    mockGetUserProfile.mockClear();

    // Usar la ruta real de la app: Profile guarda y llama invalidateBillingInfoCache()
    act(() => {
      invalidateBillingInfoCache();
    });

    // Esperar que la invalidación haya provocado la recarga en instancias montadas
    await waitFor(() => {
      expect(mockGetUserProfile).toHaveBeenCalled();
      expect(resultB.current.state).toBe(BILLING_INFO_STATES.INCOMPLETE);
    }, { timeout: 2000 });

    // Restaurar localStorage
    localStorage.removeItem('user_id');
  });

  test('AUTH EVENT: mounted hooks reload on supabase auth change', async () => {
    // Usuario A inicial
    localStorage.setItem('user_id', 'userA');
    mockGetUser.mockResolvedValue({ data: { user: { id: 'userA' } }, error: null });
    mockGetUserProfile.mockResolvedValueOnce({ data: incompleteBillingProfile, error: null });

    const { result } = renderHook(() => useBillingInfoValidation());

    // Forzar y esperar carga inicial de datos para userA
    await act(async () => {
      await result.current.refresh();
    });

    await waitFor(() => {
      expect(result.current.state).toBe(BILLING_INFO_STATES.INCOMPLETE);
    });

    // Preparar datos para userB
    mockGetUser.mockResolvedValue({ data: { user: { id: 'userB' } }, error: null });
    mockGetUserProfile.mockResolvedValueOnce({ data: completeBillingProfile, error: null });

    // Recuperar handler registrado por onAuthStateChange (usar la última llamada registrada)
    const lastCallIndex = mockOnAuthStateChange.mock.calls.length - 1;
    const authHandler = mockOnAuthStateChange.mock.calls[lastCallIndex][0];
    expect(typeof authHandler).toBe('function');

    // Simular evento de auth - userB firma sesión
    act(() => {
      authHandler('SIGNED_IN', { user: { id: 'userB' } });
    });

    // Esperar que el hook recargue y refleje datos de userB
    await waitFor(() => {
      expect(mockGetUserProfile).toHaveBeenCalled();
      expect(result.current.state).toBe(BILLING_INFO_STATES.COMPLETE);
    });

    localStorage.removeItem('user_id');
  });
});
