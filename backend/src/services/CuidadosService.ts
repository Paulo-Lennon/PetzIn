import { StatusReserva } from '../entities/Reserva';
import {
  StatusLembreteMedicamento,
} from '../entities/LembreteMedicamento';
import { TipoRegistroClinico } from '../entities/RegistroClinico';
import {
  FichaClinicaRepository,
  LembreteMedicamentoRepository,
  RegistroClinicoRepository,
} from '../repositories/CuidadosRepository';
import { PetRepository } from '../repositories/PetRepository';
import { ReservaRepository } from '../repositories/ReservaRepository';

const regexUuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class ErroValidacaoCuidados extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = 'ErroValidacaoCuidados';
  }
}

export class ErroCuidadosNaoEncontrado extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = 'ErroCuidadosNaoEncontrado';
  }
}

export class ErroConflitoCuidados extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = 'ErroConflitoCuidados';
  }
}

function validarUuid(valor: unknown, mensagem: string): string {
  if (typeof valor !== 'string' || !regexUuid.test(valor)) {
    throw new ErroValidacaoCuidados(mensagem);
  }
  return valor;
}

function validarTextoObrigatorio(
  valor: unknown,
  campo: string,
  limite: number,
): string {
  if (typeof valor !== 'string' || valor.trim().length === 0) {
    throw new ErroValidacaoCuidados(`${campo} é obrigatório`);
  }
  const texto = valor.trim();
  if (texto.length > limite) {
    throw new ErroValidacaoCuidados(
      `${campo} deve possuir no máximo ${limite} caracteres`,
    );
  }
  return texto;
}

function validarTextoOpcional(
  valor: unknown,
  campo: string,
  limite: number,
): string | null {
  if (valor === undefined || valor === null || valor === '') return null;
  if (typeof valor !== 'string') {
    throw new ErroValidacaoCuidados(`${campo} deve ser um texto`);
  }
  const texto = valor.trim();
  if (!texto) return null;
  if (texto.length > limite) {
    throw new ErroValidacaoCuidados(
      `${campo} deve possuir no máximo ${limite} caracteres`,
    );
  }
  return texto;
}

function validarTelefoneClinicoObrigatorio(valor: unknown): string {
  if (typeof valor !== 'string' || valor.trim().length === 0) {
    throw new ErroValidacaoCuidados('Telefone do veterinário é obrigatório');
  }

  if (valor.trim().toUpperCase() === 'N/A') return 'N/A';

  const telefone = valor.replace(/\D/g, '');
  if (telefone.length < 10 || telefone.length > 15) {
    throw new ErroValidacaoCuidados(
      'Informe um telefone válido ou N/A quando não houver',
    );
  }
  return telefone;
}

function validarDataHora(valor: unknown, campo: string): Date {
  if (
    typeof valor !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T/.test(valor) ||
    !/(Z|[+-]\d{2}:\d{2})$/.test(valor)
  ) {
    throw new ErroValidacaoCuidados(
      `${campo} deve ser uma data e hora ISO 8601 com fuso horário`,
    );
  }
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) {
    throw new ErroValidacaoCuidados(`${campo} é inválido`);
  }
  return data;
}

function validarNumeroOpcional(
  valor: unknown,
  campo: string,
  minimo: number,
  maximo: number,
  casas: number,
): number | null {
  if (valor === undefined || valor === null || valor === '') return null;
  if (
    typeof valor !== 'number' ||
    !Number.isFinite(valor) ||
    valor < minimo ||
    valor > maximo ||
    Number(valor.toFixed(casas)) !== valor
  ) {
    throw new ErroValidacaoCuidados(`${campo} possui valor inválido`);
  }
  return valor;
}

async function buscarPetAtivo(petIdInformado: unknown) {
  const petId = validarUuid(petIdInformado, 'Informe um pet válido');
  const pet = await PetRepository.createQueryBuilder('pet')
    .innerJoinAndSelect('pet.tutor', 'tutor')
    .where('pet.id = :petId', { petId })
    .andWhere('pet.ativo = true')
    .andWhere('tutor.ativo = true')
    .getOne();
  if (!pet) throw new ErroCuidadosNaoEncontrado('Pet não encontrado ou inativo');
  return pet;
}

async function buscarReserva(reservaIdInformado: unknown) {
  const reservaId = validarUuid(
    reservaIdInformado,
    'Informe uma reserva válida',
  );
  const reserva = await ReservaRepository.createQueryBuilder('reserva')
    .innerJoinAndSelect('reserva.pet', 'pet')
    .innerJoinAndSelect('pet.tutor', 'tutor')
    .where('reserva.id = :reservaId', { reservaId })
    .getOne();
  if (!reserva) throw new ErroCuidadosNaoEncontrado('Reserva não encontrada');
  return reserva;
}

