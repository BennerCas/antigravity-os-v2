import re

with open("src/pages/Atlas.tsx", "r", encoding="utf-8") as f:
    atlas_code = f.read()

# 1. Add ReactMarkdown
atlas_code = atlas_code.replace("} from '@phosphor-icons/react';", "} from '@phosphor-icons/react';\nimport ReactMarkdown from 'react-markdown';")

# 2. Add upgradeExplanation to Prompt
atlas_code = atlas_code.replace("  chain?: Prompt[];\n}", "  chain?: Prompt[];\n  upgradeExplanation?: string;\n}")

# 3. Add states
states = """
  // --- NUEVOS ESTADOS DEL PANEL ---
  const [inspectedPrompt, setInspectedPrompt] = useState<Prompt | null>(null);
  const [panelTab, setPanelTab] = useState<'content' | 'instructions' | 'logic'>('content');
  const [logicData, setLogicData] = useState<Record<string, string>>({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeProgress, setUpgradeProgress] = useState(0);
  const [upgradeTimeLeft, setUpgradeTimeLeft] = useState('');
  const [explanationPopup, setExplanationPopup] = useState<{title: string, text: string} | null>(null);
  const [isGeneratingLogic, setIsGeneratingLogic] = useState(false);
"""
atlas_code = atlas_code.replace("  const [suggestError, setSuggestError] = useState<string | null>(null);", "  const [suggestError, setSuggestError] = useState<string | null>(null);\n" + states)

