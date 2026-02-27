const ERROR_PATTERNS = [
  {
    patterns: [
      'operationfailedtitle',
      'operationfailedbody',
      'operation failed',
      'khenshin',
    ],
    message:
      'No se pudo completar la operación en Khipu. Inténtalo nuevamente en unos segundos.',
  },
  {
    patterns: [
      'timeout',
      'timed out',
      'time out',
      'etimedout',
      'econnaborted',
      'socket disconnected',
      'io server disconnect',
      'request timeout',
    ],
    message:
      'La conexión con el medio de pago tardó demasiado. Reintenta en unos segundos.',
  },
  {
    patterns: [
      'failed to fetch',
      'networkerror',
      'network request failed',
      'load failed',
      'fetcherror',
      'offline',
    ],
    message:
      'No fue posible conectarse con el servicio de pago. Revisa tu conexión e inténtalo otra vez.',
  },
  {
    patterns: [
      'sdk khipu no disponible',
      'no se pudo cargar el script de khipu',
      'startoperation no disponible',
      'constructor/cliente khipu no encontrado',
      'cliente khipu inválido',
    ],
    message:
      'No pudimos abrir el formulario de pago de Khipu. Reintenta o usa la opción de pago en Khipu.com.',
  },
  {
    patterns: [
      'la respuesta no contenía una url de pago',
      'error al crear orden de pago en khipu',
      'error al invocar la función de supabase',
      'error devuelto por la función de pago',
    ],
    message:
      'No se pudo iniciar el pago en este momento. Inténtalo nuevamente en unos minutos.',
  },
  {
    patterns: ['user_canceled', 'user cancelled', 'cancelado por el usuario'],
    message: 'El pago fue cancelado. Puedes intentarlo nuevamente cuando quieras.',
  },
];

const normalize = (text) => String(text || '').trim().toLowerCase();

const extractErrorText = (errorLike) => {
  if (!errorLike) return '';
  if (typeof errorLike === 'string') return errorLike;

  const message = errorLike.message || '';
  const exitMessage = errorLike.exitMessage || '';
  const exitTitle = errorLike.exitTitle || '';
  const failureReason = errorLike.failureReason || '';

  return `${message} ${exitTitle} ${exitMessage} ${failureReason}`.trim();
};

export const getFriendlyCheckoutErrorMessage = (
  errorLike,
  fallbackMessage = 'Ocurrió un problema al procesar el pago. Inténtalo nuevamente.'
) => {
  const normalized = normalize(extractErrorText(errorLike));
  if (!normalized) return fallbackMessage;

  const matched = ERROR_PATTERNS.find(({ patterns }) =>
    patterns.some((pattern) => normalized.includes(pattern))
  );

  return matched?.message || fallbackMessage;
};
