import re

path = r"c:\antigravityAS\Antigravity_OS_v2\apps\web-app\src\pages\AgentOSStudio.tsx"
with open(path, "r", encoding="utf-8") as f:
    text = f.read()

# 1. Add Microphone to imports
import_str = "from '@phosphor-icons/react';"
new_import = "Microphone, "
if "Microphone," not in text:
    text = text.replace("Stop } from '@phosphor-icons/react';", "Stop, Microphone } from '@phosphor-icons/react';")

# 2. Add state and ref in FlowArchitect
state_hook = "const [input, setInput] = useState('');"
listen_state = """    const [input, setInput] = useState('');
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);

    const toggleListen = () => {
      if (isListening) {
        recognitionRef.current?.stop();
        setIsListening(false);
        return;
      }
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("Tu navegador no soporta el dictado por voz de forma nativa. Usa Chrome o Edge.");
        return;
      }
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-ES';
      recognition.continuous = true;
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setInput(prev => prev ? prev + ' ' + finalTranscript.trim() : finalTranscript.trim());
        }
      };

      recognition.onerror = (e: any) => {
        console.error("Speech rec error:", e);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
      setIsListening(true);
      recognitionRef.current = recognition;
    };"""

text = text.replace(state_hook, listen_state)

# 3. Add button in the UI
button_html = """            {isTyping ? (
              <div className="p-3 bg-zinc-800 text-zinc-400 rounded-xl flex items-center justify-center shrink-0">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            ) : (
              <>
                <button
                  onClick={toggleListen}
                  className={`p-3 rounded-xl transition-all shadow-md flex items-center justify-center shrink-0 ${
                    isListening ? 'bg-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]' : t.sendDisabled
                  } hover:scale-105`}
                  title={isListening ? "Detener grabación" : "Dictar por voz"}
                >
                  <Microphone weight={isListening ? "fill" : "duotone"} size={22} />
                </button>
                <button
                  onClick={() => handleSend()}
                  className={`p-3 rounded-xl transition-all shadow-md flex items-center justify-center shrink-0 ${
                    input.trim() && !isTyping ? `${t.sendActive} hover:scale-105` : `${t.sendDisabled} cursor-not-allowed`
                  }`}
                >
                  <PaperPlaneRight weight="fill" size={22} />
                </button>
              </>
            )}"""

old_button_regex = r"\{isTyping \? \(\s*<div className=\"p-3 bg-zinc-800 text-zinc-400 rounded-xl flex items-center justify-center shrink-0\">\s*<div className=\"flex gap-1\">\s*<div className=\"w-2 h-2 rounded-full bg-zinc-500 animate-bounce\" style={{ animationDelay: '0ms' }} />\s*<div className=\"w-2 h-2 rounded-full bg-zinc-500 animate-bounce\" style={{ animationDelay: '150ms' }} />\s*<div className=\"w-2 h-2 rounded-full bg-zinc-500 animate-bounce\" style={{ animationDelay: '300ms' }} />\s*</div>\s*</div>\s*\) : \(\s*<button\s*onClick=\{\(\) => handleSend\(\)\}\s*className=\{`p-3 rounded-xl transition-all shadow-md flex items-center justify-center shrink-0 \$\{input\.trim\(\) && !isTyping \? `\$\{t\.sendActive\} hover:scale-105` : `\$\{t\.sendDisabled\} cursor-not-allowed`\}`\}\s*>\s*<PaperPlaneRight weight=\"fill\" size=\{22\} />\s*</button>\s*\)\}"

import re
text = re.sub(old_button_regex, button_html, text, flags=re.DOTALL)

with open(path, "w", encoding="utf-8") as f:
    f.write(text)

print("Added mic button logic")
