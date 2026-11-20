export type RolCodigo = 'ADMINISTRADOR' | 'ASESOR' | 'TECNICO' | 'CLIENTE';

// Contrato de UsuarioResponse (backend). Nunca incluye password_hash.
export interface Usuario {
    id: number;
    username: string;
    nombreCompleto: string;
    activo: boolean;
    roles: RolCodigo[];
}

export function tieneAlgunRol(usuario: Usuario | null, ...roles: RolCodigo[]): boolean {
    return usuario !== null && roles.some((rol) => usuario.roles.includes(rol));
}
