import { useAsyncList } from '../../../shared/hooks/useAsyncList';
import type { Cliente } from '../models/Cliente';
import { clienteService } from '../services/clienteService';

// Hook de dominio: expresa la intención; las rutas HTTP siguen viviendo solo en clienteService
export function useClientes() {
    return useAsyncList<Cliente>(clienteService.listar);
}
