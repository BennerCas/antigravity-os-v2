# Reporte de Auditoría: Eliminación del Módulo "Builder"

## 1. Resumen Ejecutivo
El módulo **Builder** está profundamente integrado en la aplicación, funcionando no solo como una pantalla aislada, sino como un puente interactivo desde múltiples módulos (Agents, Atlas, Architecture, Academy). Eliminarlo por completo sin romper la app requiere extirpar rutas, componentes UI, tipos, estados, endpoints backend, *master prompts*, y botones/acciones diseminados por todo el ecosistema.

## 2. Riesgos Detectados
1. **Dependencias Cruzadas (Frontend):** Las pantallas `Agents.tsx`, `Atlas.tsx` y `Architecture.tsx` tienen botones y lógica para exportar flujos o agentes directamente al Builder a través de `builderBridge.ts`. Si se elimina el Builder sin limpiar estos archivos, la compilación de React fallará por imports inexistentes.
2. **Impacto en el Engine de Flujos (Backend):** Archivos core como `flow_compiler.py`, `flow_validator.py` y `flow_normalizer.py` importan el esquema `BuilderFlow` desde `backend/schemas/builder_flow.py`. Si se elimina este archivo sin refactorizar, se romperá la ejecución y validación de flujos. (Recomendación: Renombrar `BuilderFlow` a `Flow` y desligarlo de UI).
3. **Pérdida de Master Prompts en Arquitectura:** Existen numerosos prompts (como `FUSIONAR_SYSTEM`, `FLOW_GENERATOR_SYSTEM`) inyectados en la base de datos o reportados en los endpoints de `architecture.py` y `search.py` que son exclusivos de las acciones de IA del Builder. Al removerlos, hay que tener cuidado de no alterar prompts genéricos utilizados en otras partes del SO.
4. **Almacenamiento Local (LocalStorage):** Algunos componentes de resultados, como `RunResults.tsx`, leen directamente variables asociadas al Builder en localStorage (`builder_run_results`). Esto debe ser manejado para evitar errores silenciosos.

## 3. Plan de Eliminación (Checklist de Archivos)

### 3.1. Archivos a Eliminar (Borrado Total)
#### Frontend:
- `apps/web-app/src/pages/Builder.tsx`
- `apps/web-app/src/components/builder/` (Directorio completo, incluyendo `nodes/`, `AgentsLibraryPanel.tsx`, `PropertiesPanel.tsx`, etc.)
- `apps/web-app/src/components/BuilderNodes.tsx`
- `apps/web-app/src/lib/builderBridge.ts`
- `apps/web-app/src/types/builder-flow.ts`
- `apps/web-app/src/types/builder.ts`

#### Backend:
- `backend/routers/builder_actions.py` (Lógica de IA del Builder)
- `backend/routers/builder_v1.py` (Endpoints V1)

---

### 3.2. Archivos a Modificar (Limpieza Quirúrgica)

#### Core y Navegación (Frontend)
1. **`apps/web-app/src/App.tsx`**:
   - Eliminar el `lazy import` de `Builder`.
   - Eliminar la ruta `<Route path="/builder" element={<Builder />} />`.
2. **`apps/web-app/src/components/Sidebar.tsx`**:
   - Eliminar la entrada `{ path: '/builder', label: 'Builder' }` de la lista `navItems`.
3. **`apps/web-app/src/stores/useStudioStore.ts`**:
   - Eliminar la función `parseAIResponseToFlow` si solo se utilizaba para alimentar el Builder. (Si FlowArchitect lo usa, evaluar mantenerlo).

#### Dependencias Inyectadas (Frontend)
4. **`apps/web-app/src/pages/Agents.tsx`** y **`apps/web-app/src/pages/Atlas.tsx`**:
   - Eliminar los imports de `sendToBuilderBridge` y `BuilderNodeData`.
   - Eliminar las funciones `launchFlowInBuilder`.
   - Eliminar los botones UI que disparan `Abrir en Builder →` o `Enviar Flujo a Builder`.
5. **`apps/web-app/src/pages/Architecture.tsx`** y sus componentes (`SystemEvolutionPanel.tsx`, `FlowArchitect.tsx`):
   - Eliminar botones de "Enviar a Builder" y llamadas a `sendToBuilderBridge`.
6. **`apps/web-app/src/pages/Academy.tsx`**:
   - Eliminar imports de `BuilderNodes.tsx`.
   - Remover los campos UI y estados (`driftBuilderJson`) asociados al "Builder Flow Real".
7. **Textos y Referencias**:
   - Modificar las cadenas de texto en `Automations.tsx` y `Flows.tsx` que digan "flujos del Builder" o "entorno del Builder".
   - Ajustar `apps/web-app/src/components/architecture/RunResults.tsx` para no depender de `localStorage.getItem('builder_run_results')`.
   - Eliminar el paso del Builder en `apps/web-app/src/data/tourSteps.ts`.

#### Desacople y Limpieza (Backend)
8. **`backend/main.py`**:
   - Eliminar los imports de `builder_actions` y `builder_v1`.
   - Eliminar los correspondientes `app.include_router(...)`.
9. **`backend/schemas/builder_flow.py`**:
   - Renombrar el archivo a `flow_schema.py` (o similar) y refactorizar la clase `BuilderFlow` a `Flow`.
   - Modificar las referencias a esta clase en `flow_compiler.py`, `flow_normalizer.py`, `flow_validator.py` y `architect_v1.py`.
10. **`backend/routers/architecture.py`**:
    - Buscar el JSON gigante de descripción de arquitectura y eliminar las líneas correspondientes a los prompts usados exclusivamente por el Builder (`FUSIONAR_SYSTEM`, `FLOW_GENERATOR_SYSTEM`, `API_AUTH_SPECIALIST_SYSTEM`, etc.).
11. **`backend/routers/search.py`**:
    - Eliminar la definición de constantes de prompts asociados con las acciones del Builder (ej. `FUSIONAR_SYSTEM` y `FLOW_GENERATOR_SYSTEM`). Los prompts definidos internamente en `builder_actions.py` ya se borrarán junto con el archivo.

---
**Nota Final:** Al completar estos pasos, el módulo Builder será erradicado exitosamente de forma limpia, sin dejar imports rotos y manteniendo intacta la lógica de evaluación y despliegue del sistema operativo.
