import { v4 as uuidv4 } from 'uuid';

export class LegacyFlowAdapter {
  /**
   * Converts a legacy React Flow JSON object to a any v1 object.
   */
  static normalize(legacyFlow: any): any {
    const nodes = legacyFlow.nodes || [];
    const edges = legacyFlow.edges || [];
    
    const normalizedNodes: any[] = [];
    const uiAnnotations: any[] = [];
    
    nodes.forEach((node: any) => {
      const nodeType = node.type || 'unknown';
      const data = node.data || {};
      const uiData = {
        position: node.position || { x: 0, y: 0 },
        width: node.width,
        height: node.height,
      };
      
      if (['postIt', 'drawing', 'ruler', 'note'].includes(nodeType)) {
        uiAnnotations.push({
          id: node.id,
          type: nodeType,
          data,
          ui: uiData
        });
        return;
      }
      
      const builderNode: any = {
        id: node.id || uuidv4(),
        name: data.label || nodeType,
        config: {},
        ui: uiData,
        output_contracts: {}
      };
      
      switch (nodeType) {
        case 'mainPrompt':
        case 'agent':
          builderNode.kind = 'agent';
          builderNode.config.prompt = data.content || '';
          builderNode.config.role = data.role || 'system';
          if (data.llm_model) builderNode.config.model_profile_override = data.llm_model;
          if (data.temperature !== undefined) builderNode.config.temperature = data.temperature;
          if (data.tools) builderNode.config.unresolved_capabilities = data.tools;
          break;
          
        case 'variable':
          builderNode.kind = 'transform';
          builderNode.config.var_name = data.variableName || '';
          break;
          
        case 'condition':
        case 'logic':
          builderNode.kind = 'decision';
          builderNode.config.expression = data.condition || data.prompt || '';
          break;
          
        case 'human':
        case 'human_gate':
          builderNode.kind = 'human_gate';
          builderNode.config.objective = data.label || 'Human Approval';
          break;
          
        case 'subflow':
          builderNode.kind = 'subflow';
          builderNode.config.unresolved_subflow = data.content || '';
          break;
          
        default:
          builderNode.kind = nodeType;
          builderNode.config = { ...data };
      }
      
      normalizedNodes.push(builderNode as any);
    });
    
    const normalizedEdges: any[] = edges.map((edge: any) => {
      const sourceNode = normalizedNodes.find(n => n.id === edge.source);
      let kind = 'route';
      
      // Detect ambiguous branch
      if (sourceNode && sourceNode.kind === 'decision') {
        if (!edge.label && !edge.sourceHandle) {
          kind = 'ambiguous_branch';
        }
      }
      
      return {
        id: edge.id || uuidv4(),
        from: edge.source,
        to: edge.target,
        kind,
        label: edge.label,
        source_handle: edge.sourceHandle,
        target_handle: edge.targetHandle,
        ui: {
          style: edge.style || {}
        }
      };
    });
    
    return {
      schema_version: 'builder/v1',
      id: legacyFlow.id || uuidv4(),
      revision: 1,
      metadata: {
        name: legacyFlow.name || 'Migrated Flow',
        source: 'legacy_migration'
      },
      nodes: normalizedNodes,
      edges: normalizedEdges,
      ui: {
        viewport: legacyFlow.viewport || { x: 0, y: 0, zoom: 1 },
        annotations: uiAnnotations
      }
    };
  }
}
