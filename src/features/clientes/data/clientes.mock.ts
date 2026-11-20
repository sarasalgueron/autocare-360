import type { Cliente } from '../models/Cliente';

export const clientesMock: Cliente[] = [
    { id: 1, documento: '7845123', nombreCompleto: 'Ana Rojas', email: 'ana.rojas@correo.com', telefono: '70010001', activo: true },
    { id: 2, documento: '6589421', nombreCompleto: 'Carlos Mendez', email: 'carlos.mendez@correo.com', telefono: '70010002', activo: true },
    { id: 3, documento: '9123476', nombreCompleto: 'Lucia Vargas', email: null, telefono: '70010003', activo: false },
    { id: 4, documento: '7345892', nombreCompleto: 'Diego Suarez', email: 'diego.suarez@correo.com', telefono: null, activo: true },
];
