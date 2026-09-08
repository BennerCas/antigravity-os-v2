import re

with open("src/pages/Atlas.tsx", "r", encoding="utf-8") as f:
    code = f.read()

old_popup = """      {explanationPopup && (
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
          <div className="bg-[#12141a] border border-[#2A2A2A] rounded-2xl p-6 md:p-8 max-w-xl w-full shadow-2xl relative">"""

new_popup = """      {explanationPopup && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#050a0f]/60 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div className="bg-[#12141a] border border-[#2A2A2A] rounded-2xl p-6 md:p-8 max-w-xl w-full shadow-2xl relative animate-in zoom-in-95 duration-200">"""

code = code.replace(old_popup, new_popup)

with open("src/pages/Atlas.tsx", "w", encoding="utf-8") as f:
    f.write(code)

print("Popup updated!")

