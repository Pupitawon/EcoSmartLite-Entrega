-- Copia del esquema base entregado por el equipo (ecosmart 2.sql). Solo para las pruebas locales.
-- ============================================================
-- 1. TABLAS MAESTRAS 
-- ============================================================

CREATE TABLE Tipo_Material (
    id_material INT NOT NULL,
    nombre_material VARCHAR(50) NOT NULL,
    PRIMARY KEY (id_material)
);

CREATE TABLE Usuario (
    id_usuario INT NOT NULL,
    id_auth VARCHAR(128),
    rut VARCHAR(12) NOT NULL,
    nombre_completo VARCHAR(100) NOT NULL,
    correo VARCHAR(100) NOT NULL,
    saldo_ecopoints INT NOT NULL,
    recibe_notificaciones BOOLEAN NOT NULL,
    fecha_registro TIMESTAMP NOT NULL,
    PRIMARY KEY (id_usuario)
);

CREATE TABLE Insignia (
    id_insignia INT NOT NULL,
    nombre_insignia VARCHAR(100) NOT NULL,
    descripcion TEXT,
    umbral_depositos INT NOT NULL,
    PRIMARY KEY (id_insignia)
);

-- ============================================================
-- 2. CONTENEDOR 
-- ============================================================

CREATE TABLE Contenedor (
    id_contenedor INT NOT NULL,
    id_material INT NOT NULL,
    latitud DECIMAL(10,8) NOT NULL,
    longitud DECIMAL(11,8) NOT NULL,
    porcentaje_llenado DECIMAL(5,2) NOT NULL,
    fecha_ultima_lectura TIMESTAMP,
    estado_operativo VARCHAR(20) NOT NULL,
    PRIMARY KEY (id_contenedor),
    CONSTRAINT fk_contenedor_material FOREIGN KEY (id_material) REFERENCES Tipo_Material(id_material)
);

-- ============================================================
-- 3. GESTIÓN OPERATIVA
-- ============================================================

CREATE TABLE Alerta_Llenado (
    id_alerta INT NOT NULL,
    id_contenedor INT NOT NULL,
    fecha_generacion TIMESTAMP NOT NULL,
    estado_alerta VARCHAR(20) NOT NULL,
    PRIMARY KEY (id_alerta),
    CONSTRAINT fk_alerta_contenedor FOREIGN KEY (id_contenedor) REFERENCES Contenedor(id_contenedor)
);

CREATE TABLE Retiro_Historial (
    id_retiro INT NOT NULL,
    id_contenedor INT NOT NULL,
    fecha_retiro TIMESTAMP NOT NULL,
    nivel_previo_porcentaje DECIMAL(5,2) NOT NULL,
    PRIMARY KEY (id_retiro),
    CONSTRAINT fk_retiro_contenedor FOREIGN KEY (id_contenedor) REFERENCES Contenedor(id_contenedor)
);

-- ============================================================
-- 4. INTERACCIÓN CIUDADANA
-- ============================================================

CREATE TABLE Reporte_Anomalia (
    id_reporte INT NOT NULL,
    id_usuario INT NOT NULL,
    id_contenedor INT NOT NULL,
    descripcion_problema TEXT NOT NULL,
    fecha_reporte TIMESTAMP NOT NULL,
    estado_revision VARCHAR(20) NOT NULL,
    PRIMARY KEY (id_reporte),
    CONSTRAINT fk_reporte_usuario FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario),
    CONSTRAINT fk_reporte_contenedor FOREIGN KEY (id_contenedor) REFERENCES Contenedor(id_contenedor)
);

CREATE TABLE Deposito_Residuo (
    id_deposito INT NOT NULL,
    id_usuario INT NOT NULL,
    id_contenedor INT NOT NULL,
    codigo_qr_escaneado VARCHAR(100) NOT NULL,
    ecopoints_otorgados INT NOT NULL,
    fecha_escaneo_offline TIMESTAMP NOT NULL,
    fecha_sincronizacion TIMESTAMP,
    PRIMARY KEY (id_deposito),
    CONSTRAINT unique_codigo_qr UNIQUE (codigo_qr_escaneado),
    CONSTRAINT fk_deposito_usuario FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario),
    CONSTRAINT fk_deposito_contenedor FOREIGN KEY (id_contenedor) REFERENCES Contenedor(id_contenedor)
);

CREATE TABLE Logro_Usuario (
    id_logro INT NOT NULL,
    id_usuario INT NOT NULL,
    id_insignia INT NOT NULL,
    fecha_desbloqueo TIMESTAMP NOT NULL,
    PRIMARY KEY (id_logro),
    CONSTRAINT fk_logro_usuario FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario),
    CONSTRAINT fk_logro_insignia FOREIGN KEY (id_insignia) REFERENCES Insignia(id_insignia)
);