# 4. Add methods (handleTTS, handleUpgrade, handleLogic) right before handleSuggestFlows
methods = """
  const handleTTS = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!inspectedPrompt) return;
    
    const currentText = panelTab === 'content' 
      ? inspectedPrompt.content
      : (logicData[inspectedPrompt.id || ''] || '');
      
    if (!currentText) return;

    setIsTranslating(true);
    try {
      const res = await fetch('http://127.0.0.1:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'hermes3:8b',
          prompt: `Traduce el siguiente texto al español de forma natural. Si ya esta en español, devuelve el texto original sin modificaciones. No agregues saludos, explicaciones, ni notas adicionales, SOLO el texto traducido. Texto:\\n\\n${currentText}`,
          stream: false
        })
      });
      
      let textToSpeak = currentText;
      if (res.ok) {
        const data = await res.json();
        if (data && data.response) {
            textToSpeak = data.response;
        }
      }
      
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = 'es-ES';
        utterance.rate = 1.05;
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.error(err);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(currentText);
        utterance.lang = 'es-ES';
        utterance.rate = 1.05;
        window.speechSynthesis.speak(utterance);
      }
    } finally {
      setIsTranslating(false);
    }
  };

  const handleUpgrade = async () => {
    if (!inspectedPrompt) return;
    setIsUpgrading(true);
    setUpgradeProgress(0);
    setUpgradeTimeLeft('Calculando...');
    
    try {
      const promptText = `Eres un Ingeniero de IA hispanohablante. Tu objetivo es mejorar este prompt.
INSTRUCCIÓN CRÍTICA: Responde EXACTAMENTE con esta estructura (incluyendo los encabezados):

### EXPLICACION
[Escribe aquí tu justificación detallada en ESPAÑOL de por qué es mejor (2 a 3 líneas)]

### PROMPT MEJORADO
[Escribe aquí el prompt mejorado en formato Markdown, estrictamente en español]

Prompt Original a mejorar:
${inspectedPrompt.content}`;

      const res = await fetch('http://127.0.0.1:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'hermes3:8b',
          system: 'Eres un sistema nativo en idioma ESPAÑOL. Absolutamente TODO el contenido que generes (explicaciones, respuestas, código, notas) DEBE estar única y exclusivamente en ESPAÑOL. NUNCA respondas en inglés.',
          prompt: promptText,
          stream: true
        })
      });
      
      if (!res.ok || !res.body) throw new Error('Error de conexión con Ollama local');
      
      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      
      let generatedText = '';
      let tokens = 0;
      const startTime = Date.now();
      const estimatedTotalTokens = 350;
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\\n').filter(l => l.trim() !== '');
        
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.response) {
              generatedText += parsed.response;
              tokens++;
              
              const progress = Math.min(99, Math.floor((tokens / estimatedTotalTokens) * 100));
              setUpgradeProgress(progress);
              
              const elapsedSeconds = (Date.now() - startTime) / 1000;
              const tokensPerSecond = tokens / elapsedSeconds;
              const remainingTokens = estimatedTotalTokens - tokens;
              let estimatedSecondsLeft = Math.ceil(remainingTokens / tokensPerSecond);
              if (estimatedSecondsLeft < 1) estimatedSecondsLeft = 1;
              
              setUpgradeTimeLeft(`${estimatedSecondsLeft}s restantes`);
            }
          } catch (e) {
          }
        }
      }
      
      setUpgradeProgress(100);
      setUpgradeTimeLeft('¡Completado!');
      
      let finalPrompt = generatedText;
      let explanation = "Mejora generada exitosamente.";
      
      try {
        const expMatch = generatedText.match(/### EXPLICACION\\s*([\\s\\S]*?)(?:### PROMPT MEJORADO|$)/i);
        const promptMatch = generatedText.match(/### PROMPT MEJORADO\\s*([\\s\\S]*)$/i);
        
        if (expMatch && expMatch[1]) {
          explanation = expMatch[1].trim();
        }
        if (promptMatch && promptMatch[1]) {
          finalPrompt = promptMatch[1].trim();
        }
      } catch (e) {
        console.warn("Error al extraer secciones del texto generado.");
      }

      const newPrompt: Prompt = {
        ...inspectedPrompt,
        id: (inspectedPrompt.id || Date.now().toString()) + '-upgraded',
        title: inspectedPrompt.title + ' (Upgrade)',
        content: finalPrompt,
        upgradeExplanation: explanation
      };
      
      setPrompts(prev => [newPrompt, ...prev]);
      setAllPrompts(prev => [newPrompt, ...prev]);
      
      let storedStr = localStorage.getItem('upgraded_prompts');
      let storedPrompts = storedStr ? JSON.parse(storedStr) : [];
      storedPrompts.push(newPrompt);
      localStorage.setItem('upgraded_prompts', JSON.stringify(storedPrompts));

      setInspectedPrompt(newPrompt);
      setExplanationPopup({ title: newPrompt.title, text: explanation });
      
    } catch (err) {
      console.error(err);
      alert("Error al generar mejora. Asegúrate de tener Ollama corriendo y el modelo hermes3:8b descargado.");
    } finally {
      setIsUpgrading(false);
      setTimeout(() => {
        setUpgradeProgress(0);
        setUpgradeTimeLeft('');
      }, 2000);
    }
  };

  const handleLogic = async () => {
    if (!inspectedPrompt) return;
    setPanelTab('logic');
    if (logicData[inspectedPrompt.id || '']) return;

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
      setLogicData(prev => ({ ...prev, [inspectedPrompt.id || '']: data.response }));
    } catch (err) {
      console.error(err);
      setLogicData(prev => ({ ...prev, [inspectedPrompt.id || '']: 'No se pudo generar la explicacion. Verifica la conexion con Ollama local.' }));
    } finally {
      setIsGeneratingLogic(false);
    }
  };
"""
atlas_code = atlas_code.replace("  const handleSuggestFlows =", methods + "\n  const handleSuggestFlows =")

# 5. Load upgraded prompts in useEffect
fetch_logic = """
        if (data.categories) {
          // Add localStorage upgraded prompts to the list
          let upgraded = [];
          try {
            const stored = localStorage.getItem('upgraded_prompts');
            if (stored) upgraded = JSON.parse(stored);
          } catch(e) {}
          
          let allP = [];
          data.categories.forEach((cat: any) => {
            cat.subCategories.forEach((sub: any) => {
              allP = allP.concat(sub.prompts);
            });
          });
          
          allP = [...upgraded, ...allP];
          setAllPrompts(allP);
"""
atlas_code = atlas_code.replace(
"""
        if (data.categories) {
          let allP: Prompt[] = [];
          data.categories.forEach((cat: any) => {
            cat.subCategories.forEach((sub: any) => {
              allP = allP.concat(sub.prompts);
            });
          });
          setAllPrompts(allP);
""", fetch_logic)


# 6. Apply UI Layout (Panel and Popup)
atlas_code = atlas_code.replace('<div className="min-h-screen bg-[#0a0c10] text-gray-200 p-8 font-sans">', '<div className="flex h-screen bg-[#0a0c10] text-gray-200 font-sans overflow-hidden">\\n      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">')

