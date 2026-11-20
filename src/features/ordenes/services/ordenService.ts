import { apiFetch } from '../../../api/apiClient';
import type { HistorialEstado, OrdenServicio } from '../models/OrdenServicio';
import type { AbrirOrdenRequest, CambiarEstadoRequest } from '../types/OrdenRequests';

const BASE = '/ordenes-servicio';

export const ordenService = {
    listar(signal?: AbortSignal): Promise<OrdenServicio[]> {
        return apiFetch<OrdenServicio[]>(BASE, { signal });
    },

    obtenerPorId(id: number, signal?: AbortSignal): Promise<OrdenServicio> {
        return apiFetch<OrdenServicio>(`${BASE}/${id}`, { signal });
    },

    historial(id: number, signal?: AbortSignal): Promise<HistorialEstado[]> {
        return apiFetch<HistorialEstado[]>(`${BASE}/${id}/historial`, { signal });
    },

    abrir(data: AbrirOrdenRequest): Promise<OrdenServicio> {
        return apiFetch<OrdenServicio>(BASE, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // PATCH: modifica solo el estado (y los datos que ese cambio exige)
    cambiarEstado(id: number, data: CambiarEstadoRequest): Promise<OrdenServicio> {
        return apiFetch<OrdenServicio>(`${BASE}/${id}/estado`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    },
};
