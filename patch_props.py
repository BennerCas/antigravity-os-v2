import codecs

file_path = r'C:\antigravityAS\Antigravity_OS\apps\web-app\src\components\builder\PropertiesPanel.tsx'
with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

# I want to add new fields after 'Variables de Entrada'

target = '''            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider opacity-70">Variables de Entrada</label>
              <input
                type="text"
                value={data.variables || ''}
                onChange={(e) => handleChange('variables', e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors"
                style={{ backgroundColor: "var(--theme-bg)", border: "1px solid var(--theme-border)", color: "var(--theme-text)" }}
                placeholder="Ej. topic, audience_size"
              />
            </div>'''

new_fields = target + '''

            <div className="h-px w-full my-2 shrink-0 opacity-20" style={{ backgroundColor: "var(--theme-text)" }} />
            
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider opacity-70">Modelo LLM</label>
              <select
                value={data.llm_model || 'hermes3:8b'}
                onChange={(e) => handleChange('llm_model', e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors cursor-pointer"
                style={{ backgroundColor: "var(--theme-bg)", border: "1px solid var(--theme-border)", color: "var(--theme-text)" }}
              >
                <option value="hermes3:8b">Ollama: Hermes 3 (8B)</option>
                <option value="qwen2.5-coder:latest">Ollama: Qwen 2.5 Coder</option>
                <option value="llama3.2">Ollama: Llama 3.2</option>
                <option value="gpt-4o-mini">OpenAI: GPT-4o Mini</option>
                <option value="gpt-4o">OpenAI: GPT-4o</option>
                <option value="claude-3-5-sonnet">Anthropic: Claude 3.5 Sonnet</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider opacity-70">Temperatura</label>
                <span className="text-xs opacity-70 font-mono">{data.temperature || '0.7'}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={data.temperature || '0.7'}
                onChange={(e) => handleChange('temperature', e.target.value)}
                className="w-full accent-fuchsia-500"
              />
              <div className="flex justify-between text-[10px] opacity-50 mt-1">
                <span>Determinista (0.0)</span>
                <span>Creativo (1.0)</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider opacity-70">Output Schema (JSON)</label>
              <textarea
                value={data.output_schema || ''}
                onChange={(e) => handleChange('output_schema', e.target.value)}
                className="w-full min-h-[100px] rounded-lg px-3 py-2 text-xs font-mono focus:outline-none transition-colors resize-y"
                style={{ backgroundColor: "var(--theme-bg)", border: "1px solid var(--theme-border)", color: "var(--theme-text)" }}
                placeholder="{`\n  \"key\": \"value\"\n`}"
              />
            </div>'''

content = content.replace(target, new_fields)

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(content)

print("Properties panel extended successfully")
