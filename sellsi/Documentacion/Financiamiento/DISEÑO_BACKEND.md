# Diseño Backend - Sistema Financiamiento

> **Estado**: Documento de diseño - Las tablas aún no existen en BD  
> **Última actualización**: 17 de Enero de 2026

---

## 📋 Checklist de Implementación

### Tablas por Crear
- [ ] `buyer` - Datos legales del comprador (se crea al solicitar primer financiamiento)
- [ ] `supplier` - Datos legales del proveedor (editables desde Profile)
- [ ] `financing_requests` - Solicitudes de financiamiento
- [ ] `financing_transactions` - Historial de consumos, pagos y reposiciones
- [ ] `financing_documents` - Documentos adjuntos (garantías, contratos, pagarés)

### Storage Buckets por Crear
- [ ] `financing-documents` - Bucket para almacenar documentos de financiamiento
  - Políticas RLS: Solo buyer/supplier del financiamiento pueden acceder
  - Tipos permitidos: PDF, DOC, DOCX, JPG, JPEG, PNG
  - Tamaño máximo: 10MB por archivo

### Triggers por Crear
- [ ] `restore_financing_on_supplier_order_cancel` - Reponer monto cuando supplier rechaza/cancela su supplier_order
- [ ] `update_buyer_overdue_flag` - Actualizar flag de mora en tiempo real cuando status cambia a 'paid'

### Cron Jobs por Crear
- [ ] Expiración diaria de financiamientos (00:01)
- [ ] Actualización de flag de mora en buyers
- [ ] Notificaciones de mora

### Edge Functions por Crear
- [ ] `generate-financing-contract` - Genera PDF de contrato/pagaré con datos de BD (se ejecuta cuando supplier aprueba)

### Cambios Pendientes en Frontend
- [ ] **ExpressRequestModal.jsx**: Agregar campo `RUT Representante Legal` (OBLIGATORIO)
- [ ] **ExtendedRequestModal.jsx**: Agregar campo `RUT Representante Legal` (OBLIGATORIO)
- [ ] **SupplierLegalInfoSection.jsx**: Conectar con nueva tabla `supplier`

---

## Arquitectura de Tablas

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│    users    │◄─────│    buyer    │      │  supplier   │
│  (user_id)  │◄─────│  (user_id)  │      │  (user_id)  │
└─────────────┘      └─────────────┘      └─────────────┘
       │                    │                    │
       │              ┌─────┴────────────────────┘
       │              ▼
       │    ┌───────────────────────┐
       │    │  financing_requests   │
       │    │  (buyer_id,           │
       │    │   supplier_id)        │
       │    └───────────┬───────────┘
       │                │
       │         ┌──────┴──────┐
       │         ▼             ▼
       │  ┌─────────────┐  ┌─────────────────────┐
       │  │  financing  │  │ financing_documents │
       │  │transactions │  └─────────────────────┘
       │  └─────────────┘
       │
       └──────────────────────────────►  Otras tablas existentes
```

---

## Reglas de Negocio Críticas

| Regla | Descripción |
|-------|-------------|
| N financiamientos activos | Un buyer puede tener múltiples financiamientos activos con el mismo supplier |
| Máx 5 por supplier | Límite de 5 financiamientos activos por par buyer-supplier |
| Plazo desde aprobación | `term_days` cuenta desde `approved_by_sellsi` (campo `activated_at`) |
| Buyer elige condiciones | Buyer define `amount` y `term_days` (1-60), supplier solo acepta/rechaza |
| Pago parcial opcional | Buyer puede pagar de a poco durante el plazo, o todo al final |
| No sobrepagar | No se permite pagar más de `amount_used` |
| Pago completo al expirar | Una vez expirado, debe pagar `balance` completo de una vez |
| Mora bloquea nuevos | Con financiamiento en mora, no puede solicitar nuevos |
| Mora no bloquea uso | Puede seguir usando otros financiamientos ya aprobados |
| Selección manual | Buyer elige qué financiamiento(s) usar en checkout |
| Mix de pagos | Un producto puede pagarse con N financiamientos + dinero real |
| Expiración por fecha | Mora comienza 00:00 del día siguiente al `expires_at` |
| Reposición automática | Si supplier cancela/rechaza orden, se repone el monto automáticamente |
| Reposición manual | Admin puede reponer monto manualmente desde control_panel |
| Firma con FEA externa | Usuario descarga template PDF, firma externamente, sube PDF firmado |

---

## Formato de ID de Solicitud

El ID de financiamiento se muestra de forma legible en el frontend:
- **Formato**: `#` + últimos 8 dígitos del UUID
- **Ejemplo**: UUID `550e8400-e29b-41d4-a716-446655440000` → `#55440000`
- **Implementación**: Mismo patrón usado en Supplier Orders

---

## 1. Tabla `buyer`

Extiende datos de usuario para compradores. **Se crea/actualiza solo cuando el buyer envía una solicitud de financiamiento.**

