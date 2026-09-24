import re

path = r"c:\antigravityAS\Antigravity_OS_v2\apps\web-app\src\pages\AgentOSStudio.tsx"
with open(path, "r", encoding="utf-8") as f:
    text = f.read()

# Replace the button part
button_html = """            {isTyping ? (
              <button
                onClick={handleStop}
                className={`px-4 py-3 rounded-xl transition-all shadow-md flex items-center justify-center shrink-0 bg-red-600/20 text-red-500 hover:bg-red-600/30 border border-red-500/50`}
                title="Detener ejecución"
              >
                <span className="text-sm font-bold uppercase tracking-wider">Detener</span>
              </button>
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

regex = r"\{isTyping \? \(\s*<button\s*onClick=\{handleStop\}\s*className=\{`px-4 py-3 rounded-xl transition-all shadow-md flex items-center justify-center shrink-0 \nbg-red-600/20 text-red-500 hover:bg-red-600/30 border border-red-500/50`\}\s*title=\"Detener ejecución\"\s*>\s*<span className=\"text-sm font-bold uppercase tracking-wider\">Detener</span>\s*</button>\s*\) : \(\s*<button\s*onClick=\{\(\) => handleSend\(\)\}\s*className=\{`p-3 rounded-xl transition-all shadow-md flex items-center justify-center shrink-0 \n\$\{input\.trim\(\) && !isTyping \? `\$\{t\.sendActive\} hover:scale-105` : `\$\{t\.sendDisabled\} cursor-not-allowed`\}`\}\s*>\s*<PaperPlaneRight weight=\"fill\" size=\{22\} />\s*</button>\s*\)\}"

text = re.sub(regex, button_html, text, flags=re.DOTALL)

with open(path, "w", encoding="utf-8") as f:
    f.write(text)

print("Injected mic button correctly")
