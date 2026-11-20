// RN-02: mismos valores que el enum EstadoOrden del backend y el CHECK de PostgreSQL
export type EstadoOrden =
    | 'ABIERTA'
    | 'DIAGNOSTICO'
    | 'ESPERA_APROBACION'
    | 'EN_TRABAJO'
    | 'LISTA_ENTREGA'
    | 'ENTREGADA'
    | 'CANCELADA';

// Orden del flujo: se usa para los contadores por estado y los filtros
export const ESTADOS_ORDEN: EstadoOrden[] = [
    'ABIERTA',
    'DIAGNOSTICO',
    'ESPERA_APROBACION',
    'EN_TRABAJO',
    'LISTA_ENTREGA',
    'ENTREGADA',
    'CANCELADA',
];

export const ESTADO_LABEL: Record<EstadoOrden, string> = {
    ABIERTA: 'Abierta',
    DIAGNOSTICO: 'Diagnostico',
    ESPERA_APROBACION: 'Espera aprobacion',
    EN_TRABAJO: 'En trabajo',
    LISTA_ENTREGA: 'Lista para entrega',
    ENTREGADA: 'Entregada',
    CANCELADA: 'Cancelada',
};

export function esEstadoFinal(estado: EstadoOrden): boolean {
    return estado === 'ENTREGADA' || estado === 'CANCELADA';
}

// Contrato de OrdenServicioResponse (backend)
export interface OrdenServicio {
    id: number;
    numeroOrden: string;
    vehiculoId: number;
    asesorId: number;
    estado: EstadoOrden;
    kilometrajeEntrada: number;
    kilometrajeSalida: number | null;
    observacionesEntrada: string;
    observacionesSalida: string | null;
    fechaApertura: string;
    fechaEntrega: string | null;
    // El backend decide qué transiciones son válidas; la UI solo las muestra
    transicionesPermitidas: EstadoOrden[];
}

export interface HistorialEstado {
    id: number;
    estadoAnterior: EstadoOrden | null;
    estadoNuevo: EstadoOrden;
    cambiadoPorId: number;
    fechaCambio: string;
    motivo: string | null;
}
