import re

with open("src/pages/Atlas.tsx", "r", encoding="utf-8") as f:
    code = f.read()

# 1. Remove the ghost "Vista de Lógica" button
ghost_button = """                    {panelTab === 'logic' && (
                      <div className="text-xs font-bold px-3 py-1.5 rounded-lg border flex items-center gap-1 shadow-sm shrink-0 bg-blue-900/40 text-blue-300 border-blue-700/50">
                        🧠 Vista de Lógica
                      </div>
                    )}"""
code = code.replace(ghost_button, "")

# 2. Fix the grid onClick to update promptHistory so marquee works!
grid_click_old = """onClick={(e) => { e.stopPropagation(); setInspectedPrompt(prompt); }}"""
grid_click_new = """onClick={(e) => { 
                      e.stopPropagation(); 
                      setInspectedPrompt(prompt); 
                      const key = makePromptKey(prompt);
                      const now = new Date().toISOString();
                      setPromptHistoryEntry(key, now);
                      setPromptHistory(prev => ({ ...prev, [key]: now }));
                    }}"""
code = code.replace(grid_click_old, grid_click_new)

# 3. Add persistence for logicData and translationData
# Load them in useEffect
load_data_logic = """
    try {
      setGeneratedVariants(JSON.parse(localStorage.getItem('generated_variants') || '[]'));
    } catch (err) {
"""
load_data_logic_new = """
    try {
      setGeneratedVariants(JSON.parse(localStorage.getItem('generated_variants') || '[]'));
      const storedLogic = localStorage.getItem('atlas_logic_data');
      if (storedLogic) setLogicData(JSON.parse(storedLogic));
      const storedTrans = localStorage.getItem('atlas_translation_data');
      if (storedTrans) setTranslationData(JSON.parse(storedTrans));
    } catch (err) {
"""
code = code.replace(load_data_logic, load_data_logic_new)

# 4. Refactor handleLogic to use stream: true and save to localStorage
handle_logic_old = """  const handleLogic = async () => {
    if (!inspectedPrompt) return;
    const key = makePromptKey(inspectedPrompt);
    setPanelTab('logic');
    if (logicData[key]) return;

    setIsGeneratingLogic(true);
    try {
      const res = await fetch('http://127.0.0.1:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'hermes3:8b',
          prompt: `Analiza el siguiente prompt y explica detalladamente cómo funciona, su lógica interna y su propósito principal de manera extensa y clara.\\n\\nPrompt:\\n${inspectedPrompt.content}`,
          stream: false
        })
      });
      if (!res.ok) throw new Error('Error al conectar con Ollama');
      const data = await res.json();
      setLogicData(prev => ({ ...prev, [key]: data.response }));
    } catch (err) {
      console.error(err);
      setLogicData(prev => ({ ...prev, [key]: 'No se pudo generar la explicacion. Verifica la conexion con Ollama local.' }));
    } finally {
      setIsGeneratingLogic(false);
    }
  };"""

handle_logic_new = """  const handleLogic = async () => {
    if (!inspectedPrompt) return;
    const key = makePromptKey(inspectedPrompt);
    setPanelTab('logic');
    if (logicData[key]) return;

    setIsGeneratingLogic(true);
    setLogicData(prev => ({ ...prev, [key]: '' })); // Initialize empty to start streaming

    try {
      const res = await fetch('http://127.0.0.1:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'hermes3:8b',
          prompt: `Analiza el siguiente prompt y explica detalladamente cómo funciona, su lógica interna y su propósito principal de manera extensa y clara.\\n\\nPrompt:\\n${inspectedPrompt.content}`,
          stream: true
        })
      });
      if (!res.ok || !res.body) throw new Error('Error al conectar con Ollama');
      
      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let fullText = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\\n').filter(l => l.trim() !== '');
        
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.response) {
              fullText += parsed.response;
              setLogicData(prev => ({ ...prev, [key]: fullText }));
            }
          } catch (e) {}
        }
      }
      
      // Save to localStorage
      setLogicData(prev => {
        const updated = { ...prev, [key]: fullText };
        localStorage.setItem('atlas_logic_data', JSON.stringify(updated));
        return updated;
      });
      
    } catch (err) {
      console.error(err);
      setLogicData(prev => ({ ...prev, [key]: 'No se pudo generar la explicacion. Verifica la conexion con Ollama local.' }));
    } finally {
      setIsGeneratingLogic(false);
    }
  };"""

