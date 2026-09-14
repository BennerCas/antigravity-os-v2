import React, { useState } from 'react';
import { useStudioStore, TabId } from '../stores/useStudioStore';

const FlowArchitect: React.FC = () => {
  const { chatMessages, addChatMessage } = useStudioStore();
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    addChatMessage({ role: 'human', content: input });
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-gray-100 p-4">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={`p-3 rounded-lg max-w-[85%] ${
              msg.role === 'human'
                ? 'bg-blue-600 self-end ml-auto'
                : msg.role === 'system'
                ? 'bg-gray-800 border border-gray-700 text-gray-300 text-sm'
                : 'bg-gray-700'
            }`}
          >
            {msg.content}
          </div>
        ))}
      </div>
      <div className="flex flex-col shrink-0 gap-2">
        <div className="text-xs text-gray-400">Activity Rail: Standing by...</div>
        <div className="text-xs text-gray-400 mb-2">Budget: $0.00 / $5.00</div>
        <div className="flex">
          <input
            type="text"
            className="flex-1 bg-gray-800 border border-gray-700 rounded-l-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Type your intent..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button
            onClick={handleSend}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-r-md font-semibold transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

const FlowDiagram: React.FC = () => (
  <div className="flex-1 flex items-center justify-center bg-gray-800 text-gray-400">
    [Flow Diagram / React Flow Canvas]
  </div>
);

const AgentCarousel: React.FC = () => {
  const { isFocusMode, setFocusMode } = useStudioStore();

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gray-800 relative">
      {!isFocusMode ? (
        <div className="text-center">
          <div className="text-gray-400 mb-4">[3D Agent Carousel View]</div>
          <button
            onClick={() => setFocusMode(true)}
            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-white transition-colors"
          >
            Enter Flip & Focus Mode
          </button>
        </div>
      ) : (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-95 flex flex-col items-center justify-center p-8 backdrop-blur-sm z-10 transition-all duration-250">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 w-full max-w-2xl shadow-2xl relative">
            <button
              onClick={() => setFocusMode(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              ✕ Close
            </button>
            <h3 className="text-xl font-bold mb-4 text-white">Focus Mode: Agent Details</h3>
            <div className="space-y-4 text-gray-300">
              <p><strong>I/O Contract:</strong> Defined</p>
              <p><strong>Required Tools:</strong> vector_search, pdf_parse</p>
              <p><strong>Evals:</strong> 5/5 Passing</p>
              <div className="mt-6">
                <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white transition-colors">
                  Edit Prompt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ArchitectureBlueprint: React.FC = () => (
  <div className="flex-1 flex items-center justify-center bg-gray-800 text-gray-400">
    [Architecture Blueprint / Markdown Editor]
  </div>
);

const CanvasTabs: React.FC = () => {
  const { activeTab, setActiveTab } = useStudioStore();

  const renderContent = () => {
    switch (activeTab) {
      case 'discovery': return <FlowDiagram />;
      case 'synthesis': return <AgentCarousel />;
      case 'blueprint': return <ArchitectureBlueprint />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-800">
      <div className="flex border-b border-gray-700 bg-gray-900">
        {(['discovery', 'synthesis', 'blueprint'] as TabId[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === tab
                ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-800'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
          >
            {tab === 'discovery' && '1 Descubrir'}
            {tab === 'synthesis' && '2 Sintetizar'}
            {tab === 'blueprint' && '3 Blueprint'}
          </button>
        ))}
      </div>
      <div className="flex-1 flex flex-col relative">
        {renderContent()}
      </div>
    </div>
  );
};

export default function AgentOSStudio() {
  return (
    <div className="flex h-screen w-full bg-gray-950 text-white overflow-hidden font-sans">
      <div className="w-[35%] border-r border-gray-800 flex flex-col shrink-0">
        <FlowArchitect />
      </div>
      <div className="w-[65%] flex flex-col shrink-0">
        <CanvasTabs />
      </div>
    </div>
  );
}
