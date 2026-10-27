param(
  [string]$Key = $env:INGEST_API_KEY,
  [string]$Base = "http://127.0.0.1:5000",
  [int]$Id = 1
)
if (-not $Key) { Write-Host "Define `$env:INGEST_API_KEY primero" -ForegroundColor Red; exit 1 }

$script:ok = 0
$script:fallas = 0
$auth = @{ Authorization = "Bearer $Key" }
$cultura = [Globalization.CultureInfo]::InvariantCulture

function Fecha([int]$min) {
  (Get-Date).ToUniversalTime().AddMinutes($min).ToString("yyyy-MM-dd'T'HH:mm:ss'Z'", $cultura)
}
function J($o) { $o | ConvertTo-Json -Compress }

function Probar($nombre, $esperado, $metodo, $ruta, $cuerpo, $headers, $contiene = $null) {
  $codigo = 0; $texto = ""
  try {
    $r = Invoke-WebRequest -Uri "$Base$ruta" -Method $metodo -Headers $headers -ContentType "application/json" -Body $cuerpo -UseBasicParsing
    $codigo = [int]$r.StatusCode
    $texto = $r.Content
  } catch {
    if ($_.Exception.Response) { $codigo = [int]$_.Exception.Response.StatusCode }
  }
  $bien = ($codigo -eq $esperado) -and (($null -eq $contiene) -or $texto.Contains($contiene))
  if ($bien) { $script:ok++; Write-Host "OK     $nombre" -ForegroundColor Green }
  else { $script:fallas++; Write-Host "FALLA  $nombre (esperado $esperado, obtuvo $codigo)" -ForegroundColor Red }
}

$T = Fecha 0
Write-Host "Fecha de prueba UTC: $T`n"
Write-Host "Hora local PC:     $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
$L = "/api/lecturas"

# Seguridad
Probar "Sin Authorization -> 401" 401 POST $L (J @{id_contenedor=$Id; porcentaje_llenado=50}) @{}
Probar "Clave invalida -> 401" 401 POST $L (J @{id_contenedor=$Id; porcentaje_llenado=50}) @{ Authorization = "Bearer CLAVE_INVALIDA_12345" }

# HU-01: ingesta, idempotencia, obsoleta
Probar "bearer minuscula + lectura valida -> 201" 201 POST $L (J @{id_contenedor=$Id; porcentaje_llenado=30; fecha_lectura=$T}) @{ Authorization = "bearer $Key" } '"recibida":true'
Probar "Misma fecha otra vez (idempotencia) -> 201" 201 POST $L (J @{id_contenedor=$Id; porcentaje_llenado=30; fecha_lectura=$T}) $auth '"recibida":true'
Probar "Lectura obsoleta -> 200 recibida:false" 200 POST $L (J @{id_contenedor=$Id; porcentaje_llenado=10; fecha_lectura=(Fecha -60)}) $auth '"recibida":false'
Probar "Contenedor inexistente -> 404" 404 POST $L (J @{id_contenedor=999999; porcentaje_llenado=50}) $auth
Probar "Porcentaje 150 -> 422" 422 POST $L (J @{id_contenedor=$Id; porcentaje_llenado=150}) $auth
Probar "Campo extra -> 422" 422 POST $L (J @{id_contenedor=$Id; porcentaje_llenado=50; x=1}) $auth
Probar "id_contenedor string -> 422" 422 POST $L (J @{id_contenedor="$Id"; porcentaje_llenado=50}) $auth
Probar "Fecha futura -> 422" 422 POST $L (J @{id_contenedor=$Id; porcentaje_llenado=50; fecha_lectura=(Fecha 60)}) $auth
Probar "JSON invalido -> 400" 400 POST $L '{malo' $auth
Probar "PUT ruta antigua -> 200" 200 PUT "/api/contenedores/$Id/nivel" (J @{porcentaje_llenado=45}) $auth "Lectura actualizada"

# HU-02: ciclo de alerta
Probar "85 % crea alerta" 201 POST $L (J @{id_contenedor=$Id; porcentaje_llenado=85}) $auth '"alerta_creada":true'
Probar "88 % no duplica alerta" 201 POST $L (J @{id_contenedor=$Id; porcentaje_llenado=88}) $auth '"alerta_creada":false'
Probar "20 % resuelve alerta" 201 POST $L (J @{id_contenedor=$Id; porcentaje_llenado=20}) $auth '"alerta_resuelta":true'

Write-Host "`nResultado: $script:ok OK, $script:fallas con falla"
$fq = $T.Replace("T", " ").Replace("Z", "")
Write-Host "En Supabase debe dar 1:"
Write-Host "SELECT count(*) FROM lectura WHERE id_contenedor = $Id AND fecha_lectura = '$fq';"