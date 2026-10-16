import {
  ModalidadeCobranca,
  StatusPagamento,
  StatusReserva,
} from '../entities/Reserva';
import { PetRepository } from '../repositories/PetRepository';
import { ReservaRepository } from '../repositories/ReservaRepository';

export const TARIFA_HORA = 10;
export const TARIFA_DIARIA = 240;

const MILISSEGUNDOS_HORA = 60 * 60 * 1000;
const MILISSEGUNDOS_DIARIA = 24 * MILISSEGUNDOS_HORA;
const regexUuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class ErroValidacaoReserva extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = 'ErroValidacaoReserva';
  }
}

export class ErroReservaNaoEncontrada extends Error {
  constructor() {
    super('Reserva não encontrada');
    this.name = 'ErroReservaNaoEncontrada';
  }
}

export class ErroConflitoReserva extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = 'ErroConflitoReserva';
  }
}

interface DadosCadastroReserva {
  petId: unknown;
  dataEntrada: unknown;
  dataSaida: unknown;
  numeroCanil: unknown;
  modalidade: unknown;
  observacoes?: unknown;
}

type DadosAtualizacaoReserva = Partial<DadosCadastroReserva>;

function validarUuid(valor: unknown, mensagem: string): string {
  if (typeof valor !== 'string' || !regexUuid.test(valor)) {
    throw new ErroValidacaoReserva(mensagem);
  }

  return valor;
}

function validarDataHora(valor: unknown, campo: string): Date {
  if (
    typeof valor !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T/.test(valor) ||
    !/(Z|[+-]\d{2}:\d{2})$/.test(valor)
  ) {
    throw new ErroValidacaoReserva(
      `${campo} deve ser uma data e hora ISO 8601 com fuso horário`,
    );
  }

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    throw new ErroValidacaoReserva(`${campo} é inválida`);
  }

  return data;
}

function validarPeriodo(dataEntrada: Date, dataSaida: Date): void {
  if (dataSaida.getTime() <= dataEntrada.getTime()) {
    throw new ErroValidacaoReserva(
      'Data de saída deve ser posterior à data de entrada',
    );
  }
}

function validarEntradaNaoPassada(dataEntrada: Date): void {
  const inicioMinutoAtual = new Date();
  inicioMinutoAtual.setSeconds(0, 0);

  if (dataEntrada.getTime() < inicioMinutoAtual.getTime()) {
    throw new ErroValidacaoReserva(
      'Data passada. Escolha uma data atual ou futura.',
    );
  }
}

function validarNumeroCanil(valor: unknown): number {
  if (typeof valor !== 'number' || !Number.isInteger(valor) || valor <= 0) {
    throw new ErroValidacaoReserva(
      'Número do canil deve ser um número inteiro maior que zero',
    );
  }

  return valor;
}

function validarModalidade(valor: unknown): ModalidadeCobranca {
  if (typeof valor !== 'string') {
    throw new ErroValidacaoReserva('Modalidade de cobrança é obrigatória');
  }

  const modalidade = valor.trim().toUpperCase() as ModalidadeCobranca;

  if (!Object.values(ModalidadeCobranca).includes(modalidade)) {
    throw new ErroValidacaoReserva('Modalidade de cobrança é inválida');
  }

  return modalidade;
}

function validarObservacoes(valor: unknown): string | null {
  if (valor === undefined || valor === null || valor === '') {
    return null;
  }

  if (typeof valor !== 'string') {
    throw new ErroValidacaoReserva('Observações devem ser um texto');
  }

  const observacoes = valor.trim();

  if (observacoes.length === 0) {
    return null;
  }

  if (observacoes.length > 2000) {
    throw new ErroValidacaoReserva(
      'Observações devem possuir no máximo 2000 caracteres',
    );
  }

  return observacoes;
}

function validarStatus(valor: unknown): StatusReserva {
  if (typeof valor !== 'string') {
    throw new ErroValidacaoReserva('Status da reserva é obrigatório');
  }

  const status = valor.trim().toUpperCase() as StatusReserva;

  if (!Object.values(StatusReserva).includes(status)) {
    throw new ErroValidacaoReserva('Status da reserva é inválido');
  }

  return status;
}

