# Relata: estado actual y propuesta futura de control por voz

**Estado:** Borrador para revisión  
**Enfoque:** Diseño inclusivo para personas videntes y personas no videntes o con baja visión

---

## 1. Qué es y qué hace Relata hoy

Relata es una aplicación web estática de **solo lectura** para consultar movimientos recientes en **Stellar Testnet** y escuchar explicaciones claras en español, sin backend propio ni manejo de claves privadas.

Actualmente incluye:
- **Acceso flexible en modo lectura:** conexión con wallets de navegador (Varial, LOBSTR, xBull, Albedo) o consulta directa mediante cualquier dirección pública `G...` (rechazando claves secretas `S...`).
- **Consulta configurable a Horizon Testnet:** selección de `1` a `50` pagos exitosos (`5` por defecto), botón de **Nueva consulta** y filtrado estricto de activos verificados por código y emisor (**XLM**, **USDC** y **EURC**).
- **Explicación legible y audio bajo demanda:** tarjetas en español con importe exacto, contraparte abreviada, fecha y botón **Escuchar explicación** usando la síntesis de voz del navegador (`speechSynthesis`).
- **Interfaz clara y adaptable:** indicadores de estado de conexión y selector de **modo claro / modo oscuro**.

---

## 2. Qué se busca a futuro: control por voz inclusivo

Evolucionar Relata para que cualquier persona —**vidente o no vidente**— pueda consultar su actividad y controlar la lectura mediante **comandos de voz en español**, manteniendo exactamente las mismas garantías de privacidad y solo lectura.

### Principios para ambos perfiles de usuario
- **Una sola interfaz bimodal:** lo que se hace por voz debe poder hacerse igual por teclado, lector de pantalla (NVDA, JAWS, VoiceOver) o clic/texto, sin modos separados ni pérdida de funciones.
- **Activación explícita (*Push-to-Talk*):** botón accesible y atajo de teclado con confirmación visual (videntes) y señal sonora breve + anuncios ARIA (no videntes). Nada de escucha continua en segundo plano.
- **Privacidad financiera y convivencia de audio:** no leer saldos ni importes en voz alta sin petición explícita, evitar que el audio de Relata se solape con lectores de pantalla y permitir **detención inmediata** (`Esc` o comando `"detente"`).
- **Cero almacenamiento de voz:** el audio se procesa en memoria y no se conservan grabaciones ni historiales por defecto.

---

## 3. Requisitos generales de arquitectura

Como Relata funciona actualmente solo en el navegador, sumar reconocimiento de voz privado sin depender de servicios en la nube requiere añadir tres piezas generales y desacopladas:

| Capa | Función | Criterio técnico |
|---|---|---|
| **Despachador accesible en el frontend** | Traducir intenciones confirmadas a acciones existentes (consultar, leer un pago, detener audio, cambiar tema) | Foco por teclado, etiquetas ARIA claras, alternativa escrita equivalente y límite estricto de solo lectura |
| **Puente local seguro (`localhost`)** | Conectar la aplicación web con el motor local de audio y transcripción | Validación estricta de origen (`Origin`) y token de sesión para impedir acceso de sitios externos |
| **Transcripción local (*STT offline*) + Intérprete de intenciones** | Convertir voz a texto localmente en memoria y mapear la frase a un comando válido | Empezar con **reglas deterministas** y validación de ambigüedades; sumar un **modelo semántico local** solo si hace falta mayor flexibilidad |

### Límites no negociables
- **Solo lectura:** prohibido firmar transacciones, mover fondos o pedir claves por voz.
- **Sin adivinanzas:** si falta un dato o la orden es ambigua, el sistema pide aclaración en lugar de asumir.

---

## 4. Ruta sugerida por fases (para aprobar)

1. **Fase 1 — Base accesible + comandos por texto/atajos:** preparar el despachador de intenciones, atajos y compatibilidad con lectores de pantalla directamente en el navegador.
2. **Fase 2 — Reconocimiento de voz local (*STT offline*):** incorporar captura *Push-to-Talk* y transcripción local mediante puente seguro.
3. **Fase 3 — Comprensión semántica y validación con usuarios:** añadir tolerancia a frases más naturales si las reglas no bastan y validar la experiencia con personas videntes y no videntes.

---

## Checklist rápido de aprobación

- [ ] ¿Refleja bien lo que Relata hace hoy y el rumbo que quieres mostrar?
- [ ] ¿Te parece adecuado describir las tecnologías de forma general (sin nombrar herramientas internas concretas)?
- [ ] ¿Apruebas el enfoque inclusivo dual y el avance por fases para trabajarlo a futuro?
