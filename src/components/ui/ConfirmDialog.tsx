import { Button } from './Button';
import { Modal } from './Modal';

type ConfirmDialogProps = {
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    confirming?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
};

// No conoce Cliente ni Vehiculo: la página decide qué service ejecutar al confirmar
export function ConfirmDialog({
                                  open,
                                  title,
                                  message,
                                  confirmLabel = 'Eliminar',
                                  confirming = false,
                                  onConfirm,
                                  onCancel,
                              }: ConfirmDialogProps) {
    return (
        <Modal open={open} title={title} onClose={onCancel}>
            <p>{message}</p>
            <div className="modal__actions">
                <Button variant="secondary" onClick={onCancel} disabled={confirming}>
                    Cancelar
                </Button>
                <Button variant="danger" loading={confirming} onClick={onConfirm}>
                    {confirmLabel}
                </Button>
            </div>
        </Modal>
    );
}
