import { useAsyncList } from '../../../shared/hooks/useAsyncList';
import type { Vehiculo } from '../models/Vehiculo';
import { vehiculoService } from '../services/vehiculoService';

export function useVehiculos() {
    return useAsyncList<Vehiculo>(vehiculoService.listar);
}
