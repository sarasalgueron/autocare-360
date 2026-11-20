import type { Vehiculo } from '../models/Vehiculo';

export const vehiculosMock: Vehiculo[] = [
    { id: 1, clienteId: 1, placa: '4567-ABC', vin: '1HGCM82633A004352', marca: 'Toyota', modelo: 'Corolla', color: 'Blanco', activo: true },
    { id: 2, clienteId: 1, placa: '2389-XYZ', vin: 'JS3TD62V1Y4100001', marca: 'Suzuki', modelo: 'Vitara', color: 'Gris', activo: true },
    { id: 3, clienteId: 2, placa: '7791-KLM', vin: '3N1CP5CU0KL500002', marca: 'Nissan', modelo: 'Kicks', color: null, activo: true },
    { id: 4, clienteId: 4, placa: '1045-QRS', vin: 'KNDPB3AC1F7700003', marca: 'Kia', modelo: 'Sportage', color: 'Negro', activo: false },
];
