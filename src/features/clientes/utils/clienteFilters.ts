import { cumpleEstado, normalizar, type EstadoFiltro } from '../../../shared/utils/filters';
import type { Cliente } from '../models/Cliente';

// OR dentro del texto (cualquier campo puede coincidir) y AND entre búsqueda y estado
export function matchesCliente(cliente: Cliente, search: string, estado: EstadoFiltro): boolean {
    const term = normalizar(search);
    const matchesText = !term ||
        normalizar(cliente.nombreCompleto).includes(term) ||
        normalizar(cliente.documento).includes(term) ||
        normalizar(cliente.email).includes(term);

    return matchesText && cumpleEstado(cliente.activo, estado);
}
