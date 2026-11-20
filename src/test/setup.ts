import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
// Agrega matchers como toBeInTheDocument() y toBeDisabled()
import '@testing-library/jest-dom/vitest';

// Desmonta lo renderizado en cada test para que no se mezclen entre sí
afterEach(() => {
    cleanup();
});
