-- =============================================================================
-- MIGRACIÓN MÍNIMA: SOLO TABLA CONTROL_PANEL
-- Agrega únicamente lo que falta para AdminPanelTable.jsx
-- NO toca nada que ya existe en la base de datos
-- =============================================================================

-- Tabla principal para gestión de solicitudes de pagos
CREATE TABLE IF NOT EXISTS public.control_panel (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  request_id uuid NOT NULL,
  proveedor text NOT NULL,
  comprador text NOT NULL,
  ticket text NOT NULL,
  direccion_entrega text,
  fecha_solicitada date NOT NULL,
  fecha_entrega date,
  venta numeric NOT NULL,
  estado text DEFAULT 'pendiente' NOT NULL,
  acciones text,
  comprobante_pago text,
  notas_admin text,
  procesado_por uuid,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  CONSTRAINT control_panel_pkey PRIMARY KEY (id),
  CONSTRAINT control_panel_request_id_key UNIQUE (request_id),
  CONSTRAINT control_panel_estado_check CHECK (estado IN ('pendiente', 'confirmado', 'rechazado', 'devuelto', 'en_proceso', 'entregado')),
  CONSTRAINT control_panel_request_id_fkey FOREIGN KEY (request_id) 
    REFERENCES public.requests(request_id) ON DELETE CASCADE,
  CONSTRAINT control_panel_procesado_por_fkey FOREIGN KEY (procesado_por) 
    REFERENCES public.control_panel_users(id) ON DELETE SET NULL
);

-- Trigger para updated_at
CREATE TRIGGER update_control_panel_updated_at 
  BEFORE UPDATE ON public.control_panel 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- Permisos básicos
GRANT ALL ON public.control_panel TO service_role;
GRANT SELECT ON public.control_panel TO authenticated;

-- RLS básico
ALTER TABLE public.control_panel ENABLE ROW LEVEL SECURITY;

-- Política para service_role (admin panel)
CREATE POLICY "Service role can manage control panel" ON public.control_panel
  FOR ALL USING (auth.role() = 'service_role');

-- Política para usuarios autenticados (solo lectura de sus propias solicitudes)
CREATE POLICY "Users can view their own requests" ON public.control_panel
  FOR SELECT USING (
    auth.uid() IN (
      SELECT r.buyer_id FROM public.requests r WHERE r.request_id = control_panel.request_id
      UNION
      SELECT p.supplier_id FROM public.requests r 
      JOIN public.request_products rp ON r.request_id = rp.request_id
      JOIN public.products p ON rp.product_id = p.productid
      WHERE r.request_id = control_panel.request_id
    )
  );

-- Comentario
COMMENT ON TABLE public.control_panel IS 'Gestión administrativa de solicitudes y pagos';

-- Confirmar migración
SELECT 'Tabla control_panel creada exitosamente' AS resultado;
