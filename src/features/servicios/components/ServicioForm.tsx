import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Button } from '../../../components/ui/Button';
import type { ServicioCatalogo } from '../models/ServicioCatalogo';
import { servicioService } from '../services/servicioService';
import type { ServicioFormData, ServicioRequest } from '../types/ServicioFormData';
import { validarServicio, type ServicioFormErrors } from '../utils/servicioValidation';

interface ServicioFormProps {
    servicio?: ServicioCatalogo | null;
    onSaved: (servicio: ServicioCatalogo, mode: 'create' | 'edit') => void;
    onCancelEdit?: () => void;
}

const initialServicioForm: ServicioFormData = {
    codigo: '',
    nombre: '',
    descripcion: '',
    precioBase: '',
    activo: true,
};

export default function ServicioForm({ servicio, onSaved, onCancelEdit }: ServicioFormProps) {
    const [formData, setFormData] = useState<ServicioFormData>(initialServicioForm);
    const [errors, setErrors] = useState<ServicioFormErrors>({});
    const [saving, setSaving] = useState(false);
    const [apiError, setApiError] = useState('');

    const isEditing = servicio != null;

    // Precarga en modo editar: number -> string y null -> '' para los inputs controlados
    useEffect(() => {
        if (servicio) {
            setFormData({
                codigo: servicio.codigo,
                nombre: servicio.nombre,
                descripcion: servicio.descripcion ?? '',
                precioBase: servicio.precioBase.toFixed(2),
                activo: servicio.activo,
            });
        } else {
            setFormData(initialServicioForm);
        }
        setErrors({});
        setApiError('');
    }, [servicio]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        if (e.target instanceof HTMLInputElement && e.target.type === 'checkbox') {
            const { checked } = e.target;
            setFormData((prev) => ({ ...prev, [name]: checked }));
            return;
        }

        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setApiError('');

        const validationErrors = validarServicio(formData);
        setErrors(validationErrors);
        if (Object.keys(validationErrors).length > 0) return;

        // El precio se convierte a number solo después de validar el formato
        const payload: ServicioRequest = {
            codigo: formData.codigo.trim().toUpperCase(),
            nombre: formData.nombre.trim(),
            descripcion: formData.descripcion.trim() || null,
            precioBase: Number(formData.precioBase),
            activo: formData.activo,
        };

        try {
            setSaving(true);

            if (servicio) {
                const actualizado = await servicioService.actualizar(servicio.id, payload);
                onSaved(actualizado, 'edit');
            } else {
                const creado = await servicioService.crear(payload);
                onSaved(creado, 'create');
                setFormData(initialServicioForm);
            }
        } catch (err) {
            setApiError(err instanceof Error ? err.message : 'No se pudo guardar');
        } finally {
            setSaving(false);
        }
    };

    return (
        <form className="entity-form" onSubmit={handleSubmit} noValidate>
            <h2>{isEditing ? `Editar servicio ${servicio.codigo}` : 'Nuevo servicio'}</h2>

            <div className="form-grid">
                <label>
                    Codigo
                    <input name="codigo" value={formData.codigo} onChange={handleChange} placeholder="SERV-MANT-01" />
                    {errors.codigo && <small className="field-error">{errors.codigo}</small>}
                </label>

                <label>
                    Nombre
                    <input name="nombre" value={formData.nombre} onChange={handleChange} />
                    {errors.nombre && <small className="field-error">{errors.nombre}</small>}
                </label>

                <label>
                    Precio base
                    <input
                        name="precioBase"
                        inputMode="decimal"
                        value={formData.precioBase}
                        onChange={handleChange}
                        placeholder="0.00"
                    />
                    {errors.precioBase && <small className="field-error">{errors.precioBase}</small>}
                </label>

                <label className="checkbox-field">
                    <input type="checkbox" name="activo" checked={formData.activo} onChange={handleChange} />
                    Servicio activo (disponible para nuevas ordenes)
                </label>

                <label className="form-span-2">
                    Descripcion (opcional)
                    <textarea name="descripcion" rows={3} value={formData.descripcion} onChange={handleChange} />
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
                    {isEditing ? 'Actualizar servicio' : 'Crear servicio'}
                </Button>
            </div>
        </form>
    );
}
