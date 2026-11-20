import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Button } from '../../../components/ui/Button';
import type { Cliente } from '../../clientes/models/Cliente';
import type { Vehiculo } from '../../vehiculos/models/Vehiculo';
import type { OrdenServicio } from '../models/OrdenServicio';
import { ordenService } from '../services/ordenService';
import type { AbrirOrdenFormData, AbrirOrdenRequest } from '../types/OrdenRequests';
import { validarAbrirOrden, type AbrirOrdenErrors } from '../utils/ordenValidation';

interface AbrirOrdenFormProps {
    vehiculos: Vehiculo[];
    clientesById: Map<number, Cliente>;
    // RN-03: vehículos que ya tienen una orden activa (no se pueden elegir)
    vehiculosConOrdenActiva: Set<number>;
    puedeAbrir: boolean;
    onOpened: (orden: OrdenServicio) => void;
}

const initialForm: AbrirOrdenFormData = {
    vehiculoId: '',
    kilometrajeEntrada: '',
    observacionesEntrada: '',
};

export default function AbrirOrdenForm({
                                           vehiculos,
                                           clientesById,
                                           vehiculosConOrdenActiva,
                                           puedeAbrir,
                                           onOpened,
                                       }: AbrirOrdenFormProps) {
    const [formData, setFormData] = useState<AbrirOrdenFormData>(initialForm);
    const [errors, setErrors] = useState<AbrirOrdenErrors>({});
    const [saving, setSaving] = useState(false);
    const [apiError, setApiError] = useState('');

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setApiError('');

        const validationErrors = validarAbrirOrden(formData);
        setErrors(validationErrors);
        if (Object.keys(validationErrors).length > 0) return;

        const payload: AbrirOrdenRequest = {
            vehiculoId: Number(formData.vehiculoId),
            kilometrajeEntrada: Number(formData.kilometrajeEntrada),
            observacionesEntrada: formData.observacionesEntrada.trim(),
        };

        try {
            setSaving(true);
            const orden = await ordenService.abrir(payload);
            onOpened(orden);
            setFormData(initialForm);
        } catch (err) {
            // 409 RN-03, 403 si el usuario demo no es asesor, etc.
            setApiError(err instanceof Error ? err.message : 'No se pudo abrir la orden');
        } finally {
            setSaving(false);
        }
    };

    const vehiculosActivos = vehiculos.filter((v) => v.activo);

    return (
        <form className="entity-form" onSubmit={handleSubmit} noValidate>
            <h2>Recepcion de vehiculo (abrir orden)</h2>

            {!puedeAbrir && (
                <div className="state-card">
                    Solo un asesor o administrador puede abrir ordenes. Cambia el usuario demo en el encabezado.
                </div>
            )}

            <div className="form-grid">
                <label>
                    Vehiculo
                    <select name="vehiculoId" value={formData.vehiculoId} onChange={handleChange}>
                        <option value="">Seleccione un vehiculo</option>
                        {vehiculosActivos.map((vehiculo) => {
                            const propietario = clientesById.get(vehiculo.clienteId);
                            const ocupado = vehiculosConOrdenActiva.has(vehiculo.id);
                            return (
                                <option key={vehiculo.id} value={String(vehiculo.id)} disabled={ocupado}>
                                    {vehiculo.placa} - {vehiculo.marca} {vehiculo.modelo}
                                    {propietario ? ` (${propietario.nombreCompleto})` : ''}
                                    {ocupado ? ' — ya tiene orden activa' : ''}
                                </option>
                            );
                        })}
                    </select>
                    {errors.vehiculoId && <small className="field-error">{errors.vehiculoId}</small>}
                </label>

                <label>
                    Kilometraje de entrada
                    <input
                        name="kilometrajeEntrada"
                        inputMode="numeric"
                        value={formData.kilometrajeEntrada}
                        onChange={handleChange}
                    />
                    {errors.kilometrajeEntrada && <small className="field-error">{errors.kilometrajeEntrada}</small>}
                </label>

                <label className="form-span-2">
                    Observaciones de recepcion
                    <textarea
                        name="observacionesEntrada"
                        rows={3}
                        value={formData.observacionesEntrada}
                        onChange={handleChange}
                        placeholder="Motivo de ingreso, danos visibles, pedido del cliente..."
                    />
                    {errors.observacionesEntrada && (
                        <small className="field-error">{errors.observacionesEntrada}</small>
                    )}
                </label>
            </div>

            {apiError && <div className="form-error">{apiError}</div>}

            <div className="form-actions">
                <Button type="submit" loading={saving} disabled={!puedeAbrir}>
                    Abrir orden
                </Button>
            </div>
        </form>
    );
}
