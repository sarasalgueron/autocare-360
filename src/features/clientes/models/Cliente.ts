// Contrato de ClienteResponse (backend) / tabla autocare.cliente
export interface Cliente {
    id: number;
    documento: string;
    nombreCompleto: string;
    email: string | null;
    telefono: string | null;
    activo: boolean;
}
