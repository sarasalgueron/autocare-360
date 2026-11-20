import { describe, expect, it } from 'vitest';
import type { Cliente } from '../models/Cliente';
import { matchesCliente } from './clienteFilters';

const ana: Cliente = {
    id: 1,
    documento: '7845123',
    nombreCompleto: 'Ana Rojas',
    email: 'ana.rojas@correo.com',
    telefono: null,
    activo: true,
};
const lucia: Cliente = { ...ana, id: 2, documento: '9123476', nombreCompleto: 'Lucia Vargas', email: null, activo: false };

describe('matchesCliente', () => {
    it('busca sin distinguir mayusculas y por cualquier campo (OR)', () => {
        expect(matchesCliente(ana, 'ANA', 'all')).toBe(true);
        expect(matchesCliente(ana, '7845', 'all')).toBe(true);
        expect(matchesCliente(ana, 'correo.com', 'all')).toBe(true);
        expect(matchesCliente(ana, 'pedro', 'all')).toBe(false);
    });

    it('combina busqueda y estado con AND', () => {
        expect(matchesCliente(lucia, 'lucia', 'active')).toBe(false);
        expect(matchesCliente(lucia, 'lucia', 'inactive')).toBe(true);
    });

    it('tolera email null sin romper la busqueda', () => {
        expect(matchesCliente(lucia, '@', 'all')).toBe(false);
    });
});
