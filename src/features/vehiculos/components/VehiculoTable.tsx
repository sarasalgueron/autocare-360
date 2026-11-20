import { Button } from '../../../components/ui/Button';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import type { Cliente } from '../../clientes/models/Cliente';
import type { Vehiculo } from '../models/Vehiculo';

interface VehiculoTableProps {
    vehiculos: Vehiculo[];
    clientesById: Map<number, Cliente>;
    onEdit: (id: number) => void;
    onDelete: (vehiculo: Vehiculo) => void;
}

export default function VehiculoTable({
                                          vehiculos,
                                          clientesById,
                                          onEdit,
                                          onDelete,
                                      }: VehiculoTableProps) {
    return (
        <div className="table-card">
            <div className="table-responsive">
                <table className="data-table">
                    <thead>
                    <tr>
                        <th>Placa</th>
                        <th>Marca / Modelo</th>
                        <th>VIN</th>
                        <th>Color</th>
                        <th>Propietario</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                    </thead>
                    <tbody>
                    {vehiculos.map((vehiculo) => {
                        // Map por id: resuelve el propietario sin un GET por fila (evita N+1)
                        const propietario = clientesById.get(vehiculo.clienteId);

                        return (
                            <tr key={vehiculo.id}>
                                <td className="plate-cell">{vehiculo.placa}</td>
                                <td>{vehiculo.marca} {vehiculo.modelo}</td>
                                <td>{vehiculo.vin}</td>
                                <td>{vehiculo.color ?? '—'}</td>
                                <td>
                                    {propietario
                                        ? propietario.nombreCompleto
                                        : `Cliente #${vehiculo.clienteId}`}
                                </td>
                                <td><StatusBadge active={vehiculo.activo} /></td>
                                <td className="actions-cell">
                                    <Button variant="secondary" onClick={() => onEdit(vehiculo.id)}>
                                        Editar
                                    </Button>
                                    <Button variant="danger" onClick={() => onDelete(vehiculo)}>
                                        Eliminar
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
