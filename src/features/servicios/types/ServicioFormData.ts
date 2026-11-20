// Lo que el usuario escribe: el precio llega del input como texto
export interface ServicioFormData {
    codigo: string;
    nombre: string;
    descripcion: string;
    precioBase: string;
    activo: boolean;
}

// Lo que viaja al backend en POST/PUT (ServicioCatalogoRequest de Spring)
export interface ServicioRequest {
    codigo: string;
    nombre: string;
    descripcion: string | null;
    precioBase: number;
    activo: boolean;
}
