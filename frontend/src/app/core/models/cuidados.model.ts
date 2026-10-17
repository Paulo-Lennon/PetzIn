import { Pet } from './pet.model';
import { Reserva } from './reserva.model';

export interface FichaClinica {
  id: string;
  petId: string;
  vacinasEmDia: boolean | null;
  alergias: string | null;
  condicoesClinicas: string | null;
  restricoesAlimentares: string | null;
  veterinarioNome: string | null;
  veterinarioTelefone: string | null;
  observacoes: string | null;
  criadoEm: string;
  atualizadoEm: string;
}

export type TipoRegistroClinico =
  | 'ALIMENTACAO'
  | 'HIDRATACAO'
  | 'SINAIS_VITAIS'
  | 'COMPORTAMENTO'
  | 'HIGIENE'
  | 'ATIVIDADE'
  | 'OCORRENCIA'
  | 'OBSERVACAO';

export interface RegistroClinico {
  id: string;
  petId: string;
  reservaId: string;
  tipo: TipoRegistroClinico;
  dataHora: string;
  descricao: string;
  temperatura: number | null;
  peso: number | null;
  criadoEm: string;
  reserva?: Reserva;
}

export type StatusLembreteMedicamento =
  | 'PENDENTE'
  | 'ADMINISTRADO'
  | 'NAO_ADMINISTRADO'
  | 'CANCELADO';

export interface LembreteMedicamento {
  id: string;
  petId: string;
  reservaId: string;
  medicamento: string;
  dosagem: string;
  viaAdministracao: string | null;
  horarioProgramado: string;
  status: StatusLembreteMedicamento;
  observacoes: string | null;
  administradoEm: string | null;
  motivoNaoAdministrado: string | null;
  criadoEm: string;
  atualizadoEm: string;
  pet?: Pet;
  reserva?: Reserva;
}

export interface ResumoFichaClinica {
  pet: Pet;
  ficha: FichaClinica | null;
}
