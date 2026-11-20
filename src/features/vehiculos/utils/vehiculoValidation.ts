import type { Cliente } from '../../clientes/models/Cliente';
import type { VehiculoFormData } from '../types/VehiculoFormData';

export type VehiculoFormErrors = Partial<Record<keyof VehiculoFormData, string>>;

// Longitudes segun el DDL de autocare.vehiculo; el backend sigue siendo la autoridad final
export function validarVehiculo(
    data: VehiculoFormData,
    clientes: Cliente[],
): VehiculoFormErrors {
    const errors: VehiculoFormErrors = {};

    if (!data.placa.trim()) {
        errors.placa = 'La placa es obligatoria.';
    } else if (data.placa.trim().length > 20) {
        errors.placa = 'La placa no puede superar 20 caracteres.';
    }

    if (!data.vin.trim()) {
        errors.vin = 'El VIN es obligatorio.';
    } else if (data.vin.trim().length > 30) {
        errors.vin = 'El VIN no puede superar 30 caracteres.';
    }

    if (!data.marca.trim()) errors.marca = 'La marca es obligatoria.';
    if (!data.modelo.trim()) errors.modelo = 'El modelo es obligatorio.';

    // RN-01: el propietario debe existir y estar activo
    const clienteId = Number(data.clienteId);
    const clienteValido = clientes.some(
        (cliente) => cliente.id === clienteId && cliente.activo,
    );

    if (!data.clienteId) {
        errors.clienteId = 'Debe seleccionar un cliente.';
    } else if (!clienteValido) {
        errors.clienteId = 'Seleccione un cliente valido y activo.';
    }

    return errors;
}
