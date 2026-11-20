import { useAsyncList } from '../../../shared/hooks/useAsyncList';
import type { Usuario } from '../models/Usuario';
import { usuarioService } from '../services/usuarioService';

export function useUsuarios() {
    return useAsyncList<Usuario>(usuarioService.listar);
}
