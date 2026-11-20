// Cancelar un fetch (abort) es esperado: no debe mostrarse como error del sistema
export function isAbortError(error: unknown): boolean {
    return error instanceof DOMException && error.name === 'AbortError';
}
