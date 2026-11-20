const precioFormatter = new Intl.NumberFormat('es', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

const fechaHoraFormatter = new Intl.DateTimeFormat('es', {
    dateStyle: 'short',
    timeStyle: 'short',
});

// Solo presentación: el valor que viaja a la API sigue siendo number
export function formatPrecio(valor: number): string {
    return precioFormatter.format(valor);
}

// Las fechas llegan del backend como texto ISO 8601 con zona (OffsetDateTime)
export function formatFechaHora(iso: string | null): string {
    return iso ? fechaHoraFormatter.format(new Date(iso)) : '—';
}

export function formatKilometraje(km: number | null): string {
    return km === null ? '—' : `${km.toLocaleString('es')} km`;
}
