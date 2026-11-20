import type { EstadoOrden } from '../models/OrdenServicio';
import type { AbrirOrdenFormData } from '../types/OrdenRequests';

export type AbrirOrdenErrors = Partial<Record<keyof AbrirOrdenFormData, string>>;

const ENTERO_NO_NEGATIVO = /^\d+$/;

export function validarAbrirOrden(data: AbrirOrdenFormData): AbrirOrdenErrors {
    const errors: AbrirOrdenErrors = {};

    if (!data.vehiculoId) errors.vehiculoId = 'Debe seleccionar un vehiculo.';

    if (!data.kilometrajeEntrada.trim()) {
        errors.kilometrajeEntrada = 'El kilometraje de entrada es obligatorio.';
    } else if (!ENTERO_NO_NEGATIVO.test(data.kilometrajeEntrada.trim())) {
        errors.kilometrajeEntrada = 'Ingrese un kilometraje entero y no negativo.';
    }

    if (!data.observacionesEntrada.trim()) {
        errors.observacionesEntrada = 'Las observaciones de recepcion son obligatorias.';
    }

    return errors;
}

export interface CambioEstadoFormData {
    motivo: string;
    kilometrajeSalida: string;
    observacionesSalida: string;
}

export type CambioEstadoErrors = Partial<Record<keyof CambioEstadoFormData, string>>;

/** Lo que exige cada destino (RN-07 para ENTREGADA). El backend vuelve a validarlo. */
export function validarCambioEstado(
    destino: EstadoOrden,
    data: CambioEstadoFormData,
    kilometrajeEntrada: number,
): CambioEstadoErrors {
    const errors: CambioEstadoErrors = {};

    if (destino === 'CANCELADA' && !data.motivo.trim()) {
        errors.motivo = 'Debe indicar el motivo de la cancelacion.';
    }

    if (destino === 'ENTREGADA') {
        const km = data.kilometrajeSalida.trim();
        if (!km) {
            errors.kilometrajeSalida = 'La entrega requiere el kilometraje de salida.';
        } else if (!ENTERO_NO_NEGATIVO.test(km)) {
            errors.kilometrajeSalida = 'Ingrese un kilometraje entero y no negativo.';
        } else if (Number(km) < kilometrajeEntrada) {
            errors.kilometrajeSalida = `No puede ser menor al de entrada (${kilometrajeEntrada}).`;
        }

        if (!data.observacionesSalida.trim()) {
            errors.observacionesSalida = 'La entrega requiere observaciones de salida.';
        }
    }

    return errors;
}
