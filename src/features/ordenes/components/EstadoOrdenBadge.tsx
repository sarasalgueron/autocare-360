import { ESTADO_LABEL, type EstadoOrden } from '../models/OrdenServicio';

// Color por estado + texto: no depende solo del color (accesibilidad)
export function EstadoOrdenBadge({ estado }: { estado: EstadoOrden }) {
    return (
        <span className={`badge estado estado--${estado.toLowerCase()}`}>
            {ESTADO_LABEL[estado]}
        </span>
    );
}