function validarValorPago(valor: unknown, valorTotal: number): number {
  if (
    typeof valor !== 'number' ||
    !Number.isFinite(valor) ||
    valor < 0 ||
    Number(valor.toFixed(2)) !== valor
  ) {
    throw new ErroValidacaoReserva(
      'Valor pago deve ser um número não negativo com até duas casas decimais',
    );
  }

  if (valor > valorTotal) {
    throw new ErroValidacaoReserva(
      'Valor pago não pode ser maior que o valor total da reserva',
    );
  }

  return valor;
}

export function calcularValorReserva(
  modalidade: ModalidadeCobranca,
  dataEntrada: Date,
  dataSaida: Date,
  tarifaHora = TARIFA_HORA,
  tarifaDiaria = TARIFA_DIARIA,
): number {
  validarPeriodo(dataEntrada, dataSaida);
  const duracao = dataSaida.getTime() - dataEntrada.getTime();

  if (modalidade === ModalidadeCobranca.HORA) {
    return Number((Math.ceil(duracao / MILISSEGUNDOS_HORA) * tarifaHora).toFixed(2));
  }

  if (duracao <= MILISSEGUNDOS_DIARIA) {
    return tarifaDiaria;
  }

  const diariasCompletas = Math.floor(duracao / MILISSEGUNDOS_DIARIA);
  const periodoExcedente = duracao % MILISSEGUNDOS_DIARIA;
  const horasExcedentes = Math.ceil(periodoExcedente / MILISSEGUNDOS_HORA);

  return Number(
    (diariasCompletas * tarifaDiaria + horasExcedentes * tarifaHora).toFixed(2),
  );
}

async function validarPetAtivo(petId: string): Promise<void> {
  const pet = await PetRepository.createQueryBuilder('pet')
    .innerJoin('pet.tutor', 'tutor')
    .where('pet.id = :petId', { petId })
    .andWhere('pet.ativo = true')
    .andWhere('tutor.ativo = true')
    .getOne();

  if (!pet) {
    throw new ErroValidacaoReserva('Pet não encontrado ou inativo');
  }
}

async function validarDisponibilidade(
  petId: string,
  numeroCanil: number,
  dataEntrada: Date,
  dataSaida: Date,
  reservaIdIgnorada?: string,
): Promise<void> {
  const consultaBase = () =>
    ReservaRepository.createQueryBuilder('reserva')
      .where('reserva.status != :cancelada', {
        cancelada: StatusReserva.CANCELADA,
      })
      .andWhere('reserva.dataEntrada < :dataSaida', { dataSaida })
      .andWhere('reserva.dataSaida > :dataEntrada', { dataEntrada });

  const consultaCanil = consultaBase().andWhere(
    'reserva.numeroCanil = :numeroCanil',
    { numeroCanil },
  );
  const consultaPet = consultaBase().andWhere('reserva.petId = :petId', {
    petId,
  });

  if (reservaIdIgnorada) {
    consultaCanil.andWhere('reserva.id != :reservaIdIgnorada', {
      reservaIdIgnorada,
    });
    consultaPet.andWhere('reserva.id != :reservaIdIgnorada', {
      reservaIdIgnorada,
    });
  }

  const [conflitoCanil, conflitoPet] = await Promise.all([
    consultaCanil.getExists(),
    consultaPet.getExists(),
  ]);

  if (conflitoCanil) {
    throw new ErroConflitoReserva(
      'O canil já possui uma reserva nesse período',
    );
  }

  if (conflitoPet) {
    throw new ErroConflitoReserva(
      'O pet já possui uma reserva nesse período',
    );
  }
}

