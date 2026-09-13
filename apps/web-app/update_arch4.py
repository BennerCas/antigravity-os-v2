import re

with open("src/pages/Architecture.tsx", "r", encoding="utf-8") as f:
    code = f.read()

agent_old = """<button onClick={e=>{e.stopPropagation();handleLibUpgrade('agent',agent.id,agent.instructions||agent.description||'',agent.name||agent.id);}}
                          style={{fontSize:'10px', padding:'3px 8px', borderRadius:'6px', backgroundColor:'#1a0d0d', border:'1px solid #3a1a1a', color:'#cc8060', cursor:'pointer'}}>
                          {libUpgrading===agent.id?'⏳ Optimizando...':'⚡ Upgrade'}
                        </button>"""
agent_new = """<button onClick={e=>{e.stopPropagation();handleLibUpgrade('agent',agent.id,agent.instructions||agent.description||'',agent.name||agent.id);}}
                          style={{fontSize:'10px', padding:'3px 8px', borderRadius:'6px', backgroundColor:'#1a0d0d', border:'1px solid #3a1a1a', color:'#cc8060', cursor:'pointer'}}>
                          {libUpgrading===agent.id?'⏳ Optimizando...':'⚡ Upgrade'}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleLibExplain('agent', agent.id, agent.instructions || agent.description || '', agent.name || agent.id); }}
                          style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '6px', backgroundColor: '#0d150d', border: '1px solid #1a2a1a', color: '#6a9a6a', cursor: 'pointer', marginLeft: '4px' }}>
                          {libExplaining === agent.id ? '⏳ Analizando...' : libExplanations[agent.id] ? '💡 Ocultar' : '💡 Cómo funciona'}
                        </button>"""
code = code.replace(agent_old, agent_new)

kb_old = """<button onClick={e=>{e.stopPropagation();handleLibUpgrade('kb',prompt.id||prompt.title,prompt.content||'',prompt.title);}}
                          style={{fontSize:'10px', padding:'3px 8px', borderRadius:'6px', backgroundColor:'#1a0d0d', border:'1px solid #3a1a1a', color:'#cc8060', cursor:'pointer'}}>
                          {libUpgrading===(prompt.id||prompt.title)?'⏳ Optimizando...':'⚡ Upgrade'}
                        </button>"""
kb_new = """<button onClick={e=>{e.stopPropagation();handleLibUpgrade('kb',prompt.id||prompt.title,prompt.content||'',prompt.title);}}
                          style={{fontSize:'10px', padding:'3px 8px', borderRadius:'6px', backgroundColor:'#1a0d0d', border:'1px solid #3a1a1a', color:'#cc8060', cursor:'pointer'}}>
                          {libUpgrading===(prompt.id||prompt.title)?'⏳ Optimizando...':'⚡ Upgrade'}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleLibExplain('kb', prompt.id || prompt.title, prompt.content || '', prompt.title); }}
                          style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '6px', backgroundColor: '#0d150d', border: '1px solid #1a2a1a', color: '#6a9a6a', cursor: 'pointer', marginLeft: '4px' }}>
                          {libExplaining === (prompt.id || prompt.title) ? '⏳ Analizando...' : libExplanations[prompt.id || prompt.title] ? '💡 Ocultar' : '💡 Cómo funciona'}
                        </button>"""
code = code.replace(kb_old, kb_new)

with open("src/pages/Architecture.tsx", "w", encoding="utf-8") as f:
    f.write(code)