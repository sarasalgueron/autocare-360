import { Button } from '../../../components/ui/Button';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import type { Cliente } from '../models/Cliente';

interface ClienteTableProps {
    clientes: Cliente[];
    onEdit: (id: number) => void;
    onDelete: (cliente: Cliente) => void;
}

// Solo renderiza filas y emite acciones; la página decide qué hacer (y si hay EmptyState)
export default function ClienteTable({ clientes, onEdit, onDelete }: ClienteTableProps) {
    return (
        <div className="table-card">
            <div className="table-responsive">
                <table className="data-table">
                    <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Documento</th>
                        <th>Email</th>
                        <th>Telefono</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                    </thead>
                    <tbody>
                    {clientes.map((cliente) => (
                        <tr key={cliente.id}>
                            <td>{cliente.id}</td>
                            <td>{cliente.nombreCompleto}</td>
                            <td>{cliente.documento}</td>
                            <td>{cliente.email ?? '—'}</td>
                            <td>{cliente.telefono ?? '—'}</td>
                            <td><StatusBadge active={cliente.activo} /></td>
                            <td className="actions-cell">
                                <Button variant="secondary" onClick={() => onEdit(cliente.id)}>
                                    Editar
                                </Button>
                                <Button variant="danger" onClick={() => onDelete(cliente)}>
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
