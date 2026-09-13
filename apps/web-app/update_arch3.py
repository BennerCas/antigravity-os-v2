import re

with open("src/pages/Architecture.tsx", "r", encoding="utf-8") as f:
    code = f.read()

# Add states
state_pattern = r"(const\s+\[libUpgrading,\s*setLibUpgrading\]\s*=\s*useState<string\|null>\(null\);)"
state_add = r"\1\n  const [libExplaining, setLibExplaining] = useState<string|null>(null);\n  const [libExplanations, setLibExplanations] = useState<Record<string,string>>({});"
if "libExplaining" not in code:
    code = re.sub(state_pattern, state_add, code)

# Add function handleLibExplain
func_pattern = r"(const\s+handleLibUpgrade\s*=\s*async)"
func_add = """const handleLibExplain = async (type: 'agent'|'kb', id: string, content: string, name: string) => {
    if (libExplanations[id]) {
      setLibExplanations(prev => { const n = {...prev}; delete n[id]; return n; });
      return;
    }
    setLibExplaining(id);
    try {
      const prompt = type === 'agent'
        ? `Explica de forma simple y concisa (3-4 oraciones) cómo funciona este agente IA llamado "${name}" y para qué sirve.\\n\\nInstrucciones del agente:\\n${content.slice(0, 500)}`
        : `Explica de forma simple (3-4 oraciones) para qué sirve este conocimiento/prompt llamado "${name}" y cómo ayuda a un agente IA.\\n\\nContenido:\\n${content.slice(0, 500)}`;
      
      const res = await fetch(`${API_URL}/agents/chat`, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          agent_id: 'system_optimizer',
          message: prompt,
          override_instructions: 'Eres un experto en IA que explica de forma simple y en español cómo funcionan los agentes y prompts. Responde en 3-4 oraciones claras, sin tecnicismos.'
        })
      });
      const d = await res.json();
      setLibExplanations(prev => ({...prev, [id]: d.response || 'No disponible'}));
    } catch {
      setLibExplanations(prev => ({...prev, [id]: 'No se pudo generar la explicación.'}))
    } finally {
      setLibExplaining(null);
    }
  };

  \\1"""
if "handleLibExplain" not in code:
    code = re.sub(func_pattern, func_add, code, count=1)

# Modify Agent Button
agent_btn_pattern = r"(<button\s+onClick=\{\(\)\s*=>\s*handleLibUpgrade\('agent',\s*agent\.id,\s*agent\.instructions\s*\|\|\s*agent\.description\s*\|\|\s*'',\s*agent\.name\s*\|\|\s*agent\.id\)\}[\s\S]*?<\/button>)"
agent_btn_replace = r"""\1
                  <button onClick={(e) => { e.stopPropagation(); handleLibExplain('agent', agent.id, agent.instructions || agent.description || '', agent.name || agent.id); }}
                    style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '6px', backgroundColor: '#0d150d', border: '1px solid #1a2a1a', color: '#6a9a6a', cursor: 'pointer' }}>
                    {libExplaining === agent.id ? '⏳ Analizando...' : libExplanations[agent.id] ? '💡 Ocultar' : '💡 Cómo funciona'}
                  </button>"""
code = re.sub(agent_btn_pattern, agent_btn_replace, code)

# Modify KB Button
kb_btn_pattern = r"(<button\s+onClick=\{\(\)\s*=>\s*handleLibUpgrade\('kb',\s*prompt\.id\s*\|\|\s*prompt\.title,\s*prompt\.content\s*\|\|\s*'',\s*prompt\.title\)\}[\s\S]*?<\/button>)"
kb_btn_replace = r"""\1
                  <button onClick={(e) => { e.stopPropagation(); handleLibExplain('kb', prompt.id || prompt.title, prompt.content || '', prompt.title); }}
                    style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '6px', backgroundColor: '#0d150d', border: '1px solid #1a2a1a', color: '#6a9a6a', cursor: 'pointer' }}>
                    {libExplaining === (prompt.id || prompt.title) ? '⏳ Analizando...' : libExplanations[prompt.id || prompt.title] ? '💡 Ocultar' : '💡 Cómo funciona'}
                  </button>"""
code = re.sub(kb_btn_pattern, kb_btn_replace, code)

# Add Explanation Divs
# For agents, the container div ends after the buttons. We can just append it before the final closing div of the map element.
agent_explanation = r"""
                {libExplanations[agent.id] && (
                  <div style={{ marginTop: '8px', padding: '10px', borderRadius: '6px', backgroundColor: '#050d05', border: '1px solid #0d1a0d', fontSize: '11px', color: '#7B9C7F', lineHeight: '1.6' }}>
                    {libExplanations[agent.id]}
                  </div>
                )}
              </div>
"""
# Replace the end of the agent card mapping. We look for `</div>\s*\)\}\s*</div>\s*</div>\s*{\/\* Panel Atlas KB`
code = re.sub(r'<\/div>\s*(\)\})\s*(<\/div>\s*<\/div>\s*{\/\*\s*Panel Atlas KB)', agent_explanation + r'            \1\n          \2', code)

# For KB
kb_explanation = r"""
                {libExplanations[prompt.id || prompt.title] && (
                  <div style={{ marginTop: '8px', padding: '10px', borderRadius: '6px', backgroundColor: '#050d05', border: '1px solid #0d1a0d', fontSize: '11px', color: '#7B9C7F', lineHeight: '1.6' }}>
                    {libExplanations[prompt.id || prompt.title]}
                  </div>
                )}
              </div>
"""
code = re.sub(r'<\/div>\s*(\)\})\s*(<\/div>\s*<\/div>\s*<\/div>\s*\)\s*:\s*mainTab\s*===\s*\'evolution\')', kb_explanation + r'            \1\n          \2', code)


with open("src/pages/Architecture.tsx", "w", encoding="utf-8") as f:
    f.write(code)