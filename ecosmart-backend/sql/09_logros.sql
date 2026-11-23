-- Logros por niveles: antes estaban fijos en el código, ahora se leen de la base.
-- Se puede correr más de una vez. Para cambiar un nivel se edita la fila (UPDATE), no el código.

CREATE TABLE IF NOT EXISTS logro (
  id_logro VARCHAR(30) PRIMARY KEY,   -- depositante, racha o botellas: es lo que se mide
  titulo   VARCHAR(60) NOT NULL,
  icono    VARCHAR(20) NOT NULL,
  unidad   VARCHAR(30) NOT NULL,
  orden    INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS logro_nivel (
  id_logro  VARCHAR(30) NOT NULL REFERENCES logro (id_logro) ON DELETE CASCADE,
  nivel     INT NOT NULL CHECK (nivel > 0),
  requerido INT NOT NULL CHECK (requerido > 0),
  PRIMARY KEY (id_logro, nivel)
);

INSERT INTO logro (id_logro, titulo, icono, unidad, orden) VALUES
  ('depositante', 'Reciclador constante', 'recycle', 'depósitos', 1),
  ('racha', 'Racha imparable', 'flame', 'días seguidos', 2),
  ('botellas', 'Botellas recicladas', 'botella', 'botellas', 3)
ON CONFLICT (id_logro) DO NOTHING;

INSERT INTO logro_nivel (id_logro, nivel, requerido) VALUES
  ('depositante', 1, 1), ('depositante', 2, 5), ('depositante', 3, 15), ('depositante', 4, 30), ('depositante', 5, 60),
  ('racha', 1, 3), ('racha', 2, 7), ('racha', 3, 14), ('racha', 4, 30),
  ('botellas', 1, 10), ('botellas', 2, 50), ('botellas', 3, 150), ('botellas', 4, 300), ('botellas', 5, 600)
ON CONFLICT (id_logro, nivel) DO NOTHING;

-- Igual que el resto: solo entra el backend
ALTER TABLE logro ENABLE ROW LEVEL SECURITY;
ALTER TABLE logro_nivel ENABLE ROW LEVEL SECURITY;