panel_ui = """
      </div>
      {/* Right Column: Panel */}
      <div className="w-96 md:w-[600px] border-l border-gray-800 bg-[#0f111a] flex flex-col z-20 flex-shrink-0 shadow-2xl">
        <div className="p-5 border-b border-gray-800 flex items-center justify-between bg-gray-900/50">
          <h2 className="font-bold text-gray-200 flex items-center gap-2"><Sparkle size={18} className="text-blue-400" /> Panel de Prompt</h2>
          {inspectedPrompt && (
            <button onClick={() => setInspectedPrompt(null)} className="text-gray-500 hover:text-white transition-colors">
              <X size={16} />
            </button>
          )}
        </div>
        
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {inspectedPrompt ? (
            <div className="flex flex-col h-full">

              <div className="flex-1 overflow-y-auto p-5 custom-scrollbar" style={{ paddingBottom: '0.5cm' }}>
                
                <div className="flex flex-col gap-2 mb-6">
                  <div className="text-[10px] uppercase font-bold text-gray-500 tracking-widest border-b border-gray-800 pb-2 mb-1">Herramientas IA</div>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={handleUpgrade} 
                      disabled={isUpgrading}
                      className="rounded bg-gray-800 hover:bg-gray-700 border border-transparent hover:border-blue-500 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-all shadow-sm flex-1 min-w-[100px] disabled:opacity-50"
                    >
                      {isUpgrading ? '⚡ Upgrade...' : '✨ Upgrade'}
                    </button>
                    <button 
                      onClick={handleTTS}
                      disabled={isTranslating}
                      className="rounded bg-gray-800 hover:bg-gray-700 border border-transparent hover:border-blue-500 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-all shadow-sm flex-1 min-w-[100px] disabled:opacity-50"
                    >
                      {isTranslating ? '🔊 Traduciendo...' : '🗣️ TTS'}
                    </button>
                  </div>
                  
                  {isUpgrading && (
                    <div className="mt-2 flex flex-col gap-1">
                      <div className="flex justify-between text-xs text-[#7B9C7F] font-medium">
                        <span>Generando mejora...</span>
                        <span>{upgradeProgress}% ({upgradeTimeLeft})</span>
                      </div>
                      <div className="w-full bg-gray-900 rounded-full h-1.5 overflow-hidden border border-[#2A2A2A]">
                        <div 
                          className="h-full rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${upgradeProgress}%`, backgroundColor: '#4ade80', boxShadow: '0 0 10px rgba(74,222,128,0.5)' }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="pr-2">
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">{inspectedPrompt.category?.split(' > ').pop() || 'Prompt'}</span>
                    <h3 className="text-2xl font-bold text-white mt-1 leading-tight">{inspectedPrompt.title}</h3>
                  </div>
                  {panelTab === 'content' ? (
                  <button 
                    onClick={handleLogic} 
                    className="text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1 shadow-sm shrink-0 bg-blue-900/40 text-blue-300 border-blue-700/50 hover:bg-blue-800"
                  >
                    🧠 Lógica
                  </button>
                ) : (
                  <button 
                    onClick={() => setPanelTab('content')} 
                    className="text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1 shadow-sm shrink-0 bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white"
                  >
                    ⬅️ Volver
                  </button>
                )}
                </div>
                
                <div className="bg-gray-900/80 p-5 rounded-xl border border-gray-800 text-sm text-gray-300 leading-relaxed prose prose-invert prose-sm max-w-none prose-headings:text-blue-400 prose-a:text-blue-400 shadow-inner">
                  {panelTab === 'content' ? (
                    <ReactMarkdown>{inspectedPrompt.content}</ReactMarkdown>
                  ) : (
                    <ReactMarkdown>{logicData[inspectedPrompt.id || ''] || (isGeneratingLogic ? '🧠 Generando análisis profundo de la lógica del prompt... (Esto puede tomar unos segundos)' : 'No hay datos.')}</ReactMarkdown>
                  )}
                </div>
                
              </div>

              <div className="panel-footer">
                <button
                  onClick={(e) => handleSetPrompt(e as any, inspectedPrompt)}
                  style={{
                    display: 'block',
                    width: '100%',
                    backgroundColor: '#2A2A2A',
                    border: 'none',
                    borderRadius: '0',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '14px',
                    letterSpacing: '0.04em',
                    padding: '18px 24px',
                    cursor: 'pointer',
                    transition: 'background-color 150ms ease',
                    textAlign: 'center',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#3a3a3a')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#2A2A2A')}
                >
                  Abrir en el Builder →
                </button>
              </div>

            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-50 text-center p-5">
              <div className="text-6xl mb-4">📝</div>
              <p>Selecciona un prompt en el atlas para ver sus detalles y herramientas de IA.</p>
            </div>
          )}
        </div>
      </div>

      {explanationPopup && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ 
            backgroundColor: 'rgba(5, 10, 15, 0.95)',
            transform: 'translateZ(0)',
            animation: 'fadeIn 0.2s ease-out' 
          }}
        >
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; backdrop-filter: blur(0px); }
              to { opacity: 1; backdrop-filter: blur(8px); }
            }
          `}</style>
          <div className="bg-[#12141a] border border-[#2A2A2A] rounded-2xl p-6 md:p-8 max-w-xl w-full shadow-2xl relative">
            <button 
              onClick={() => setExplanationPopup(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors bg-gray-800/50 hover:bg-gray-700 p-2 rounded-full"
            >
              <X size={20} />
            </button>
            <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Sparkle weight="fill" className="text-blue-400" />
              Mejora Aplicada
            </h3>
            <p className="text-gray-400 mb-4">Explicación de la optimización y cambios en <strong className="text-white">{explanationPopup.title}</strong>:</p>
            <div className="bg-[#0a0c10] border border-gray-800 rounded-xl p-5 text-gray-300 leading-relaxed font-medium mb-6">
              {explanationPopup.text}
            </div>
            
            <div className="flex justify-between items-center mt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if ('speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                    const utterance = new SpeechSynthesisUtterance(explanationPopup.text);
                    utterance.lang = 'es-ES';
                    utterance.rate = 1.05;
                    window.speechSynthesis.speak(utterance);
                  }
                }}
                className="text-gray-400 hover:text-white flex items-center gap-2 border border-gray-700 hover:border-gray-500 px-4 py-2 rounded-full transition-colors bg-gray-900"
              >
                <SpeakerHigh size={18} /> Escuchar
              </button>
              
              <button 
                onClick={() => setExplanationPopup(null)}
                className="text-white font-bold bg-transparent border border-gray-600 hover:bg-gray-800 px-6 py-2.5 rounded-full transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
"""
atlas_code = re.sub(r"(\s*</div>\s*\);\s*};\s*export default Atlas;)", panel_ui + r"\1", atlas_code)

