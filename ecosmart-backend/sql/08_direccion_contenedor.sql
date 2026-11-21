-- ============================================================
-- Migración: dirección o referencia de cada contenedor (ej. "Av. Granaderos 2390, frente al Jumbo").
-- La escribe el administrador (o la sugiere la app desde el mapa) y la ven el admin y los ciudadanos.
-- Ejecutar en Supabase (SQL Editor) o con psql ANTES de desplegar el backend que la lee.
-- Se puede correr más de una vez.
-- ============================================================

ALTER TABLE contenedor ADD COLUMN IF NOT EXISTS direccion VARCHAR(200);
