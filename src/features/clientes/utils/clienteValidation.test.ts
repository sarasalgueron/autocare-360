import { describe, expect, it } from 'vitest';
import type { ClienteFormData } from '../types/ClienteFormData';
import { validarCliente } from './clienteValidation';

const valido: ClienteFormData = {
    documento: '7845123',
    nombreCompleto: 'Ana Rojas',
    email: '',
    telefono: '',
    activo: true,
};

describe('validarCliente', () => {
    it('acepta un cliente valido con email y telefono vacios (son opcionales)', () => {
        expect(validarCliente(valido)).toEqual({});
    });

    it('exige documento y nombre completo', () => {
        const errors = validarCliente({ ...valido, documento: '  ', nombreCompleto: '' });
        expect(errors.documento).toBeDefined();
        expect(errors.nombreCompleto).toBeDefined();
    });

    it('valida el formato del email solo si se escribio', () => {
        expect(validarCliente({ ...valido, email: 'no-es-email' }).email).toBeDefined();
        expect(validarCliente({ ...valido, email: 'ana@correo.com' }).email).toBeUndefined();
    });
});
