with open('backend/services/agent_factory.py', 'r', encoding='utf-8') as f:
    content = f.read()

old_method = """    @classmethod
    async def chat_one_shot(
        cls,
        agent_id: str,
        user_prompt: str,
        atlas_knowledge_id: Optional[str] = None,
        override_instructions: Optional[str] = None,
        extra_tools: Optional[List[Callable]] = None,
        model: Optional[str] = None, use_tools: bool = True,
    ) -> str:
        config = cls.build_config(
            agent_id=agent_id,
            atlas_knowledge_id=atlas_knowledge_id,
            override_instructions=override_instructions,
            extra_tools=extra_tools,
            model=model, use_tools=use_tools,
        )
        try:
            async with Agent(config) as agent:
                response = await agent.chat(user_prompt)
                return await response.text()
        except Exception as e:
            return f"[AgentFactory Error] {type(e).__name__}: {e}\""""

new_method = """    @classmethod
    async def chat_one_shot(
        cls,
        agent_id: str,
        user_prompt: str,
        atlas_knowledge_id: Optional[str] = None,
        override_instructions: Optional[str] = None,
        extra_tools: Optional[List[Callable]] = None,
        model: Optional[str] = None, use_tools: bool = True,
    ) -> str:
        import os
        
        # --- QUANTUM ROUTING: Bypassear a Ollama local si no hay herramientas ---
        use_ollama = os.getenv("ACTIVE_MODEL") == "ollama" or (model and (":" in model or "hermes" in model))
        if not use_tools:
            use_ollama = True 
            
        if use_ollama:
            import httpx
            system_instructions = ensamblar_instrucciones(
                agent_id, atlas_knowledge_id, override_instructions
            )
            ollama_model = model or os.getenv("OLLAMA_MODEL", "hermes3:8b")
            ollama_url = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434").rstrip("/")
            if not ollama_url.endswith("/v1"):
                ollama_url += "/v1"
                
            payload = {
                "model": ollama_model,
                "messages": [
                    {"role": "system", "content": system_instructions},
                    {"role": "user", "content": user_prompt}
                ],
                "temperature": 0.7,
            }
            try:
                async with httpx.AsyncClient(timeout=120.0) as client:
                    resp = await client.post(f"{ollama_url}/chat/completions", json=payload)
                    resp.raise_for_status()
                    return resp.json()["choices"][0]["message"]["content"]
            except Exception as e:
                print(f"[Quantum Routing] Falló Ollama local: {e}. Cayendo a Gemini Cloud...")
                
        # --- RUTEO POR DEFECTO: Google Antigravity SDK ---
        config = cls.build_config(
            agent_id=agent_id,
            atlas_knowledge_id=atlas_knowledge_id,
            override_instructions=override_instructions,
            extra_tools=extra_tools,
            model=model, use_tools=use_tools,
        )
        try:
            async with Agent(config) as agent:
                response = await agent.chat(user_prompt)
                return await response.text()
        except Exception as e:
            return f"[AgentFactory Error] {type(e).__name__}: {e}\""""

if old_method in content:
    content = content.replace(old_method, new_method)
    with open('backend/services/agent_factory.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Reemplazo exitoso en AgentFactory!")
else:
    print("No se encontro el metodo original!")
