import re

path = r"c:\antigravityAS\Antigravity_OS_v2\apps\web-app\src\pages\AgentOSStudio.tsx"
with open(path, "r", encoding="utf-8") as f:
    text = f.read()

target = """            ) : (
              <button
                onClick={() => handleSend()}
                className={`p-3 rounded-xl transition-all shadow-md flex items-center justify-center shrink-0 
${input.trim() && !isTyping ? `${t.sendActive} hover:scale-105` : `${t.sendDisabled} cursor-not-allowed`}`}
              >
                <PaperPlaneRight weight="fill" size={22} />
              </button>
            )}"""

replacement = """            ) : (
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

# We need to make the target exact string match
target_stripped = target.replace(" \n", "\n")

if target in text:
    text = text.replace(target, replacement)
    print("Replaced exact target")
else:
    print("Could not find exact target. Trying regex...")
    # remove spacing differences
    target_pattern = r"\) : \(\s*<button\s*onClick=\{\(\) => handleSend\(\)\}\s*className=\{`p-3 rounded-xl transition-all shadow-md flex items-center justify-center shrink-0\s*\$\{input\.trim\(\) && !isTyping \? `\$\{t\.sendActive\} hover:scale-105` : `\$\{t\.sendDisabled\} cursor-not-allowed`\}`\}\s*>\s*<PaperPlaneRight weight=\"fill\" size=\{22\} />\s*</button>\s*\)\}"
    
    if re.search(target_pattern, text):
        text = re.sub(target_pattern, replacement, text)
        print("Replaced with regex")
    else:
        print("Still not found")

with open(path, "w", encoding="utf-8") as f:
    f.write(text)

