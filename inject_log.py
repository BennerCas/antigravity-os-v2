import re

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add a div that displays global errors
error_display = """
      {/* Global Error Display */}
      <div id="error-log" className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-red-900 text-white p-4 rounded whitespace-pre-wrap max-w-2xl max-h-96 overflow-auto pointer-events-none opacity-0"></div>
      <script dangerouslySetInnerHTML={{__html: 
        window.onerror = function(msg, url, lineNo, columnNo, error) {
          const el = document.getElementById('error-log');
          if (el) {
            el.style.opacity = '1';
            el.innerText += msg + '\\n' + (error ? error.stack : '') + '\\n\\n';
          }
          return false;
        };
        const origError = console.error;
        console.error = function(...args) {
          const el = document.getElementById('error-log');
          if (el) {
            el.style.opacity = '1';
            el.innerText += args.join(' ') + '\\n\\n';
          }
          origError.apply(console, args);
        };
      }} />
"""

# Insert after <div className="flex-1 relative ...
idx = content.find('<div className="flex-1 relative')
idx_end = content.find('>', idx) + 1

content = content[:idx_end] + error_display + content[idx_end:]

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