# 7. Add "?" button and active-card styles to grid
atlas_code = atlas_code.replace(
    "const inChain = isInChain(prompt);",
    "const inChain = isInChain(prompt);\n              const isInspected = inspectedPrompt && makePromptKey(inspectedPrompt) === key;"
)
atlas_code = atlas_code.replace(
    "className={`border rounded-2xl p-6 flex flex-col h-80 relative cursor-pointer transition-all group ${inChain ? 'border-[#174A1F] active-card' : 'bg-[#151515] border-[#2A2A2A] hover:border-[#3a3a3a]'}`}",
    "className={`border rounded-2xl p-6 flex flex-col h-80 relative cursor-pointer transition-all group ${inChain ? 'border-[#174A1F] active-card' : isInspected ? 'active-card' : 'bg-[#151515] border-[#2A2A2A] hover:border-[#3a3a3a]'}`}"
)
atlas_code = atlas_code.replace(
    "onClick={(e) => handleSetPrompt(e, prompt)}",
    "onClick={(e) => { e.stopPropagation(); setInspectedPrompt(prompt); }}"
)

# Add "?" button after {prompt.title}
q_btn = """{prompt.upgradeExplanation && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setExplanationPopup({title: prompt.title, text: prompt.upgradeExplanation!}); }}
                      className="ml-2 text-xs font-bold bg-blue-900/40 text-blue-400 border border-blue-800/50 w-6 h-6 rounded-full flex items-center justify-center hover:bg-blue-800 hover:text-white transition-colors flex-shrink-0"
                      title="Ver explicación de la mejora"
                    >
                      ?
                    </button>
                  )}"""
atlas_code = atlas_code.replace(
    "<h3 className=\"font-bold text-lg text-gray-100 mb-2 line-clamp-2 leading-snug\">{prompt.title}</h3>",
    "<div className=\"flex items-center mb-2\"><h3 className=\"font-bold text-lg text-gray-100 line-clamp-2 leading-snug flex-1\">{prompt.title}</h3>" + q_btn + "</div>"
)

with open("src/pages/Atlas.tsx", "w", encoding="utf-8") as f:
    f.write(atlas_code)
print("Atlas updated perfectly.")

