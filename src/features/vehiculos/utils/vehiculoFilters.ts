import type { Cliente } from '../../clientes/models/Cliente';
import { cumpleEstado, normalizar, type EstadoFiltro } from '../../../shared/utils/filters';
import type { Vehiculo } from '../models/Vehiculo';

export interface VehiculoFiltros {
    search: string;
    clienteId: string; // '' = todos; el select entrega texto
    estado: EstadoFiltro;
}

export function matchesVehiculo(
    vehiculo: Vehiculo,
    filtros: VehiculoFiltros,
    clientesById: Map<number, Cliente>,
): boolean {
    // El nombre del propietario se resuelve con el Map, sin duplicarlo dentro de Vehiculo
    const owner = clientesById.get(vehiculo.clienteId);
    const texto = normalizar(
        `${vehiculo.placa} ${vehiculo.vin} ${vehiculo.marca} ${vehiculo.modelo} ${owner?.nombreCompleto ?? ''}`,
    );

    const matchesText = texto.includes(normalizar(filtros.search));
    const matchesOwner = filtros.clienteId === '' || vehiculo.clienteId === Number(filtros.clienteId);

    return matchesText && matchesOwner && cumpleEstado(vehiculo.activo, filtros.estado);
}
