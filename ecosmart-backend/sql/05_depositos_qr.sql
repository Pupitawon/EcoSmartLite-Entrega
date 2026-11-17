-- ============================================================
-- Migración: depósitos por QR (POST /api/depositos y GET /api/depositos/resumen)
-- Copia fiel de lo que ya está aplicado en Supabase (EcoSmartDB) al 2026-11-17.
-- Sirve para reconstruir la base desde cero. Se puede correr más de una vez.
-- ============================================================

-- 1) Parámetros del sistema (límite diario y puntos por botella)
CREATE TABLE IF NOT EXISTS public.configuracion_sistema (
  clave       VARCHAR PRIMARY KEY,
  valor       INTEGER NOT NULL,
  descripcion TEXT
);
INSERT INTO public.configuracion_sistema (clave, valor, descripcion) VALUES
  ('max_botellas_por_dia', 10, 'Maximo de botellas por usuario/dia que otorgan ecopoints (dia calendario de Chile)'),
  ('ecopoints_por_botella', 5, 'Ecopoints que otorga cada botella reciclada')
ON CONFLICT (clave) DO NOTHING;
ALTER TABLE public.configuracion_sistema ENABLE ROW LEVEL SECURITY;

-- 2) Código QR de cada contenedor: "ECO-" + 16 caracteres
ALTER TABLE public.contenedor
  ADD COLUMN IF NOT EXISTS codigo_qr VARCHAR NOT NULL
  DEFAULT ('ECO-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 16)));
CREATE UNIQUE INDEX IF NOT EXISTS uq_contenedor_codigo_qr ON public.contenedor (codigo_qr);

-- 3) Depósitos: id de escaneo (idempotencia), cantidad y cantidad con puntos
ALTER TABLE public.deposito_residuo ADD COLUMN IF NOT EXISTS id_escaneo UUID NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE public.deposito_residuo ADD COLUMN IF NOT EXISTS cantidad INTEGER NOT NULL DEFAULT 1;
ALTER TABLE public.deposito_residuo ADD COLUMN IF NOT EXISTS cantidad_premiada INTEGER NOT NULL DEFAULT 1;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'deposito_residuo_cantidad_check') THEN
    ALTER TABLE public.deposito_residuo ADD CONSTRAINT deposito_residuo_cantidad_check CHECK (cantidad >= 1);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'deposito_residuo_cantidad_premiada_check') THEN
    ALTER TABLE public.deposito_residuo ADD CONSTRAINT deposito_residuo_cantidad_premiada_check CHECK (cantidad_premiada >= 0);
  END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS uq_deposito_id_escaneo ON public.deposito_residuo (id_escaneo);
CREATE INDEX IF NOT EXISTS idx_deposito_usuario_fecha ON public.deposito_residuo (id_usuario, fecha_escaneo_offline);
CREATE INDEX IF NOT EXISTS idx_deposito_contenedor_fecha ON public.deposito_residuo (id_contenedor, fecha_escaneo_offline);

-- 4) Una insignia por usuario (la función usa ON CONFLICT sobre este índice)
CREATE UNIQUE INDEX IF NOT EXISTS uq_logro_usuario_insignia ON public.logro_usuario (id_usuario, id_insignia);

-- 5) Registrar un depósito en UNA transacción: depósito + saldo + insignias.
--    Devuelve jsonb { ok, duplicado, cantidad, cantidad_premiada, ecopoints_otorgados, saldo_ecopoints, ... }
--    o { ok: false, error: CANTIDAD_INVALIDA | FECHA_INVALIDA | USUARIO_NO_ENCONTRADO | ESCANEO_YA_REGISTRADO
--                          | QR_INVALIDO | CONTENEDOR_LLENO }.
CREATE OR REPLACE FUNCTION public.registrar_deposito(
  p_id_usuario integer, p_codigo_qr character varying, p_cantidad integer,
  p_id_escaneo uuid, p_fecha_escaneo timestamp without time zone)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_ahora          timestamp := (now() AT TIME ZONE 'UTC');
  v_usuario_id     integer;
  v_contenedor     public.contenedor%ROWTYPE;
  v_prev           public.deposito_residuo%ROWTYPE;
  v_limite         integer;
  v_pts_botella    integer;
  v_local_inicio   timestamp;
  v_inicio_utc     timestamp;
  v_fin_utc        timestamp;
  v_premiadas_hoy  integer;
  v_restantes      integer;
  v_premiar        integer;
  v_puntos         integer;
  v_id_deposito    integer;
  v_saldo          integer;
  v_insignias      jsonb;
