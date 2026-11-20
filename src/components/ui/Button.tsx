import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

// Extiende los atributos nativos: onClick, type, aria-label, etc. siguen disponibles
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    loading?: boolean;
};

export function Button({
                           variant = 'primary',
                           loading = false,
                           disabled,
                           children,
                           type = 'button',
                           className = '',
                           ...props
                       }: ButtonProps) {
    return (
        <button
            type={type}
            className={`btn btn--${variant} ${className}`.trim()}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? 'Procesando...' : children}
        </button>
    );
}
