import re

with open("apps/web-app/src/pages/Architecture.tsx", "r", encoding="utf-8") as f:
    code = f.read()

state_add = """const [libUpgrading, setLibUpgrading] = useState<string|null>(null);
  const [libExplaining, setLibExplaining] = useState<string|null>(null);
  const [libExplanations, setLibExplanations] = useState<Record<string,string>>({});"""

if "libExplaining" not in code:
    code = code.replace("const [libUpgrading, setLibUpgrading] = useState<string|null>(null);", state_add)

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
  };"""

if "handleLibExplain" not in code:
    code = code.replace("const handleLibUpgrade = async (type: 'agent'|'kb', id: string, content: string, title: string) => {", func_add + "\n\n  const handleLibUpgrade = async (type: 'agent'|'kb', id: string, content: string, title: string) => {")

agent_btn_search = """{libUpgrading===agent.id?'⏳ Optimizando...':'⚡ Upgrade'}
                  </button>"""
agent_btn_replace = """{libUpgrading===agent.id?'⏳ Optimizando...':'⚡ Upgrade'}
                  </button>
                  <button onClick={e=>{e.stopPropagation();handleLibExplain('agent',agent.id,agent.instructions||agent.description||'',agent.name||agent.id);}}
                    style={{fontSize:'10px', padding:'3px 8px', borderRadius:'6px', backgroundColor:'#0d150d', border:'1px solid #1a2a1a', color:'#6a9a6a', cursor:'pointer'}}>
                    {libExplaining===agent.id?'⏳ Analizando...':libExplanations[agent.id]?'💡 Ocultar':'💡 Cómo funciona'}
                  </button>"""

code = code.replace(agent_btn_search, agent_btn_replace)

kb_btn_search = """{libUpgrading===(prompt.id||prompt.title)?'⏳ Optimizando...':'⚡ Upgrade'}
                  </button>"""
kb_btn_replace = """{libUpgrading===(prompt.id||prompt.title)?'⏳ Optimizando...':'⚡ Upgrade'}
                  </button>
                  <button onClick={e=>{e.stopPropagation();handleLibExplain('kb',prompt.id||prompt.title,prompt.content||'',prompt.title);}}
                    style={{fontSize:'10px', padding:'3px 8px', borderRadius:'6px', backgroundColor:'#0d150d', border:'1px solid #1a2a1a', color:'#6a9a6a', cursor:'pointer'}}>
                    {libExplaining===(prompt.id||prompt.title)?'⏳ Analizando...':libExplanations[prompt.id||prompt.title]?'💡 Ocultar':'💡 Cómo funciona'}
                  </button>"""
code = code.replace(kb_btn_search, kb_btn_replace)

agent_explanation = """</div>
            )}
          </div>
        ))}
      </div>
    </div>
    {/* Panel Atlas KB */}"""
    
# Better way to inject the explanation div
code = code.replace("</div>\n            )}\n          </div>\n        ))}\n      </div>\n    </div>\n    {/* Panel Atlas KB */}", 
"""</div>\n                {libExplanations[agent.id] && (
                  <div style={{marginTop:'8px', padding:'10px', borderRadius:'6px', backgroundColor:'#050d05', border:'1px solid #0d1a0d', fontSize:'11px', color:'#7B9C7F', lineHeight:'1.6'}}>
                    {libExplanations[agent.id]}
                  </div>
                )}\n              </div>\n            )}\n          </div>\n        ))}\n      </div>\n    </div>\n    {/* Panel Atlas KB */}""")

code = code.replace("</div>\n            )}\n          </div>\n        ))}\n      </div>\n    </div>\n  </div>\n) : mainTab === 'evolution' ? (",
"""</div>\n                {libExplanations[prompt.id||prompt.title] && (
                  <div style={{marginTop:'8px', padding:'10px', borderRadius:'6px', backgroundColor:'#050d05', border:'1px solid #0d1a0d', fontSize:'11px', color:'#7B9C7F', lineHeight:'1.6'}}>
                    {libExplanations[prompt.id||prompt.title]}
                  </div>
                )}\n              </div>\n            )}\n          </div>\n        ))}\n      </div>\n    </div>\n  </div>\n) : mainTab === 'evolution' ? (""")


with open("apps/web-app/src/pages/Architecture.tsx", "w", encoding="utf-8") as f:
    f.write(code)