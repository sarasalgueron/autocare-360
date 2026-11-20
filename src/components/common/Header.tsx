import { useSesionDemo } from '../../app/sesionDemoContext';

export default function Header() {
    const { usuarios, usuarioActual, cambiarUsuario } = useSesionDemo();

    return (
        <header className="topbar">
            <div>
                <p className="topbar__eyebrow">Frontend administrativo</p>
                <h1>AutoCare360</h1>
            </div>

            {/* Selector temporal mientras no exista login (RF-01) */}
            <label className="field topbar__usuario">
                <span className="field__label">Usuario (demo)</span>
                <select
                    value={usuarioActual ? String(usuarioActual.id) : ''}
                    onChange={(e) => cambiarUsuario(Number(e.target.value))}
                >
                    {!usuarioActual && <option value="">Sin usuarios demo</option>}
                    {usuarios.map((usuario) => (
                        <option key={usuario.id} value={String(usuario.id)}>
                            {usuario.nombreCompleto} ({usuario.roles.join(', ')})
                        </option>
                    ))}
                </select>
            </label>
        </header>
    );
}
