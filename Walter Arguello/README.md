# Órbita · Propinas en Stellar

Prototipo no custodial de propinas en XLM, exclusivamente en Stellar Testnet.

## Funciones
- Configurar nombre y dirección pública de un creador; guardar en este navegador.
- Compartir un enlace con `?to=G...&name=...`.
- Conectar Freighter y verificar Testnet antes de conectar y de firmar.
- Consultar saldo, elegir monto y agregar un memo de hasta 28 bytes.
- Firmar desde la wallet, enviar a Horizon y mostrar comprobante solo tras respuesta exitosa.
- Validar dirección, monto y destinatario diferente al remitente.

## Demostración
1. Instalar Freighter desde https://freighter.app/ y seleccionar Stellar Testnet.
2. Preparar dos cuentas de prueba distintas y activarlas con Friendbot desde https://laboratory.stellar.org/.
3. Configurar la dirección pública de la cuenta receptora en «Configurar creador».
4. Conectar la cuenta pagadora, elegir 1 XLM y firmar el pago.
5. Abrir el comprobante y comprobar el saldo del destinatario.

Las monedas de Testnet no tienen valor real. La app nunca solicita claves privadas. La desconexión elimina la sesión local; los permisos de la extensión se revocan desde Freighter.

## Ejecutar
Con Node 22 o posterior: `npm install`, `npm run dev`. Para compilar: `npm run build`.
Para generar la versión estática, ejecuta `npm run build`.

## Verificación y límites
Sintaxis JavaScript comprobada. La validación de extremo a extremo requiere completar un pago con wallet en Stellar Testnet.
No hay servidor ni registro propio: los datos de perfil permanecen en el navegador o en el enlace. Los pagos se consultan en Stellar. No incluye contratos inteligentes.
