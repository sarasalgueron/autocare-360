import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppErrorBoundary } from './AppErrorBoundary';

function ComponenteQueFalla(): never {
    throw new Error('fallo de render simulado');
}

describe('AppErrorBoundary', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('muestra el fallback cuando un hijo falla durante el render', () => {
        // React y componentDidCatch escriben en consola: se silencia solo en este test
        vi.spyOn(console, 'error').mockImplementation(() => {});

        render(
            <AppErrorBoundary>
                <ComponenteQueFalla />
            </AppErrorBoundary>,
        );

        expect(screen.getByRole('alert')).toHaveTextContent('La interfaz tuvo un problema.');
    });

    it('renderiza los hijos cuando no hay error', () => {
        render(
            <AppErrorBoundary>
                <p>contenido normal</p>
            </AppErrorBoundary>,
        );
        expect(screen.getByText('contenido normal')).toBeInTheDocument();
    });
});
