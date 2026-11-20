import { Route, Routes } from 'react-router';
import MainLayout from '../layouts/MainLayout';
import DashboardPage from '../pages/DashboardPage';
import NotFoundPage from '../pages/NotFoundPage';
import ClientesPage from '../features/clientes/pages/ClientesPage';
import VehiculosPage from '../features/vehiculos/pages/VehiculosPage';
import ServiciosPage from '../features/servicios/pages/ServiciosPage';
import OrdenesPage from '../features/ordenes/pages/OrdenesPage';

export default function AppRouter() {
    return (
        <Routes>
            <Route element={<MainLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="clientes" element={<ClientesPage />} />
                <Route path="vehiculos" element={<VehiculosPage />} />
                <Route path="servicios" element={<ServiciosPage />} />
                <Route path="ordenes" element={<OrdenesPage />} />
                <Route path="*" element={<NotFoundPage />} />
            </Route>
        </Routes>
    );
}
