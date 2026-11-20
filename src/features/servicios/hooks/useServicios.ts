import { useAsyncList } from '../../../shared/hooks/useAsyncList';
import type { ServicioCatalogo } from '../models/ServicioCatalogo';
import { servicioService } from '../services/servicioService';

export function useServicios() {
    return useAsyncList<ServicioCatalogo>(servicioService.listar);
}
