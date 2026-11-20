import { createContext, useContext } from 'react';
import type { Usuario } from '../features/usuarios/models/Usuario';

export interface SesionDemo {
    usuarios: Usuario[];
    usuarioActual: Usuario | null;
    cambiarUsuario: (id: number) => void;
}

export const SesionDemoContext = createContext<SesionDemo | null>(null);

// Context: evita pasar el usuario actual por props a través de todo el árbol (prop drilling)
export function useSesionDemo(): SesionDemo {
    const sesion = useContext(SesionDemoContext);
    if (!sesion) {
        throw new Error('useSesionDemo debe usarse dentro de SesionDemoProvider');
    }
    return sesion;
}
