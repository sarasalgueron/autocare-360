import { apiFetch } from '../../../api/apiClient';
import type { Cliente } from '../models/Cliente';
import type {
    ClienteCreateRequest,
    ClienteUpdateRequest,
} from '../types/ClienteRequests';

export const clienteService = {
    listar(signal?: AbortSignal): Promise<Cliente[]> {
        return apiFetch<Cliente[]>('/clientes', { signal });
    },

    obtenerPorId(id: number, signal?: AbortSignal): Promise<Cliente> {
        return apiFetch<Cliente>(`/clientes/${id}`, { signal });
    },

    crear(data: ClienteCreateRequest): Promise<Cliente> {
        return apiFetch<Cliente>('/clientes', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    actualizar(id: number, data: ClienteUpdateRequest): Promise<Cliente> {
        return apiFetch<Cliente>(`/clientes/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    eliminar(id: number): Promise<void> {
        return apiFetch<void>(`/clientes/${id}`, {
            method: 'DELETE',
        });
    },
};
