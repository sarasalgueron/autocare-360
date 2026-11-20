// Texto normalizado para búsquedas case-insensitive
export function normalizar(texto: string | null | undefined): string {
    return (texto ?? '').trim().toLowerCase();
}

export type EstadoFiltro = 'all' | 'active' | 'inactive';

export const ESTADO_OPTIONS = [
    { value: 'all', label: 'Todos' },
    { value: 'active', label: 'Activos' },
    { value: 'inactive', label: 'Inactivos' },
];

export function cumpleEstado(activo: boolean, estado: EstadoFiltro): boolean {
    return estado === 'all' || (estado === 'active' ? activo : !activo);
}
