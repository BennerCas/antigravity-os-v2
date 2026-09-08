import React from 'react';
import { BuilderNode, DataContract, NodeExecutionPolicy } from '../../types/builder-flow';

interface ContractInspectorProps {
  node: BuilderNode;
  onUpdate: (updatedNode: BuilderNode) => void;
}

export const ContractInspector: React.FC<ContractInspectorProps> = ({ node, onUpdate }) => {
  const updatePolicy = (field: keyof NodeExecutionPolicy, value: any) => {
    const newPolicy = { ...(node.execution_policy || {}), [field]: value };
    onUpdate({ ...node, execution_policy: newPolicy });
  };

  const renderCapabilities = () => {
    if (node.kind !== 'agent') return null;
    return (
      <div className="mt-4 border-t border-gray-700 pt-4">
        <h4 className="font-bold text-sm text-gray-300 mb-2">Capabilities Registry</h4>
        <select 
          className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm text-white"
          value={node.config.unresolved_capabilities || ''}
          onChange={(e) => onUpdate({ ...node, config: { ...node.config, unresolved_capabilities: e.target.value }})}
        >
          <option value="">Seleccionar Tool (Referencia)...</option>
          <option value="ai.document_extraction">ai.document_extraction (v1.0.0)</option>
          <option value="storage.invoice.write">storage.invoice.write (v1.2.0)</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">Vinculación segura sin exponer secretos.</p>
      </div>
    );
  };

  return (
    <div className="p-4 bg-gray-800 text-white rounded-lg shadow h-full flex flex-col">
      <h3 className="font-bold text-lg mb-4 flex items-center">
        <span className="bg-blue-600 text-xs px-2 py-1 rounded mr-2 uppercase">{node.kind}</span>
        Contract Inspector
      </h3>
      
      <div className="space-y-4 flex-1 overflow-y-auto">
        <div>
          <label className="block text-xs text-gray-400 uppercase mb-1">Nombre del Nodo</label>
          <input 
            type="text" 
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm"
            value={node.name}
            onChange={(e) => onUpdate({ ...node, name: e.target.value })}
          />
        </div>

        {/* Input/Output Data Contracts */}
        <div className="bg-gray-900 p-3 rounded border border-gray-700">
          <h4 className="font-bold text-sm text-gray-300 mb-2">Data Contracts</h4>
          <div className="mb-2">
            <span className="text-xs text-gray-500 block mb-1">Input Schema Ref</span>
            <input 
              type="text" 
              className="w-full bg-gray-800 border border-gray-600 rounded p-1 text-xs"
              placeholder="e.g., Invoice/v1"
              value={node.input_contract?.schema_ref || ''}
              onChange={(e) => onUpdate({ ...node, input_contract: { schema_ref: e.target.value }})}
            />
          </div>
          <div>
            <span className="text-xs text-gray-500 block mb-1">Output Schema Ref (Default)</span>
            <input 
              type="text" 
              className="w-full bg-gray-800 border border-gray-600 rounded p-1 text-xs"
              placeholder="e.g., ExtractionResult/v1"
              value={node.output_contracts?.['default']?.schema_ref || ''}
              onChange={(e) => onUpdate({ ...node, output_contracts: { 'default': { schema_ref: e.target.value } }})}
            />
          </div>
        </div>

        {/* Execution Policy */}
        <div className="bg-gray-900 p-3 rounded border border-gray-700">
          <h4 className="font-bold text-sm text-gray-300 mb-2">Execution Policy</h4>
          <div>
            <span className="text-xs text-gray-500 block mb-1">Timeout (ms)</span>
            <input 
              type="number" 
              className="w-full bg-gray-800 border border-gray-600 rounded p-1 text-xs"
              value={node.execution_policy?.timeout_ms || 30000}
              onChange={(e) => updatePolicy('timeout_ms', parseInt(e.target.value))}
            />
          </div>
        </div>

        {renderCapabilities()}

        {/* Node Config / Expression (Decision Node) */}
        {node.kind === 'decision' && (
          <div className="mt-4 border-t border-gray-700 pt-4">
            <h4 className="font-bold text-sm text-gray-300 mb-2">Logic Expression</h4>
            <input 
              type="text" 
              className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm text-green-400 font-mono"
              placeholder="e.g., shared.requires_review == true"
              value={node.config.expression || ''}
              onChange={(e) => onUpdate({ ...node, config: { ...node.config, expression: e.target.value }})}
            />
          </div>
        )}
      </div>
    </div>
  );
};
