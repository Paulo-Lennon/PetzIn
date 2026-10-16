import { ModalidadeCobranca } from '../../core/models/reserva.model';

const MILISSEGUNDOS_HORA = 60 * 60 * 1000;
const MILISSEGUNDOS_DIARIA = 24 * MILISSEGUNDOS_HORA;

export interface PreviaReserva {
  diarias: number;
  horas: number;
  valorTotal: number;
}

export function calcularPreviaReserva(
  modalidade: ModalidadeCobranca,
  entrada: Date,
  saida: Date,
  tarifaHora = 10,
  tarifaDiaria = 240,
): PreviaReserva | null {
  const duracao = saida.getTime() - entrada.getTime();
  if (!Number.isFinite(duracao) || duracao <= 0) return null;

  if (modalidade === 'HORA') {
    const horas = Math.ceil(duracao / MILISSEGUNDOS_HORA);
    return { diarias: 0, horas, valorTotal: horas * tarifaHora };
  }

  if (duracao <= MILISSEGUNDOS_DIARIA) {
    return { diarias: 1, horas: 0, valorTotal: tarifaDiaria };
  }

  const diarias = Math.floor(duracao / MILISSEGUNDOS_DIARIA);
  const restante = duracao % MILISSEGUNDOS_DIARIA;
  const horas = Math.ceil(restante / MILISSEGUNDOS_HORA);

  return {
    diarias,
    horas,
    valorTotal: diarias * tarifaDiaria + horas * tarifaHora,
  };
}
