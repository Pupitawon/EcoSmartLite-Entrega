-- Datos de prueba (solo BD local de pruebas)
INSERT INTO Tipo_Material (id_material, nombre_material) VALUES
  (1,'Plástico'),(2,'Vidrio'),(3,'Papel y cartón'),(4,'Latas');

INSERT INTO Contenedor (id_contenedor,id_material,latitud,longitud,porcentaje_llenado,fecha_ultima_lectura,estado_operativo) VALUES
  (101,1,-22.45640000,-68.92290000,35,(NOW() AT TIME ZONE 'UTC') - INTERVAL '10 minutes','disponible'),
  (102,2,-22.45710000,-68.92110000,62,(NOW() AT TIME ZONE 'UTC') - INTERVAL '25 minutes','atencion'),
  (103,3,-22.46020000,-68.93010000,81,(NOW() AT TIME ZONE 'UTC') - INTERVAL '5 minutes','critico'),
  (104,4,-22.46330000,-68.92560000,18,(NOW() AT TIME ZONE 'UTC') - INTERVAL '30 hours','disponible'),
  (105,1,-22.45290000,-68.91870000,74,NULL,'atencion');
