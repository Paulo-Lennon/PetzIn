import { Tutor } from './tutor.model';

export type SexoPet = 'MACHO' | 'FEMEA' | 'NAO_INFORMADO';

export interface Pet {
  id: string;
  tutorId: string;
  nome: string;
  especie: string;
  raca: string | null;
  sexo: SexoPet;
  dataNascimento: string | null;
  pesoAtual: number | null;
  fotoUrl: string | null;
  observacoes: string | null;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
  tutor?: Tutor;
}

export type CriarPet = Pick<Pet, 'tutorId' | 'nome' | 'especie'> &
  Partial<
    Pick<
      Pet,
      'raca' | 'sexo' | 'dataNascimento' | 'pesoAtual' | 'fotoUrl' | 'observacoes'
    >
  >;
