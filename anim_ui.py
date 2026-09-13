with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Sync refs when React state changes
old_propsEffect = """  useEffect(() => {
    propsRef.current = props;
  });"""

new_propsEffect = """  useEffect(() => {
    propsRef.current = props;
  });

  // Keep refs in sync with React state (used inside rAF)
  useEffect(() => {
    rotActiveRef.current = rotationOn;
  }, [rotationOn]);

  useEffect(() => {
    // Map slider 0.1-2.0 to radians 0.0003 - 0.004
    rotSpeedRef.current = 0.0003 + (rotationSpeed / 2.0) * 0.004;
  }, [rotationSpeed]);"""

if old_propsEffect in content:
    content = content.replace(old_propsEffect, new_propsEffect)
    print("Sync effects added OK")
else:
    print("ERROR: propsEffect target not found")

# 2. Add the ON/OFF + speed slider control panel in the toolbar
# Find the Global Progress button block and insert AFTER the toolbar div context buttons
old_toolbar_end = """              </div>
          </div>
          {/* Context Toggle */}"""

new_toolbar_end = """              </div>
          </div>

          {/* Rotation Controls */}
          <div className="pointer-events-auto flex items-center gap-3 bg-[#0d1117]/90 border border-gray-800 rounded-xl px-3 py-2 backdrop-blur-sm">
            <button
              onClick={() => setRotationOn(prev => !prev)}
              title={rotationOn ? "Detener rotación" : "Activar rotación"}
              className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-lg border transition-all ${rotationOn ? 'bg-green-900/60 border-green-600 text-green-400 shadow-[0_0_8px_rgba(74,222,128,0.4)]' : 'bg-gray-900 border-gray-700 text-gray-400'}`}
            >
              <span className={`w-2 h-2 rounded-full ${rotationOn ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
              {rotationOn ? 'GIRANDO' : 'PAUSADO'}
            </button>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-xs">🐢</span>
              <input
                type="range"
                min="0.1"
                max="2.0"
                step="0.05"
                value={rotationSpeed}
                onChange={e => setRotationSpeed(parseFloat(e.target.value))}
                className="w-24 accent-cyan-400 cursor-pointer"
                title="Velocidad de rotación"
              />
              <span className="text-gray-500 text-xs">🚀</span>
            </div>
          </div>
          {/* Context Toggle */}"""

if old_toolbar_end in content:
    content = content.replace(old_toolbar_end, new_toolbar_end)
    print("Rotation UI added OK")
else:
    print("ERROR: toolbar_end target not found")

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("File saved.")
