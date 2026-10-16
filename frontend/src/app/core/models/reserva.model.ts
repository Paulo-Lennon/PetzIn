import { Pet } from './pet.model';

export type ModalidadeCobranca = 'HORA' | 'DIARIA';
export type StatusReserva =
  | 'AGENDADA'
  | 'EM_ANDAMENTO'
  | 'CONCLUIDA'
  | 'CANCELADA';
export type StatusPagamento = 'PENDENTE' | 'PARCIAL' | 'PAGO';

export interface Reserva {
  id: string;
  petId: string;
  dataEntrada: string;
  dataSaida: string;
  numeroCanil: number;
  modalidade: ModalidadeCobranca;
  tarifaHora: number;
  tarifaDiaria: number;
  valorTotal: number;
  valorPago: number;
  statusPagamento: StatusPagamento;
  pagoEm: string | null;
  status: StatusReserva;
  observacoes: string | null;
  criadoEm: string;
  atualizadoEm: string;
  pet?: Pet;
}

export type CriarReserva = Pick<
  Reserva,
  'petId' | 'dataEntrada' | 'dataSaida' | 'numeroCanil' | 'modalidade'
> &
  Partial<Pick<Reserva, 'observacoes'>>;
