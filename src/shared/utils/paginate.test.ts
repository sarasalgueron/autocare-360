import { describe, expect, it } from 'vitest';
import { paginate } from './paginate';

const numeros = Array.from({ length: 12 }, (_, i) => i + 1); // [1..12]

describe('paginate', () => {
    it('devuelve los elementos de la pagina pedida', () => {
        const result = paginate(numeros, 2, 5);
        expect(result.items).toEqual([6, 7, 8, 9, 10]);
        expect(result.totalPages).toBe(3);
    });

    it('la ultima pagina puede tener menos elementos', () => {
        expect(paginate(numeros, 3, 5).items).toEqual([11, 12]);
    });

    it('ajusta una pagina fuera de rango a la ultima valida', () => {
        // Caso real: se elimino el unico registro de la ultima pagina
        const result = paginate(numeros, 9, 5);
        expect(result.page).toBe(3);
        expect(result.items).toEqual([11, 12]);
    });

    it('una lista vacia tiene 1 pagina y ningun elemento', () => {
        expect(paginate([], 1, 10)).toEqual({ items: [], page: 1, totalPages: 1 });
    });
});
