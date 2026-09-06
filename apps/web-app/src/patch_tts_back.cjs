const fs = require('fs');
const file = 'c:/antigravityAS/Antigravity_OS_v2/apps/web-app/src/pages/Agents.tsx';
let c = fs.readFileSync(file, 'utf8');

// 1. Add isTranslating state
c = c.replace(
  'const [isUpgrading, setIsUpgrading] = useState(false);', 
  'const [isUpgrading, setIsUpgrading] = useState(false);\n  const [isTranslating, setIsTranslating] = useState(false);'
);

// 2. Add handleTTS next to handleUpgrade
const newTTSHandler = `
  const handleTTS = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!inspectedAgent) return;
    
    // Determine the text to read based on current tab
    const currentText = panelTab === 'content' 
      ? (inspectedAgent.instructions || inspectedAgent.content)
      : (logicData[inspectedAgent.id || ''] || '');
      
    if (!currentText) return;

    setIsTranslating(true);
    try {
      // Background translation to Spanish using local LLM
      const res = await fetch('http://127.0.0.1:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'hermes3:8b',
          prompt: \`Traduce el siguiente texto al español de forma natural. Si ya esta en español, devuelve el texto original sin modificaciones. No agregues saludos, explicaciones, ni notas adicionales, SOLO el texto traducido. Texto:\\n\\n\${currentText}\`,
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
`;
c = c.replace('const handleUpgrade = async () => {', newTTSHandler + '\n  const handleUpgrade = async () => {');

// 3. Update the TTS button in the UI
const oldTTSButtonRegex = /<button\s*onClick=\{\(e\) => handleSpeak\(e as any, inspectedAgent\.instructions \|\| inspectedAgent\.content\)\}[\s\S]*?<\/button>/;
const newTTSButton = `<button 
                      onClick={handleTTS}
                      disabled={isTranslating}
                      className="rounded bg-gray-800 hover:bg-gray-700 border border-transparent hover:border-blue-500 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-all shadow-sm flex-1 min-w-[100px] disabled:opacity-50"
                    >
                      {isTranslating ? '⏳ Traduciendo...' : '🔊 TTS'}
                    </button>`;
c = c.replace(oldTTSButtonRegex, newTTSButton);

// 4. Update the Logic button to be a Volver button when in logic tab
const oldLogicButtonRegex = /<button\s*onClick=\{handleLogic\}[\s\S]*?🧠 Lógica\s*<\/button>/;
const newLogicButton = `{panelTab === 'content' ? (
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
                )}`;
c = c.replace(oldLogicButtonRegex, newLogicButton);

fs.writeFileSync(file, c);
console.log('TTS and Back button patched');
