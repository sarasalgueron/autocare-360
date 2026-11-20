import { describe, expect, it } from 'vitest';
import type { ServicioFormData } from '../types/ServicioFormData';
import { validarServicio } from './servicioValidation';

const valido: ServicioFormData = {
    codigo: 'SERV-MANT-01',
    nombre: 'Cambio de aceite',
    descripcion: '',
    precioBase: '150.50',
    activo: true,
};

describe('validarServicio', () => {
    it('acepta un servicio valido con descripcion vacia', () => {
        expect(validarServicio(valido)).toEqual({});
    });

    it('acepta precio entero y precio cero', () => {
        expect(validarServicio({ ...valido, precioBase: '150' }).precioBase).toBeUndefined();
        expect(validarServicio({ ...valido, precioBase: '0' }).precioBase).toBeUndefined();
    });

    it('rechaza precio negativo, con 3 decimales o no numerico', () => {
        expect(validarServicio({ ...valido, precioBase: '-5' }).precioBase).toBeDefined();
        expect(validarServicio({ ...valido, precioBase: '1.999' }).precioBase).toBeDefined();
        expect(validarServicio({ ...valido, precioBase: 'abc' }).precioBase).toBeDefined();
    });

    it('exige codigo y nombre', () => {
        const errors = validarServicio({ ...valido, codigo: ' ', nombre: '' });
        expect(errors.codigo).toBeDefined();
        expect(errors.nombre).toBeDefined();
    });
});
