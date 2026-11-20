import { describe, expect, it } from 'vitest';
import { validarAbrirOrden, validarCambioEstado, type CambioEstadoFormData } from './ordenValidation';

const vacio: CambioEstadoFormData = { motivo: '', kilometrajeSalida: '', observacionesSalida: '' };

describe('validarAbrirOrden', () => {
    it('acepta una recepcion completa', () => {
        expect(validarAbrirOrden({
            vehiculoId: '3',
            kilometrajeEntrada: '50000',
            observacionesEntrada: 'Ruido en frenos',
        })).toEqual({});
    });

    it('exige vehiculo, kilometraje entero y observaciones', () => {
        const errors = validarAbrirOrden({ vehiculoId: '', kilometrajeEntrada: '12.5', observacionesEntrada: ' ' });
        expect(errors.vehiculoId).toBeDefined();
        expect(errors.kilometrajeEntrada).toBeDefined();
        expect(errors.observacionesEntrada).toBeDefined();
    });
});

describe('validarCambioEstado', () => {
    it('una transicion comun no exige datos extra', () => {
        expect(validarCambioEstado('DIAGNOSTICO', vacio, 50000)).toEqual({});
    });

    it('cancelar exige motivo', () => {
        expect(validarCambioEstado('CANCELADA', vacio, 50000).motivo).toBeDefined();
        expect(validarCambioEstado('CANCELADA', { ...vacio, motivo: 'Cliente desistio' }, 50000)).toEqual({});
    });

    it('entregar exige km de salida >= km de entrada y observaciones (RN-07)', () => {
        const sinDatos = validarCambioEstado('ENTREGADA', vacio, 50000);
        expect(sinDatos.kilometrajeSalida).toBeDefined();
        expect(sinDatos.observacionesSalida).toBeDefined();

        const kmMenor = validarCambioEstado('ENTREGADA', { ...vacio, kilometrajeSalida: '49999', observacionesSalida: 'OK' }, 50000);
        expect(kmMenor.kilometrajeSalida).toBeDefined();

        const valido = validarCambioEstado('ENTREGADA', { ...vacio, kilometrajeSalida: '50050', observacionesSalida: 'OK' }, 50000);
        expect(valido).toEqual({});
    });
});
