import { useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

interface TourProps {
  runTour: boolean;
  onComplete: () => void;
}

export function InteractiveTour({ runTour, onComplete }: TourProps) {
  useEffect(() => {
    if (!runTour) return;

    const driverObj = driver({
      showProgress: true,
      doneBtnText: 'Empezar',
      nextBtnText: 'Siguiente →',
      prevBtnText: '← Atrás',
      steps: [
        {
          element: '.sidebar-container',
          popover: {
            title: 'Bienvenido a Antigravity OS',
            description: 'Este es el panel lateral donde puedes navegar entre AgentOS, Builder, Academy y Arquitectura.',
            side: 'right',
            align: 'start'
          }
        },
        {
          element: '.builder-canvas',
          popover: {
            title: 'El Builder (Canvas)',
            description: 'Aquí puedes arrastrar y soltar nodos para crear agentes, conectarlos y armar tu pipeline de ejecución.',
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '.execute-button',
          popover: {
            title: 'Orquestación Mágica',
            description: 'Haz clic aquí para que el Meta-Orquestador analice tu grafo, elija el framework (CrewAI, AutoGen, etc.) y ejecute el código.',
            side: 'bottom',
            align: 'end'
          }
        }
      ],
      onDestroyStarted: () => {
        if (!driverObj.hasNextStep() || confirm("¿Seguro que quieres saltar el tutorial?")) {
          driverObj.destroy();
          onComplete();
        }
      }
    });

    setTimeout(() => {
      driverObj.drive();
    }, 500);

    return () => {
      driverObj.destroy();
    };
  }, [runTour, onComplete]);

  return null;
}
