DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['lectura','alerta_llenado','contenedor','tipo_material',
                           'usuario','deposito_residuo','reporte_anomalia']
  LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    END IF;
  END LOOP;
END $$;