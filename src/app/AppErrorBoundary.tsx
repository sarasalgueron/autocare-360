import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { hasError: boolean };

/**
 * Captura errores lanzados DURANTE EL RENDER de sus hijos.
 * NO captura errores de fetch/async ni de event handlers: esos se manejan con try/catch.
 * Tiene que ser un componente de clase: React no ofrece un hook equivalente.
 */
export class AppErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false };

    // Se ejecuta durante el render fallido: decide mostrar el fallback
    static getDerivedStateFromError(): State {
        return { hasError: true };
    }

    // Se ejecuta después: lugar para registrar el error (consola, servicio de logs...)
    componentDidCatch(error: unknown, info: ErrorInfo) {
        console.error('Render error', error, info.componentStack);
    }

    render() {
        if (this.state.hasError) {
            return (
                <main className="state-card error" role="alert">
                    <h1>La interfaz tuvo un problema.</h1>
                    <p>Recarga la pagina. Si el problema persiste, contacta al administrador.</p>
                </main>
            );
        }
        return this.props.children;
    }
}
