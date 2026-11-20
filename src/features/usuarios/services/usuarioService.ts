import { apiFetch } from '../../../api/apiClient';
import type { Usuario } from '../models/Usuario';

export const usuarioService = {
    listar(signal?: AbortSignal): Promise<Usuario[]> {
        return apiFetch<Usuario[]>('/usuarios', { signal });
    },
};
