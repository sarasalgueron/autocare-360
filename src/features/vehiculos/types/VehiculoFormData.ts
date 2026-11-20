// Lo que el usuario escribe: input/select entregan texto
export interface VehiculoFormData {
    placa: string;
    vin: string;
    marca: string;
    modelo: string;
    color: string;
    clienteId: string;
    activo: boolean;
}

// Lo que viaja al backend en POST/PUT (VehiculoRequest de Spring), ya validado y convertido
export interface VehiculoRequest {
    clienteId: number;
    placa: string;
    vin: string;
    marca: string;
    modelo: string;
    color: string | null;
    activo: boolean;
}
