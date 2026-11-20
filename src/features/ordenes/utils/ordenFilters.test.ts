import { describe, expect, it } from 'vitest';
import type { Cliente } from '../../clientes/models/Cliente';
import type { Vehiculo } from '../../vehiculos/models/Vehiculo';
import type { EstadoOrden, OrdenServicio } from '../models/OrdenServicio';
import { contarPorEstado, matchesOrden } from './ordenFilters';

function orden(id: number, estado: EstadoOrden, vehiculoId = 1): OrdenServicio {
    return {
        id,
        numeroOrden: `OS-2026-000${id}`,
        vehiculoId,
        asesorId: 2,
        estado,
        kilometrajeEntrada: 1000,
        kilometrajeSalida: null,
        observacionesEntrada: 'x',
        observacionesSalida: null,
        fechaApertura: '2026-10-08T10:00:00Z',
        fechaEntrega: null,
        transicionesPermitidas: [],
    };
}

const vehiculos = new Map<number, Vehiculo>([[1, {
    id: 1, clienteId: 1, placa: '4567-ABC', vin: 'VIN1', marca: 'Toyota', modelo: 'Hilux', color: null, activo: true,
}]]);
const clientes = new Map<number, Cliente>([[1, {
    id: 1, documento: '1', nombreCompleto: 'Ana Rojas', email: null, telefono: null, activo: true,
}]]);

describe('ordenFilters', () => {
    it('cuenta las ordenes por estado', () => {
        const conteo = contarPorEstado([orden(1, 'ABIERTA'), orden(2, 'ABIERTA'), orden(3, 'ENTREGADA')]);
        expect(conteo.ABIERTA).toBe(2);
        expect(conteo.ENTREGADA).toBe(1);
        expect(conteo.EN_TRABAJO).toBe(0);
    });

    it('ACTIVAS excluye ENTREGADA y CANCELADA', () => {
        expect(matchesOrden(orden(1, 'EN_TRABAJO'), '', 'ACTIVAS', vehiculos, clientes)).toBe(true);
        expect(matchesOrden(orden(2, 'ENTREGADA'), '', 'ACTIVAS', vehiculos, clientes)).toBe(false);
        expect(matchesOrden(orden(3, 'CANCELADA'), '', 'ACTIVAS', vehiculos, clientes)).toBe(false);
    });

    it('busca por numero, placa o nombre del propietario', () => {
        expect(matchesOrden(orden(1, 'ABIERTA'), 'os-2026-0001', '', vehiculos, clientes)).toBe(true);
        expect(matchesOrden(orden(1, 'ABIERTA'), '4567', '', vehiculos, clientes)).toBe(true);
        expect(matchesOrden(orden(1, 'ABIERTA'), 'ana', '', vehiculos, clientes)).toBe(true);
        expect(matchesOrden(orden(1, 'ABIERTA'), 'pedro', '', vehiculos, clientes)).toBe(false);
    });
});