function validarHorarioNaReserva(
  horario: Date,
  reserva: { dataEntrada: Date; dataSaida: Date },
): void {
  if (
    horario.getTime() < reserva.dataEntrada.getTime() ||
    horario.getTime() > reserva.dataSaida.getTime()
  ) {
    throw new ErroValidacaoCuidados(
      'O horário deve estar dentro do período da reserva',
    );
  }
}

export class CuidadosService {
  async buscarFicha(petIdInformado: unknown) {
    const pet = await buscarPetAtivo(petIdInformado);
    const ficha = await FichaClinicaRepository.findOneBy({ petId: pet.id });
    return { pet, ficha };
  }

  async salvarFicha(petIdInformado: unknown, dados: Record<string, unknown>) {
    const pet = await buscarPetAtivo(petIdInformado);
    const campos = [
      'vacinasEmDia',
      'alergias',
      'condicoesClinicas',
      'restricoesAlimentares',
      'veterinarioNome',
      'veterinarioTelefone',
      'observacoes',
    ];
    const camposAusentes = campos.filter(
      (campo) => !Object.prototype.hasOwnProperty.call(dados, campo),
    );
    if (camposAusentes.length > 0) {
      throw new ErroValidacaoCuidados(
        'Preencha todos os campos. Se não houver nada a declarar, informe N/A',
      );
    }

    let ficha = await FichaClinicaRepository.findOneBy({ petId: pet.id });
    ficha ??= FichaClinicaRepository.create({ petId: pet.id });

    if (typeof dados.vacinasEmDia !== 'boolean') {
      throw new ErroValidacaoCuidados('Informe se as vacinas estão em dia');
    }
    ficha.vacinasEmDia = dados.vacinasEmDia;
    ficha.alergias = validarTextoObrigatorio(dados.alergias, 'Alergias', 2000);
    ficha.condicoesClinicas = validarTextoObrigatorio(
        dados.condicoesClinicas,
        'Condições clínicas',
        2000,
      );
    ficha.restricoesAlimentares = validarTextoObrigatorio(
        dados.restricoesAlimentares,
        'Restrições alimentares',
        2000,
      );
    ficha.veterinarioNome = validarTextoObrigatorio(
        dados.veterinarioNome,
        'Nome do veterinário',
        150,
      );
    ficha.veterinarioTelefone = validarTelefoneClinicoObrigatorio(
      dados.veterinarioTelefone,
    );
    ficha.observacoes = validarTextoObrigatorio(
        dados.observacoes,
        'Observações clínicas',
        2000,
      );

    return FichaClinicaRepository.save(ficha);
  }

  async listarRegistros(petIdInformado: unknown) {
    const pet = await buscarPetAtivo(petIdInformado);
    return RegistroClinicoRepository.createQueryBuilder('registro')
      .innerJoinAndSelect('registro.reserva', 'reserva')
      .where('registro.petId = :petId', { petId: pet.id })
      .orderBy('registro.dataHora', 'DESC')
      .getMany();
  }

  async criarRegistro(reservaIdInformado: unknown, dados: Record<string, unknown>) {
    const reserva = await buscarReserva(reservaIdInformado);
    if (reserva.status !== StatusReserva.EM_ANDAMENTO) {
      throw new ErroConflitoCuidados(
        'Registros clínicos só podem ser incluídos durante a hospedagem',
      );
    }

    const tipo = typeof dados.tipo === 'string'
      ? dados.tipo.trim().toUpperCase() as TipoRegistroClinico
      : undefined;
    if (!tipo || !Object.values(TipoRegistroClinico).includes(tipo)) {
      throw new ErroValidacaoCuidados('Tipo de registro clínico é inválido');
    }
    const dataHora = validarDataHora(dados.dataHora, 'Data e hora do registro');
    validarHorarioNaReserva(dataHora, reserva);

    const registro = RegistroClinicoRepository.create({
      petId: reserva.petId,
      reservaId: reserva.id,
      tipo,
      dataHora,
      descricao: validarTextoObrigatorio(dados.descricao, 'Descrição', 2000),
      temperatura: validarNumeroOpcional(
        dados.temperatura,
        'Temperatura',
        30,
        45,
        1,
      ),
      peso: validarNumeroOpcional(dados.peso, 'Peso', 0.01, 9999.99, 2),
    });
    return RegistroClinicoRepository.save(registro);
  }

  async criarLembrete(reservaIdInformado: unknown, dados: Record<string, unknown>) {
    const reserva = await buscarReserva(reservaIdInformado);
    if (
      reserva.status !== StatusReserva.AGENDADA &&
      reserva.status !== StatusReserva.EM_ANDAMENTO
    ) {
      throw new ErroConflitoCuidados(
        'Lembretes só podem ser criados para reservas agendadas ou em andamento',
      );
    }
    const horarioProgramado = validarDataHora(
      dados.horarioProgramado,
      'Horário programado',
    );
    validarHorarioNaReserva(horarioProgramado, reserva);

    const lembrete = LembreteMedicamentoRepository.create({
      petId: reserva.petId,
      reservaId: reserva.id,
      medicamento: validarTextoObrigatorio(
        dados.medicamento,
        'Medicamento',
        150,
      ),
      dosagem: validarTextoObrigatorio(dados.dosagem, 'Dosagem', 100),
      viaAdministracao: validarTextoOpcional(
        dados.viaAdministracao,
        'Via de administração',
        80,
      ),
      horarioProgramado,
      observacoes: validarTextoOpcional(dados.observacoes, 'Observações', 2000),
      status: StatusLembreteMedicamento.PENDENTE,
    });
    return LembreteMedicamentoRepository.save(lembrete);
  }

