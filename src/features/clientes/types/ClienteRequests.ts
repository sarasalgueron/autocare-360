import type { Cliente } from '../models/Cliente';

export type ClienteCreateRequest = Omit<Cliente, 'id'>;
export type ClienteUpdateRequest = Omit<Cliente, 'id'>;
