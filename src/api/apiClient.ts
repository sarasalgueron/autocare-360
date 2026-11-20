import { API_URL } from '../config/env';
import { getUsuarioActualId } from '../shared/session/sesionDemo';

// Forma del ApiError que devuelve el GlobalExceptionHandler de Spring Boot
interface ApiErrorBody {
    message?: string;
    fieldErrors?: Record<string, string>;
}

export class ApiError extends Error {
    status: number;
    fieldErrors: Record<string, string>;

    constructor(status: number, message: string, fieldErrors: Record<string, string> = {}) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.fieldErrors = fieldErrors;
    }
}

async function toApiError(response: Response): Promise<ApiError> {
    const text = await response.text();
    try {
        const body = JSON.parse(text) as ApiErrorBody;
        const fieldErrors = body.fieldErrors ?? {};
        const detalles = Object.values(fieldErrors);
        const message = detalles.length > 0
            ? `${body.message ?? 'Datos invalidos'}: ${detalles.join(' ')}`
            : body.message;
        return new ApiError(response.status, message || response.statusText || 'Error HTTP', fieldErrors);
    } catch {
        // La respuesta no era JSON (por ejemplo, un proxy o el servidor caido)
        return new ApiError(response.status, text || response.statusText || 'Error HTTP');
    }
}

export async function apiFetch<T>(
    endpoint: string,
    options: RequestInit = {},
): Promise<T> {
    if (!API_URL) {
        throw new Error('Falta VITE_API_URL');
    }

    const headers = new Headers(options.headers);
    if (options.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }
    // Usuario actual (modo demo): el backend lo usa para RF-04 y para validar el rol
    headers.set('X-Usuario-Id', String(getUsuarioActualId()));

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        throw await toApiError(response);
    }

    if (response.status === 204) {
        return undefined as T;
    }

    return response.json() as Promise<T>;
}
