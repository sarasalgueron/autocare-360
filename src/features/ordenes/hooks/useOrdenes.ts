import { useAsyncList } from '../../../shared/hooks/useAsyncList';
import type { OrdenServicio } from '../models/OrdenServicio';
import { ordenService } from '../services/ordenService';

export function useOrdenes() {
    return useAsyncList<OrdenServicio>(ordenService.listar);
}
