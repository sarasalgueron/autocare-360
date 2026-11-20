import type { ServicioFormData } from '../types/ServicioFormData';

export type ServicioFormErrors = Partial<Record<keyof ServicioFormData, string>>;

// NUMERIC(12,2): hasta 10 enteros y 2 decimales, sin signo negativo
const PRECIO_REGEX = /^\d{1,10}(\.\d{1,2})?$/;

export function validarServicio(data: ServicioFormData): ServicioFormErrors {
    const errors: ServicioFormErrors = {};

    if (!data.codigo.trim()) {
        errors.codigo = 'El codigo es obligatorio.';
    } else if (data.codigo.trim().length > 40) {
        errors.codigo = 'El codigo no puede superar 40 caracteres.';
    }

    if (!data.nombre.trim()) {
        errors.nombre = 'El nombre es obligatorio.';
    } else if (data.nombre.trim().length > 120) {
        errors.nombre = 'El nombre no puede superar 120 caracteres.';
    }

    const precio = data.precioBase.trim();
    if (!precio) {
        errors.precioBase = 'El precio base es obligatorio.';
    } else if (!PRECIO_REGEX.test(precio)) {
        errors.precioBase = 'Ingrese un precio valido (no negativo, maximo 2 decimales).';
    }

    return errors;
}
