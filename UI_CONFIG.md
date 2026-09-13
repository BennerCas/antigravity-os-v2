# UI_CONFIG — Antigravity OS v2
# Contexto completo de la interfaz para pasar a otro agente.
# Proyecto: c:\antigravityAS\Antigravity_OS_v2
# Stack: React + TypeScript + Tailwind CSS v4 + Vite
# Dev server: http://localhost:5174

---

## ESTRUCTURA DE ARCHIVOS CLAVE

| Archivo | Rol |
|---|---|
| apps/web-app/src/pages/Agents.tsx | Módulo Agentes (naranja) |
| apps/web-app/src/pages/Atlas.tsx  | Módulo Atlas (cyan)    |
| apps/web-app/src/index_v2.css     | CSS global — importado en main.tsx |
| apps/web-app/src/main.tsx         | Entry point |
| apps/web-app/src/App.tsx          | Router principal (lazy imports) |

---

## MÓDULO AGENTS — Tema NARANJA

Color principal : #f97316  (orange-400 / orange-500)
Color hover     : #fb923c  (orange-300)

### Clases Tailwind

Cards normal     : border border-orange-400 bg-black/40
Cards hover      : hover:border-orange-500
Cards activa     : bg-orange-950/40 border-orange-400
Cards en chain   : bg-black/80 border-orange-400
Títulos de cards : text-orange-400 font-bold text-lg
Botón selección normal  : border-orange-400 text-orange-400 bg-transparent hover:bg-orange-900/30 p-2 rounded-full border
Botón selección activo  : bg-orange-500 border-orange-400 text-white p-2 rounded-full border
Botones acción   : border border-orange-400 text-orange-400 hover:bg-orange-900/30 font-bold ... rounded-xl
Header h1        : text-orange-400  (sin sombra)
Input búsqueda   : border border-orange-400 bg-gray-900 rounded-xl
Separador top    : border-b border-orange-400

---

## MÓDULO ATLAS — Tema CYAN

Color principal : #22d3ee (cyan-400)
Color secundario: #06b6d4 (cyan-500)

### Clases Tailwind

Cards normal     : border border-cyan-400 rounded-2xl bg-gray-900
Cards activa     : bg-cyan-950/40 border-cyan-400
Títulos (h3/h4)  : text-cyan-400 font-bold  (sin sombra)
Botón selección normal : border-cyan-400 text-cyan-400 bg-transparent hover:bg-cyan-900/30 p-2 rounded-full border
Botón selección activo : bg-cyan-500 border-cyan-400 text-white p-2 rounded-full border
Botones acción   : border border-cyan-400 text-cyan-400 hover:bg-cyan-900/30 font-bold ... rounded-X
Headers sección  : text-cyan-400 font-bold
Input búsqueda   : border border-cyan-400 bg-gray-900

---

## CSS GLOBAL — index_v2.css

### REGLA ELIMINADA (no volver a agregar nunca):
  * { box-shadow: none !important; }
  → Era el culpable principal: mataba TODOS los box-shadow de la app.

### .active-card → NARANJA (Agents module)
  background-color: rgba(249, 115, 22, 0.06) !important;
  border: 1px solid #f97316 !important;
  h1-h4 color: #fb923c
  button border-color: #f97316  color: #fb923c
  SIN box-shadow

### .active-card-blue → CYAN (Atlas module)
  background-color: rgba(6, 182, 212, 0.06) !important;
  border: 1px solid #22d3ee !important;
  h1-h4 color: #22d3ee
  button border-color: #22d3ee  color: #22d3ee
  SIN box-shadow

### Universal selection rules → naranja (Agents)
  .selected-green, .active-card, .nav-item-active, div.active-card
  background-color: rgba(249, 115, 22, 0.06) !important;
  border-color: #f97316 !important;
  svg color/stroke: #fb923c

---

## REGLAS ESTRICTAS (NO NEGOCIABLE)

1. NO agregar * { box-shadow: none !important } al CSS global — rompe todo
2. NO usar shadow-[0_0_Xpx_theme(colors.cyan.X)] — Tailwind v4 no lo procesa.
   Usar hex directo: shadow-[0_0_10px_#06b6d4]
3. NO alterar texto del cuerpo (p, span, text-gray-*). Solo títulos cambian color.
4. Sin glow: sin drop-shadow-[...], sin text-shadow, sin box-shadow decorativo
5. Botón de selección SIEMPRE visible en cards (no oculto en gris)

---

## PROBLEMAS HISTÓRICOS (para no repetirlos)

| Problema                              | Causa                                           | Solución                          |
|---------------------------------------|--------------------------------------------------|-----------------------------------|
| Ningún estilo cambiaba                | * { box-shadow: none !important }               | Eliminado de index_v2.css ~L72    |
| Fondos oscuros forzados en cards      | .active-card { background: #0A1C0D !important } | Reescrito con naranja/cyan        |
| shadow-[...] no compilaba            | theme() en valores arbitrarios Tailwind v4       | Hex directo en su lugar           |
| Error TS17001 duplicate className     | Subagente inyectó className antes de onClick    | Líneas sueltas fusionadas         |

---

## CÓMO CAMBIAR EL TEMA EN FUTURO

Agents: buscar orange-400 → nuevo color. Actualizar #f97316 en index_v2.css
Atlas:  buscar cyan-400  → nuevo color. Actualizar #22d3ee en index_v2.css
