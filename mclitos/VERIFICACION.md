# Verificación de Órbita

## Resultado observado

- `npm install`: 20 paquetes agregados, auditoría con cero vulnerabilidades en ese momento.
- `npm test`: 15 pruebas correctas después de las correcciones.
- `npm run build`: compilación de producción correcta.
- Navegador de escritorio a 1440 px y móvil a 390 px: sin desbordamiento horizontal.
- SDK real sin extensión instalada: el botón muestra las instrucciones para instalar y desbloquear Varial.

## Flujos comprobados en navegador con dobles

Se reemplazaron temporalmente las respuestas del SDK y de Horizon dentro del navegador de pruebas, sin agregar puertas de prueba al código de la app.

Se comprobaron 16 resultados: dirección completa, saldo exacto, emisor visible, enlace a explorador Testnet, móvil conectado sin desbordamiento, copia al portapapeles, rechazo de cuenta cambiada sin consultar Horizon, eliminación de saldos anteriores, ocultación y borrado de cuenta al desconectar, rechazo de Mainnet sin consulta HTTP, rechazo de permisos, cuenta sin activar, JSON inválido con mensaje español, error de conexión y recuperación al actualizar.

El primer intento del doble de SDK falló por no ofrecer la exportación predeterminada que usa la interoperabilidad CommonJS de Vite. Se corrigió el doble, no el SDK ni el código de conexión, y los 16 resultados pasaron.

## Regresiones reproducidas y corregidas

1. Una respuesta JSON incompleta exponía un error técnico en inglés. Se observó la prueba fallar antes de capturar el error y mostrar un mensaje útil en español.
2. Una cuenta cambiada durante la consulta podía publicar el saldo anterior. Se observó la prueba fallar antes de volver a comprobar cuenta y red al terminar la consulta.

Las pruebas iniciales también se ejecutaron antes de crear los módulos y fallaron por módulo inexistente; después de implementar, pasaron 13 casos. Las dos regresiones elevaron el total a 15.

## Revisión independiente

El verificador confirmó la corrección de los dos hallazgos en una copia aislada: 15/15 pruebas de la app y 17/17 al incorporar sus dos probes de regresión. No encontró bloqueos pendientes en el alcance revisado. No modificó el código original ni verificó una extensión real.

## Prueba manual con wallet real

El usuario confirmó desde su navegador, mediante el túnel al VPS y con su wallet en Testnet:

- La dirección pública y los XLM de su billetera aparecen en la app.
- La dirección copiada coincide con la de su wallet.
- Desconectar oculta la dirección y los saldos.
- Reconectar vuelve a mostrar los datos correctamente.

Estos resultados fueron comunicados por el usuario; no se observaron directamente desde el navegador de pruebas del VPS. No se solicitaron claves privadas ni firmas.

## Pendiente de entrega

El usuario eligió mantener `mclitos` porque se registró con esa cuenta de GitHub. La diferencia con el requisito de nombre completo de la consigna ya fue advertida.

El historial local se organiza en cinco unidades coherentes: base ejecutable, integración de wallet con pruebas, estado de conexión con pruebas, interfaz y documentación de verificación. Cada etapa de código se compiló desde su contenido preparado para commit en una copia aislada; las etapas de integración, estado e interfaz también ejecutaron sus pruebas.

La documentación se comprueba por lectura estructural; no requiere una prueba funcional nueva porque no modifica el comportamiento. En la preparación de las pruebas parciales hubo un aviso de salto de línea final; el archivo completo de la siguiente etapa lo normalizó y las comprobaciones posteriores pasaron.

Todavía no se publicó la rama ni se abrió un PR. Los cinco commits requeridos constan en la plataforma del campamento, aunque no aparecen en el README original del repositorio.
