import type { EstadoOrden } from '../models/OrdenServicio';

// Formulario de recepción: los valores del input/select llegan como texto
export interface AbrirOrdenFormData {
    vehiculoId: string;
    kilometrajeEntrada: string;
    observacionesEntrada: string;
}

// El asesor NO se envía: el backend lo toma del usuario actual (X-Usuario-Id)
export interface AbrirOrdenRequest {
    vehiculoId: number;
    kilometrajeEntrada: number;
    observacionesEntrada: string;
}

export interface CambiarEstadoRequest {
    estado: EstadoOrden;
    motivo: string | null;
    kilometrajeSalida: number | null;
    observacionesSalida: string | null;
}
