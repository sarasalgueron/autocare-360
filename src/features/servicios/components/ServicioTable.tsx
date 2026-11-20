import { Button } from '../../../components/ui/Button';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { formatPrecio } from '../../../shared/utils/format';
import type { ServicioCatalogo } from '../models/ServicioCatalogo';

interface ServicioTableProps {
    servicios: ServicioCatalogo[];
    onEdit: (id: number) => void;
    onDelete: (servicio: ServicioCatalogo) => void;
}

export default function ServicioTable({ servicios, onEdit, onDelete }: ServicioTableProps) {
    return (
        <div className="table-card">
            <div className="table-responsive">
                <table className="data-table">
                    <thead>
                    <tr>
                        <th>Codigo</th>
                        <th>Nombre</th>
                        <th>Descripcion</th>
                        <th className="num-cell">Precio base</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                    </thead>
                    <tbody>
                    {servicios.map((servicio) => (
                        <tr key={servicio.id}>
                            <td className="plate-cell">{servicio.codigo}</td>
                            <td>{servicio.nombre}</td>
                            <td>{servicio.descripcion ?? '—'}</td>
                            <td className="num-cell">{formatPrecio(servicio.precioBase)}</td>
                            <td><StatusBadge active={servicio.activo} /></td>
                            <td className="actions-cell">
                                <Button variant="secondary" onClick={() => onEdit(servicio.id)}>
                                    Editar
                                </Button>
                                <Button variant="danger" onClick={() => onDelete(servicio)}>
                                    Eliminar
                                </Button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
