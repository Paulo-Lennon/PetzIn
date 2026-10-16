import { StatusPagamento, StatusReserva } from '../entities/Reserva';
import { ReservaRepository } from '../repositories/ReservaRepository';

export class ErroValidacaoFinanceiro extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = 'ErroValidacaoFinanceiro';
  }
}

function validarDataHoraOpcional(valor: unknown, campo: string): Date | undefined {
  if (valor === undefined) {
    return undefined;
  }

  if (
    typeof valor !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T/.test(valor) ||
    !/(Z|[+-]\d{2}:\d{2})$/.test(valor)
  ) {
    throw new ErroValidacaoFinanceiro(
      `${campo} deve ser uma data e hora ISO 8601 com fuso horário`,
    );
  }

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    throw new ErroValidacaoFinanceiro(`${campo} é inválida`);
  }

  return data;
}

function arredondarMoeda(valor: number): number {
  return Number(valor.toFixed(2));
}

export class FinanceiroService {
  async obterResumo(filtros: { dataInicio?: unknown; dataFim?: unknown }) {
    const dataInicio = validarDataHoraOpcional(
      filtros.dataInicio,
      'Data inicial',
    );
    const dataFim = validarDataHoraOpcional(filtros.dataFim, 'Data final');

    if (dataInicio && dataFim && dataFim.getTime() <= dataInicio.getTime()) {
      throw new ErroValidacaoFinanceiro(
        'Data final deve ser posterior à data inicial',
      );
    }

    const consulta = ReservaRepository.createQueryBuilder('reserva').orderBy(
      'reserva.dataEntrada',
      'ASC',
    );

    if (dataInicio) {
      consulta.andWhere('reserva.dataEntrada >= :dataInicio', { dataInicio });
    }

    if (dataFim) {
      consulta.andWhere('reserva.dataEntrada <= :dataFim', { dataFim });
    }

    const reservas = await consulta.getMany();
    const reservasConsideradas = reservas.filter(
      (reserva) => reserva.status !== StatusReserva.CANCELADA,
    );
    const totalPrevisto = reservasConsideradas.reduce(
      (total, reserva) => total + reserva.valorTotal,
      0,
    );
    const totalRecebido = reservasConsideradas.reduce(
      (total, reserva) => total + reserva.valorPago,
      0,
    );

    return {
      periodo: {
        dataInicio: dataInicio?.toISOString() ?? null,
        dataFim: dataFim?.toISOString() ?? null,
      },
      totalPrevisto: arredondarMoeda(totalPrevisto),
      totalRecebido: arredondarMoeda(totalRecebido),
      totalPendente: arredondarMoeda(totalPrevisto - totalRecebido),
      quantidadeReservas: reservasConsideradas.length,
      quantidadeCanceladas: reservas.length - reservasConsideradas.length,
      pagamentos: {
        pendentes: reservasConsideradas.filter(
          (reserva) =>
            reserva.statusPagamento === StatusPagamento.PENDENTE,
        ).length,
        parciais: reservasConsideradas.filter(
          (reserva) => reserva.statusPagamento === StatusPagamento.PARCIAL,
        ).length,
        pagos: reservasConsideradas.filter(
          (reserva) => reserva.statusPagamento === StatusPagamento.PAGO,
        ).length,
      },
    };
  }
}
