import { useCallback, useEffect, useState } from 'react';
import { isAbortError } from '../utils/isAbortError';

type Loader<T> = (signal: AbortSignal) => Promise<T[]>;

/**
 * Patrón genérico para cargar una colección remota: data + loading + error + reload.
 * Cada componente que lo usa tiene su propio estado (se reutiliza la lógica, no los datos).
 *
 * El loader debe ser una referencia estable (p. ej. clienteService.listar, definido
 * fuera del componente); si cambiara en cada render, el Effect se repetiría sin fin.
 */
export function useAsyncList<T>(loader: Loader<T>) {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [reloadToken, setReloadToken] = useState(0);

    // Cambiar reloadToken vuelve a ejecutar el Effect: así se fuerza una recarga
    const reload = useCallback(() => {
        setReloadToken((value) => value + 1);
    }, []);

    useEffect(() => {
        const controller = new AbortController();

        const load = async () => {
            try {
                setLoading(true);
                setError('');
                const result = await loader(controller.signal);
                setData(result);
            } catch (err) {
                if (!isAbortError(err)) {
                    setError(err instanceof Error ? err.message : 'Error de carga');
                }
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        };

        void load();

        // Cleanup: al desmontar o antes de una recarga se cancela el request anterior
        return () => controller.abort();
    }, [loader, reloadToken]);

    return { data, setData, loading, error, reload };
}