  async listarLembretes(filtros: {
    reservaId?: unknown;
    status?: unknown;
    dataInicio?: unknown;
    dataFim?: unknown;
  }) {
    const consulta = LembreteMedicamentoRepository.createQueryBuilder('lembrete')
      .innerJoinAndSelect('lembrete.pet', 'pet')
      .innerJoinAndSelect('lembrete.reserva', 'reserva')
      .orderBy('lembrete.horarioProgramado', 'ASC');

    if (filtros.reservaId !== undefined) {
      const reservaId = validarUuid(filtros.reservaId, 'Informe uma reserva válida');
      consulta.andWhere('lembrete.reservaId = :reservaId', { reservaId });
    }
    if (filtros.status !== undefined) {
      const status = typeof filtros.status === 'string'
        ? filtros.status.trim().toUpperCase() as StatusLembreteMedicamento
        : undefined;
      if (!status || !Object.values(StatusLembreteMedicamento).includes(status)) {
        throw new ErroValidacaoCuidados('Status do lembrete é inválido');
      }
      consulta.andWhere('lembrete.status = :status', { status });
    }
    if (filtros.dataInicio !== undefined) {
      const dataInicio = validarDataHora(filtros.dataInicio, 'Data inicial');
      consulta.andWhere('lembrete.horarioProgramado >= :dataInicio', { dataInicio });
    }
    if (filtros.dataFim !== undefined) {
      const dataFim = validarDataHora(filtros.dataFim, 'Data final');
      consulta.andWhere('lembrete.horarioProgramado <= :dataFim', { dataFim });
    }
    return consulta.getMany();
  }

  async alterarStatusLembrete(
    idInformado: unknown,
    dados: Record<string, unknown>,
  ) {
    const id = validarUuid(idInformado, 'Informe um lembrete válido');
    const lembrete = await LembreteMedicamentoRepository.createQueryBuilder('lembrete')
      .innerJoinAndSelect('lembrete.reserva', 'reserva')
      .where('lembrete.id = :id', { id })
      .getOne();
    if (!lembrete) {
      throw new ErroCuidadosNaoEncontrado('Lembrete não encontrado');
    }
    if (lembrete.status !== StatusLembreteMedicamento.PENDENTE) {
      throw new ErroConflitoCuidados('Somente lembretes pendentes podem ser atualizados');
    }
    if (lembrete.reserva.status !== StatusReserva.EM_ANDAMENTO) {
      throw new ErroConflitoCuidados(
        'A administração só pode ser registrada durante a hospedagem',
      );
    }

    const status = typeof dados.status === 'string'
      ? dados.status.trim().toUpperCase() as StatusLembreteMedicamento
      : undefined;
    if (
      status !== StatusLembreteMedicamento.ADMINISTRADO &&
      status !== StatusLembreteMedicamento.NAO_ADMINISTRADO
    ) {
      throw new ErroValidacaoCuidados(
        'Status deve ser ADMINISTRADO ou NAO_ADMINISTRADO',
      );
    }
    const motivo = validarTextoOpcional(
      dados.motivoNaoAdministrado,
      'Motivo da não administração',
      2000,
    );
    if (status === StatusLembreteMedicamento.NAO_ADMINISTRADO && !motivo) {
      throw new ErroValidacaoCuidados(
        'Informe o motivo da não administração',
      );
    }

    lembrete.status = status;
    lembrete.administradoEm =
      status === StatusLembreteMedicamento.ADMINISTRADO ? new Date() : null;
    lembrete.motivoNaoAdministrado = motivo;
    return LembreteMedicamentoRepository.save(lembrete);
  }

  async cancelarLembrete(idInformado: unknown): Promise<void> {
    const id = validarUuid(idInformado, 'Informe um lembrete válido');
    const lembrete = await LembreteMedicamentoRepository.findOneBy({ id });
    if (!lembrete) {
      throw new ErroCuidadosNaoEncontrado('Lembrete não encontrado');
    }
    if (lembrete.status !== StatusLembreteMedicamento.PENDENTE) {
      throw new ErroConflitoCuidados('Somente lembretes pendentes podem ser cancelados');
    }
    lembrete.status = StatusLembreteMedicamento.CANCELADO;
    await LembreteMedicamentoRepository.save(lembrete);
  }
}