BEGIN
  IF p_cantidad IS NULL OR p_cantidad < 1 OR p_cantidad > 50 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'CANTIDAD_INVALIDA');
  END IF;

  IF p_fecha_escaneo IS NULL OR p_fecha_escaneo > v_ahora + interval '5 minutes' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'FECHA_INVALIDA');
  END IF;

  -- Bloqueo del usuario: serializa depositos concurrentes (limite y saldo)
  SELECT u.id_usuario INTO v_usuario_id
  FROM public.usuario u
  WHERE u.id_usuario = p_id_usuario
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'USUARIO_NO_ENCONTRADO');
  END IF;

  -- Idempotencia: el mismo escaneo reenviado no suma dos veces
  SELECT * INTO v_prev
  FROM public.deposito_residuo d
  WHERE d.id_escaneo = p_id_escaneo;

  IF FOUND THEN
    IF v_prev.id_usuario <> p_id_usuario THEN
      RETURN jsonb_build_object('ok', false, 'error', 'ESCANEO_YA_REGISTRADO');
    END IF;

    SELECT u.saldo_ecopoints INTO v_saldo
    FROM public.usuario u WHERE u.id_usuario = p_id_usuario;

    RETURN jsonb_build_object(
      'ok', true,
      'duplicado', true,
      'id_deposito', v_prev.id_deposito,
      'cantidad', v_prev.cantidad,
      'cantidad_premiada', v_prev.cantidad_premiada,
      'ecopoints_otorgados', v_prev.ecopoints_otorgados,
      'saldo_ecopoints', v_saldo,
      'insignias_nuevas', '[]'::jsonb
    );
  END IF;

  -- Contenedor por codigo QR
  SELECT * INTO v_contenedor
  FROM public.contenedor c
  WHERE c.codigo_qr = p_codigo_qr;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'QR_INVALIDO');
  END IF;

  -- estado_operativo lo calcula el backend por nivel de llenado (disponible/atencion/critico);
  -- no indica averias. Solo se bloquea si el contenedor esta lleno.
  IF v_contenedor.porcentaje_llenado >= 100 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'CONTENEDOR_LLENO');
  END IF;

  -- Configuracion
  SELECT cs.valor INTO v_limite
  FROM public.configuracion_sistema cs WHERE cs.clave = 'max_botellas_por_dia';
  v_limite := COALESCE(v_limite, 10);

  SELECT cs.valor INTO v_pts_botella
  FROM public.configuracion_sistema cs WHERE cs.clave = 'ecopoints_por_botella';
  v_pts_botella := COALESCE(v_pts_botella, 5);

  -- Limite diario por usuario (dia calendario de Chile segun la fecha del escaneo)
  v_local_inicio := date_trunc('day', (p_fecha_escaneo AT TIME ZONE 'UTC') AT TIME ZONE 'America/Santiago');
  v_inicio_utc   := (v_local_inicio AT TIME ZONE 'America/Santiago') AT TIME ZONE 'UTC';
  v_fin_utc      := ((v_local_inicio + interval '1 day') AT TIME ZONE 'America/Santiago') AT TIME ZONE 'UTC';

  SELECT COALESCE(SUM(d.cantidad_premiada), 0) INTO v_premiadas_hoy
  FROM public.deposito_residuo d
  WHERE d.id_usuario = p_id_usuario
    AND d.fecha_escaneo_offline >= v_inicio_utc
    AND d.fecha_escaneo_offline <  v_fin_utc;

  v_restantes := GREATEST(v_limite - v_premiadas_hoy, 0);
  v_premiar   := LEAST(p_cantidad, v_restantes);
  v_puntos    := v_premiar * v_pts_botella;

  -- Registro del deposito (siempre se registra; solo los puntos tienen tope)
  INSERT INTO public.deposito_residuo (
    id_usuario, id_contenedor, codigo_qr_escaneado, ecopoints_otorgados,
    fecha_escaneo_offline, fecha_sincronizacion,
    id_escaneo, cantidad, cantidad_premiada
  ) VALUES (
    p_id_usuario, v_contenedor.id_contenedor, p_codigo_qr, v_puntos,
    p_fecha_escaneo, v_ahora,
    p_id_escaneo, p_cantidad, v_premiar
  )
  RETURNING id_deposito INTO v_id_deposito;

  -- Saldo
  UPDATE public.usuario u
  SET saldo_ecopoints = u.saldo_ecopoints + v_puntos
  WHERE u.id_usuario = p_id_usuario
  RETURNING u.saldo_ecopoints INTO v_saldo;

  -- Insignias (total historico de botellas con puntos)
  WITH total AS (
    SELECT COALESCE(SUM(d.cantidad_premiada), 0) AS n
    FROM public.deposito_residuo d
    WHERE d.id_usuario = p_id_usuario
  ),
  nuevas AS (
    INSERT INTO public.logro_usuario (id_usuario, id_insignia, fecha_desbloqueo)
    SELECT p_id_usuario, i.id_insignia, v_ahora
    FROM public.insignia i, total t
    WHERE i.umbral_depositos <= t.n
    ON CONFLICT (id_usuario, id_insignia) DO NOTHING
    RETURNING id_insignia
  )
  SELECT COALESCE(
           jsonb_agg(jsonb_build_object(
             'id_insignia', i.id_insignia,
             'nombre_insignia', i.nombre_insignia)),
           '[]'::jsonb)
  INTO v_insignias
  FROM nuevas n
  JOIN public.insignia i ON i.id_insignia = n.id_insignia;

  RETURN jsonb_build_object(
    'ok', true,
    'duplicado', false,
    'id_deposito', v_id_deposito,
    'id_contenedor', v_contenedor.id_contenedor,
    'cantidad', p_cantidad,
    'cantidad_premiada', v_premiar,
    'ecopoints_por_botella', v_pts_botella,
    'ecopoints_otorgados', v_puntos,
    'limite_diario', v_limite,
    'premiadas_hoy', v_premiadas_hoy + v_premiar,
    'restantes_hoy', v_restantes - v_premiar,
    'saldo_ecopoints', v_saldo,
    'insignias_nuevas', v_insignias
  );
END;
$function$;

-- Solo el backend (rol postgres) la llama: no se expone por la API REST de Supabase.
REVOKE EXECUTE ON FUNCTION public.registrar_deposito(integer, varchar, integer, uuid, timestamp) FROM PUBLIC, anon, authenticated;
