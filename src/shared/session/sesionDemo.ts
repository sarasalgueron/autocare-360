/**
 * Sesión DEMO (sin login todavía, RF-01 pendiente).
 * Guarda el id del usuario interno elegido en el selector del encabezado y lo expone a
 * apiClient, que lo envía como X-Usuario-Id. Cuando exista login, este módulo se reemplaza
 * por el token de autenticación y el resto del frontend no cambia.
 */
const STORAGE_KEY = 'autocare360.usuarioDemoId';
export const USUARIO_DEMO_POR_DEFECTO = 2; // asesor.demo (docs/sql/datos-demo-usuarios.sql)

function leerInicial(): number {
    try {
        const valor = Number(window.localStorage.getItem(STORAGE_KEY));
        return Number.isInteger(valor) && valor > 0 ? valor : USUARIO_DEMO_POR_DEFECTO;
    } catch {
        // localStorage puede no estar disponible (modo privado, tests): se usa el valor por defecto
        return USUARIO_DEMO_POR_DEFECTO;
    }
}

let usuarioActualId = leerInicial();

export function getUsuarioActualId(): number {
    return usuarioActualId;
}

export function setUsuarioActualId(id: number): void {
    usuarioActualId = id;
    try {
        window.localStorage.setItem(STORAGE_KEY, String(id));
    } catch {
        // sin persistencia: el cambio dura hasta recargar la página
    }
}
