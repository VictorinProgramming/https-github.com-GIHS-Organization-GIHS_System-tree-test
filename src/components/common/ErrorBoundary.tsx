import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  declare props: Props;
  declare state: State;
  declare setState: (state: Partial<State> | ((prevState: State) => Partial<State>)) => void;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-[#041838] border border-rose-800 rounded-3xl shadow-xl max-w-lg mx-auto my-8 text-center animate-in fade-in text-white">
          <div className="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-800 flex items-center justify-center text-rose-400 mx-auto mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">
            {this.props.fallbackTitle || 'Ocorreu um erro inesperado no componente'}
          </h3>
          <p className="text-xs text-rose-300 mb-4 font-mono">
            {this.state.error?.message || 'Erro durante a renderização.'}
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 rounded-xl bg-[#0067FC] hover:bg-[#007BFC] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Tentar Novamente</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
