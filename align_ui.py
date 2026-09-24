import re

with open('apps/web-app/src/pages/AgentOSStudio.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add state for GPU
content = content.replace(
    "const [input, setInput] = useState('');",
    "const [input, setInput] = useState('');\n  const [gpuActive, setGpuActive] = useState(false);"
)

# 2. Update activateAmdGpu function to set state
old_func = """
  const activateAmdGpu = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/v1/studio/amd-gpu/activate', { method: 'POST' });
      const data = await res.json();
      if(data.status === 'success') {
        alert('Ollama reiniciado exitosamente con aceleracion AMD RDNA3.\\n¡Listo para procesar enjambres cuanticos!');
      } else {
        alert('Error: ' + data.message);
      }
    } catch(e) {
      alert('Error de red al activar GPU: ' + e);
    }
  };
"""
new_func = """
  const activateAmdGpu = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/v1/studio/amd-gpu/activate', { method: 'POST' });
      const data = await res.json();
      if(data.status === 'success') {
        setGpuActive(true);
        alert('Ollama reiniciado exitosamente con aceleracion AMD RDNA3.\\n¡Listo para procesar enjambres cuanticos!');
      } else {
        alert('Error: ' + data.message);
      }
    } catch(e) {
      alert('Error de red al activar GPU: ' + e);
    }
  };
"""
content = content.replace(old_func.strip(), new_func.strip())

# 3. Update the button
old_btn = """
          <button onClick={activateAmdGpu} title="Activar Aceleracion GPU AMD (RDNA3)" className={`hover:text-green-400 transition-colors ${t.text}`}>
            <Cpu size={18} />
          </button>
"""
new_btn = """
          <button 
            onClick={activateAmdGpu} 
            title="Activar Aceleración GPU AMD (RDNA3)" 
            className={`transition-all duration-500 ${gpuActive ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)] scale-110' : `hover:text-yellow-400 ${t.text}`}`}
          >
            <Brain size={18} weight={gpuActive ? 'fill' : 'regular'} className={gpuActive ? 'animate-pulse' : ''} />
          </button>
"""
content = content.replace(old_btn.strip(), new_btn.strip())

# 4. Align Slide 2 with Slide 1
old_slide2 = 'className="shrink-0 w-full snap-center flex flex-col"'
new_slide2 = 'className="shrink-0 w-full snap-center h-full flex flex-col pt-[1.5cm] pb-[0.5cm]"'
content = content.replace(old_slide2, new_slide2)


with open('apps/web-app/src/pages/AgentOSStudio.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("UI Aligned and Golden Brain added!")
