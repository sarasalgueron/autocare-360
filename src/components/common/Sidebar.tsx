import { NavLink } from 'react-router';

const menuItems = [
    { to: '/', label: 'Inicio', end: true },
    { to: '/ordenes', label: 'Órdenes' },
    { to: '/clientes', label: 'Clientes' },
    { to: '/vehiculos', label: 'Vehículos' },
    { to: '/servicios', label: 'Servicios' },
];

export default function Sidebar() {
    return (
        <aside className="sidebar">
            <div className="sidebar__brand">
                <span className="sidebar__brand-mark">A</span>
                <div>
                    <strong>AutoCare360</strong>
                    <small>Administración</small>
                </div>
            </div>

            <nav className="sidebar__nav" aria-label="Navegación principal">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        className={({ isActive }) =>
                            `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
                        }
                    >
                        {item.label}
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
}
