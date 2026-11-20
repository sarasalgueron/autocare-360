import { MetricCard } from '../components/ui/MetricCard';
import { useClientes } from '../features/clientes/hooks/useClientes';
import { useVehiculos } from '../features/vehiculos/hooks/useVehiculos';

/**
 * El Dashboard no crea otra fuente de verdad: reutiliza los hooks y DERIVA las métricas.
 * Con miles de registros convendría un endpoint agregado en el backend (/api/reports/...)
 * en vez de descargar todas las filas para contarlas.
 */
export default function DashboardPage() {
    const clientes = useClientes();
    const vehiculos = useVehiculos();

    const loading = clientes.loading || vehiculos.loading;
    // error es '' cuando no hay fallo: por eso || y no ??
    const error = clientes.error || vehiculos.error;

    if (loading) return <div className="state-card">Cargando dashboard...</div>;
    if (error) return <div className="state-card error" role="alert">{error}</div>;

    const clientesConVehiculo = new Set(vehiculos.data.map((v) => v.clienteId));

    const metrics = {
        clientesTotal: clientes.data.length,
        clientesActivos: clientes.data.filter((c) => c.activo).length,
        vehiculosTotal: vehiculos.data.length,
        vehiculosActivos: vehiculos.data.filter((v) => v.activo).length,
        clientesSinVehiculo: clientes.data.filter((c) => !clientesConVehiculo.has(c.id)).length,
    };

    return (
        <section className="page-stack">
            <header>
                <p className="page-heading__eyebrow">Panel principal</p>
                <h1>Bienvenido a AutoCare360</h1>
            </header>

            <div className="metrics-grid">
                <MetricCard
                    label="Clientes"
                    value={metrics.clientesTotal}
                    helper={`${metrics.clientesActivos} activos`}
                />
                <MetricCard
                    label="Clientes activos"
                    value={metrics.clientesActivos}
                    helper={`${metrics.clientesTotal - metrics.clientesActivos} inactivos`}
                />
                <MetricCard
                    label="Vehiculos"
                    value={metrics.vehiculosTotal}
                    helper={`${metrics.vehiculosActivos} activos`}
                />
                <MetricCard
                    label="Vehiculos activos"
                    value={metrics.vehiculosActivos}
                    helper={`${metrics.vehiculosTotal - metrics.vehiculosActivos} inactivos`}
                />
                <MetricCard
                    label="Clientes sin vehiculos"
                    value={metrics.clientesSinVehiculo}
                    helper="Relacion 1:N con 0 hijos"
                />
            </div>
        </section>
    );
}
