type SearchInputProps = {
    value: string;
    onChange: (value: string) => void;
    label?: string;
    placeholder?: string;
};

// Controlado: no filtra nada, solo emite el texto; la página decide qué hacer con él
export function SearchInput({
                                value,
                                onChange,
                                label = 'Busqueda',
                                placeholder = 'Buscar...',
                            }: SearchInputProps) {
    return (
        <label className="field">
            <span className="field__label">{label}</span>
            <input
                type="search"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
            />
        </label>
    );
}