export class ReservaService {
  async cadastrar(dados: DadosCadastroReserva) {
    const petId = validarUuid(dados.petId, 'Informe um pet válido');
    const dataEntrada = validarDataHora(dados.dataEntrada, 'Data de entrada');
    const dataSaida = validarDataHora(dados.dataSaida, 'Data de saída');
    const numeroCanil = validarNumeroCanil(dados.numeroCanil);
    const modalidade = validarModalidade(dados.modalidade);

    validarPeriodo(dataEntrada, dataSaida);
    validarEntradaNaoPassada(dataEntrada);
    await validarPetAtivo(petId);
    await validarDisponibilidade(
      petId,
      numeroCanil,
      dataEntrada,
      dataSaida,
    );

    const reserva = ReservaRepository.create({
      petId,
      dataEntrada,
      dataSaida,
      numeroCanil,
      modalidade,
      tarifaHora: TARIFA_HORA,
      tarifaDiaria: TARIFA_DIARIA,
      valorTotal: calcularValorReserva(modalidade, dataEntrada, dataSaida),
      status: StatusReserva.AGENDADA,
      observacoes: validarObservacoes(dados.observacoes),
    });

    return ReservaRepository.save(reserva);
  }

  async listar(filtros: { petId?: unknown; status?: unknown }) {
    const consulta = ReservaRepository.createQueryBuilder('reserva')
      .innerJoinAndSelect('reserva.pet', 'pet')
      .innerJoinAndSelect('pet.tutor', 'tutor')
      .orderBy('reserva.dataEntrada', 'DESC');

    if (filtros.petId !== undefined) {
      const petId = validarUuid(filtros.petId, 'Informe um pet válido');
      consulta.andWhere('reserva.petId = :petId', { petId });
    }

    if (filtros.status !== undefined) {
      const status = validarStatus(filtros.status);
      consulta.andWhere('reserva.status = :status', { status });
    }

    return consulta.getMany();
  }

  async buscarPorId(idInformado: unknown) {
    const id = validarUuid(
      idInformado,
      'Informe um identificador de reserva válido',
    );
    const reserva = await ReservaRepository.createQueryBuilder('reserva')
      .innerJoinAndSelect('reserva.pet', 'pet')
      .innerJoinAndSelect('pet.tutor', 'tutor')
      .where('reserva.id = :id', { id })
      .getOne();

    if (!reserva) {
      throw new ErroReservaNaoEncontrada();
    }

    return reserva;
  }

  async atualizar(idInformado: unknown, dados: DadosAtualizacaoReserva) {
    const id = validarUuid(
      idInformado,
      'Informe um identificador de reserva válido',
    );
    const reserva = await ReservaRepository.findOneBy({ id });

    if (!reserva) {
      throw new ErroReservaNaoEncontrada();
    }

    if (reserva.status !== StatusReserva.AGENDADA) {
      throw new ErroConflitoReserva(
        'Somente reservas agendadas podem ter seus dados alterados',
      );
    }

    const camposPermitidos = [
      'petId',
      'dataEntrada',
      'dataSaida',
      'numeroCanil',
      'modalidade',
      'observacoes',
    ] as const;
    const possuiCampoParaAtualizar = camposPermitidos.some((campo) =>
      Object.prototype.hasOwnProperty.call(dados, campo),
    );

    if (!possuiCampoParaAtualizar) {
      throw new ErroValidacaoReserva('Informe ao menos um campo para atualizar');
    }

    const petId = Object.prototype.hasOwnProperty.call(dados, 'petId')
      ? validarUuid(dados.petId, 'Informe um pet válido')
      : reserva.petId;
    const dataEntrada = Object.prototype.hasOwnProperty.call(dados, 'dataEntrada')
      ? validarDataHora(dados.dataEntrada, 'Data de entrada')
      : reserva.dataEntrada;
    const dataSaida = Object.prototype.hasOwnProperty.call(dados, 'dataSaida')
      ? validarDataHora(dados.dataSaida, 'Data de saída')
      : reserva.dataSaida;
    const numeroCanil = Object.prototype.hasOwnProperty.call(dados, 'numeroCanil')
      ? validarNumeroCanil(dados.numeroCanil)
      : reserva.numeroCanil;
    const modalidade = Object.prototype.hasOwnProperty.call(dados, 'modalidade')
      ? validarModalidade(dados.modalidade)
      : reserva.modalidade;

    validarPeriodo(dataEntrada, dataSaida);
    validarEntradaNaoPassada(dataEntrada);
    await validarPetAtivo(petId);
    await validarDisponibilidade(
      petId,
      numeroCanil,
      dataEntrada,
      dataSaida,
      reserva.id,
    );

    reserva.petId = petId;
    reserva.dataEntrada = dataEntrada;
    reserva.dataSaida = dataSaida;
    reserva.numeroCanil = numeroCanil;
    reserva.modalidade = modalidade;
    const novoValorTotal = calcularValorReserva(
      modalidade,
      dataEntrada,
      dataSaida,
      reserva.tarifaHora,
      reserva.tarifaDiaria,
    );

    if (reserva.valorPago > novoValorTotal) {
      throw new ErroConflitoReserva(
        'O novo valor total não pode ser menor que o valor já pago',
      );
    }

    reserva.valorTotal = novoValorTotal;

    if (reserva.valorPago === 0) {
      reserva.statusPagamento = StatusPagamento.PENDENTE;
      reserva.pagoEm = null;
    } else if (reserva.valorPago < novoValorTotal) {
      reserva.statusPagamento = StatusPagamento.PARCIAL;
      reserva.pagoEm = null;
    } else {
      reserva.statusPagamento = StatusPagamento.PAGO;
      reserva.pagoEm ??= new Date();
    }

    if (Object.prototype.hasOwnProperty.call(dados, 'observacoes')) {
      reserva.observacoes = validarObservacoes(dados.observacoes);
    }

    return ReservaRepository.save(reserva);
  }

