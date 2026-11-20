import { apiFetch } from '../../../api/apiClient';
import type { ServicioCatalogo } from '../models/ServicioCatalogo';
import type { ServicioRequest } from '../types/ServicioFormData';

const BASE = '/servicios-catalogo';

export const servicioService = {
    listar(signal?: AbortSignal): Promise<ServicioCatalogo[]> {
        return apiFetch<ServicioCatalogo[]>(BASE, { signal });
    },

    obtenerPorId(id: number, signal?: AbortSignal): Promise<ServicioCatalogo> {
        return apiFetch<ServicioCatalogo>(`${BASE}/${id}`, { signal });
    },

    crear(data: ServicioRequest): Promise<ServicioCatalogo> {
        return apiFetch<ServicioCatalogo>(BASE, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    actualizar(id: number, data: ServicioRequest): Promise<ServicioCatalogo> {
        return apiFetch<ServicioCatalogo>(`${BASE}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    eliminar(id: number): Promise<void> {
        return apiFetch<void>(`${BASE}/${id}`, { method: 'DELETE' });
    },
};
