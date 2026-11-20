// Contrato de ServicioCatalogoResponse (backend) / tabla autocare.servicio_catalogo
export interface ServicioCatalogo {
    id: number;
    codigo: string;
    nombre: string;
    descripcion: string | null;
    precioBase: number;
    activo: boolean;
}