  async alterarStatus(idInformado: unknown, statusInformado: unknown) {
    const id = validarUuid(
      idInformado,
      'Informe um identificador de reserva válido',
    );
    const novoStatus = validarStatus(statusInformado);
    const reserva = await ReservaRepository.findOneBy({ id });

    if (!reserva) {
      throw new ErroReservaNaoEncontrada();
    }

    const transicoesPermitidas: Record<StatusReserva, StatusReserva[]> = {
      [StatusReserva.AGENDADA]: [
        StatusReserva.EM_ANDAMENTO,
        StatusReserva.CANCELADA,
      ],
      [StatusReserva.EM_ANDAMENTO]: [
        StatusReserva.CONCLUIDA,
        StatusReserva.CANCELADA,
      ],
      [StatusReserva.CONCLUIDA]: [],
      [StatusReserva.CANCELADA]: [],
    };

    if (!transicoesPermitidas[reserva.status].includes(novoStatus)) {
      throw new ErroConflitoReserva(
        `Não é possível alterar o status de ${reserva.status} para ${novoStatus}`,
      );
    }

    if (
      novoStatus === StatusReserva.CANCELADA &&
      reserva.valorPago > 0
    ) {
      throw new ErroConflitoReserva(
        'Não é possível cancelar uma reserva com valor pago',
      );
    }

    reserva.status = novoStatus;
    return ReservaRepository.save(reserva);
  }

  async registrarPagamento(idInformado: unknown, valorInformado: unknown) {
    const id = validarUuid(
      idInformado,
      'Informe um identificador de reserva válido',
    );
    const reserva = await ReservaRepository.findOneBy({ id });

    if (!reserva) {
      throw new ErroReservaNaoEncontrada();
    }

    if (reserva.status === StatusReserva.CANCELADA) {
      throw new ErroConflitoReserva(
        'Não é possível registrar pagamento em uma reserva cancelada',
      );
    }

    const valorPago = validarValorPago(valorInformado, reserva.valorTotal);

    reserva.valorPago = valorPago;

    if (valorPago === 0) {
      reserva.statusPagamento = StatusPagamento.PENDENTE;
      reserva.pagoEm = null;
    } else if (valorPago < reserva.valorTotal) {
      reserva.statusPagamento = StatusPagamento.PARCIAL;
      reserva.pagoEm = null;
    } else {
      reserva.statusPagamento = StatusPagamento.PAGO;
      reserva.pagoEm = new Date();
    }

    return ReservaRepository.save(reserva);
  }

  async cancelar(idInformado: unknown): Promise<void> {
    await this.alterarStatus(idInformado, StatusReserva.CANCELADA);
  }
}
