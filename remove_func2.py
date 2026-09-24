with open('apps/web-app/src/pages/AgentOSStudio.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

text_to_remove = """  const activateAmdGpu = async () => {
    try {
      const res = await fetch(`${API_URL}/studio/amd-gpu/activate`, { method: 'POST' });
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
  };"""

content = content.replace(text_to_remove, "")

with open('apps/web-app/src/pages/AgentOSStudio.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done!")
