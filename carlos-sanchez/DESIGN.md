<!-- SEED: re-run $impeccable document once there's code to capture the actual tokens and components. -->
---
name: Proofolio
description: Reconocimientos de contribuciones públicas firmados en Stellar Testnet
---

# Design System: Proofolio

## Overview

**Creative North Star: "El registro de taller"**

Proofolio debe sentirse como la mesa ordenada de un equipo que revisa trabajo real: evidencia legible, acciones precisas y señales de confianza discretas. La referencia funcional combina la claridad de contribuciones de GitHub, la densidad disciplinada de Linear y la confianza transaccional de Stripe. El diseño sirve a la tarea y no compite con ella.

La superficie será clara porque la demo se usará principalmente en una laptop durante el bootcamp. El sistema rechaza la estética cripto neón, el dashboard SaaS genérico, la gamificación infantil y el glassmorphism decorativo.

**Key Characteristics:**

- Jerarquía clara y compacta.
- Evidencia antes que métricas.
- Estados de red y firma siempre visibles.
- Movimiento breve que comunica cambios de estado.
- Adaptación móvil estructural, sin reducir la legibilidad.

## Colors

Estrategia restringida con fondo blanco puro y un teal de pátina como única voz de marca principal.

### Primary

- **Teal de pátina:** ancla del producto para acciones primarias, foco y selección. El valor se resolverá en OKLCH durante la implementación a partir de `oklch(0.550 0.095 180)`.

### Secondary

- **Coral de revisión:** reservado para estados que requieren atención y pequeños acentos humanos. Valor por resolver durante la implementación.

### Neutral

- **Blanco de mesa:** fondo puro, sin tinte crema.
- **Tinta mineral:** texto casi negro con un matiz mínimo hacia el teal.
- **Superficie de trabajo:** segunda capa neutral para paneles y filas seleccionadas.

**The One Voice Rule.** El teal ocupa menos del 10% de la pantalla y aparece únicamente donde existe una acción, selección o estado verificable.

## Typography

**Display Font:** una sola sans humanista, por resolver durante la implementación.
**Body Font:** la misma sans humanista con fallbacks del sistema.

**Character:** familiar y precisa. La tipografía debe desaparecer dentro del flujo, conservar buena diferenciación entre números y letras y soportar direcciones Stellar largas.

### Hierarchy

- **Display:** semibold, escala fija, reservado para el título de la vista.
- **Headline:** semibold, usado en agrupaciones y estados principales.
- **Title:** medium, usado en proyectos y Pull Requests.
- **Body:** regular, 65 a 75 caracteres por línea para texto explicativo.
- **Label:** medium, sin mayúsculas sostenidas ni tracking decorativo.

**The Address Rule.** Las direcciones se muestran con una fuente monoespaciada solo cuando facilita copiar o comparar; nunca reemplazan una etiqueta humana.

## Elevation

Plano por defecto. La profundidad se comunica con capas tonales y bordes discretos; las sombras aparecen únicamente en el Sheet lateral, menús flotantes y elementos en arrastre o foco elevado.

**The State Elevation Rule.** Una sombra comunica una relación espacial o un cambio de estado, nunca decora una tarjeta estática.

## Components

Los componentes reales se documentarán después del scaffold de shadcn. Deben conservar affordances estándar, foco visible, estados de carga y error, y radios contenidos entre 8 y 14 píxeles.

## Do's and Don'ts

### Do:

- **Do** mantener Testnet, wallet y estado de la cuenta visibles cerca de las acciones que dependen de ellos.
- **Do** mostrar proyecto, número de PR, fecha, tipo de contribución y wallet emisora en cada registro.
- **Do** usar verbos y objetos en botones, por ejemplo “Conectar wallet” o “Firmar reconocimiento”.
- **Do** conservar contenido útil y controles táctiles de al menos 44 píxeles en móvil.

### Don't:

- **Don't** usar estética cripto neón, gradientes púrpura ni superficies oscuras especulativas.
- **Don't** construir un dashboard SaaS genérico con cuadrículas repetidas de tarjetas y métricas decorativas.
- **Don't** añadir gamificación infantil, rankings, trofeos o contadores competitivos.
- **Don't** usar glassmorphism decorativo, radios de 32 píxeles o más, texto degradado ni franjas laterales de color.
- **Don't** afirmar que GitHub, Stellar u otra institución verificó la identidad o la calidad del trabajo.
