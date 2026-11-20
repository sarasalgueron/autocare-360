export interface PageResult<T> {
    items: T[];
    page: number;
    totalPages: number;
}

/**
 * Paginación cliente. Se aplica DESPUÉS de filtrar.
 * Si la página pedida quedó fuera de rango (p. ej. tras eliminar el último elemento
 * de la última página), se ajusta a la última página válida.
 */
export function paginate<T>(data: T[], page: number, pageSize: number): PageResult<T> {
    const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
    const currentPage = Math.min(Math.max(1, page), totalPages);
    const start = (currentPage - 1) * pageSize;

    return {
        items: data.slice(start, start + pageSize),
        page: currentPage,
        totalPages,
    };
}

export const PAGE_SIZE_OPTIONS = [
    { value: '5', label: '5 por pagina' },
    { value: '10', label: '10 por pagina' },
    { value: '20', label: '20 por pagina' },
];
