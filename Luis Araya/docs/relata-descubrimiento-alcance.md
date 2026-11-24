# Relata: descubrimiento y alcance de la primera entrega

**Fecha:** 15 de noviembre de 2026  
**Estado:** alcance funcional acordado; implementación todavía no iniciada  
**Entrega objetivo:** Pura Vida Bootcamp 1, miércoles 18 de noviembre de 2026

Relata será una aplicación web de solo lectura para consultar movimientos de una cuenta Stellar y escuchar una explicación sencilla en español. La primera entrega busca demostrar un recorrido funcional y seguro en Testnet, sin mover fondos ni pedir firmas.

## 1. Resultado esperado

Una persona podrá:

1. conectar una wallet Varial configurada en Stellar Testnet o entrar con una cuenta pública preparada para la demostración;
2. consultar los cinco pagos compatibles más recientes;
3. identificar si cada pago fue recibido o enviado;
4. ver su importe, activo, fecha, estado y cuenta contraparte;
5. escuchar la misma explicación mediante la voz disponible en el navegador.

El producto se presentará como:

> **Relata**  
> Entiende y escucha tus movimientos en Stellar.

`Relata` es un nombre de trabajo. No se ha comprobado todavía su disponibilidad como marca, dominio o nombre de aplicación.

## 2. Usuario y propuesta de valor

### Usuario inicial

Personas hispanohablantes que quieren comprender la actividad de una cuenta Stellar sin interpretar directamente los datos técnicos de la red.

La primera versión no se presentará como una solución validada para personas ciegas o con baja visión. Puede incorporar buenas prácticas de uso por teclado y claridad visual, pero no afirmará una accesibilidad que todavía no se ha probado con usuarios.

### Propuesta de valor

Relata convierte pagos recientes de Stellar en explicaciones breves y comprensibles, disponibles como texto y como lectura en voz alta.

No identifica a las personas detrás de las cuentas, no deduce el motivo de un pago y no ofrece asesoramiento financiero.

## 3. Recorrido principal

### Acceso con wallet

1. La persona pulsa **Conectar Varial**.
2. Relata solicita acceso únicamente a la dirección pública y a la red activa.
3. Si Varial está en Testnet, Relata consulta la actividad de esa cuenta.
4. Si Varial está en otra red, la consulta se bloquea y se muestra:

   > Relata funciona con la red de pruebas en esta demo. Cambia Varial a Testnet para continuar.

Relata no cambiará la red automáticamente ni consultará Mainnet por error.

### Acceso de demostración

La persona podrá elegir **Probar la demo** para consultar una cuenta pública de Testnet preparada con pagos en XLM y USDC de prueba. Esta vía permitirá evaluar el producto sin instalar ni configurar una wallet.

La aplicación no incluirá ninguna clave privada de esa cuenta. Solo utilizará su dirección pública.

## 4. Movimientos compatibles

La primera versión explicará exclusivamente pagos que cumplan todas estas condiciones:

- se completaron correctamente;
- fueron recibidos o enviados por la cuenta consultada;
- utilizan XLM o el USDC oficial de Testnet identificado por su código y su cuenta emisora.

Relata filtrará primero los movimientos compatibles y mostrará los cinco más recientes. Si encuentra operaciones que todavía no sabe explicar, no improvisará una interpretación: indicará cuántas quedaron fuera del resumen.

No se considerará auténtico un activo únicamente porque use el código `USDC`. En Stellar, un activo emitido se identifica mediante **código y emisor**.

## 5. Información de cada pago

Cada elemento mostrará:

- dirección del pago: recibido o enviado;
- importe exacto;
- activo: XLM o USDC de Testnet verificado;
- fecha y hora;
- dirección pública de la cuenta contraparte, abreviada;
- estado completado;
- acción **Escuchar explicación**.

Ejemplo de explicación:

> Recibiste 25 USDC el 15 de noviembre a las 10:30. El pago provino de una cuenta terminada en 7K2M y se completó correctamente en la red de pruebas.

La dirección se describirá como una cuenta, no como una persona o empresa. Relata no atribuirá identidades que la red no permite comprobar.

## 6. Lectura en voz alta

La primera entrega utilizará la síntesis de voz del navegador.

- La lectura comenzará únicamente cuando la persona pulse **Escuchar explicación**.
- Habrá un control para detenerla.
- El texto visible será siempre la fuente principal de la explicación.
- Relata buscará una voz en español disponible en el equipo.
- Si no encuentra una voz adecuada, mostrará un aviso y conservará la explicación escrita.

La voz concreta y su calidad pueden variar según el navegador, el sistema y las voces instaladas. La primera versión no incluirá reconocimiento de voz ni órdenes habladas.

## 7. Wallet y límites de autorización

Varial será la única wallet conectable en esta entrega. Relata utilizará la integración nueva recomendada por su documentación y limitará su uso a:

- comprobar que la extensión está disponible;
- solicitar permiso para acceder a la dirección pública;
- leer la red seleccionada;
- consultar movimientos públicos de la cuenta.

Relata no solicitará firmas, no preparará ni enviará transacciones y no tendrá acceso a claves privadas o frases de recuperación.

La extensión ya se instaló correctamente en Brave y Zen. En Zen, la versión distribuida mediante Mozilla Add-ons conserva el nombre anterior, Freighter. La detección desde la futura aplicación todavía debe verificarse.

## 8. Plataforma y navegadores

La primera entrega estará dirigida a navegadores de escritorio en Windows.

| Navegador | Papel en la primera entrega |
|---|---|
| Brave | Desarrollo y presentación principal |
| Chrome | Prueba de compatibilidad |
| Edge | Prueba de compatibilidad |
| Zen Browser | Prueba de compatibilidad sobre el motor de Firefox |

