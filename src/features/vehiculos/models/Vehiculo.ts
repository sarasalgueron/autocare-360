// Contrato de VehiculoResponse (backend) / tabla autocare.vehiculo
export interface Vehiculo {
    id: number;
    clienteId: number;
    placa: string;
    vin: string;
    marca: string;
    modelo: string;
    color: string | null;
    activo: boolean;
}
