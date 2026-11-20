import { useState } from 'react';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Pagination } from '../../../components/ui/Pagination';
import { SearchInput } from '../../../components/ui/SearchInput';
import { SelectFilter } from '../../../components/ui/SelectFilter';
import { ESTADO_OPTIONS, type EstadoFiltro } from '../../../shared/utils/filters';
import { PAGE_SIZE_OPTIONS, paginate } from '../../../shared/utils/paginate';
import ClienteForm from '../components/ClienteForm';
import ClienteTable from '../components/ClienteTable';
import { useClientes } from '../hooks/useClientes';
import type { Cliente } from '../models/Cliente';
import { clienteService } from '../services/clienteService';
import { matchesCliente } from '../utils/clienteFilters';

export default function ClientesPage() {
    const {
        data: clientes,
        setData: setClientes,
        loading,
        error: loadError,
        reload,
    } = useClientes();

    // Estado fuente que controla el usuario
    const [search, setSearch] = useState('');
    const [estado, setEstado] = useState<EstadoFiltro>('all');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Estado de operación
    const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [pendingDelete, setPendingDelete] = useState<Cliente | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [actionError, setActionError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const showSuccess = (message: string) => {
        setSuccessMessage(message);
        window.setTimeout(() => setSuccessMessage(''), 2500);
    };

    // Cambiar búsqueda/filtro/tamaño reinicia a la página 1 desde el propio evento
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
            const cliente = await clienteService.obtenerPorId(id);
            setEditingCliente(cliente);
        } catch (err) {
            setActionError(err instanceof Error ? err.message : 'No se pudo cargar el cliente');
        } finally {
            setLoadingDetail(false);
        }
    };

    const handleSaved = (saved: Cliente, mode: 'create' | 'edit') => {
        setClientes((prev) =>
            mode === 'create'
                ? [...prev, saved]
                : prev.map((item) => item.id === saved.id ? saved : item),
        );
        setEditingCliente(null);
        setActionError('');
        showSuccess(mode === 'create' ? 'Cliente creado correctamente' : 'Cliente actualizado correctamente');
    };

    // Eliminar en dos pasos: el botón solo marca pendingDelete; el DELETE ocurre al confirmar
    const confirmDelete = async () => {
        if (!pendingDelete) return;

        try {
            setDeleting(true);
            setActionError('');
            await clienteService.eliminar(pendingDelete.id);
            setClientes((prev) => prev.filter((item) => item.id !== pendingDelete.id));
            if (editingCliente?.id === pendingDelete.id) setEditingCliente(null);
            showSuccess('Cliente eliminado correctamente');
        } catch (err) {
            // Ej.: 409 si tiene vehículos; la fila NO se quita de la UI
            setActionError(err instanceof Error ? err.message : 'No se pudo eliminar');
        } finally {
            setDeleting(false);
            setPendingDelete(null);
        }
    };

    if (loading) return <div className="state-card">Cargando clientes...</div>;

    if (loadError) {
        return (
            <div className="state-card error">
                <p>{loadError}</p>
                <button type="button" onClick={reload}>Reintentar</button>
            </div>
        );
    }

    // Datos derivados: filtrar -> paginar (en ese orden). No se guardan en estado
    const filtered = clientes.filter((cliente) => matchesCliente(cliente, search, estado));
    const { items: visible, page: currentPage, totalPages } = paginate(filtered, page, pageSize);

    return (
        <section className="page-stack">
            <header>
                <h1>Clientes</h1>
                <p>CRUD completo conectado con Spring Boot.</p>
            </header>

            {actionError && <div className="state-card error" role="alert">{actionError}</div>}
            {successMessage && <div className="form-success" role="status">{successMessage}</div>}
            {loadingDetail && <div className="state-card">Cargando detalle...</div>}

            <ClienteForm
                cliente={editingCliente}
                onSaved={handleSaved}
                onCancelEdit={() => setEditingCliente(null)}
            />

            <div className="toolbar">
                <SearchInput
                    value={search}
                    onChange={handleSearch}
                    placeholder="Nombre, documento o email"
                />
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
                    title={clientes.length === 0 ? 'No hay clientes registrados' : 'Sin resultados'}
                    description={clientes.length === 0
                        ? 'Registra el primer cliente con el formulario.'
                        : 'Ningun cliente coincide con la busqueda o el filtro.'}
                />
            ) : (
                <>
                    <ClienteTable
                        clientes={visible}
                        onEdit={handleEdit}
                        onDelete={setPendingDelete}
                    />
                    <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
                </>
            )}

            <ConfirmDialog
                open={pendingDelete !== null}
                title="Eliminar cliente"
                message={pendingDelete
                    ? `¿Eliminar a ${pendingDelete.nombreCompleto}? Esta accion no se puede deshacer.`
                    : ''}
                confirming={deleting}
                onConfirm={confirmDelete}
                onCancel={() => setPendingDelete(null)}
            />
        </section>
    );
}
