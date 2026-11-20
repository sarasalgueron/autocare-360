import { Button } from '../../../components/ui/Button';
import { formatFechaHora } from '../../../shared/utils/format';
import type { Cliente } from '../../clientes/models/Cliente';
import type { Vehiculo } from '../../vehiculos/models/Vehiculo';
import type { OrdenServicio } from '../models/OrdenServicio';
import { EstadoOrdenBadge } from './EstadoOrdenBadge';

interface OrdenTableProps {
    ordenes: OrdenServicio[];
    vehiculosById: Map<number, Vehiculo>;
    clientesById: Map<number, Cliente>;
    onVer: (orden: OrdenServicio) => void;
}

export default function OrdenTable({ ordenes, vehiculosById, clientesById, onVer }: OrdenTableProps) {
    return (
        <div className="table-card">
            <div className="table-responsive">
                <table className="data-table">
                    <thead>
                    <tr>
                        <th>Numero</th>
                        <th>Vehiculo</th>
                        <th>Propietario</th>
                        <th>Estado</th>
                        <th>Apertura</th>
                        <th>Acciones</th>
                    </tr>
                    </thead>
                    <tbody>
                    {ordenes.map((orden) => {
                        // Orden -> Vehiculo -> Cliente: se navega con Maps, sin requests por fila
                        const vehiculo = vehiculosById.get(orden.vehiculoId);
                        const propietario = vehiculo ? clientesById.get(vehiculo.clienteId) : undefined;

                        return (
                            <tr key={orden.id}>
                                <td className="plate-cell">{orden.numeroOrden}</td>
                                <td>{vehiculo ? `${vehiculo.placa} - ${vehiculo.marca} ${vehiculo.modelo}` : `#${orden.vehiculoId}`}</td>
                                <td>{propietario?.nombreCompleto ?? '—'}</td>
                                <td><EstadoOrdenBadge estado={orden.estado} /></td>
                                <td>{formatFechaHora(orden.fechaApertura)}</td>
                                <td className="actions-cell">
                                    <Button variant="secondary" onClick={() => onVer(orden)}>
                                        Ver / gestionar
                                    </Button>
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
