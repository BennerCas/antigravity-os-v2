import { useEffect, useState } from 'react';
import { API_URL } from '../lib/api';
import { Database, Key, Server, Cpu, Activity, HardDrive } from 'lucide-react';

interface OllamaModel {
  name: string;
  size: number;
  size_vram: number;
}

interface VaultStatus {
  api_keys: Record<string, string>;
  ollama_models: OllamaModel[];
}

export default function Vault() {
  const [status, setStatus] = useState<VaultStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/vault/status`)
      .then(res => res.json())
      .then(data => {
        setStatus(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching vault status:', err);
        setLoading(false);
      });
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex h-full w-full flex-col p-8 bg-zinc-950 text-white overflow-y-auto">
      <div className="flex items-center gap-3 mb-8">
        <Database className="w-8 h-8 text-emerald-400" />
        <h1 className="text-3xl font-bold tracking-tight">Vault</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Activity className="w-8 h-8 text-emerald-400 animate-pulse" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Local Brain Status */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-6 border-b border-zinc-800 pb-4">
              <Server className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-semibold">Local Brain Status</h2>
            </div>
            
            {status?.ollama_models.length === 0 ? (
              <p className="text-zinc-500">No models currently loaded in Ollama.</p>
            ) : (
              <div className="space-y-4">
                {status?.ollama_models.map((model, idx) => (
                  <div key={idx} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-emerald-400">{model.name}</span>
                      <span className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-300">Loaded</span>
                    </div>
                    <div className="flex gap-4 text-sm text-zinc-400 mt-2">
                      <div className="flex items-center gap-1">
                        <HardDrive className="w-4 h-4" />
                        <span>Size: {formatBytes(model.size)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Cpu className="w-4 h-4 text-purple-400" />
                        <span className="text-purple-400">VRAM: {formatBytes(model.size_vram)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fallback Vault (API Keys) */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-6 border-b border-zinc-800 pb-4">
              <Key className="w-6 h-6 text-amber-400" />
              <h2 className="text-xl font-semibold">Fallback Vault</h2>
            </div>
            
            {!status?.api_keys || Object.keys(status.api_keys).length === 0 ? (
              <p className="text-zinc-500">No configured API keys found.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {Object.entries(status.api_keys).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-lg p-3">
                    <span className="font-mono text-sm text-zinc-300">{key}</span>
                    <span className="font-mono text-sm text-zinc-500 bg-zinc-950 px-2 py-1 rounded border border-zinc-800">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
        </div>
      )}
    </div>
  );
}
