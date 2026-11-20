import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '../../../components/ui/Button';
import { isAbortError } from '../../../shared/utils/isAbortError';
import { formatFechaHora, formatKilometraje } from '../../../shared/utils/format';
import type { Cliente } from '../../clientes/models/Cliente';
import type { Usuario } from '../../usuarios/models/Usuario';
import type { Vehiculo } from '../../vehiculos/models/Vehiculo';
import { ESTADO_LABEL, type EstadoOrden, type HistorialEstado, type OrdenServicio } from '../models/OrdenServicio';
import { ordenService } from '../services/ordenService';
import {
    validarCambioEstado,
    type CambioEstadoErrors,
    type CambioEstadoFormData,
} from '../utils/ordenValidation';
import { EstadoOrdenBadge } from './EstadoOrdenBadge';

interface OrdenDetalleProps {
    orden: OrdenServicio;
    vehiculo?: Vehiculo;
    propietario?: Cliente;
    usuariosById: Map<number, Usuario>;
    // Entregar o cancelar es decisión del asesor/administrador (el backend también lo verifica)
    puedeEntregarOCancelar: boolean;
    onEstadoCambiado: (orden: OrdenServicio) => void;
}

const formVacio: CambioEstadoFormData = { motivo: '', kilometrajeSalida: '', observacionesSalida: '' };

/**
 * Se monta con key={orden.id} desde la página: al abrir otra orden React crea una instancia
 * nueva y el estado local (destino elegido, formulario) arranca limpio sin un Effect de reseteo.
 */
