import { useState, type ReactNode } from 'react';
import { useUsuarios } from '../features/usuarios/hooks/useUsuarios';
import { getUsuarioActualId, setUsuarioActualId } from '../shared/session/sesionDemo';
import { SesionDemoContext } from './sesionDemoContext';

export function SesionDemoProvider({ children }: { children: ReactNode }) {
    const { data: usuarios } = useUsuarios();
    const [usuarioId, setUsuarioId] = useState(getUsuarioActualId);

    const cambiarUsuario = (id: number) => {
        setUsuarioActualId(id); // lo que leerá apiClient en la próxima petición
        setUsuarioId(id);       // lo que re-renderiza la UI
    };

    // Dato derivado: el objeto Usuario se busca en la lista, no se duplica en estado
    const usuarioActual = usuarios.find((u) => u.id === usuarioId) ?? null;

    return (
        <SesionDemoContext.Provider value={{ usuarios, usuarioActual, cambiarUsuario }}>
            {children}
        </SesionDemoContext.Provider>
    );
}
