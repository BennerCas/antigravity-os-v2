import { describe, it, expect } from 'vitest';
import { parseAIResponseToFlow } from '../stores/useStudioStore';

describe('parseAIResponseToFlow Pipeline & Clean Verification', () => {
  it('correctly parses an array-based topology, assigns Left-to-Right columns, and creates logical bridges', () => {
    const rawAiText = `
<thinking>
1. Analyze User Intent: The user wants a UI component.
2. Architecture decisions: Router and Agents needed.
</thinking>

<topology>
[
  { "id": "tr1", "data": { "label": "Webhook Trigger", "kind": "trigger", "description": "Entrada de eventos" } },
  { "id": "rt1", "data": { "label": "Supervisor Router", "kind": "router", "description": "Enrutamiento cognitivo" } },
  { "id": "ag1", "data": { "label": "Security Auditor", "kind": "agent", "description": "Audita seguridad" } },
  { "id": "ag2", "data": { "label": "UI Engineer", "kind": "agent", "description": "Construye interfaz" } },
  { "id": "tl1", "data": { "label": "Knowledge DB", "kind": "tool", "description": "Base de datos vectorial" } },
  { "id": "sk1", "data": { "label": "Final Aggregator", "kind": "sink", "description": "Receptor final" } }
]
</topology>

<artifact name="dashboard_app">
<!DOCTYPE html>
<html><body><h1>App Funcional</h1></body></html>
</artifact>
`;

    const result = parseAIResponseToFlow(rawAiText);

    // 1. Debe haber 7 nodos en total (6 del JSON + 1 del Artefacto)
    expect(result.nodes.length).toBe(7);

    // 2. NINGÚN nodo debe contener texto de <thinking> en su label ni id
    result.nodes.forEach(node => {
      const label = (node.data as any).label || '';
      expect(label.toLowerCase()).not.toContain('thinking');
      expect(label.toLowerCase()).not.toContain('analyze');
      expect(label.toLowerCase()).not.toContain('user intent');
    });

    // 3. Verificar posicionamiento jerárquico izquierda a derecha (DAG columns)
    const triggerNode = result.nodes.find(n => (n.data as any).kind === 'trigger');
    const routerNode = result.nodes.find(n => (n.data as any).kind === 'router');
    const agentNode = result.nodes.find(n => (n.data as any).kind === 'agent');
    const toolNode = result.nodes.find(n => (n.data as any).kind === 'tool');
    const sinkNode = result.nodes.find(n => (n.data as any).kind === 'sink');
    const artifactNode = result.nodes.find(n => (n.data as any).kind === 'artifact');

    expect(triggerNode).toBeDefined();
    expect(routerNode).toBeDefined();
    expect(agentNode).toBeDefined();
    expect(toolNode).toBeDefined();
    expect(sinkNode).toBeDefined();
    expect(artifactNode).toBeDefined();

    // Columnas ordenadas por posX: Trigger (60) < Router (380) < Agent (700) < Tool (1020) < Sink (1340) < Artifact (1660)
    expect(triggerNode!.position.x).toBe(60);
    expect(routerNode!.position.x).toBe(380);
    expect(agentNode!.position.x).toBe(700);
    expect(toolNode!.position.x).toBe(1020);
    expect(sinkNode!.position.x).toBe(1340);
    expect(artifactNode!.position.x).toBe(1660);

    // 4. Puentes lógicos automáticos creados
    expect(result.edges.length).toBeGreaterThan(0);
    const edgeLabels = result.edges.map(e => e.label);
    expect(edgeLabels).toContain('Enrutar Requerimiento');
    expect(edgeLabels).toContain('Delegar Tarea');
    expect(edgeLabels).toContain('Renderizar Artefacto');

    // 5. Blueprint técnico generado
    expect(result.md).toContain('## 🏛️ Blueprint Arquitectonico del Sistema');
    expect(result.md).toContain('Inventario de Nodos y Componentes');
  });

  it('handles fallback gracefully without turning reasoning text into nodes', () => {
    const rawHeuristic = `
🧠 Proceso Cognitivo:
_
Analyze User Intent: The user wants a military sidebar.
Constraint Check: Ensure strict execution.
_

### Modulo de Autenticacion
Gestiona el inicio de sesion y tokens JWT.

### Modulo de Procesamiento
Calcula metricas en tiempo real.
`;

    const result = parseAIResponseToFlow(rawHeuristic);

    // No debe haber nodos que provengan de Proceso Cognitivo ni de Constraints
    result.nodes.forEach(node => {
      const label = (node.data as any).label || '';
      expect(label.toLowerCase()).not.toContain('proceso cognitivo');
      expect(label.toLowerCase()).not.toContain('analyze');
      expect(label.toLowerCase()).not.toContain('constraint');
    });

    // Debe haber reconocido los dos módulos reales
    expect(result.nodes.length).toBe(2);
    expect((result.nodes[0].data as any).label).toBe('Modulo de Autenticacion');
    expect((result.nodes[1].data as any).label).toBe('Modulo de Procesamiento');
  });
});