export default function OrdenDetalle({
                                         orden,
                                         vehiculo,
                                         propietario,
                                         usuariosById,
                                         puedeEntregarOCancelar,
                                         onEstadoCambiado,
                                     }: OrdenDetalleProps) {
    const [historial, setHistorial] = useState<HistorialEstado[]>([]);
    const [loadingHistorial, setLoadingHistorial] = useState(true);
    const [historialError, setHistorialError] = useState('');

    const [destino, setDestino] = useState<EstadoOrden | null>(null);
    const [form, setForm] = useState<CambioEstadoFormData>(formVacio);
    const [errors, setErrors] = useState<CambioEstadoErrors>({});
    const [saving, setSaving] = useState(false);
    const [apiError, setApiError] = useState('');

    // RF-20: el historial depende de la orden y de su estado; si el estado cambia, se recarga.
    // AbortController cancela el request viejo e ignore evita aplicar una respuesta obsoleta.
    useEffect(() => {
        const controller = new AbortController();
        let ignore = false;

        const load = async () => {
            try {
                setLoadingHistorial(true);
                setHistorialError('');
                const data = await ordenService.historial(orden.id, controller.signal);
                if (!ignore) setHistorial(data);
            } catch (err) {
                if (!ignore && !isAbortError(err)) {
                    setHistorialError(err instanceof Error ? err.message : 'No se pudo cargar el historial');
                }
            } finally {
                if (!ignore) setLoadingHistorial(false);
            }
        };

        void load();
        return () => {
            ignore = true;
            controller.abort();
        };
    }, [orden.id, orden.estado]);

    const transiciones = orden.transicionesPermitidas.filter((estado) =>
        puedeEntregarOCancelar || (estado !== 'ENTREGADA' && estado !== 'CANCELADA'),
    );

    const elegirDestino = (estado: EstadoOrden) => {
        setDestino(estado);
        setForm(formVacio);
        setErrors({});
        setApiError('');
    };

    const confirmarCambio = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!destino) return;

        const validationErrors = validarCambioEstado(destino, form, orden.kilometrajeEntrada);
        setErrors(validationErrors);
        if (Object.keys(validationErrors).length > 0) return;

        try {
            setSaving(true);
            setApiError('');
            const actualizada = await ordenService.cambiarEstado(orden.id, {
                estado: destino,
                motivo: form.motivo.trim() || null,
                kilometrajeSalida: destino === 'ENTREGADA' ? Number(form.kilometrajeSalida) : null,
                observacionesSalida: destino === 'ENTREGADA' ? form.observacionesSalida.trim() : null,
            });
            setDestino(null);
            onEstadoCambiado(actualizada);
        } catch (err) {
            setApiError(err instanceof Error ? err.message : 'No se pudo cambiar el estado');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="orden-detalle">
            <dl className="detalle-grid">
                <div><dt>Estado</dt><dd><EstadoOrdenBadge estado={orden.estado} /></dd></div>
                <div><dt>Vehiculo</dt><dd>{vehiculo ? `${vehiculo.placa} - ${vehiculo.marca} ${vehiculo.modelo}` : `#${orden.vehiculoId}`}</dd></div>
                <div><dt>Propietario</dt><dd>{propietario?.nombreCompleto ?? '—'}</dd></div>
                <div><dt>Asesor</dt><dd>{usuariosById.get(orden.asesorId)?.nombreCompleto ?? `#${orden.asesorId}`}</dd></div>
                <div><dt>Apertura</dt><dd>{formatFechaHora(orden.fechaApertura)}</dd></div>
                <div><dt>Km entrada</dt><dd>{formatKilometraje(orden.kilometrajeEntrada)}</dd></div>
                <div className="detalle-grid__wide"><dt>Observaciones de recepcion</dt><dd>{orden.observacionesEntrada}</dd></div>
                {orden.estado === 'ENTREGADA' && (
                    <>
                        <div><dt>Entrega</dt><dd>{formatFechaHora(orden.fechaEntrega)}</dd></div>
                        <div><dt>Km salida</dt><dd>{formatKilometraje(orden.kilometrajeSalida)}</dd></div>
                        <div className="detalle-grid__wide"><dt>Observaciones de entrega</dt><dd>{orden.observacionesSalida}</dd></div>
                    </>
                )}
            </dl>

            <section>
                <h3>Mover la orden</h3>
                {transiciones.length === 0 ? (
                    <p className="texto-muted">
                        {orden.transicionesPermitidas.length === 0
                            ? 'La orden esta en un estado final.'
                            : 'Tu usuario no puede realizar las transiciones disponibles.'}
                    </p>
                ) : (
                    <div className="transiciones">
                        {transiciones.map((estado) => (
                            <Button
                                key={estado}
                                variant={estado === 'CANCELADA' ? 'danger' : destino === estado ? 'primary' : 'secondary'}
                                onClick={() => elegirDestino(estado)}
                            >
                                {ESTADO_LABEL[estado]}
                            </Button>
                        ))}
                    </div>
                )}

                {destino && (
                    <form className="cambio-estado" onSubmit={confirmarCambio} noValidate>
                        <p>
                            <strong>{ESTADO_LABEL[orden.estado]}</strong> → <strong>{ESTADO_LABEL[destino]}</strong>
                        </p>

                        {destino === 'ENTREGADA' && (
                            <div className="form-grid">
                                <label>
                                    Kilometraje de salida
                                    <input
                                        inputMode="numeric"
                                        value={form.kilometrajeSalida}
                                        onChange={(e) => setForm((prev) => ({ ...prev, kilometrajeSalida: e.target.value }))}
                                    />
                                    {errors.kilometrajeSalida && <small className="field-error">{errors.kilometrajeSalida}</small>}
                                </label>
                                <label className="form-span-2">
                                    Observaciones de entrega
                                    <textarea
                                        rows={2}
                                        value={form.observacionesSalida}
                                        onChange={(e) => setForm((prev) => ({ ...prev, observacionesSalida: e.target.value }))}
                                    />
                                    {errors.observacionesSalida && <small className="field-error">{errors.observacionesSalida}</small>}
                                </label>
                            </div>
                        )}

                        <label className="field">
                            <span className="field__label">
                                Motivo {destino === 'CANCELADA' ? '(obligatorio)' : '(opcional)'}
                            </span>
                            <input
                                value={form.motivo}
                                onChange={(e) => setForm((prev) => ({ ...prev, motivo: e.target.value }))}
                            />
                            {errors.motivo && <small className="field-error">{errors.motivo}</small>}
                        </label>

                        {apiError && <div className="form-error">{apiError}</div>}

                        <div className="form-actions">
                            <Button variant="secondary" onClick={() => setDestino(null)} disabled={saving}>
                                Cancelar
                            </Button>
                            <Button type="submit" variant={destino === 'CANCELADA' ? 'danger' : 'primary'} loading={saving}>
                                Confirmar cambio
                            </Button>
                        </div>
                    </form>
                )}
            </section>

            <section>
                <h3>Historial de estados</h3>
                {loadingHistorial && <p className="texto-muted">Cargando historial...</p>}
                {historialError && <div className="form-error">{historialError}</div>}
                {!loadingHistorial && !historialError && (
                    <ol className="historial">
                        {historial.map((h) => (
                            <li key={h.id}>
                                <span className="historial__fecha">{formatFechaHora(h.fechaCambio)}</span>
                                <span>
                                    {h.estadoAnterior ? `${ESTADO_LABEL[h.estadoAnterior]} → ` : ''}
                                    <strong>{ESTADO_LABEL[h.estadoNuevo]}</strong>
                                </span>
                                <span className="texto-muted">
                                    por {usuariosById.get(h.cambiadoPorId)?.nombreCompleto ?? `usuario #${h.cambiadoPorId}`}
                                    {h.motivo ? ` — ${h.motivo}` : ''}
                                </span>
                            </li>
                        ))}
                    </ol>
                )}
            </section>
        </div>
    );
}