Las comprobaciones mínimas en cada navegador serán:

- carga de la aplicación;
- acceso a la cuenta pública de demostración;
- conexión con Varial cuando corresponda;
- verificación de Testnet;
- consulta y representación de movimientos;
- disponibilidad de voz en español;
- inicio y detención de la lectura.

La calidad de voz puede variar. No se promete una voz idéntica en todos los equipos.

Móviles, macOS y Linux quedan fuera de esta entrega.

## 9. Datos de demostración

La demostración utilizará Stellar Testnet, sin activos con valor económico real.

La preparación de la cuenta requerirá:

1. crear una cuenta exclusiva de Testnet;
2. obtener XLM de prueba mediante Friendbot;
3. establecer una línea de confianza para el USDC oficial de Testnet;
4. obtener USDC de prueba mediante el faucet correspondiente;
5. generar pagos recibidos y enviados que permitan mostrar el recorrido completo.

Estas acciones sirven para preparar los datos. No forman parte de las capacidades de Relata y no convierten la aplicación en una herramienta para enviar pagos.

Testnet se reinicia periódicamente. La cuenta de demostración y sus movimientos deberán comprobarse antes de presentar o entregar el proyecto.

## 10. Requisitos de la entrega

Según el repositorio del Pura Vida Bootcamp y la tarea compartida:

- construir una aplicación funcional sobre Stellar con apoyo de Stellar Raven durante el desarrollo;
- incluir una sección para conectar una wallet de Stellar;
- hacer un fork del repositorio oficial;
- crear una carpeta con el nombre completo del participante;
- desarrollar la aplicación dentro de esa carpeta;
- trabajar en una rama `feature/tu-nombre`;
- abrir un pull request hacia `main` del repositorio original;
- incluir el nombre completo en la descripción;
- aportar al menos cinco commits propios;
- registrar el enlace del pull request en la plataforma.

El uso de Stellar Raven es una condición del proceso de desarrollo. No se ha encontrado un requisito que obligue a integrarlo como servicio dentro de Relata.

## 11. Fuera de alcance

La primera entrega no incluirá:

- Mainnet;
- envío, preparación o firma de pagos;
- gestión o almacenamiento de claves privadas;
- otros activos distintos de XLM y USDC verificado de Testnet;
- operaciones fallidas;
- pagos por ruta;
- explicación de transacciones con varias operaciones;
- contratos de Soroban;
- DeFi;
- interpretación de órdenes habladas;
- motor de voz externo local;
- aplicación de escritorio, mascota o panel flotante;
- soporte móvil, macOS o Linux;
- promesas de historial completo;
- asesoramiento financiero;
- identidad atribuida a una dirección;
- posicionamiento como producto de accesibilidad validado.

## 12. Errores que deben explicarse con claridad

Relata deberá distinguir al menos estas situaciones:

- Varial no está instalada o no puede detectarse;
- la persona rechaza la conexión;
- Varial está conectada a una red distinta de Testnet;
- la cuenta no existe en Testnet;
- no hay pagos compatibles;
- la consulta a Stellar falla;
- existen operaciones no compatibles que fueron omitidas;
- no hay una voz en español disponible;
- la lectura no puede iniciarse o detenerse correctamente.

Ninguno de estos casos debe presentarse como éxito ni ocultarse detrás de una pantalla vacía.

## 13. Criterios de aceptación de la demo

La primera versión estará lista para presentar cuando se haya observado que:

- la opción **Probar la demo** funciona sin wallet;
- Varial puede conectarse sin pedir firmas;
- una wallet en una red distinta queda bloqueada con el mensaje acordado;
- se muestran como máximo cinco pagos compatibles, ordenados del más reciente al más antiguo;
- XLM se reconoce como activo nativo;
- USDC se reconoce mediante código y emisor de Testnet;
- los importes se conservan sin redondeos engañosos;
- cada pago muestra todos los campos acordados;
- la explicación escrita coincide con los datos consultados;
- la lectura en español se inicia solo por acción de la persona y puede detenerse;
- las operaciones no compatibles se omiten y se informa de su cantidad;
- el recorrido principal se verifica en Brave y se realizan pruebas de compatibilidad en Chrome, Edge y Zen;
- no se solicita ninguna firma ni se expone una clave privada.

## 14. Evolución posterior

Después de la entrega se podrá valorar, con evidencia y sin convertirlo ahora en compromiso:

- integrar un motor de voz local mediante un adaptador;
- añadir más tipos de operación y activos;
- ampliar la cobertura histórica;
- incorporar voz como entrada;
- recuperar el enfoque de accesibilidad y validarlo con usuarios;
- crear una aplicación de escritorio;
- explorar las etapas posteriores del bootcamp relacionadas con Soroban, datos verificables, tokens y DeFi.

Cada ampliación deberá partir de una necesidad comprobada y conservar la distinción entre lo que Stellar permite observar y lo que Relata no puede afirmar.

## 15. Decisiones aún pendientes antes de implementar

- zona horaria utilizada para mostrar y narrar fechas;
- longitud exacta de la abreviatura de las direcciones;
- texto final de los mensajes de error;
- dirección pública de la cuenta preparada para la demo;
- comprobación práctica de Varial y de las voces en los cuatro navegadores;
- disponibilidad legal y digital del nombre `Relata`;
- estructura visual definitiva;
- stack técnico y estrategia de despliegue.

Estas decisiones no cambian la propuesta de valor ni el alcance funcional acordado, pero deben resolverse antes de cerrar la implementación.
