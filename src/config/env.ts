// Único lugar que lee variables de entorno de Vite.
// Vite elige el archivo según el modo: .env.development (npm run dev) o .env.production (npm run build).
export const API_URL: string | undefined = import.meta.env.VITE_API_URL;
