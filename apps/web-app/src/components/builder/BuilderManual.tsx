export function BuilderManual() {
  return (
    <div className="w-full h-full overflow-y-auto bg-[var(--theme-bg)] text-[var(--theme-text)] p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold border-b border-gray-700 pb-4">📖 Manual & Pipeline del Builder</h1>
        
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">🔍 Visión General del Pipeline</h2>
          <p className="text-gray-300 leading-relaxed">
            El módulo Builder es el corazón de orquestación de Antigravity. Permite diseñar, conectar, inspeccionar y ejecutar flujos de IA (pipelines) complejos. El flujo de trabajo típico involucra el diseño de los agentes y prompts en el lienzo (Flow Architect / FlowBoard), la revisión y compilación del flujo, su ejecución a través del Motor Nativo (LangGraph), y el análisis posterior de los resultados.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">📑 Pestañas del Módulo</h2>
          
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-3">
            <h3 className="text-xl font-medium text-blue-400">🏗️ Flow Architect</h3>
            <p className="text-gray-300">
              Es el espacio principal de diseño. Aquí puedes ver y gestionar la estructura de alto nivel de tus pipelines. A través del Flow Architect conectas la lógica, estableces las relaciones entre componentes y defines la arquitectura general del sistema.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-3">
            <h3 className="text-xl font-medium text-purple-400">⚡ FlowBoard</h3>
            <p className="text-gray-300">
              Es el lienzo interactivo donde se construyen los nodos del flujo. En esta pestaña puedes:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Agregar nodos de Inicio, Agentes, Variables, Condicionales y Sub-flujos.</li>
              <li>Conectar nodos para establecer la dirección de la ejecución.</li>
              <li>Modificar propiedades, estilos y temas visuales del lienzo.</li>
              <li>Utilizar herramientas de dibujo (Lápiz, Línea, Borrador) y agrupar nodos.</li>
            </ul>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-3">
            <h3 className="text-xl font-medium text-green-400">🔍 Run Inspector</h3>
            <p className="text-gray-300">
              Permite inspeccionar detalladamente cómo se estructuran y comunican los nodos. Es útil para hacer depuración (debugging) del pipeline antes de lanzarlo y analizar los payloads que se enviarán al motor de ejecución.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-3">
            <h3 className="text-xl font-medium text-yellow-400">📊 Run Results</h3>
            <p className="text-gray-300">
              El panel de resultados de ejecución. Una vez que se ejecuta el flujo, aquí podrás visualizar el output de los LLMs, revisar el texto generado y consultar el historial de resultados. También permite usar herramientas integradas como TTS (Text-to-Speech).
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">⚙️ Controles y Botones del Lienzo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
            <div className="bg-black/20 p-4 rounded-lg">
              <span className="font-bold text-white">▶️ Inicio / 🤖 Agente / 🆅 Variable:</span> Añaden nuevos nodos específicos al lienzo.
            </div>
            <div className="bg-black/20 p-4 rounded-lg">
              <span className="font-bold text-white">⧖ Condición / 👤 Humano / 📦 Sub-Flujo:</span> Crean nodos de lógica, pausas para input humano o agrupaciones lógicas.
            </div>
            <div className="bg-black/20 p-4 rounded-lg">
              <span className="font-bold text-white">📋 / ✂️ / 📝 (Copiar/Cortar/Pegar):</span> Portapapeles para gestionar nodos.
            </div>
            <div className="bg-black/20 p-4 rounded-lg">
              <span className="font-bold text-white">📦 / 🔓 (Agrupar/Desagrupar):</span> Agrupa visualmente múltiples nodos para mejor organización.
            </div>
            <div className="bg-black/20 p-4 rounded-lg">
              <span className="font-bold text-white">🚀 Ejecutar:</span> Compila el grafo actual y lo envía al Motor Nativo para su procesamiento.
            </div>
            <div className="bg-black/20 p-4 rounded-lg">
              <span className="font-bold text-white">🪄 AI Flow / 🤖 Agentes / 📚 Prompts:</span> Paneles inferiores para agregar recursos de bibliotecas o generarlos con IA.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
