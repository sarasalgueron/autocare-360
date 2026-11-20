import { useState } from 'react';
import { useSesionDemo } from '../../../app/sesionDemoContext';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Modal } from '../../../components/ui/Modal';
import { Pagination } from '../../../components/ui/Pagination';
import { SearchInput } from '../../../components/ui/SearchInput';
import { PAGE_SIZE_OPTIONS, paginate } from '../../../shared/utils/paginate';
import { SelectFilter } from '../../../components/ui/SelectFilter';
import { useClientes } from '../../clientes/hooks/useClientes';
import { tieneAlgunRol } from '../../usuarios/models/Usuario';
import { useVehiculos } from '../../vehiculos/hooks/useVehiculos';
import AbrirOrdenForm from '../components/AbrirOrdenForm';
import OrdenDetalle from '../components/OrdenDetalle';
import OrdenTable from '../components/OrdenTable';
import { useOrdenes } from '../hooks/useOrdenes';
import { ESTADO_LABEL, ESTADOS_ORDEN, esEstadoFinal, type OrdenServicio } from '../models/OrdenServicio';
import { contarPorEstado, matchesOrden, type FiltroEstadoOrden } from '../utils/ordenFilters';

export default function OrdenesPage() {
    const ordenesQuery = useOrdenes();
    const vehiculosQuery = useVehiculos();
    const clientesQuery = useClientes();
    const { usuarios, usuarioActual } = useSesionDemo();

    const { data: ordenes, setData: setOrdenes } = ordenesQuery;

    const [search, setSearch] = useState('');
    const [filtroEstado, setFiltroEstado] = useState<FiltroEstadoOrden>('ACTIVAS');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [ordenSeleccionadaId, setOrdenSeleccionadaId] = useState<number | null>(null);
    const [successMessage, setSuccessMessage] = useState('');

    const loading = ordenesQuery.loading || vehiculosQuery.loading || clientesQuery.loading;
    const loadError = ordenesQuery.error || vehiculosQuery.error || clientesQuery.error;

    const reloadAll = () => {
        ordenesQuery.reload();
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
    const handleFiltroEstado = (value: FiltroEstadoOrden) => {
        setFiltroEstado(value);
        setPage(1);
    };
    const handlePageSize = (value: string) => {
        setPageSize(Number(value));
        setPage(1);
    };

    // La lista viene del backend ordenada de la más reciente a la más antigua
    const handleOpened = (orden: OrdenServicio) => {
        setOrdenes((prev) => [orden, ...prev]);
        showSuccess(`Orden ${orden.numeroOrden} abierta`);
    };

    const handleEstadoCambiado = (actualizada: OrdenServicio) => {
        setOrdenes((prev) => prev.map((o) => o.id === actualizada.id ? actualizada : o));
        showSuccess(`Orden ${actualizada.numeroOrden}: ${ESTADO_LABEL[actualizada.estado]}`);
    };

    if (loading) return <div className="state-card">Cargando ordenes...</div>;

    if (loadError) {
        return (
            <div className="state-card error">
                <p>{loadError}</p>
                <button type="button" onClick={reloadAll}>Reintentar</button>
            </div>
        );
    }

    // ---- Datos derivados (se recalculan en cada render) ----
    const vehiculosById = new Map(vehiculosQuery.data.map((v) => [v.id, v]));
    const clientesById = new Map(clientesQuery.data.map((c) => [c.id, c]));
    const usuariosById = new Map(usuarios.map((u) => [u.id, u]));
    const vehiculosConOrdenActiva = new Set(
        ordenes.filter((o) => !esEstadoFinal(o.estado)).map((o) => o.vehiculoId),
    );
    const conteo = contarPorEstado(ordenes);

    const filtered = ordenes.filter((o) => matchesOrden(o, search, filtroEstado, vehiculosById, clientesById));
    const { items: visible, page: currentPage, totalPages } = paginate(filtered, page, pageSize);

    // La selección guarda solo el id: así el modal siempre muestra la versión actual de la orden
    const ordenSeleccionada = ordenes.find((o) => o.id === ordenSeleccionadaId) ?? null;
    const vehiculoSeleccionado = ordenSeleccionada ? vehiculosById.get(ordenSeleccionada.vehiculoId) : undefined;

    const puedeAbrir = tieneAlgunRol(usuarioActual, 'ASESOR', 'ADMINISTRADOR');

    return (
        <section className="page-stack">
            <header>
                <h1>Ordenes de servicio</h1>
                <p>Recepcion, seguimiento por estado y entrega del vehiculo.</p>
            </header>

            {successMessage && <div className="form-success" role="status">{successMessage}</div>}

            <AbrirOrdenForm
                vehiculos={vehiculosQuery.data}
                clientesById={clientesById}
                vehiculosConOrdenActiva={vehiculosConOrdenActiva}
                puedeAbrir={puedeAbrir}
                onOpened={handleOpened}
            />

            {/* Tablero por estado: cada tarjeta filtra la tabla */}
            <div className="estado-tablero" role="group" aria-label="Filtrar por estado">
                <button
                    type="button"
                    className={`estado-chip ${filtroEstado === 'ACTIVAS' ? 'estado-chip--activo' : ''}`}
                    onClick={() => handleFiltroEstado('ACTIVAS')}
                >
                    <span>Activas</span>
                    <strong>{ordenes.length - conteo.ENTREGADA - conteo.CANCELADA}</strong>
                </button>
                {ESTADOS_ORDEN.map((estado) => (
                    <button
                        key={estado}
                        type="button"
                        className={`estado-chip estado--${estado.toLowerCase()} ${filtroEstado === estado ? 'estado-chip--activo' : ''}`}
                        onClick={() => handleFiltroEstado(estado)}
                    >
                        <span>{ESTADO_LABEL[estado]}</span>
                        <strong>{conteo[estado]}</strong>
                    </button>
                ))}
                <button
                    type="button"
                    className={`estado-chip ${filtroEstado === '' ? 'estado-chip--activo' : ''}`}
                    onClick={() => handleFiltroEstado('')}
                >
                    <span>Todas</span>
                    <strong>{ordenes.length}</strong>
                </button>
            </div>

            <div className="toolbar">
                <SearchInput value={search} onChange={handleSearch} placeholder="Numero, placa o propietario" />
                <SelectFilter
                    label="Tamanio de pagina"
                    value={String(pageSize)}
                    options={PAGE_SIZE_OPTIONS}
                    onChange={handlePageSize}
                />
            </div>

            {filtered.length === 0 ? (
                <EmptyState
                    title={ordenes.length === 0 ? 'Todavia no hay ordenes' : 'Sin resultados'}
                    description={ordenes.length === 0
                        ? 'Abre la primera orden con el formulario de recepcion.'
                        : 'Ninguna orden coincide con el estado o la busqueda.'}
                />
            ) : (
                <>
                    <OrdenTable
                        ordenes={visible}
                        vehiculosById={vehiculosById}
                        clientesById={clientesById}
                        onVer={(orden) => setOrdenSeleccionadaId(orden.id)}
                    />
                    <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
                </>
            )}

            <Modal
                open={ordenSeleccionada !== null}
                title={ordenSeleccionada ? `Orden ${ordenSeleccionada.numeroOrden}` : ''}
                size="lg"
                onClose={() => setOrdenSeleccionadaId(null)}
            >
                {ordenSeleccionada && (
                    <OrdenDetalle
                        key={ordenSeleccionada.id}
                        orden={ordenSeleccionada}
                        vehiculo={vehiculoSeleccionado}
                        propietario={vehiculoSeleccionado ? clientesById.get(vehiculoSeleccionado.clienteId) : undefined}
                        usuariosById={usuariosById}
                        puedeEntregarOCancelar={tieneAlgunRol(usuarioActual, 'ASESOR', 'ADMINISTRADOR')}
                        onEstadoCambiado={handleEstadoCambiado}
                    />
                )}
            </Modal>
        </section>
    );
}
