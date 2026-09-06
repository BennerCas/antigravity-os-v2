import { useState, useEffect } from 'react';
import { API_URL } from '../lib/api';
import { 
  Plus, X, Trash, Lightning, 
  CheckCircle, Clock, PlayCircle,
  Gear, Robot, Key, Warning, ArrowsClockwise, FileCode
} from '@phosphor-icons/react';

export default function Automations() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [flows, setFlows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSlider, setShowSlider] = useState(false);
  const [activeTab, setActiveTab] = useState<'LIST' | 'LOGS' | 'TEMPLATES'>('LIST');

  // Templates Data
  const TEMPLATES = [
    { 
      title: "Máquina B2B (Social Media)", 
      desc: "Genera 5 posts para LinkedIn sobre tendencias de TI y envíalos.", 
      trigger: "CRON", cronExpr: "0 7 * * 1-5", retries: 2, timeout: 15,
      masterPrompt: "Eres un Content Manager B2B. Tu objetivo es generar 5 posts diarios para LinkedIn enfocados en Cloud y Ciberseguridad. Usa tono profesional, ganchos fuertes y CTAs claros. Los resultados deben estructurarse en formato JSON listos para postear."
    },
    { 
      title: "Auditoría DevSecOps", 
      desc: "Escanea diffs en Github buscando vulnerabilidades tras cada push.", 
      trigger: "WEBHOOK", cronExpr: "", retries: 1, timeout: 60,
      masterPrompt: "Actúa como un Arquitecto de Seguridad Senior (DevSecOps). Analiza el código fuente del payload recibido. Busca vulnerabilidades OWASP Top 10, credenciales expuestas y malas prácticas. Devuelve un reporte en Markdown priorizado por severidad."
    },
    { 
      title: "Triage de Soporte Nivel 1", 
      desc: "Clasifica y redacta borradores de respuesta para tickets de Zendesk.", 
      trigger: "WEBHOOK", cronExpr: "", retries: 3, timeout: 5,
      masterPrompt: "Eres un Ingeniero de Soporte L1 empático y resolutivo. Lee el ticket entrante, clasifica su urgencia (Baja, Media, Alta, Crítica) y redacta una respuesta preliminar calmando al usuario y ofreciendo los primeros pasos de troubleshooting de nuestra base de conocimientos."
    },
    { 
      title: "Vigilante de Precios", 
      desc: "Compara el pricing de competidores diariamente y alerta por Slack.", 
      trigger: "CRON", cronExpr: "0 0 * * *", retries: 5, timeout: 20,
      masterPrompt: "Tu tarea es extraer los precios actuales de las 3 URLs de competidores proporcionadas. Compara los precios extraídos con nuestra base de datos histórica. Si detectas una baja de precios, redacta una alerta de Slack urgente para el equipo de ventas."
    },
    { 
      title: "Resumen Financiero", 
      desc: "Procesa un CSV de ventas, genera gráficas y redacta un mail ejecutivo.", 
      trigger: "CRON", cronExpr: "0 17 * * 5", retries: 1, timeout: 45,
      masterPrompt: "Como Analista de Datos Financieros, procesa el CSV de ingresos semanales. Extrae los KPIs clave (MRR, Churn, Crecimiento WoW), genera un código en Python para crear gráficas y redacta un resumen ejecutivo de 3 párrafos para los inversores."
    },
    { 
      title: "Refinamiento Jira", 
      desc: "Convierte historias de usuario simples en criterios de aceptación técnicos.", 
      trigger: "WEBHOOK", cronExpr: "", retries: 2, timeout: 10,
      masterPrompt: "Eres un Product Owner Técnico. Toma la descripción básica de la historia de usuario recibida y expándela. Redacta 5 criterios de aceptación BDD (Given-When-Then), identifica 3 edge cases, y sugiere los endpoints de API que se necesitarán modificar."
    },
    { 
      title: "QA Automático", 
      desc: "Escribe tests E2E en Playwright para componentes UI modificados en el día.", 
      trigger: "CRON", cronExpr: "0 23 * * *", retries: 2, timeout: 60,
      masterPrompt: "Eres un QA Automation Engineer Experto. Revisa los componentes React modificados hoy. Escribe tests E2E robustos usando Playwright TypeScript. Asegúrate de cubrir estados de carga, errores de validación, y de usar selectores resilientes (data-testid)."
    },
    { 
      title: "Cold Emails B2B", 
      desc: "Investiga a la empresa de un Lead nuevo en HubSpot y genera un correo.", 
      trigger: "WEBHOOK", cronExpr: "", retries: 3, timeout: 15,
      masterPrompt: "Tu misión es hiper-personalizar ventas. Recibirás el dominio web de un lead. Investiga su misión, pila tecnológica y noticias recientes. Redacta un 'Cold Email' de máximo 4 oraciones. La primera oración debe mencionar algo específico de la empresa para romper el hielo."
    },
    { 
      title: "Monitor de Logs", 
      desc: "Analiza logs del servidor cada hora para detectar patrones de anomalías.", 
      trigger: "CRON", cronExpr: "0 * * * *", retries: 1, timeout: 10,
      masterPrompt: "Actúa como un SRE (Site Reliability Engineer) veterano. Recibirás una muestra de los últimos logs del clúster. Identifica patrones anómalos, excepciones repetitivas o latencias altas. Si encuentras un riesgo crítico, redacta un mensaje de 'Page' para el ingeniero on-call."
    },
    { 
      title: "Newsletter Automático", 
      desc: "Resume noticias de 5 blogs y arma un HTML para enviar en Mailchimp.", 
      trigger: "CRON", cronExpr: "30 6 * * 1-5", retries: 3, timeout: 20,
      masterPrompt: "Eres el Editor en Jefe de una newsletter Tech. Lee el contenido extraído de 5 blogs. Selecciona los 3 temas más impactantes. Resume cada uno en un párrafo ágil y entretenido. Genera el código HTML final con estilos inline listo para Mailchimp."
    }
  ];

  // Form State
  const [selectedFlow, setSelectedFlow] = useState('');
  const [type, setType] = useState('CRON');
  const [cronExpr, setCronExpr] = useState('0 8 * * *');
  const [masterPrompt, setMasterPrompt] = useState('');
  const [retries, setRetries] = useState(3);
  const [timeout, setTimeout] = useState(30);
  const [autoName, setAutoName] = useState('');

  const [executions, setExecutions] = useState<any[]>([]);

  const fetchJobs = () => {
    fetch(`${API_URL}/automations/jobs`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setJobs(data);
        else setJobs([]);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const fetchFlows = () => {
    fetch(`${API_URL}/flows`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setFlows(data);
      });
  };

  const fetchExecutions = () => {
    fetch(`${API_URL}/builder/executions`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setExecutions(data);
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchJobs();
    fetchFlows();
    fetchExecutions();
    
    // Auto-refresh executions every 5 seconds if on LOGS tab
    const interval = setInterval(() => {
      fetchExecutions();
      fetchJobs();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCreate = async () => {
    if (!selectedFlow) return alert("Selecciona un flujo.");
    if (type === 'CRON' && !cronExpr) return alert("Ingresa un cron.");
    
    await fetch(`${API_URL}/automations/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        flow_id: selectedFlow,
        type: type,
        cron_expr: type === 'CRON' ? cronExpr : null,
        master_prompt: masterPrompt,
        retries: retries,
        timeout: timeout,
        name: autoName
      })
    });
    setShowSlider(false);
    fetchJobs();
  };

  const handleDelete = async (id: string) => {
    await fetch(`${API_URL}/automations/jobs/${id}`, { method: 'DELETE' });
    fetchJobs();
  };

  const totalExecutions = executions.length;
  const successExecutions = executions.filter(e => e.exit_code === 0).length;
  const successRate = totalExecutions > 0 ? ((successExecutions / totalExecutions) * 100).toFixed(1) : 0;

  return (
    <div className="h-full overflow-y-auto p-8 max-w-7xl mx-auto flex flex-col gap-6 relative">
      
      {/* Header & Quick Stats */}
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-white mb-2 flex items-center gap-3">
            <Lightning size={40} className="text-[var(--theme-border)]" /> Orquestador
          </h1>
          <p className="text-zinc-400 text-sm">
            Panel de control avanzado para la ejecución autónoma y desatendida de flujos de IA.
          </p>
        </div>
        <button 
          onClick={() => setShowSlider(true)}
          className="px-6 py-3 bg-[var(--theme-border)] hover:opacity-80 text-[var(--theme-bg)] font-black rounded-xl shadow-lg transition-transform hover:scale-105 flex items-center gap-2"
        >
          <Plus size={20} weight="light" /> Nueva Automatización
        </button>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-black/40 border border-[var(--theme-border)]/30 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start text-zinc-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Tareas Activas</span>
            <Gear size={20} className="text-[#7B9C7F]" />
          </div>
          <span className="text-3xl font-black text-white">{jobs.length}</span>
        </div>
        <div className="bg-black/40 border border-[var(--theme-border)]/30 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start text-zinc-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Ejecuciones Totales</span>
            <ArrowsClockwise size={20} className="text-[#8A8A8A]" />
          </div>
          <span className="text-3xl font-black text-white">{totalExecutions}</span>
        </div>
        <div className="bg-black/40 border border-[var(--theme-border)]/30 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start text-zinc-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Tasa de Éxito</span>
            <CheckCircle size={20} className="text-emerald-400" />
          </div>
          <span className="text-3xl font-black text-emerald-400">{successRate}%</span>
        </div>
        <div className="bg-black/40 border border-[var(--theme-border)]/30 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start text-zinc-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Próximo Trigger</span>
            <Clock size={20} className="text-orange-400" />
          </div>
          <span className="text-lg font-bold text-white mt-2">-</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-[var(--theme-border)]/30 pb-2">
        <button 
          onClick={() => setActiveTab('LIST')}
          className={`text-sm font-bold pb-2 border-b-2 transition-colors ${activeTab === 'LIST' ? 'border-[var(--theme-border)] text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
        >
          Canalizaciones
        </button>
        <button 
          onClick={() => setActiveTab('TEMPLATES')}
          className={`text-sm font-bold pb-2 border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'TEMPLATES' ? 'border-[var(--theme-border)] text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
        >
          Plantillas (Casos de Uso) <span className="bg-[var(--theme-border)] text-black text-[10px] px-1.5 py-0.5 rounded-full">10</span>
        </button>
        <button 
          onClick={() => setActiveTab('LOGS')}
          className={`text-sm font-bold pb-2 border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'LOGS' ? 'border-[var(--theme-border)] text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
        >
          Historial de Eventos <span className="bg-[var(--theme-border)] text-black text-[10px] px-1.5 py-0.5 rounded-full">{executions.length}</span>
        </button>
      </div>

      {/* Main Content Area */}
      {activeTab === 'LIST' && (
        <section className="bg-[var(--theme-card)] border border-[var(--theme-border)]/50 rounded-2xl p-6 shadow-2xl">
          {loading ? (
            <div className="flex items-center justify-center p-10"><ArrowsClockwise size={32} className="animate-spin text-[var(--theme-border)]" /></div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-16">
              <Robot size={64} className="mx-auto text-zinc-700 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">El motor está inactivo</h3>
              <p className="text-zinc-500 text-sm mb-6 max-w-md mx-auto">No tienes ninguna automatización configurada. Conecta tus flujos del Builder a eventos de tiempo real o webhooks externos.</p>
              <button onClick={() => setShowSlider(true)} className="px-6 py-2 bg-[var(--theme-border)] text-[var(--theme-bg)] font-bold rounded-lg shadow transition-transform hover:scale-105">
                Empezar a Orquestar
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-300">
                <thead className="text-xs text-zinc-500 uppercase border-b border-[var(--theme-border)]/30">
                  <tr>
                    <th className="px-4 py-3 font-bold">Pipeline</th>
                    <th className="px-4 py-3 font-bold">Disparador</th>
                    <th className="px-4 py-3 font-bold">Estado</th>
                    <th className="px-4 py-3 text-right font-bold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => {
                    const flowName = flows.find(f => f.id === job.flow_id)?.name || "Flujo Huérfano";
                    const displayName = job.name ? job.name : flowName;
                    return (
                      <tr key={job.id} className="border-b border-[var(--theme-border)]/10 hover:bg-black/20 transition-colors">
                        <td className="px-4 py-4">
                          <div className="font-bold text-white text-base">{displayName}</div>
                          <div className="text-xs text-zinc-500 font-mono mt-1">Flow: {flowName} | ID: {job.id.substring(0,8)}...</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 ${job.type === 'CRON' ? 'bg-purple-900/30 text-[#8A8A8A] border border-purple-900' : 'bg-orange-900/30 text-orange-400 border border-orange-900'}`}>
                              {job.type === 'CRON' ? <Clock size={14} /> : <FileCode size={14} />} {job.type}
                            </span>
                          </div>
                          <div className="text-xs font-mono text-zinc-400 mt-2">
                            {job.type === 'CRON' ? job.cron_expr : `/trigger/${job.flow_id.substring(0,6)}`}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            ACTIVO
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={async () => {
                                alert(`Encolando ejecución manual para: ${displayName}...`);
                                await fetch(`${API_URL}/automations/trigger/${job.flow_id}?auto_id=${job.id}`, { method: 'POST' });
                                fetchExecutions();
                              }}
                              className="p-2 hover:bg-blue-900/30 text-[#7B9C7F] rounded transition-colors" title="Ejecutar Manualmente">
                              <PlayCircle size={20} />
                            </button>
                            <button onClick={() => handleDelete(job.id)} className="p-2 hover:bg-red-900/30 text-red-400 rounded transition-colors" title="Desvincular">
                              <Trash size={20} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {activeTab === 'LOGS' && (
        <section className="bg-[var(--theme-card)] border border-[var(--theme-border)]/50 rounded-2xl p-6 shadow-2xl min-h-[400px]">
          <h2 className="text-xl font-bold text-white mb-4">Registro de Ejecuciones (Tiempo Real)</h2>
          {executions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-zinc-500">
              <ArrowsClockwise size={48} className="mb-4 text-zinc-700 animate-spin" />
              <p>Esperando ejecuciones...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {executions.map(exec => (
                <div key={exec.id} className="bg-black/40 border border-[var(--theme-border)]/20 p-4 rounded-xl">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold ${exec.exit_code === 0 ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400'}`}>
                        {exec.exit_code === 0 ? 'SUCCESS' : 'FAILED'} (Exit: {exec.exit_code})
                      </span>
                      <span className="text-zinc-500 text-xs font-mono">ID: {exec.id}</span>
                      <span className="text-zinc-500 text-xs font-mono">FW: {exec.framework}</span>
                    </div>
                    <span className="text-zinc-400 text-xs">{new Date(exec.created_at).toLocaleString()}</span>
                  </div>
                  <pre className="text-zinc-300 text-xs font-mono whitespace-pre-wrap mt-3 bg-black/60 p-3 rounded border border-zinc-800 max-h-40 overflow-y-auto">
                    {exec.log || "Sin logs de salida."}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === 'TEMPLATES' && (
        <section className="bg-[var(--theme-card)] border border-[var(--theme-border)]/50 rounded-2xl p-6 shadow-2xl">
          <div className="mb-6 border-b border-zinc-800 pb-4">
            <h2 className="text-xl font-bold text-white mb-2">Casos de Uso de Orquestación</h2>
            <p className="text-zinc-400 text-sm">
              Estos son ejemplos de cómo convertir tus flujos del Builder en trabajadores autónomos usando 
              el <strong>Master Prompt</strong>. Haz clic en "Usar Plantilla" para autocompletar la configuración.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TEMPLATES.map((tmpl, idx) => (
              <div key={idx} className="bg-black/40 border border-zinc-800 rounded-xl p-5 hover:border-[var(--theme-border)]/50 transition-colors group">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-white text-md flex items-center gap-2">
                    {tmpl.title}
                  </h3>
                  <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded flex items-center gap-1 ${tmpl.trigger === 'CRON' ? 'bg-purple-900/30 text-[#8A8A8A]' : 'bg-orange-900/30 text-orange-400'}`}>
                    {tmpl.trigger === 'CRON' ? <Clock size={12}/> : <FileCode size={12}/>} {tmpl.trigger}
                  </span>
                </div>
                <p className="text-sm text-zinc-400 mb-4 h-10">{tmpl.desc}</p>
                <div className="flex justify-end">
                  <button 
                    onClick={() => {
                      setType(tmpl.trigger);
                      setAutoName(tmpl.title);
                      setMasterPrompt(tmpl.masterPrompt);
                      setCronExpr(tmpl.cronExpr);
                      setRetries(tmpl.retries);
                      setTimeout(tmpl.timeout);
                      setShowSlider(true);
                    }}
                    className="text-[var(--theme-border)] text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                  >
                    <Plus size={16}/> Usar Plantilla
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Slide-over Modal for Pro Configuration */}
      {showSlider && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="bg-[var(--surface-canvas)] w-full max-w-2xl h-full border-l border-[var(--theme-border)] shadow-2xl flex flex-col transform transition-transform overflow-y-auto">
            
            <div className="p-6 border-b border-[var(--theme-border)]/30 flex justify-between items-center sticky top-0 bg-[var(--surface-canvas)]/95 backdrop-blur z-10">
              <div>
                <h2 className="text-2xl font-black text-white">Configurar Orquestación</h2>
                <p className="text-zinc-400 text-sm">Define cómo y cuándo se ejecuta este agente.</p>
              </div>
              <button onClick={() => setShowSlider(false)} className="p-2 hover:bg-black/20 rounded-full transition-colors text-zinc-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="p-8 space-y-8 flex-1">
              
              {/* Sección 1: Selección de Flujo */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[var(--theme-border)] flex items-center gap-2 border-b border-zinc-800 pb-2">
                  <Robot size={20} /> 1. Selecciona el Cerebro (Flujo)
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  <input 
                    type="text" 
                    placeholder="Nombre descriptivo (ej: Auditoría Diaria)"
                    className="w-full bg-black/40 border border-zinc-800 rounded-lg p-3 text-sm text-white outline-none focus:border-[var(--theme-border)] transition-colors"
                    value={autoName}
                    onChange={(e) => setAutoName(e.target.value)}
                  />
                  <select 
                    className="w-full bg-black/40 border border-zinc-800 rounded-lg p-3 text-sm text-white outline-none focus:border-[var(--theme-border)] transition-colors"
                    value={selectedFlow}
                    onChange={(e) => setSelectedFlow(e.target.value)}
                  >
                    <option value="">-- Elige un flujo guardado --</option>
                    {flows.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sección 2: Gatillo */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[var(--theme-border)] flex items-center gap-2 border-b border-zinc-800 pb-2">
                  <Gear size={20} /> 2. Gatillo de Ejecución
                </h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setType('CRON')}
                    className={`flex-1 py-4 rounded-xl text-sm font-bold border-2 transition-all flex flex-col items-center gap-2 ${type === 'CRON' ? 'bg-[var(--theme-border)]/10 border-[var(--theme-border)] text-white shadow-[0_0_15px_var(--theme-border)]' : 'bg-black/40 border-zinc-800 text-zinc-500 hover:border-zinc-600'}`}
                  >
                    <Clock size={28} /> CRON (Tiempo)
                  </button>
                  <button 
                    onClick={() => setType('WEBHOOK')}
                    className={`flex-1 py-4 rounded-xl text-sm font-bold border-2 transition-all flex flex-col items-center gap-2 ${type === 'WEBHOOK' ? 'bg-[var(--theme-border)]/10 border-[var(--theme-border)] text-white shadow-[0_0_15px_var(--theme-border)]' : 'bg-black/40 border-zinc-800 text-zinc-500 hover:border-zinc-600'}`}
                  >
                    <FileCode size={28} /> Webhook (Evento)
                  </button>
                </div>

                {type === 'CRON' && (
                  <div className="bg-black/20 p-4 rounded-xl border border-zinc-800/50 mt-4 space-y-2">
                    <label className="block text-xs font-bold text-zinc-400">EXPRESIÓN CRONTAB</label>
                    <input 
                      type="text" 
                      value={cronExpr}
                      onChange={(e) => setCronExpr(e.target.value)}
                      className="w-full bg-black/60 border border-zinc-700 rounded-lg p-3 text-lg text-emerald-400 font-mono outline-none tracking-widest text-center"
                      placeholder="0 8 * * *"
                    />
                    <div className="flex justify-between text-xs text-zinc-500 px-2 font-mono">
                      <span>Minuto</span><span>Hora</span><span>Día(Mes)</span><span>Mes</span><span>Día(Semana)</span>
                    </div>
                  </div>
                )}
                {type === 'WEBHOOK' && (
                  <div className="bg-blue-900/10 p-4 rounded-xl border border-blue-900/30 mt-4 flex items-start gap-3">
                    <Key size={24} className="text-[#7B9C7F] flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-blue-300">Endpoint Protegido</h4>
                      <p className="text-xs text-blue-200/70 mt-1">
                        Se generará una URL local única. Soporta payloads JSON que serán inyectados como variables globales en el flujo.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Sección 3: Master Prompt (NOVEDAD) */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[var(--theme-border)] flex items-center gap-2 border-b border-zinc-800 pb-2">
                  <Robot size={20} /> 3. Master Prompt (Opcional)
                </h3>
                <p className="text-xs text-zinc-400">
                  Sobrescribe la instrucción principal del flujo solo para esta automatización. Permite re-usar un mismo flujo base (ej: "Investigar Tema") para diferentes tareas automáticas (ej: "Investiga IA" a las 8AM, "Investiga Cripto" a las 9AM).
                </p>
                <textarea 
                  className="w-full h-32 bg-black/40 border border-zinc-800 rounded-xl p-4 text-sm text-white outline-none focus:border-[var(--theme-border)] transition-colors resize-none"
                  placeholder="Ej: Ejecuta este flujo asumiendo el rol de un auditor de ciberseguridad enfocado en OWASP..."
                  value={masterPrompt}
                  onChange={(e) => setMasterPrompt(e.target.value)}
                />
              </div>

              {/* Sección 4: Configuración Avanzada */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[var(--theme-border)] flex items-center gap-2 border-b border-zinc-800 pb-2">
                  <Gear size={20} /> 4. Tolerancia a Fallos
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1">REINTENTOS</label>
                    <input 
                      type="number" 
                      value={retries}
                      onChange={(e) => setRetries(parseInt(e.target.value) || 0)}
                      className="w-full bg-black/40 border border-zinc-800 rounded-lg p-3 text-sm text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1">TIMEOUT (MINUTOS)</label>
                    <input 
                      type="number" 
                      value={timeout}
                      onChange={(e) => setTimeout(parseInt(e.target.value) || 0)}
                      className="w-full bg-black/40 border border-zinc-800 rounded-lg p-3 text-sm text-white outline-none"
                    />
                  </div>
                </div>
              </div>

            </div>

            <div className="p-6 border-t border-[var(--theme-border)]/30 bg-[var(--surface-canvas)] flex justify-end gap-3 sticky bottom-0 z-10">
              <button 
                onClick={() => setShowSlider(false)}
                className="px-6 py-3 hover:bg-black/20 text-zinc-300 font-bold rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleCreate}
                disabled={!selectedFlow || (type === 'CRON' && !cronExpr)}
                className="px-8 py-3 bg-[var(--theme-border)] text-[var(--theme-bg)] font-black rounded-xl shadow-lg transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
              >
                <CheckCircle size={20} weight="light" /> Iniciar Orquestación
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
