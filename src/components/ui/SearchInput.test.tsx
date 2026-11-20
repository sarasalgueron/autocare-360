import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SearchInput } from './SearchInput';

describe('SearchInput', () => {
    it('emite cada tecla escrita por el usuario', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();

        render(<SearchInput value="" onChange={onChange} />);
        await user.type(screen.getByRole('searchbox'), 'ana');

        // Es controlado y value no cambia en el test, así que cada evento trae una sola letra
        expect(onChange).toHaveBeenCalledTimes(3);
        expect(onChange).toHaveBeenLastCalledWith('a');
    });

    it('tiene una etiqueta visible y no depende solo del placeholder', () => {
        render(<SearchInput value="" onChange={vi.fn()} label="Buscar clientes" />);
        expect(screen.getByLabelText('Buscar clientes')).toBeInTheDocument();
    });
});
