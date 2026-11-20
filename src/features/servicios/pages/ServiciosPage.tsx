import { useState } from 'react';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Pagination } from '../../../components/ui/Pagination';
import { SearchInput } from '../../../components/ui/SearchInput';
import { SelectFilter } from '../../../components/ui/SelectFilter';
import { ESTADO_OPTIONS, type EstadoFiltro } from '../../../shared/utils/filters';
import { PAGE_SIZE_OPTIONS, paginate } from '../../../shared/utils/paginate';
import ServicioForm from '../components/ServicioForm';
import ServicioTable from '../components/ServicioTable';
import { useServicios } from '../hooks/useServicios';
import type { ServicioCatalogo } from '../models/ServicioCatalogo';
import { servicioService } from '../services/servicioService';
import { matchesServicio } from '../utils/servicioFilters';

export default function ServiciosPage() {
    const {
        data: servicios,
        setData: setServicios,
        loading,
        error: loadError,
        reload,
    } = useServicios();

    const [search, setSearch] = useState('');
    const [estado, setEstado] = useState<EstadoFiltro>('all');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [editingServicio, setEditingServicio] = useState<ServicioCatalogo | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [pendingDelete, setPendingDelete] = useState<ServicioCatalogo | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [actionError, setActionError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const showSuccess = (message: string) => {
        setSuccessMessage(message);
        window.setTimeout(() => setSuccessMessage(''), 2500);
    };

    const handleSearch = (value: string) => {
        setSearch(value);
        setPage(1);
    };
    const handleEstado = (value: string) => {
        setEstado(value as EstadoFiltro);
        setPage(1);
    };
    const handlePageSize = (value: string) => {
        setPageSize(Number(value));
        setPage(1);
    };

    const handleEdit = async (id: number) => {
        try {
            setLoadingDetail(true);
            setActionError('');
            const servicio = await servicioService.obtenerPorId(id);
            setEditingServicio(servicio);
        } catch (err) {
            setActionError(err instanceof Error ? err.message : 'No se pudo cargar el servicio');
        } finally {
            setLoadingDetail(false);
        }
    };

    // El backend devuelve la lista ordenada por codigo; tras crear/editar se reordena igual
    const handleSaved = (saved: ServicioCatalogo, mode: 'create' | 'edit') => {
        setServicios((prev) => {
            const next = mode === 'create'
                ? [...prev, saved]
                : prev.map((item) => item.id === saved.id ? saved : item);
            return [...next].sort((a, b) => a.codigo.localeCompare(b.codigo));
        });
        setEditingServicio(null);
        setActionError('');
        showSuccess(mode === 'create' ? 'Servicio creado correctamente' : 'Servicio actualizado correctamente');
    };

    const confirmDelete = async () => {
        if (!pendingDelete) return;

        try {
            setDeleting(true);
            setActionError('');
            await servicioService.eliminar(pendingDelete.id);
            setServicios((prev) => prev.filter((item) => item.id !== pendingDelete.id));
            if (editingServicio?.id === pendingDelete.id) setEditingServicio(null);
            showSuccess('Servicio eliminado correctamente');
        } catch (err) {
            // 409 si el servicio ya se usó en una tarea de orden: conviene desactivarlo
            setActionError(err instanceof Error ? err.message : 'No se pudo eliminar');
        } finally {
            setDeleting(false);
            setPendingDelete(null);
        }
    };

    if (loading) return <div className="state-card">Cargando servicios...</div>;

    if (loadError) {
        return (
            <div className="state-card error">
                <p>{loadError}</p>
                <button type="button" onClick={reload}>Reintentar</button>
            </div>
        );
    }

    const filtered = servicios.filter((servicio) => matchesServicio(servicio, search, estado));
    const { items: visible, page: currentPage, totalPages } = paginate(filtered, page, pageSize);

    return (
        <section className="page-stack">
            <header>
                <h1>Catalogo de servicios</h1>
                <p>Servicios y precios de referencia que el taller ofrece en sus ordenes.</p>
            </header>

            {actionError && <div className="state-card error" role="alert">{actionError}</div>}
            {successMessage && <div className="form-success" role="status">{successMessage}</div>}
            {loadingDetail && <div className="state-card">Cargando detalle...</div>}

            <ServicioForm
                servicio={editingServicio}
                onSaved={handleSaved}
                onCancelEdit={() => setEditingServicio(null)}
            />

            <div className="toolbar">
                <SearchInput value={search} onChange={handleSearch} placeholder="Codigo, nombre o descripcion" />
                <SelectFilter label="Estado" value={estado} options={ESTADO_OPTIONS} onChange={handleEstado} />
                <SelectFilter
                    label="Tamanio de pagina"
                    value={String(pageSize)}
                    options={PAGE_SIZE_OPTIONS}
                    onChange={handlePageSize}
                />
            </div>

            {filtered.length === 0 ? (
                <EmptyState
                    title={servicios.length === 0 ? 'No hay servicios en el catalogo' : 'Sin resultados'}
                    description={servicios.length === 0
                        ? 'Registra el primer servicio con el formulario.'
                        : 'Ningun servicio coincide con la busqueda o el filtro.'}
                />
            ) : (
                <>
                    <ServicioTable servicios={visible} onEdit={handleEdit} onDelete={setPendingDelete} />
                    <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
                </>
            )}

            <ConfirmDialog
                open={pendingDelete !== null}
                title="Eliminar servicio"
                message={pendingDelete
                    ? `¿Eliminar el servicio ${pendingDelete.codigo} - ${pendingDelete.nombre}? Si ya se uso en alguna orden no se podra eliminar; en ese caso desactivalo.`
                    : ''}
                confirming={deleting}
                onConfirm={confirmDelete}
                onCancel={() => setPendingDelete(null)}
            />
        </section>
    );
}