```sql
CREATE TABLE public.buyer (
  user_id uuid PRIMARY KEY REFERENCES public.users(user_id) ON DELETE CASCADE,
  
  -- Datos legales (pre-llenan modal de financiamiento)
  legal_name text,                      -- Razón social empresa
  legal_rut varchar(12),                -- RUT empresa
  legal_representative_name text,       -- Nombre representante legal
  legal_representative_rut varchar(12), -- RUT representante legal (OBLIGATORIO en modal)
  legal_address text,                   -- Dirección legal
  legal_commune varchar(100),           -- Comuna
  legal_region varchar(100),            -- Región
  
  -- Preferencias
  auto_fill_financing_modal boolean DEFAULT true,  -- Pre-llenar modal con datos guardados
  
  -- Flag de mora (actualizado por cron job diario)
  has_overdue_financing boolean DEFAULT false,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Uso**: 
- **Toggle ON**: Modal pre-llena con datos de `buyer`
- **Toggle OFF**: Modal abre vacío
- **Al enviar (siempre)**: UPSERT `buyer` con datos del form + INSERT `financing_requests` con snapshot

**Nota sobre Flag de Mora**: Se usa Opción A (flag en tabla) en lugar de query en tiempo real para mejor performance en validaciones frecuentes durante checkout.

---

## 2. Tabla `supplier`

Extiende datos de usuario para proveedores. **Editables desde Profile > Información Legal.**

> **Nota**: Actualmente `SupplierLegalInfoSection.jsx` en Profile maneja estos campos pero no están conectados a BD. Esta tabla almacenará esos datos.

```sql
CREATE TABLE public.supplier (
  user_id uuid PRIMARY KEY REFERENCES public.users(user_id) ON DELETE CASCADE,
  
  -- Datos legales (editables desde Profile)
  legal_name text,                      -- Razón social empresa
  legal_rut varchar(12),                -- RUT empresa
  legal_representative_name text,       -- Nombre representante legal
  legal_representative_rut varchar(12), -- RUT representante legal
  legal_address text,                   -- Dirección legal
  legal_commune varchar(100),           -- Comuna
  legal_region varchar(100),            -- Región
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### Mapeo Frontend → BD
| Campo en SupplierLegalInfoSection | Campo en tabla supplier |
|-----------------------------------|-------------------------|
| `supplierLegalRut` | `legal_rut` |
| `supplierLegalName` | `legal_name` |
| `supplierLegalRepRut` | `legal_representative_rut` |
| `supplierLegalRepName` | `legal_representative_name` |
| `supplierLegalAddress` | `legal_address` |
| `supplierLegalRegion` | `legal_region` |
| `supplierLegalCommune` | `legal_commune` |

---

## 3. Tabla `financing_requests`

Solicitudes con **snapshot inmutable** de datos legales de ambas partes. Permite N activos por buyer-supplier.

```sql
CREATE TABLE public.financing_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relaciones
  buyer_id uuid NOT NULL REFERENCES public.users(user_id),
  supplier_id uuid NOT NULL REFERENCES public.users(user_id),
  
  -- Tipo de solicitud (definido por modal usado: ExpressRequestModal o ExtendedRequestModal)
  request_type varchar(10) NOT NULL CHECK (request_type IN ('express', 'extended')),
  
  -- Datos financieros
  amount numeric NOT NULL CHECK (amount > 0),
  amount_used numeric DEFAULT 0 CHECK (amount_used >= 0),
  amount_paid numeric DEFAULT 0 CHECK (amount_paid >= 0),
  amount_refunded numeric DEFAULT 0 CHECK (amount_refunded >= 0),  -- Dinero devuelto al comprador
  term_days integer NOT NULL CHECK (term_days BETWEEN 1 AND 60),
  
  -- Snapshot BUYER (copia inmutable al crear solicitud)
  buyer_legal_name text NOT NULL,
  buyer_legal_rut varchar(12) NOT NULL,
  buyer_legal_representative_name text NOT NULL,
  buyer_legal_representative_rut varchar(12) NOT NULL,  -- ⚠️ OBLIGATORIO (agregar campo a modales)
  buyer_legal_address text,
  buyer_legal_commune varchar(100),
  buyer_legal_region varchar(100),
  
  -- Snapshot SUPPLIER (copia cuando supplier aprueba)
  supplier_legal_name text,
  supplier_legal_rut varchar(12),
  supplier_legal_representative_name text,
  supplier_legal_representative_rut varchar(12),
  supplier_legal_address text,
  supplier_legal_commune varchar(100),
  supplier_legal_region varchar(100),
  
  -- Estado
  status varchar(30) NOT NULL DEFAULT 'pending_supplier_review',
  
  -- Motivos
  rejection_reason text,
  cancellation_reason text,
  
  -- Admin que aprobó
  approved_by_admin_id uuid REFERENCES public.control_panel_users(id),
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  approved_at timestamptz,           -- Cuando SUPPLIER aprobó
  rejected_at timestamptz,
  cancelled_at timestamptz,
  signed_buyer_at timestamptz,
  signed_supplier_at timestamptz,
  signed_sellsi_at timestamptz,      -- Cuando SELLSI firmó el documento
  activated_at date,                 -- Cuando SELLSI aprobó (inicia term_days)
  expires_at date,                   -- activated_at + term_days (último día válido)
  
  -- Constraints
  CONSTRAINT financing_status_check CHECK (
    status IN (
      'pending_supplier_review',
      'rejected_by_supplier',
      'buyer_signature_pending',
      'cancelled_by_buyer',
      'supplier_signature_pending',
      'cancelled_by_supplier',
      'pending_sellsi_approval',
      'approved_by_sellsi',
      'rejected_by_sellsi',
      'expired',
      'paid'
    )
  )
);

-- Índices
CREATE INDEX idx_financing_buyer ON public.financing_requests (buyer_id, status, created_at DESC);
CREATE INDEX idx_financing_supplier ON public.financing_requests (supplier_id, status);
CREATE INDEX idx_financing_active ON public.financing_requests (buyer_id, supplier_id) 
  WHERE status = 'approved_by_sellsi';
CREATE INDEX idx_financing_expired ON public.financing_requests (expires_at) 
  WHERE status = 'approved_by_sellsi';
-- Índice vital para el trigger de actualización de mora (performance)
CREATE INDEX idx_financing_buyer_overdue_check ON public.financing_requests (buyer_id) 
  WHERE status = 'expired' AND amount_used > amount_paid;
```

### Mapeo Frontend → BD (Modales de Solicitud)
| Campo en Modal | Campo en financing_requests |
|----------------|----------------------------|
| `formData.type` | `request_type` ('express' o 'extended') |
| `formData.amount` | `amount` |
| `formData.term` | `term_days` |
| `formData.businessName` | `buyer_legal_name` |
| `formData.rut` | `buyer_legal_rut` |
| `formData.legalRepresentative` | `buyer_legal_representative_name` |
| ⚠️ **FALTA EN MODAL** | `buyer_legal_representative_rut` |
| `formData.legalAddress` | `buyer_legal_address` |
| `formData.legalCommune` | `buyer_legal_commune` |
| `formData.legalRegion` | `buyer_legal_region` |

### Clarificación de Timestamps
| Campo | Cuándo se setea | Quién lo hace |
|-------|-----------------|---------------|
| `approved_at` | Supplier aprueba → **se genera template PDF** | Supplier |
| `signed_buyer_at` | Buyer sube PDF firmado con FEA | Buyer |
| `signed_supplier_at` | Supplier sube PDF firmado con FEA (sobre firma buyer) | Supplier |
| `signed_sellsi_at` | Sellsi sube PDF firmado con FEA (sobre firmas buyer+supplier) | Admin |
| `activated_at` | Sellsi marca approved_by_sellsi → inicia plazo | Admin (control_panel) |
| `expires_at` | Se calcula: `activated_at + term_days` | Admin (control_panel) |

### Momentos de Snapshot
| Campos | Cuándo se copian |
|--------|------------------|
| `buyer_*` | Al crear solicitud (INSERT) |
| `supplier_*` | Cuando supplier aprueba (status → `buyer_signature_pending`) |

### Campos Calculados (runtime)
```sql
-- Saldo disponible para usar
available_balance = amount - amount_used

-- Deuda actual
balance = amount_used - amount_paid

-- Saldo a favor pendiente de devolución (reembolso)
refund_pending = amount_paid - amount_used - amount_refunded

-- Días en mora (si expirado)
overdue_days = GREATEST(0, CURRENT_DATE - expires_at::date)
```

### Estados

```
pending_supplier_review ──┬──► rejected_by_supplier [FINAL]
                          │
                          └──► buyer_signature_pending ──┬──► cancelled_by_buyer [FINAL]
                                                         │
                                                         └──► supplier_signature_pending ──┬──► cancelled_by_supplier [FINAL]
                                                                                           │
                                                                                           └──► pending_sellsi_approval ──┬──► rejected_by_sellsi [FINAL]
                                                                                                                          │
                                                                                                                          └──► approved_by_sellsi ──┬──► expired (cron) ──► paid [FINAL]
                                                                                                                                                    │
                                                                                                                                                    └──► paid [FINAL]
```

| Estado | Descripción | Usable |
|--------|-------------|--------|
| `approved_by_sellsi` | Activo, dentro del plazo | ✅ |
| `expired` | Plazo vencido, pendiente de pago | ❌ |
| `paid` | Deuda saldada completamente | ❌ |

---

## 4. Tabla `financing_transactions`

Registro de consumos, pagos y **reposiciones** para auditoría completa y cálculo de balances.

```sql
CREATE TABLE public.financing_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  financing_id uuid NOT NULL REFERENCES public.financing_requests(id) ON DELETE CASCADE,
  
  -- Tipo de transacción
  type varchar(15) NOT NULL CHECK (type IN ('consumo', 'pago', 'reposicion', 'devolucion')),
  amount numeric NOT NULL CHECK (amount > 0),
  
  -- Referencias según tipo
  supplier_order_id uuid REFERENCES public.supplier_orders(id),  -- Si type = 'consumo' o 'reposicion'
  payment_method varchar(20),                            -- Si type = 'pago' (khipu, flow, transferencia)
  payment_reference text,                                -- ID transacción externa (pago)
  
  -- Campos específicos para reposición
  restoration_reason text,                               -- Motivo de la reposición
  restored_by uuid REFERENCES public.control_panel_users(id),  -- Admin que repuso (null si automático)
  is_automatic boolean DEFAULT false,                    -- true si fue por trigger de cancelación
  
  -- Auditoría
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES public.users(user_id)       -- Usuario que generó la transacción (NULL si automático)
);

CREATE INDEX idx_ftx_financing ON public.financing_transactions (financing_id, type, created_at);
CREATE INDEX idx_ftx_supplier_order ON public.financing_transactions (supplier_order_id) WHERE supplier_order_id IS NOT NULL;
CREATE INDEX idx_ftx_reposiciones ON public.financing_transactions (financing_id, created_at) 
  WHERE type = 'reposicion';
```

### Lógica de Reposición y Reembolsos

**Cuando se repone un monto:**
1. Se resta de `amount_used` en `financing_requests`
2. **NO se ajusta `amount_paid`** - esto permite rastrear saldo a favor
3. Si `amount_paid > amount_used`, significa que hay **reembolso pendiente** de dinero real

**Flujo de dinero real en Sellsi:**
- Comprador paga financiamiento → Dinero va a Sellsi (retención)
- Si orden se completa → Sellsi libera fondos a proveedor
- Si proveedor cancela → Puntos regresan automáticamente + **Sellsi debe transferir dinero real de vuelta al comprador**

**Ejemplo de reembolso:**
```
Estado inicial:  amount=100,000 | amount_used=100,000 | amount_paid=50,000 | amount_refunded=0 | balance=50,000
Proveedor cancela orden de 100,000:
Estado después:  amount=100,000 | amount_used=0        | amount_paid=50,000 | amount_refunded=0 | refund_pending=50,000
                 ⚠️ Saldo a favor: 50,000 (reembolso pendiente para control_panel)

Admin procesa devolución de 50,000:
Estado final:    amount=100,000 | amount_used=0        | amount_paid=50,000 | amount_refunded=50,000 | refund_pending=0
                 ✅ Histórico completo: Pagó 50k, se le devolvió 50k
```

**Query para Control Panel - Reembolsos Pendientes:**
```sql
-- Financiamientos con saldo a favor (dinero real a devolver)
SELECT 
  fr.id,
  fr.buyer_id,
  ub.user_nm as buyer_name,
  fr.amount_paid - fr.amount_used - fr.amount_refunded as refund_pending,
  fr.updated_at as refund_generated_at
FROM financing_requests fr
JOIN users ub ON ub.user_id = fr.buyer_id
WHERE (fr.amount_paid - fr.amount_used - fr.amount_refunded) > 0
ORDER BY fr.updated_at DESC;
```

### Ejemplo de Movimientos Completo
```
| financing_id | type       | amount  | supplier_order_id | restoration_reason        | is_automatic | created_at |
|--------------|------------|---------|-------------------|---------------------------|--------------|------------|
| uuid-1       | consumo    | 30,000  | sup-order-1       | null                      | false        | día 5      |
| uuid-1       | pago       | 10,000  | null              | null                      | false        | día 10     |
| uuid-1       | consumo    | 50,000  | sup-order-2       | null                      | false        | día 15     |
| uuid-1       | reposicion | 50,000  | sup-order-2       | Supplier canceló orden    | true         | día 16     |
| uuid-1       | devolucion | 50,000  | null              | Devolución de excedentes  | false        | día 20     |
```

---

## 5. Tabla `financing_documents`

Documentos: garantías (buyer), contratos y pagarés (sistema).

> **Recomendación**: Usar tipos específicos para mejor trazabilidad y filtrado.

```sql
CREATE TABLE public.financing_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  financing_id uuid NOT NULL REFERENCES public.financing_requests(id) ON DELETE CASCADE,
  
  -- Tipo de documento (específicos para mejor trazabilidad)
  document_type varchar(30) NOT NULL CHECK (document_type IN (
    -- Garantías subidas por buyer (solo en solicitud extendida)
    'certificado_poderes',           -- Certificado de poderes
    'vigencia_poderes',              -- Certificado de vigencia de poderes
    'carpeta_tributaria',            -- Carpeta tributaria simplificada
    'otros_garantia',                -- Otros documentos opcionales
    -- Documentos generados por sistema
    'contrato',                      -- Contrato marco firmado
    'pagare'                         -- Pagaré firmado
  )),
  document_name varchar(100),
  storage_path text NOT NULL,
  file_size integer,
  mime_type varchar(50),
  
  -- Quién subió el documento (buyer/supplier o admin)
  uploaded_by uuid REFERENCES public.users(user_id),              -- Si lo sube buyer/supplier
  uploaded_by_admin_id uuid REFERENCES public.control_panel_users(id),  -- Si lo sube admin Sellsi
  uploaded_at timestamptz DEFAULT now(),
  
  -- Validar que al menos uno esté presente
  CONSTRAINT one_uploader CHECK (
    (uploaded_by IS NOT NULL AND uploaded_by_admin_id IS NULL) OR
    (uploaded_by IS NULL AND uploaded_by_admin_id IS NOT NULL)
  )
);

CREATE INDEX idx_fdocs_financing ON public.financing_documents (financing_id, document_type);
```

### Documentos por Tipo de Solicitud

| Tipo Solicitud | Documentos Requeridos |
|----------------|----------------------|
| **Express** | Solo contrato y pagaré (generados por sistema) |
| **Extended** | Certificado poderes + Vigencia poderes + Carpeta tributaria + Contrato + Pagaré |

### Mapeo Frontend → BD (ExtendedRequestModal)
| Campo en Modal | document_type |
|----------------|---------------|
| `powersCertificate` | `certificado_poderes` |
| `powersValidityCertificate` | `vigencia_poderes` |
| `simplifiedTaxFolder` | `carpeta_tributaria` |
| `others` (opcional) | `otros_garantia` |

---

## 6. Trigger: Reposición Automática en Cancelación de Supplier Order

Cuando el **supplier rechaza o cancela** su parte del pedido (`supplier_orders`) que usó financiamiento, se repone automáticamente.

> **Nota**: El trigger está en `supplier_orders` porque el financiamiento es por supplier. Una `order` puede tener múltiples `supplier_orders`, y si se cancela uno, solo se repone ese financiamiento.

```sql
-- Trigger function
CREATE OR REPLACE FUNCTION restore_financing_on_supplier_order_cancel()
RETURNS TRIGGER AS $$
DECLARE
  v_financing_tx RECORD;
BEGIN
  -- Solo ejecutar si el status cambió a 'rejected' o 'cancelled'
  IF NEW.status IN ('rejected', 'cancelled') AND OLD.status NOT IN ('rejected', 'cancelled') THEN
    
    -- Buscar transacciones de consumo asociadas a este supplier_order
    FOR v_financing_tx IN 
      SELECT ft.financing_id, ft.amount 
      FROM financing_transactions ft
      WHERE ft.supplier_order_id = NEW.id 
        AND ft.type = 'consumo'
    LOOP
      -- 1. Reducir amount_used en financing_requests
      -- IMPORTANTE: NO ajustamos amount_paid para rastrear saldo a favor (reembolsos pendientes)
      UPDATE financing_requests
      SET amount_used = GREATEST(0, amount_used - v_financing_tx.amount),
          updated_at = now()
      WHERE id = v_financing_tx.financing_id;
      
      -- 2. Registrar transacción de reposición
      INSERT INTO financing_transactions (
        financing_id, type, amount, supplier_order_id, 
        restoration_reason, is_automatic, created_by
      ) VALUES (
        v_financing_tx.financing_id,
        'reposicion',
        v_financing_tx.amount,
        NEW.id,
        CASE 
          WHEN NEW.status = 'rejected' THEN 'Pedido rechazado por proveedor'
          ELSE 'Pedido cancelado por proveedor'
        END,
        true,
        NEW.supplier_id  -- El supplier que rechazó/canceló
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger en tabla supplier_orders
CREATE TRIGGER trg_restore_financing_on_supplier_order_cancel
  AFTER UPDATE ON supplier_orders
  FOR EACH ROW
  EXECUTE FUNCTION restore_financing_on_supplier_order_cancel();
```

### Trigger: Actualización de Flag de Mora en Tiempo Real

**Problema:** El cron job actualiza el flag de mora una vez al día (00:01). Si un buyer paga su deuda a las 10:00 AM, no puede solicitar nuevo financiamiento hasta el día siguiente.

**Solución:** Trigger que actualiza el flag inmediatamente cuando un financiamiento cambia a estado 'paid'.

```sql
-- Trigger function
CREATE OR REPLACE FUNCTION update_buyer_overdue_flag()
RETURNS TRIGGER AS $$
BEGIN
  -- Ejecutar cuando status cambia a 'paid' (desbloquea) o 'expired' (puede bloquear)
  IF (NEW.status = 'paid' AND OLD.status != 'paid') OR 
     (NEW.status = 'expired' AND OLD.status != 'expired') THEN
    -- Actualizar flag del buyer inmediatamente
    UPDATE buyer
    SET has_overdue_financing = EXISTS (
      SELECT 1 FROM financing_requests fr
      WHERE fr.buyer_id = NEW.buyer_id
        AND fr.status = 'expired'
        AND fr.amount_used > fr.amount_paid
    ),
    updated_at = now()
    WHERE user_id = NEW.buyer_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger en tabla financing_requests
CREATE TRIGGER trg_update_buyer_overdue_flag
  AFTER UPDATE ON financing_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_buyer_overdue_flag();
```

---

## 7. Cron Jobs

### Expiración de Financiamientos
```sql
-- Ejecutar diariamente a las 00:01 (Chile time)
UPDATE financing_requests
SET status = 'expired', updated_at = now()
WHERE status = 'approved_by_sellsi'
  AND expires_at < CURRENT_DATE;
```

### Actualizar Flag de Mora en Buyers
```sql
-- Ejecutar diariamente después de expiración
-- Solo actualiza buyers que tienen registro en la tabla buyer
UPDATE buyer b
SET has_overdue_financing = EXISTS (
  SELECT 1 FROM financing_requests fr
  WHERE fr.buyer_id = b.user_id
    AND fr.status = 'expired'
    AND fr.amount_used > fr.amount_paid
),
updated_at = now()
WHERE EXISTS (SELECT 1 FROM financing_requests WHERE buyer_id = b.user_id);
```

### Notificaciones de Mora
```sql
-- Ejecutar diariamente
INSERT INTO notifications (user_id, supplier_id, type, role_context, context_section, title, body, metadata)
SELECT 
  fr.buyer_id,
  fr.supplier_id,
  'financing_overdue',
  'buyer',
  'financing',
  'Financiamiento vencido',
  format('Tienes un pago pendiente de $%s con %s', 
    fr.amount_used - fr.amount_paid, 
    (SELECT user_nm FROM users WHERE user_id = fr.supplier_id)),
  jsonb_build_object('financing_id', fr.id, 'balance', fr.amount_used - fr.amount_paid)
FROM financing_requests fr
WHERE fr.status = 'expired'
  AND fr.amount_used > fr.amount_paid
  -- Evitar duplicados: solo si no se notificó hoy
  AND NOT EXISTS (
    SELECT 1 FROM notifications n
    WHERE n.user_id = fr.buyer_id
      AND n.type = 'financing_overdue'
      AND n.metadata->>'financing_id' = fr.id::text
      AND n.created_at::date = CURRENT_DATE
  );
```

---

## 8. Lógica de Checkout

### Validar Uso de Financiamiento
```sql
-- Antes de permitir uso en checkout
SELECT 
  id,
  amount - amount_used as available,
  status
FROM financing_requests
WHERE buyer_id = :buyer_id
  AND supplier_id = :supplier_id
  AND status = 'approved_by_sellsi'
  AND expires_at >= CURRENT_DATE
  AND (amount - amount_used) > 0
ORDER BY expires_at ASC; -- Mostrar primero los que vencen antes
```

### Registrar Consumo (en transacción)
```sql
-- IMPORTANTE: Validar antes que financing.supplier_id = supplier_order.supplier_id
BEGIN;
  -- 1. Actualizar amount_used con RETURNING para detectar saldo insuficiente
  UPDATE financing_requests
  SET amount_used = amount_used + :monto_a_usar,
      updated_at = now()
  WHERE id = :financing_id
    AND status = 'approved_by_sellsi'
    AND (amount - amount_used) >= :monto_a_usar
    AND supplier_id = :supplier_id  -- Validar que el financiamiento sea del supplier correcto
  RETURNING id;
  
  -- Si UPDATE retorna 0 filas, significa que violó alguna condición del WHERE
  -- Backend debe manejar esto como "Saldo insuficiente" o "Financiamiento no disponible"
  
  -- 2. Registrar transacción (asociada al supplier_order, no al order padre)
  INSERT INTO financing_transactions (financing_id, type, amount, supplier_order_id, created_by)
  VALUES (:financing_id, 'consumo', :monto_a_usar, :supplier_order_id, :buyer_id);
COMMIT;
```

### Registrar Pago
```sql
-- Nota: balance = amount_used - amount_paid (diferencial pendiente)
-- Si pagó parcialmente antes, solo paga lo que queda. Si no pagó nada, paga todo.
BEGIN;
  -- Validar no sobrepagar
  UPDATE financing_requests
  SET amount_paid = amount_paid + :monto_pago,
      updated_at = now(),
      status = CASE 
        WHEN amount_paid + :monto_pago >= amount_used THEN 'paid'
        ELSE status
      END
  WHERE id = :financing_id
    AND (amount_paid + :monto_pago) <= amount_used
    -- Si expirado, debe pagar balance completo de una vez
    AND (status != 'expired' OR :monto_pago = (amount_used - amount_paid));
  
  INSERT INTO financing_transactions (financing_id, type, amount, payment_method, payment_reference, created_by)
  VALUES (:financing_id, 'pago', :monto_pago, :method, :reference, :buyer_id);
COMMIT;
```

---

## 9. RLS Policies

```sql
-- financing_requests
ALTER TABLE public.financing_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "buyer_own" ON public.financing_requests
  FOR ALL USING (buyer_id = auth.uid());

CREATE POLICY "supplier_received" ON public.financing_requests
  FOR ALL USING (supplier_id = auth.uid());

CREATE POLICY "admin_all" ON public.financing_requests
  FOR ALL USING (
    EXISTS (SELECT 1 FROM control_panel_users WHERE id = auth.uid() AND is_active = true)
  );

-- financing_transactions
ALTER TABLE public.financing_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_transactions" ON public.financing_transactions
  FOR ALL USING (
    financing_id IN (
      SELECT id FROM financing_requests 
      WHERE buyer_id = auth.uid() OR supplier_id = auth.uid()
    )
  );

CREATE POLICY "admin_all_transactions" ON public.financing_transactions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM control_panel_users WHERE id = auth.uid() AND is_active = true)
  );

-- financing_documents
ALTER TABLE public.financing_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_documents" ON public.financing_documents
  FOR ALL USING (
    financing_id IN (
      SELECT id FROM financing_requests 
      WHERE buyer_id = auth.uid() OR supplier_id = auth.uid()
    )
  );

CREATE POLICY "admin_all_documents" ON public.financing_documents
  FOR ALL USING (
    EXISTS (SELECT 1 FROM control_panel_users WHERE id = auth.uid() AND is_active = true)
  );

-- buyer/supplier
ALTER TABLE public.buyer ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_buyer" ON public.buyer FOR ALL USING (user_id = auth.uid());
CREATE POLICY "own_supplier" ON public.supplier FOR ALL USING (user_id = auth.uid());

CREATE POLICY "admin_all_buyer" ON public.buyer FOR ALL USING (
  EXISTS (SELECT 1 FROM control_panel_users WHERE id = auth.uid() AND is_active = true)
);

CREATE POLICY "admin_all_supplier" ON public.supplier FOR ALL USING (
  EXISTS (SELECT 1 FROM control_panel_users WHERE id = auth.uid() AND is_active = true)
);
```

---

## 10. Validaciones de Negocio

| Validación | Implementación |
|------------|----------------|
| `amount > 0` | CHECK constraint |
| `term_days` 1-60 | CHECK constraint |
| `amount_paid <= amount_used` | CHECK constraint |
| Máx 5 activos por supplier | Query count antes de INSERT |
| No solicitar si tiene mora | `buyer.has_overdue_financing = false` |
| Solo usar financ. del supplier del producto | `financing.supplier_id = product.supplier_id` |
| No usar expirado | `status = 'approved_by_sellsi' AND expires_at >= CURRENT_DATE` |
| Saldo disponible suficiente | `(amount - amount_used) >= monto_a_usar` |

### Validar Límite 5 Activos (antes de crear solicitud)
```sql
-- Solo cuenta financiamientos "en proceso" o "activos", NO los expirados ni pagados
SELECT COUNT(*) < 5 as can_request
FROM financing_requests
WHERE buyer_id = :buyer_id
  AND supplier_id = :supplier_id
  AND status IN ('pending_supplier_review', 'buyer_signature_pending', 
                 'supplier_signature_pending', 'pending_sellsi_approval', 
                 'approved_by_sellsi');
```

### Validar No Tiene Mora (antes de crear solicitud)
```sql
-- Bloquea nueva solicitud si el buyer tiene financiamientos en mora
SELECT NOT COALESCE(has_overdue_financing, false) as can_request
FROM buyer
WHERE user_id = :buyer_id;
```

---

## 11. Queries Principales

### Financiamientos Disponibles para Checkout
```sql
SELECT 
  fr.id,
  fr.amount,
  fr.amount - fr.amount_used as available,
  fr.expires_at,
  fr.expires_at - CURRENT_DATE as days_remaining
FROM financing_requests fr
WHERE fr.buyer_id = :buyer_id
  AND fr.supplier_id = :supplier_id
  AND fr.status = 'approved_by_sellsi'
  AND fr.expires_at >= CURRENT_DATE
  AND fr.amount > fr.amount_used
ORDER BY fr.expires_at ASC;
```

### Financiamientos en Mora (Admin)
```sql
SELECT 
  fr.*,
  ub.user_nm as buyer_name,
  us.user_nm as supplier_name,
  fr.amount_used - fr.amount_paid as balance,
  CURRENT_DATE - fr.expires_at::date as overdue_days
FROM financing_requests fr
JOIN users ub ON ub.user_id = fr.buyer_id
JOIN users us ON us.user_id = fr.supplier_id
WHERE fr.status = 'expired'
  AND fr.amount_used > fr.amount_paid
ORDER BY overdue_days DESC;
```

---

## 12. Flujo de Firma (Contrato y Pagaré)

### Proceso (3 Firmas FEA)
1. **Supplier aprueba** (`approved_at`) → Edge function genera PDF template con datos de BD
2. **Buyer descarga** template → Firma con FEA externamente → **Sube PDF firmado** → `signed_buyer_at`
3. **Supplier descarga** (con firma buyer) → Firma con FEA → **Sube PDF firmado** → `signed_supplier_at`
4. **Sellsi descarga** (con firmas buyer+supplier) → Firma con FEA → **Sube PDF firmado** → `signed_sellsi_at`
5. **Sellsi** marca `approved_by_sellsi` → `activated_at` se setea → inicia plazo

### Flujo de Documentos en Storage
```
{financing_id}/
├── contrato_template.pdf          ← Generado por edge function (approved_at)
├── contrato_buyer_signed.pdf      ← Subido por buyer (1ra firma)
├── contrato_supplier_signed.pdf   ← Subido por supplier (2da firma, sobre la del buyer)
├── contrato_final.pdf             ← Subido por Sellsi (3ra firma, documento final)
└── pagare_final.pdf               ← Mismo flujo que contrato
```

---

## 13. Funciones Admin (Control Panel)

### Reposición Manual
```sql
CREATE OR REPLACE FUNCTION admin_restore_financing_amount(
  p_financing_id uuid, p_amount numeric, p_reason text, p_admin_id uuid
) RETURNS json AS $$
DECLARE
  v_financing financing_requests%ROWTYPE;
  v_new_amount_used numeric;
BEGIN
  SELECT * INTO v_financing FROM financing_requests WHERE id = p_financing_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Financiamiento no encontrado');
  END IF;
  IF p_amount > v_financing.amount_used THEN
    RETURN json_build_object('success', false, 'error', 'El monto excede amount_used');
  END IF;
  
  v_new_amount_used := v_financing.amount_used - p_amount;
  
  -- Actualizar financing_requests (NO ajustar amount_paid para rastrear saldo a favor)
  UPDATE financing_requests
  SET amount_used = v_new_amount_used,
      updated_at = now()
  WHERE id = p_financing_id;
  
  INSERT INTO financing_transactions (financing_id, type, amount, restoration_reason, restored_by, is_automatic, created_by)
  VALUES (p_financing_id, 'reposicion', p_amount, p_reason, p_admin_id, false, p_admin_id);
  
  RETURN json_build_object('success', true, 'new_amount_used', v_new_amount_used);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Procesar Devolución (Cerrar Reembolso Pendiente)
```sql
CREATE OR REPLACE FUNCTION admin_process_refund(
  p_financing_id uuid, p_amount numeric, p_admin_id uuid
) RETURNS json AS $$
DECLARE
  v_updated_rows int;
BEGIN
  -- Validación y actualización atómica (previene race conditions)
  -- La condición en WHERE garantiza que la validación se ejecuta con row-level lock
  UPDATE financing_requests
  SET amount_refunded = amount_refunded + p_amount,
      updated_at = now()
  WHERE id = p_financing_id
    AND (amount_paid - amount_used - amount_refunded) >= p_amount;
  
  GET DIAGNOSTICS v_updated_rows = ROW_COUNT;
  
  -- Si no se actualizó ninguna fila, significa que violó la condición del WHERE
  IF v_updated_rows = 0 THEN
    -- Verificar si es porque no existe o porque saldo insuficiente
    IF NOT EXISTS (SELECT 1 FROM financing_requests WHERE id = p_financing_id) THEN
      RETURN json_build_object('success', false, 'error', 'Financiamiento no encontrado');
    ELSE
      RETURN json_build_object('success', false, 'error', 'Saldo insuficiente o modificado concurrentemente');
    END IF;
  END IF;

  -- Registrar transacción de devolución
  INSERT INTO financing_transactions (financing_id, type, amount, restoration_reason, created_by)
  VALUES (p_financing_id, 'devolucion', p_amount, 'Devolución de excedentes por cancelación', p_admin_id);

  RETURN json_build_object('success', true, 'refund_processed', p_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Queries Admin
```sql
-- Historial de transacciones de un financiamiento
SELECT ft.*, u.user_nm as created_by_name,
  CASE ft.type WHEN 'consumo' THEN 'Consumo' WHEN 'pago' THEN 'Pago' WHEN 'reposicion' THEN 'Reposición' END as type_label
FROM financing_transactions ft
LEFT JOIN users u ON u.user_id = ft.created_by
WHERE ft.financing_id = :financing_id
ORDER BY ft.created_at DESC;

-- Historial de reposiciones (auditoría)
SELECT ft.*, ub.user_nm as buyer_name, us.user_nm as supplier_name, ua.full_name as restored_by_name
FROM financing_transactions ft
JOIN financing_requests fr ON fr.id = ft.financing_id
LEFT JOIN users ub ON ub.user_id = fr.buyer_id
LEFT JOIN users us ON us.user_id = fr.supplier_id
LEFT JOIN control_panel_users ua ON ua.id = ft.restored_by
WHERE ft.type = 'reposicion' ORDER BY ft.created_at DESC;

-- Reembolsos pendientes (dinero real a devolver al comprador)
SELECT 
  fr.id,
  fr.buyer_id,
  ub.user_nm as buyer_name,
  fr.supplier_id,
  us.user_nm as supplier_name,
  fr.amount_paid - fr.amount_used - fr.amount_refunded as refund_pending,
  fr.updated_at as refund_generated_at
FROM financing_requests fr
JOIN users ub ON ub.user_id = fr.buyer_id
JOIN users us ON us.user_id = fr.supplier_id
WHERE (fr.amount_paid - fr.amount_used - fr.amount_refunded) > 0
ORDER BY fr.updated_at DESC;
```

---

## 14. Storage Bucket y Políticas

```sql
-- Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('financing-documents', 'financing-documents', false, 10485760,
  ARRAY['application/pdf', 'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg', 'image/png']::text[]);

-- RLS: Buyer/Supplier pueden ver sus documentos
CREATE POLICY "financing_docs_select" ON storage.objects FOR SELECT USING (
  bucket_id = 'financing-documents' AND EXISTS (
    SELECT 1 FROM financing_documents fd
    JOIN financing_requests fr ON fr.id = fd.financing_id
    WHERE fd.storage_path = name AND (fr.buyer_id = auth.uid() OR fr.supplier_id = auth.uid())
  )
);

-- RLS: Admin puede ver TODOS los documentos (via service_role o política específica)
CREATE POLICY "financing_docs_admin_select" ON storage.objects FOR SELECT USING (
  bucket_id = 'financing-documents' AND
  EXISTS (SELECT 1 FROM control_panel_users WHERE id = auth.uid() AND is_active = true)
);

-- RLS: Insert autenticados
CREATE POLICY "financing_docs_insert" ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'financing-documents' AND auth.uid() IS NOT NULL);
```

---

## 15. Pendientes

### Backend
- [ ] Edge function `generate-financing-contract` (genera PDF con datos BD al aprobar supplier)
- [ ] `adminFinancingService.restoreFinancingAmount()`
- [ ] `adminFinancingService.processRefund()` - Procesar devoluciones de saldo a favor
- [ ] `adminFinancingService.getFinancingTransactions()`

### Frontend Control Panel
- [ ] Modal "Ver Movimientos" (historial transacciones)
- [ ] Botón "Reponer Monto" (reposición manual)
- [ ] Dashboard de Mora (financiamientos vencidos)
- [ ] **Dashboard de Reembolsos Pendientes** (cuando `amount_paid > amount_used`) - Sellsi debe transferir dinero real de vuelta al comprador
