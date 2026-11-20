import type { ClienteFormData } from '../types/ClienteFormData';

export type ClienteFormErrors = Partial<Record<keyof ClienteFormData, string>>;

// Reglas alineadas con ClienteRequest del backend; el backend sigue siendo la autoridad final
export function validarCliente(data: ClienteFormData): ClienteFormErrors {
    const errors: ClienteFormErrors = {};

    if (!data.documento.trim()) {
        errors.documento = 'El documento es obligatorio.';
    } else if (data.documento.trim().length > 40) {
        errors.documento = 'El documento no puede superar 40 caracteres.';
    }

    if (!data.nombreCompleto.trim()) {
        errors.nombreCompleto = 'El nombre completo es obligatorio.';
    } else if (data.nombreCompleto.trim().length > 160) {
        errors.nombreCompleto = 'El nombre no puede superar 160 caracteres.';
    }

    // email y telefono son opcionales: solo se valida el formato si se escribieron
    if (data.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
        errors.email = 'El email no tiene un formato valido.';
    }

    if (data.telefono.trim() && !/^[0-9+\- ]{7,40}$/.test(data.telefono.trim())) {
        errors.telefono = 'El telefono debe tener al menos 7 digitos.';
    }

    return errors;
}
