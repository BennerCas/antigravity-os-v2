import re

with open("apps/web-app/src/pages/AgentOSStudio.tsx", "r", encoding="utf-8") as f:
    text = f.read()

dots_replacement = r"""
        <div className="flex justify-center mb-1 relative">
          <div className="flex gap-2 items-center mx-auto relative left-[0px]">
            <button onClick={() => document.getElementById("agent-carousel")?.scrollTo({ left: 0, behavior: "smooth" })} className={`w-2 h-2 rounded-full transition-colors duration-300 ${carouselSlide === 0 ? t.primary : "bg-gray-500 opacity-40"}`} />
            <button onClick={() => document.getElementById("agent-carousel")?.scrollTo({ left: window.innerWidth, behavior: "smooth" })} className={`w-2 h-2 rounded-full transition-colors duration-300 ${carouselSlide === 1 ? t.primary : "bg-gray-500 opacity-40"}`} />
          </div>
        </div>
"""

text = re.sub(r'<div className="flex justify-center mb-1 relative">.*?</div>\s*<button onClick=\{\(\) => setSelectedChatAgentId\("aurelios-core"\)\}.*?</button>\s*</div>', dots_replacement.strip(), text, flags=re.DOTALL)

with open("apps/web-app/src/pages/AgentOSStudio.tsx", "w", encoding="utf-8") as f:
    f.write(text)
