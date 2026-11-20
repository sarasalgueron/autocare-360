import { cumpleEstado, normalizar, type EstadoFiltro } from '../../../shared/utils/filters';
import type { ServicioCatalogo } from '../models/ServicioCatalogo';

export function matchesServicio(servicio: ServicioCatalogo, search: string, estado: EstadoFiltro): boolean {
    const term = normalizar(search);
    const matchesText = !term ||
        normalizar(servicio.codigo).includes(term) ||
        normalizar(servicio.nombre).includes(term) ||
        normalizar(servicio.descripcion).includes(term);

    return matchesText && cumpleEstado(servicio.activo, estado);
}
