export const tourSteps = [
  {
    target: "#target-canvas",
    title: "Bienvenido al Builder Visual",
    content: "Este lienzo es el lugar donde conviertes una idea en una arquitectura de Inteligencia Artificial. Cada nodo representa una capacidad —un agente, una variable, una decisión o una intervención humana— y cada conexión determina qué ocurre después. Piensa en el Builder como un lenguaje de programación visual: en lugar de escribir toda la lógica en código, diseñas el comportamiento del sistema conectando piezas inteligentes.",
    placement: "center"
  },
  {
    target: "#target-node-inicio",
    title: "Todo sistema necesita un comienzo",
    content: "El nodo Inicio define el punto desde el que comienza la ejecución. Es la puerta de entrada de tu arquitectura. En un flujo real puede representar una nueva solicitud, un documento recibido, una tarea programada o cualquier evento que desencadene el proceso. Haz clic para añadirlo al lienzo. A partir de aquí comenzaremos a construir nuestro primer enjambre.",
    placement: "left"
  },
  {
    target: "#target-node-agente",
    title: "Añade tu primera inteligencia",
    content: "Ahora incorpora un nodo Agente. Un agente es una unidad de razonamiento capaz de recibir información, analizarla y producir un resultado. Colócalo después de Inicio y conecta ambos nodos. Esta conexión significa: «cuando comienza el flujo, entrega el trabajo a este agente». Acabas de crear la arquitectura de IA más sencilla posible: entrada → razonamiento → resultado.",
    placement: "left"
  },
  {
    target: "#target-canvas",
    title: "Las conexiones son la lógica",
    content: "La línea que conecta los nodos no es decoración: representa el flujo de ejecución. Cuando conectas A con B estás definiendo una relación causal: B puede ejecutarse después de que A produzca su resultado. A partir de esta idea puedes construir cadenas, bifurcaciones, ciclos y arquitecturas completas de colaboración entre agentes.",
    placement: "center"
  },
  {
    target: "#target-dock-agents",
    title: "No construyas cada cerebro desde cero",
    content: "El Catálogo de Agentes es tu biblioteca de especialistas. En lugar de diseñar manualmente cada agente, puedes explorar capacidades predefinidas y añadirlas a tu arquitectura. Busca el especialista adecuado para el trabajo que quieres realizar y piensa en términos de composición: no necesitas un agente que sepa hacerlo todo; necesitas varios agentes buenos en lo que cada uno debe hacer.",
    placement: "top"
  },
  {
    target: "#target-dock-prompts",
    title: "Abre el Atlas de Prompts",
    content: "El Atlas de Prompts añade otra capa de inteligencia: metodologías e instrucciones especializadas que puedes incorporar a tus agentes. No tienes que descubrir desde cero cómo pedirle a una IA que analice, investigue, critique, clasifique o genere algo. Puedes partir de conocimiento estructurado y adaptarlo a tu objetivo.",
    placement: "top"
  },
  {
    target: "#target-dock-ai-flow",
    title: "De una idea a un sistema completo",
    content: "AI Flow es el atajo para pasar de intención a arquitectura. En lugar de crear manualmente cada nodo y conexión, puedes describir en lenguaje natural lo que quieres conseguir. El generador interpreta el objetivo y puede proponer una estructura de agentes, tareas y conexiones que después puedes inspeccionar, modificar y perfeccionar visualmente.",
    placement: "top"
  },
  {
    target: "#target-node-variable",
    title: "Dale memoria al sistema",
    content: "Las Variables permiten almacenar información que otras partes del flujo pueden utilizar posteriormente. Puedes guardar resultados, estados, puntuaciones, identificadores, decisiones o cualquier dato relevante para la ejecución. Por ejemplo, un agente puede calcular «risk_score = 87» y una etapa posterior puede utilizar ese valor para decidir qué camino seguir.",
    placement: "left"
  },
  {
    target: "#target-node-condicion",
    title: "Introduce decisiones inteligentes",
    content: "Hasta ahora nuestro flujo podía seguir una secuencia. El nodo Condición permite que el sistema tome diferentes caminos dependiendo de los datos. Puedes evaluar una Variable o un resultado producido por un agente y crear rutas If/Else. Por ejemplo: «si el nivel de riesgo es alto, escalar; si es medio, solicitar una segunda revisión; si es bajo, continuar automáticamente».",
    placement: "left"
  },
  {
    target: "#target-node-humano",
    title: "Incorpora inteligencia humana",
    content: "El nodo Humano permite pausar el flujo y solicitar intervención de una persona. Esto es fundamental cuando una decisión tiene impacto económico, legal, operativo o reputacional. En lugar de automatizar ciegamente, puedes hacer que la IA prepare el análisis y que una persona tome la decisión final.",
    placement: "left"
  },
  {
    target: "#target-node-subflujo",
    title: "Encapsula sistemas complejos",
    content: "Cuando una parte de tu arquitectura crece demasiado, puedes convertirla en un Sub-flujo. Un Sub-flujo funciona como una macro: encapsula varios nodos y conexiones dentro de un componente reutilizable. Por ejemplo, puedes crear un sub-flujo «Investigación Empresarial» que internamente busque información, la contraste, la analice y entregue un resultado estructurado.",
    placement: "left"
  },
  {
    target: "#target-btn-execute",
    title: "De arquitectura a ejecución",
    content: "Has diseñado el comportamiento del sistema. El botón Ejecutar convierte esa arquitectura visual en una ejecución real: los nodos comienzan a procesarse siguiendo las conexiones y reglas que definiste. Antes de ejecutar, revisa mentalmente el recorrido: entrada, agentes, memoria, decisiones, excepciones y puntos de aprobación.",
    placement: "top"
  }
];
