import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Button } from '../../../components/ui/Button';
import type { Cliente } from '../models/Cliente';
import { clienteService } from '../services/clienteService';
import type { ClienteFormData } from '../types/ClienteFormData';
import type { ClienteCreateRequest } from '../types/ClienteRequests';
import { validarCliente, type ClienteFormErrors } from '../utils/clienteValidation';

interface ClienteFormProps {
    cliente?: Cliente | null;
    onSaved: (cliente: Cliente, mode: 'create' | 'edit') => void;
    onCancelEdit?: () => void;
}

const initialClienteForm: ClienteFormData = {
    documento: '',
    nombreCompleto: '',
    email: '',
    telefono: '',
    activo: true,
};

export default function ClienteForm({
                                        cliente,
                                        onSaved,
                                        onCancelEdit,
                                    }: ClienteFormProps) {
    const [formData, setFormData] = useState<ClienteFormData>(initialClienteForm);
    const [errors, setErrors] = useState<ClienteFormErrors>({});
    const [saving, setSaving] = useState(false);
    const [apiError, setApiError] = useState('');

    const isEditing = cliente != null;

    // Sincroniza el formulario cuando cambia el cliente a editar (no hace HTTP)
    useEffect(() => {
        if (cliente) {
            setFormData({
                documento: cliente.documento,
                nombreCompleto: cliente.nombreCompleto,
                // null del backend -> '' para que el input siga siendo controlado
                email: cliente.email ?? '',
                telefono: cliente.telefono ?? '',
                activo: cliente.activo,
            });
        } else {
            setFormData(initialClienteForm);
        }
        setErrors({});
        setApiError('');
    }, [cliente]);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setApiError('');

        const validationErrors = validarCliente(formData);
        setErrors(validationErrors);
        if (Object.keys(validationErrors).length > 0) return;

        // Campos opcionales vacios viajan como null (columna NULL en PostgreSQL)
        const payload: ClienteCreateRequest = {
            documento: formData.documento.trim(),
            nombreCompleto: formData.nombreCompleto.trim(),
            email: formData.email.trim() ? formData.email.trim().toLowerCase() : null,
            telefono: formData.telefono.trim() || null,
            activo: formData.activo,
        };

        try {
            setSaving(true);

            if (cliente) {
                const actualizado = await clienteService.actualizar(cliente.id, payload);
                onSaved(actualizado, 'edit');
            } else {
                const creado = await clienteService.crear(payload);
                onSaved(creado, 'create');
                setFormData(initialClienteForm);
            }
        } catch (err) {
            setApiError(err instanceof Error ? err.message : 'No se pudo guardar');
        } finally {
            setSaving(false);
        }
    };

    return (
        <form className="entity-form" onSubmit={handleSubmit} noValidate>
            <h2>{isEditing ? `Editar cliente #${cliente.id}` : 'Nuevo cliente'}</h2>

            <div className="form-grid">
                <label>
                    Documento
                    <input name="documento" value={formData.documento} onChange={handleChange} />
                    {errors.documento && <small className="field-error">{errors.documento}</small>}
                </label>

                <label>
                    Nombre completo
                    <input name="nombreCompleto" value={formData.nombreCompleto} onChange={handleChange} />
                    {errors.nombreCompleto && <small className="field-error">{errors.nombreCompleto}</small>}
                </label>

                <label>
                    Email (opcional)
                    <input type="email" name="email" value={formData.email} onChange={handleChange} />
                    {errors.email && <small className="field-error">{errors.email}</small>}
                </label>

                <label>
                    Telefono (opcional)
                    <input name="telefono" value={formData.telefono} onChange={handleChange} />
                    {errors.telefono && <small className="field-error">{errors.telefono}</small>}
                </label>

                <label className="checkbox-field form-span-2">
                    <input type="checkbox" name="activo" checked={formData.activo} onChange={handleChange} />
                    Cliente activo
                </label>
            </div>

            {apiError && <div className="form-error">{apiError}</div>}

            <div className="form-actions">
                {isEditing && (
                    <Button variant="secondary" onClick={onCancelEdit} disabled={saving}>
                        Cancelar edicion
                    </Button>
                )}
                <Button type="submit" loading={saving}>
                    {isEditing ? 'Actualizar cliente' : 'Crear cliente'}
                </Button>
            </div>
        </form>
    );
}
