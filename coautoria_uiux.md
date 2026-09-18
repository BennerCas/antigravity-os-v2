# UI/UX Design Specification: Módulo "CoautorIA"
**Ecosistema:** Antigravity OS
**Estilo Visual:** Ciber-renacentista (Base oscura, acentos en neón cian, detalles en oro envejecido/latón, tipografía serif clásica contrastada con sans-serif técnica).
**Paleta de Colores:** 
- Fondo: Vacío Oscuro (`#05080F`) y Gris Grafito (`#1A1D24`)
- Primario (Neón): Cian Cuántico (`#00E5FF`)
- Secundario (Renacentista): Oro Alquímico (`#D4AF37`)
- Texto: Blanco Hueso (`#E8E9EB`) y Cian Atenuado (`#80E5FF`)

---

## 1. Pantalla de Creación de Entidades (Agentes, Equipos, Empresas)
*El "Laboratorio Alquímico Digital". Un espacio donde se forjan nuevas mentes.*

### Layout y Navegación
- **Panel Izquierdo (El Astrolabio):** Un menú de navegación rotativo que se asemeja a un astrolabio holográfico. Permite cambiar entre creación de `Individuo`, `Equipo`, o `Empresa`.
- **Área Central (El Crisol):** El lienzo principal donde se configuran los parámetros.

### Componentes Clave
- **Selectores de Nicho (Matriz de Conocimiento):** 
  - En lugar de simples *dropdowns*, los nichos se presentan como una constelación de nodos hexagonales. Al seleccionar uno (ej. *Psicología Oscura*, *Marketing B2B*), el nodo brilla en cian y traza líneas hacia sub-nichos compatibles.
- **Sliders de % de Fusión (Tubos de Ensayo Neón):**
  - Controles deslizantes verticales que simulan tubos de vacío de cristal. Al arrastrar el manejador (un engranaje de latón digital), el tubo se llena con un fluido holográfico cian. 
  - *Interacción:* Si creas un "Equipo", los sliders de diferentes agentes deben sumar 100% de la "Voz Colectiva". Si un slider sube, los otros bajan dinámicamente con una suave animación elástica.
- **Previsualización de Identidad:**
  - Una tarjeta holográfica estilo Tarot en la esquina superior derecha que se actualiza en tiempo real. Muestra el "ADN" del Agente/Equipo (Atributos, Tono, Nivel de Creatividad) con un diagrama de radar (spider chart) en cian brillante.

---

## 2. Salas de Debate (Multijugador)
*El "Senado de Cristal". Donde las mentes colisionan para generar ideas.*

### Layout
- **Disposición en Anfiteatro:** Vista isométrica o de planta circular. Los avatares de los agentes/usuarios se sitúan en pedestales alrededor de un "fuego" central (una visualización del tema o prompt actual).

### Componentes Clave
- **Avatares Holo-Esculturales:** Los agentes se representan como bustos clásicos (estilo mármol grecorromano) pero renderizados en wireframe cian. Cuando un agente está "hablando" (generando texto), su wireframe pulsa al ritmo del texto.
- **Timeline de Hilos (El Tapiz):**
  - El chat no es una lista plana. Es un grafo que desciende. Si dos agentes debaten un punto específico, el hilo se bifurca visualmente.
  - Los mensajes aparecen letra por letra con un ligero resplandor de terminal de los 80s, acompañados de un sutil sonido de máquina de escribir mecánica.
- **Panel de Intervención (Modo Dios):** El usuario humano tiene un panel de control inferior en oro envejecido, permitiendo "Inyectar Premisa", "Pausar Debate" o "Forzar Consenso".

---

## 3. Estación de Podcast / Radio
*La "Torre de Transmisión". Una cabina de sonido traída del siglo XXII.*

### Layout
- **Dashboard de Consola Analógica-Digital:** Inspirado en mesas de mezclas antiguas pero con interfaces proyectadas en el aire. Fondo de madera de nogal pulida con incrustaciones de metal, sobre el cual flotan los paneles UI.

### Componentes Clave
- **Visualizador de Espectro Central:** Una onda de sonido masiva en el centro de la pantalla. Diferentes colores para diferentes agentes (ej. Cian para el Host, Oro para el Invitado IA).
- **Mesa de DJ de Dinámica Vocal:**
  - Controles rotatorios (*knobs*) holográficos para ajustar `Pacing` (Ritmo), `Humor`, `Sarcasmo`, y `Tensión` en tiempo real mientras se genera el guion o el audio.
- **Selector de Banda Sonora:** Un panel lateral tipo gramófono digital donde se seleccionan camas musicales (Synthwave, Laúd Renacentista, Ambient) que se adaptan automáticamente a la intensidad de la conversación de los agentes.

---

## 4. Escritura de eBooks (Multijugador)
*El "Scriptorium Colaborativo". El pergamino infinito iluminado por algoritmos.*

### Layout
- **Vista Dividida:** 
  - *Izquierda (60%):* El Pergamino (El documento principal).
  - *Derecha (40%):* La Sala de Guerra (Panel de coautores y outline dinámico).

### Componentes Clave
- **El Pergamino (Documento):**
  - Fondo gris grafito muy oscuro. Tipografía Serif elegante y altamente legible para el cuerpo del texto. 
  - **Cursores Colaborativos:** Múltiples cursores moviéndose simultáneamente, cada uno con el nombre del agente IA (ej. `Agente: Hemingway-X` escribiendo en cian, `Agente: Asimov-Prime` en violeta).
- **Notas al Margen (Glosas Digitales):**
  - Comentarios flotantes que aparecen en los márgenes exteriores. Los agentes pueden "discutir" sobre la estructura de un párrafo antes de inyectarlo en el documento principal. Aparecen como pequeños pergaminos de luz.
- **Mapa de Trama (Árbol de Capítulos):**
  - Un árbol jerárquico a la derecha que muestra el progreso del libro. Las ramas (capítulos) brillan en oro cuando están completadas y en cian parpadeante cuando un agente está trabajando activamente en ellas.
