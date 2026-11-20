import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Pagination } from './Pagination';

describe('Pagination', () => {
    it('solicita la pagina siguiente', async () => {
        const user = userEvent.setup();
        const onPageChange = vi.fn();

        render(<Pagination page={1} totalPages={3} onPageChange={onPageChange} />);
        await user.click(screen.getByRole('button', { name: /siguiente/i }));

        expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it('deshabilita Anterior en la primera pagina y Siguiente en la ultima', () => {
        const { rerender } = render(<Pagination page={1} totalPages={3} onPageChange={vi.fn()} />);
        expect(screen.getByRole('button', { name: /anterior/i })).toBeDisabled();

        rerender(<Pagination page={3} totalPages={3} onPageChange={vi.fn()} />);
        expect(screen.getByRole('button', { name: /siguiente/i })).toBeDisabled();
    });
});
