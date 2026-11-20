import { useState } from 'react';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Pagination } from '../../../components/ui/Pagination';
import { SearchInput } from '../../../components/ui/SearchInput';
import { SelectFilter } from '../../../components/ui/SelectFilter';
import { ESTADO_OPTIONS, type EstadoFiltro } from '../../../shared/utils/filters';
import { PAGE_SIZE_OPTIONS, paginate } from '../../../shared/utils/paginate';
import { useClientes } from '../../clientes/hooks/useClientes';
import VehiculoForm from '../components/VehiculoForm';
import VehiculoTable from '../components/VehiculoTable';
import { useVehiculos } from '../hooks/useVehiculos';
import type { Vehiculo } from '../models/Vehiculo';
import { vehiculoService } from '../services/vehiculoService';
import { matchesVehiculo } from '../utils/vehiculoFilters';

export default function VehiculosPage() {
    const vehiculosQuery = useVehiculos();
    const clientesQuery = useClientes();
    const { data: vehiculos, setData: setVehiculos } = vehiculosQuery;
    const clientes = clientesQuery.data;

    const [search, setSearch] = useState('');
    const [clienteFiltro, setClienteFiltro] = useState('');
    const [estado, setEstado] = useState<EstadoFiltro>('all');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [editingVehiculo, setEditingVehiculo] = useState<Vehiculo | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [pendingDelete, setPendingDelete] = useState<Vehiculo | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [actionError, setActionError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const loading = vehiculosQuery.loading || clientesQuery.loading;
    const loadError = vehiculosQuery.error || clientesQuery.error;

    const reloadAll = () => {
        vehiculosQuery.reload();
        clientesQuery.reload();
    };

    const showSuccess = (message: string) => {
        setSuccessMessage(message);
        window.setTimeout(() => setSuccessMessage(''), 2500);
    };

    const handleSearch = (value: string) => {
        setSearch(value);
        setPage(1);
    };
    const handleClienteFiltro = (value: string) => {
        setClienteFiltro(value);
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
            const vehiculo = await vehiculoService.obtenerPorId(id);
            setEditingVehiculo(vehiculo);
        } catch (err) {
            setActionError(err instanceof Error ? err.message : 'No se pudo cargar el vehiculo');
        } finally {
            setLoadingDetail(false);
        }
    };

    const handleSaved = (saved: Vehiculo, mode: 'create' | 'edit') => {
        setVehiculos((prev) =>
            mode === 'create'
                ? [...prev, saved]
                : prev.map((item) => item.id === saved.id ? saved : item),
        );
        setEditingVehiculo(null);
        setActionError('');
        showSuccess(mode === 'create' ? 'Vehiculo creado correctamente' : 'Vehiculo actualizado correctamente');
    };

    const confirmDelete = async () => {
        if (!pendingDelete) return;

        try {
            setDeleting(true);
            setActionError('');
            await vehiculoService.eliminar(pendingDelete.id);
            setVehiculos((prev) => prev.filter((v) => v.id !== pendingDelete.id));
            if (editingVehiculo?.id === pendingDelete.id) setEditingVehiculo(null);
            showSuccess('Vehiculo eliminado correctamente');
        } catch (err) {
            setActionError(err instanceof Error ? err.message : 'No se pudo eliminar');
        } finally {
            setDeleting(false);
            setPendingDelete(null);
        }
    };

    if (loading) return <div className="state-card">Cargando vehiculos...</div>;

    if (loadError) {
        return (
            <div className="state-card error">
                <p>{loadError}</p>
                <button type="button" onClick={reloadAll}>Reintentar</button>
            </div>
        );
    }

    // Datos derivados en cada render: índice de clientes, filtrado y página visible
    const clientesById = new Map(clientes.map((cliente) => [cliente.id, cliente]));
    const filtered = vehiculos.filter((vehiculo) =>
        matchesVehiculo(vehiculo, { search, clienteId: clienteFiltro, estado }, clientesById),
    );
    const { items: visible, page: currentPage, totalPages } = paginate(filtered, page, pageSize);

    const propietarioOptions = [
        { value: '', label: 'Todos los clientes' },
        ...clientes.map((cliente) => ({ value: String(cliente.id), label: cliente.nombreCompleto })),
    ];

    return (
        <section className="page-stack">
            <header>
                <h1>Vehículos</h1>
                <p>CRUD completo + relación Cliente 1:N.</p>
            </header>

            {actionError && <div className="state-card error" role="alert">{actionError}</div>}
            {successMessage && <div className="form-success" role="status">{successMessage}</div>}
            {loadingDetail && <div className="state-card">Cargando detalle...</div>}

            <VehiculoForm
                clientes={clientes}
                vehiculo={editingVehiculo}
                onSaved={handleSaved}
                onCancelEdit={() => setEditingVehiculo(null)}
            />

            <div className="toolbar">
                <SearchInput
                    value={search}
                    onChange={handleSearch}
                    placeholder="Placa, VIN, marca, modelo o propietario"
                />
                <SelectFilter
                    label="Propietario"
                    value={clienteFiltro}
                    options={propietarioOptions}
                    onChange={handleClienteFiltro}
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
                    title={vehiculos.length === 0 ? 'No hay vehiculos registrados' : 'Sin resultados'}
                    description={vehiculos.length === 0
                        ? 'Registra el primer vehiculo con el formulario.'
                        : 'Ningun vehiculo coincide con la busqueda o los filtros.'}
                />
            ) : (
                <>
                    <VehiculoTable
                        vehiculos={visible}
                        clientesById={clientesById}
                        onEdit={handleEdit}
                        onDelete={setPendingDelete}
                    />
                    <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
                </>
            )}

            <ConfirmDialog
                open={pendingDelete !== null}
                title="Eliminar vehiculo"
                message={pendingDelete
                    ? `¿Eliminar el vehiculo ${pendingDelete.placa}? Esta accion no se puede deshacer.`
                    : ''}
                confirming={deleting}
                onConfirm={confirmDelete}
                onCancel={() => setPendingDelete(null)}
            />
        </section>
    );
}
