import type { Cliente } from '../../clientes/models/Cliente';
import type { Vehiculo } from '../../vehiculos/models/Vehiculo';
import { normalizar } from '../../../shared/utils/filters';
import type { EstadoOrden, OrdenServicio } from '../models/OrdenServicio';

// '' = todos los estados; 'ACTIVAS' = las que no están ENTREGADA ni CANCELADA (RN-03)
export type FiltroEstadoOrden = EstadoOrden | '' | 'ACTIVAS';

export function matchesOrden(
    orden: OrdenServicio,
    search: string,
    filtroEstado: FiltroEstadoOrden,
    vehiculosById: Map<number, Vehiculo>,
    clientesById: Map<number, Cliente>,
): boolean {
    const vehiculo = vehiculosById.get(orden.vehiculoId);
    const propietario = vehiculo ? clientesById.get(vehiculo.clienteId) : undefined;
    const texto = normalizar(
        `${orden.numeroOrden} ${vehiculo?.placa ?? ''} ${propietario?.nombreCompleto ?? ''}`,
    );

    const matchesEstado = filtroEstado === ''
        || (filtroEstado === 'ACTIVAS'
            ? orden.estado !== 'ENTREGADA' && orden.estado !== 'CANCELADA'
            : orden.estado === filtroEstado);

    return texto.includes(normalizar(search)) && matchesEstado;
}

/** Cantidad de órdenes por estado (para el tablero). Dato derivado, no estado. */
export function contarPorEstado(ordenes: OrdenServicio[]): Record<EstadoOrden, number> {
    const conteo = {
        ABIERTA: 0,
        DIAGNOSTICO: 0,
        ESPERA_APROBACION: 0,
        EN_TRABAJO: 0,
        LISTA_ENTREGA: 0,
        ENTREGADA: 0,
        CANCELADA: 0,
    };
    for (const orden of ordenes) conteo[orden.estado] += 1;
    return conteo;
}
