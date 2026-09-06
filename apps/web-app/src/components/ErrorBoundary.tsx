import { Component, ErrorInfo, ReactNode } from 'react';
import { WarningCircle } from '@phosphor-icons/react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMsg: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMsg: ""
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMsg: error.message };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center w-full h-full bg-[#0a0c10] text-zinc-300 p-8">
          <WarningCircle size={64} className="text-red-500 mb-6" weight="light" />
          <h1 className="text-3xl font-bold text-white mb-2">Fallo del Sistema en Interfaz</h1>
          <p className="text-zinc-400 mb-6 max-w-lg text-center">
            Se ha detectado una anomalía en el renderizado de este módulo. Antigravity OS ha interceptado el error para evitar el colapso total de la ventana.
          </p>
          <div className="bg-red-950/30 border border-red-900/50 p-4 rounded-xl w-full max-w-2xl mb-8">
            <pre className="text-red-400 font-mono text-sm whitespace-pre-wrap">{this.state.errorMsg}</pre>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-colors"
          >
            Reiniciar Módulo
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
