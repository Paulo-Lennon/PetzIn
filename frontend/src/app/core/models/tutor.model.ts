import { Pet } from './pet.model';

export interface Tutor {
  id: string;
  nome: string;
  telefone: string;
  email: string | null;
  observacoes: string | null;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
  pets?: Pet[];
}

export type CriarTutor = Pick<Tutor, 'nome' | 'telefone'> &
  Partial<Pick<Tutor, 'email' | 'observacoes'>>;
