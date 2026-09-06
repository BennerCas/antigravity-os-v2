import { useState } from 'react';
import { API_URL } from '../lib/api';

export default function Coding() {
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const testBackend = async () => {
    setLoading(true);
    setResponse('');
    try {
      const res = await fetch(`${API_URL}/execute/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          framework: 'autogen', 
          task_description: 'Test connection from frontend',
          preset_name: 'saas-landing' 
        })
      });
      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (error: unknown) {
      setResponse(`Error connecting to backend: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full w-full flex-col p-8">
      <h1 className="text-3xl font-bold text-white mb-4">Coding</h1>
      <p className="text-gray-400 mb-6">Coding component scaffolding.</p>
      
      <button 
        onClick={testBackend}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 w-max mb-4 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test Backend Connection'}
      </button>
      
      {response && (
        <pre className="p-4 bg-gray-800 text-green-400 rounded overflow-auto whitespace-pre-wrap text-sm border border-gray-700">
          {response}
        </pre>
      )}
    </div>
  );
}
