import { useEffect, useRef, type ReactNode } from 'react';

type ModalProps = {
    open: boolean;
    title: string;
    children: ReactNode;
    onClose: () => void;
    size?: 'md' | 'lg';
};

/**
 * Usa <dialog> nativo: showModal() lo pone en la capa superior, bloquea el fondo
 * y cierra con Escape sin que tengamos que programarlo.
 */
export function Modal({ open, title, children, onClose, size = 'md' }: ModalProps) {
    const ref = useRef<HTMLDialogElement>(null);

    // Sincroniza la prop open con la API del navegador (sistema externo a React)
    useEffect(() => {
        const dialog = ref.current;
        if (!dialog) return;
        if (open && !dialog.open) dialog.showModal();
        if (!open && dialog.open) dialog.close();
    }, [open]);

    return (
        <dialog ref={ref} className={`modal modal--${size}`} onClose={onClose} aria-labelledby="modal-title">
            <header className="modal__header">
                <h2 id="modal-title">{title}</h2>
                <button type="button" className="modal__close" aria-label="Cerrar" onClick={onClose}>
                    ×
                </button>
            </header>
            {children}
        </dialog>
    );
}