code = code.replace(handle_logic_old, handle_logic_new)

# 5. Refactor handleTranslate to use stream: true and save to localStorage
handle_translate_old = """  const handleTranslate = async () => {
    if (!inspectedPrompt) return;
    const key = makePromptKey(inspectedPrompt);
    setPanelTab('translation');
    if (translationData[key]) return;

    setIsTranslatingContent(true);
    try {
      const res = await fetch('http://127.0.0.1:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'hermes3:8b',
          prompt: `Traduce el siguiente prompt al español manteniendo exactamente el mismo formato, estructura, y variables (como [texto]). No agregues comentarios ni explicaciones adicionales, solo la traducción directa del texto.\\n\\nPrompt:\\n${inspectedPrompt.content}`,
          stream: false
        })
      });
      if (!res.ok) throw new Error('Error al conectar con Ollama');
      const data = await res.json();
      setTranslationData(prev => ({ ...prev, [key]: data.response }));
    } catch (err) {
      console.error(err);
      setTranslationData(prev => ({ ...prev, [key]: 'Error al generar la traducción. Verifica la conexión con Ollama.' }));
    } finally {
      setIsTranslatingContent(false);
    }
  };"""

handle_translate_new = """  const handleTranslate = async () => {
    if (!inspectedPrompt) return;
    const key = makePromptKey(inspectedPrompt);
    setPanelTab('translation');
    if (translationData[key]) return;

    setIsTranslatingContent(true);
    setTranslationData(prev => ({ ...prev, [key]: '' })); // Initialize empty to start streaming

    try {
      const res = await fetch('http://127.0.0.1:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'hermes3:8b',
          prompt: `Traduce el siguiente prompt al español manteniendo exactamente el mismo formato, estructura, y variables (como [texto]). No agregues comentarios ni explicaciones adicionales, solo la traducción directa del texto.\\n\\nPrompt:\\n${inspectedPrompt.content}`,
          stream: true
        })
      });
      if (!res.ok || !res.body) throw new Error('Error al conectar con Ollama');
      
      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let fullText = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\\n').filter(l => l.trim() !== '');
        
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.response) {
              fullText += parsed.response;
              setTranslationData(prev => ({ ...prev, [key]: fullText }));
            }
          } catch (e) {}
        }
      }
      
      // Save to localStorage
      setTranslationData(prev => {
        const updated = { ...prev, [key]: fullText };
        localStorage.setItem('atlas_translation_data', JSON.stringify(updated));
        return updated;
      });
      
    } catch (err) {
      console.error(err);
      setTranslationData(prev => ({ ...prev, [key]: 'Error al generar la traducción. Verifica la conexión con Ollama.' }));
    } finally {
      setIsTranslatingContent(false);
    }
  };"""

code = code.replace(handle_translate_old, handle_translate_new)

# Fix loading text for isGeneratingLogic and isTranslatingContent when text is empty
code = code.replace(
    "{logicData[makePromptKey(inspectedPrompt)] || (isGeneratingLogic ? '🧠 Generando análisis profundo de la lógica del prompt... (Esto puede tomar unos segundos)' : 'No hay datos.')}",
    "{logicData[makePromptKey(inspectedPrompt)] || (isGeneratingLogic ? '🧠 Conectando y generando análisis...' : 'No hay datos.')}"
)
code = code.replace(
    "{translationData[makePromptKey(inspectedPrompt)] || (isTranslatingContent ? '🇪🇸 Traduciendo el prompt al español de forma natural... (Esto puede tomar unos segundos)' : 'No hay datos.')}",
    "{translationData[makePromptKey(inspectedPrompt)] || (isTranslatingContent ? '🇪🇸 Conectando y traduciendo...' : 'No hay datos.')}"
)

with open("src/pages/Atlas.tsx", "w", encoding="utf-8") as f:
    f.write(code)

print("Fixes applied successfully!")

