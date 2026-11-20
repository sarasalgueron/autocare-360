import { apiFetch } from '../../../api/apiClient';
import type { Vehiculo } from '../models/Vehiculo';
import type { VehiculoRequest } from '../types/VehiculoFormData';

export const vehiculoService = {
    listar(signal?: AbortSignal): Promise<Vehiculo[]> {
        return apiFetch<Vehiculo[]>('/vehiculos', { signal });
    },

    obtenerPorId(id: number, signal?: AbortSignal): Promise<Vehiculo> {
        return apiFetch<Vehiculo>(`/vehiculos/${id}`, { signal });
    },

    crear(data: VehiculoRequest): Promise<Vehiculo> {
        return apiFetch<Vehiculo>('/vehiculos', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    actualizar(id: number, data: VehiculoRequest): Promise<Vehiculo> {
        return apiFetch<Vehiculo>(`/vehiculos/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    eliminar(id: number): Promise<void> {
        return apiFetch<void>(`/vehiculos/${id}`, { method: 'DELETE' });
    },
};
