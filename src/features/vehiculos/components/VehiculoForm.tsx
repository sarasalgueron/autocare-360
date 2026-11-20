import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Button } from '../../../components/ui/Button';
import type { Cliente } from '../../clientes/models/Cliente';
import type { Vehiculo } from '../models/Vehiculo';
import { vehiculoService } from '../services/vehiculoService';
import type { VehiculoFormData, VehiculoRequest } from '../types/VehiculoFormData';
import { validarVehiculo, type VehiculoFormErrors } from '../utils/vehiculoValidation';

const initialVehiculoForm: VehiculoFormData = {
    placa: '',
    vin: '',
    marca: '',
    modelo: '',
    color: '',
    clienteId: '',
    activo: true,
};

interface VehiculoFormProps {
    clientes: Cliente[];
    vehiculo?: Vehiculo | null;
    onSaved: (vehiculo: Vehiculo, mode: 'create' | 'edit') => void;
    onCancelEdit?: () => void;
}

export default function VehiculoForm({
                                         clientes,
                                         vehiculo,
                                         onSaved,
                                         onCancelEdit,
                                     }: VehiculoFormProps) {
    const [formData, setFormData] = useState<VehiculoFormData>(initialVehiculoForm);
    const [errors, setErrors] = useState<VehiculoFormErrors>({});
    const [saving, setSaving] = useState(false);
    const [apiError, setApiError] = useState('');

    const isEditing = vehiculo != null;

    // Precarga en modo editar: clienteId vuelve a string y color null a '' para los inputs
    useEffect(() => {
        if (vehiculo) {
            setFormData({
                placa: vehiculo.placa,
                vin: vehiculo.vin,
                marca: vehiculo.marca,
                modelo: vehiculo.modelo,
                color: vehiculo.color ?? '',
                clienteId: String(vehiculo.clienteId),
                activo: vehiculo.activo,
            });
        } else {
            setFormData(initialVehiculoForm);
        }
        setErrors({});
        setApiError('');
    }, [vehiculo]);

    const handleChange = (
        e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
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

        const validationErrors = validarVehiculo(formData, clientes);
        setErrors(validationErrors);
        if (Object.keys(validationErrors).length > 0) return;

        // Se convierte clienteId a number solo despues de validar
        const payload: VehiculoRequest = {
            clienteId: Number(formData.clienteId),
            placa: formData.placa.trim().toUpperCase(),
            vin: formData.vin.trim().toUpperCase(),
            marca: formData.marca.trim(),
            modelo: formData.modelo.trim(),
            color: formData.color.trim() || null,
            activo: formData.activo,
        };

        try {
            setSaving(true);

            if (vehiculo) {
                const actualizado = await vehiculoService.actualizar(vehiculo.id, payload);
                onSaved(actualizado, 'edit');
            } else {
                const creado = await vehiculoService.crear(payload);
                onSaved(creado, 'create');
                setFormData(initialVehiculoForm);
            }
        } catch (err) {
            setApiError(err instanceof Error ? err.message : 'No se pudo guardar');
        } finally {
            setSaving(false);
        }
    };

    return (
        <form className="entity-form" onSubmit={handleSubmit} noValidate>
            <h2>{isEditing ? `Editar vehiculo ${vehiculo.placa}` : 'Nuevo vehiculo'}</h2>

            <div className="form-grid">
                <label>
                    Placa
                    <input name="placa" value={formData.placa} onChange={handleChange} />
                    {errors.placa && <small className="field-error">{errors.placa}</small>}
                </label>

                <label>
                    VIN
                    <input name="vin" value={formData.vin} onChange={handleChange} />
                    {errors.vin && <small className="field-error">{errors.vin}</small>}
                </label>

                <label>
                    Marca
                    <input name="marca" value={formData.marca} onChange={handleChange} />
                    {errors.marca && <small className="field-error">{errors.marca}</small>}
                </label>

                <label>
                    Modelo
                    <input name="modelo" value={formData.modelo} onChange={handleChange} />
                    {errors.modelo && <small className="field-error">{errors.modelo}</small>}
                </label>

                <label>
                    Color (opcional)
                    <input name="color" value={formData.color} onChange={handleChange} />
                    {errors.color && <small className="field-error">{errors.color}</small>}
                </label>

                <label>
                    Propietario
                    <select name="clienteId" value={formData.clienteId} onChange={handleChange}>
                        <option value="">Seleccione un cliente</option>
                        {clientes
                            .filter((cliente) => cliente.activo)
                            .map((cliente) => (
                                <option key={cliente.id} value={String(cliente.id)}>
                                    {cliente.nombreCompleto} - {cliente.documento}
                                </option>
                            ))}
                    </select>
                    {errors.clienteId && <small className="field-error">{errors.clienteId}</small>}
                </label>

                <label className="checkbox-field form-span-2">
                    <input type="checkbox" name="activo" checked={formData.activo} onChange={handleChange} />
                    Vehiculo activo
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
                    {isEditing ? 'Actualizar vehiculo' : 'Crear vehiculo'}
                </Button>
            </div>
        </form>
    );
}
