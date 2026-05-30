import { Component, type ReactNode } from "react";

type Props = { children: ReactNode; fallback?: ReactNode; label?: string };
type State = { hasError: boolean; error?: Error };

export class SafeBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: unknown) {
    // eslint-disable-next-line no-console
    console.error(`[SafeBoundary${this.props.label ? `:${this.props.label}` : ""}]`, error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-xs text-amber-900">
            Não foi possível carregar este bloco agora. Continue navegando — tente novamente em instantes.
          </div>
        )
      );
    }
    return this.props.children;
  }
}
