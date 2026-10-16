import { SexoPet } from '../entities/Pet';
import { StatusReserva } from '../entities/Reserva';
import { PetRepository } from '../repositories/PetRepository';
import { ReservaRepository } from '../repositories/ReservaRepository';
import { TutorRepository } from '../repositories/TutorRepository';
import { In } from 'typeorm';

export class ErroValidacaoPet extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = 'ErroValidacaoPet';
  }
}

export class ErroPetNaoEncontrado extends Error {
  constructor() {
    super('Pet não encontrado');
    this.name = 'ErroPetNaoEncontrado';
  }
}

export class ErroConflitoPet extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = 'ErroConflitoPet';
  }
}

interface DadosCadastroPet {
  tutorId: unknown;
  nome: unknown;
  especie: unknown;
  raca?: unknown;
  sexo?: unknown;
  dataNascimento?: unknown;
  pesoAtual?: unknown;
  fotoUrl?: unknown;
  observacoes?: unknown;
}

type DadosAtualizacaoPet = Partial<DadosCadastroPet>;

const regexUuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validarTutorId(valor: unknown): string {
  if (typeof valor !== 'string' || !regexUuid.test(valor)) {
    throw new ErroValidacaoPet('Informe um tutor válido');
  }

  return valor;
}

function validarPetId(valor: unknown): string {
  if (typeof valor !== 'string' || !regexUuid.test(valor)) {
    throw new ErroValidacaoPet('Informe um identificador de pet válido');
  }

  return valor;
}

async function buscarTutorAtivo(tutorId: string) {
  const tutor = await TutorRepository.findOne({
    where: { id: tutorId, ativo: true },
  });

  if (!tutor) {
    throw new ErroValidacaoPet('Tutor não encontrado ou inativo');
  }

  return tutor;
}

function validarTextoObrigatorio(
  valor: unknown,
  campo: string,
  tamanhoMaximo: number,
): string {
  if (typeof valor !== 'string' || valor.trim().length === 0) {
    throw new ErroValidacaoPet(`${campo} é obrigatório`);
  }

  const texto = valor.trim();

  if (texto.length > tamanhoMaximo) {
    throw new ErroValidacaoPet(
      `${campo} deve possuir no máximo ${tamanhoMaximo} caracteres`,
    );
  }

  return texto;
}

function validarTextoOpcional(
  valor: unknown,
  campo: string,
  tamanhoMaximo?: number,
): string | null {
  if (valor === undefined || valor === null || valor === '') {
    return null;
  }

  if (typeof valor !== 'string') {
    throw new ErroValidacaoPet(`${campo} deve ser um texto`);
  }

  const texto = valor.trim();

  if (texto.length === 0) {
    return null;
  }

  if (tamanhoMaximo && texto.length > tamanhoMaximo) {
    throw new ErroValidacaoPet(
      `${campo} deve possuir no máximo ${tamanhoMaximo} caracteres`,
    );
  }

  return texto;
}

function validarDataNascimento(valor: unknown): string | null {
  if (valor === undefined || valor === null || valor === '') {
    return null;
  }

  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    throw new ErroValidacaoPet(
      'Data de nascimento deve estar no formato AAAA-MM-DD',
    );
  }

  const data = new Date(`${valor}T00:00:00.000Z`);

  if (
    Number.isNaN(data.getTime()) ||
    data.toISOString().slice(0, 10) !== valor
  ) {
    throw new ErroValidacaoPet('Data de nascimento inválida');
  }

  const hoje = new Date().toISOString().slice(0, 10);

  if (valor > hoje) {
    throw new ErroValidacaoPet('Data de nascimento não pode estar no futuro');
  }

  return valor;
}

function validarPeso(valor: unknown): number | null {
  if (valor === undefined || valor === null || valor === '') {
    return null;
  }

  if (
    typeof valor !== 'number' ||
    !Number.isFinite(valor) ||
    valor <= 0 ||
    valor > 9999.99
  ) {
    throw new ErroValidacaoPet(
      'Peso deve ser um número maior que zero e menor que 10000',
    );
  }

  if (Number(valor.toFixed(2)) !== valor) {
    throw new ErroValidacaoPet('Peso deve possuir no máximo duas casas decimais');
  }

  return valor;
}

function validarSexo(valor: unknown): SexoPet {
  if (valor === undefined || valor === null || valor === '') {
    return SexoPet.NAO_INFORMADO;
  }

  if (typeof valor !== 'string') {
    throw new ErroValidacaoPet('Sexo informado é inválido');
  }

  const sexo = valor.trim().toUpperCase() as SexoPet;

  if (!Object.values(SexoPet).includes(sexo)) {
    throw new ErroValidacaoPet('Sexo informado é inválido');
  }

  return sexo;
}

export class PetService {
  async cadastrar(dados: DadosCadastroPet) {
    const tutorId = validarTutorId(dados.tutorId);
    await buscarTutorAtivo(tutorId);

    const pet = PetRepository.create({
      nome: validarTextoObrigatorio(dados.nome, 'Nome', 150),
      especie: validarTextoObrigatorio(dados.especie, 'Espécie', 50),
      raca: validarTextoOpcional(dados.raca, 'Raça', 100),
      sexo: validarSexo(dados.sexo),
      dataNascimento: validarDataNascimento(dados.dataNascimento),
      pesoAtual: validarPeso(dados.pesoAtual),
      fotoUrl: validarTextoOpcional(dados.fotoUrl, 'Foto', 500),
      observacoes: validarTextoOpcional(
        dados.observacoes,
        'Observações',
        2000,
      ),
      tutorId,
    });

    return PetRepository.save(pet);
  }

  async listar(filtroTutorId: unknown) {
    let tutorId: string | undefined;

    if (filtroTutorId !== undefined) {
      tutorId = validarTutorId(filtroTutorId);
    }

    const consulta = PetRepository.createQueryBuilder('pet')
      .innerJoinAndSelect('pet.tutor', 'tutor')
      .where('pet.ativo = :petAtivo', { petAtivo: true })
      .andWhere('tutor.ativo = :tutorAtivo', { tutorAtivo: true })
      .orderBy('pet.criadoEm', 'DESC');

    if (tutorId) {
      consulta.andWhere('pet.tutorId = :tutorId', { tutorId });
    }

    return consulta.getMany();
  }

  async buscarPorId(idInformado: unknown) {
    const id = validarPetId(idInformado);
    const pet = await PetRepository.createQueryBuilder('pet')
      .innerJoinAndSelect('pet.tutor', 'tutor')
      .where('pet.id = :id', { id })
      .andWhere('pet.ativo = :petAtivo', { petAtivo: true })
      .andWhere('tutor.ativo = :tutorAtivo', { tutorAtivo: true })
      .getOne();

    if (!pet) {
      throw new ErroPetNaoEncontrado();
    }

    return pet;
  }

  async atualizar(idInformado: unknown, dados: DadosAtualizacaoPet) {
    const id = validarPetId(idInformado);
    const pet = await PetRepository.findOne({
      where: { id, ativo: true },
    });

    if (!pet) {
      throw new ErroPetNaoEncontrado();
    }

    const camposPermitidos = [
      'tutorId',
      'nome',
      'especie',
      'raca',
      'sexo',
      'dataNascimento',
      'pesoAtual',
      'fotoUrl',
      'observacoes',
    ] as const;
    const possuiCampoParaAtualizar = camposPermitidos.some((campo) =>
      Object.prototype.hasOwnProperty.call(dados, campo),
    );

    if (!possuiCampoParaAtualizar) {
      throw new ErroValidacaoPet('Informe ao menos um campo para atualizar');
    }

    if (Object.prototype.hasOwnProperty.call(dados, 'tutorId')) {
      const tutorId = validarTutorId(dados.tutorId);
      await buscarTutorAtivo(tutorId);
      pet.tutorId = tutorId;
    }

    if (Object.prototype.hasOwnProperty.call(dados, 'nome')) {
      pet.nome = validarTextoObrigatorio(dados.nome, 'Nome', 150);
    }

    if (Object.prototype.hasOwnProperty.call(dados, 'especie')) {
      pet.especie = validarTextoObrigatorio(dados.especie, 'Espécie', 50);
    }

    if (Object.prototype.hasOwnProperty.call(dados, 'raca')) {
      pet.raca = validarTextoOpcional(dados.raca, 'Raça', 100);
    }

    if (Object.prototype.hasOwnProperty.call(dados, 'sexo')) {
      pet.sexo = validarSexo(dados.sexo);
    }

    if (Object.prototype.hasOwnProperty.call(dados, 'dataNascimento')) {
      pet.dataNascimento = validarDataNascimento(dados.dataNascimento);
    }

    if (Object.prototype.hasOwnProperty.call(dados, 'pesoAtual')) {
      pet.pesoAtual = validarPeso(dados.pesoAtual);
    }

    if (Object.prototype.hasOwnProperty.call(dados, 'fotoUrl')) {
      pet.fotoUrl = validarTextoOpcional(dados.fotoUrl, 'Foto', 500);
    }

    if (Object.prototype.hasOwnProperty.call(dados, 'observacoes')) {
      pet.observacoes = validarTextoOpcional(
        dados.observacoes,
        'Observações',
        2000,
      );
    }

    return PetRepository.save(pet);
  }

  async desativar(idInformado: unknown): Promise<void> {
    const id = validarPetId(idInformado);
    const pet = await PetRepository.findOne({
      where: { id, ativo: true },
    });

    if (!pet) {
      throw new ErroPetNaoEncontrado();
    }

    const quantidadeReservasAtivas = await ReservaRepository.count({
      where: {
        petId: id,
        status: In([
          StatusReserva.AGENDADA,
          StatusReserva.EM_ANDAMENTO,
        ]),
      },
    });

    if (quantidadeReservasAtivas > 0) {
      throw new ErroConflitoPet(
        'Não é possível desativar um pet que possui reservas ativas',
      );
    }

    pet.ativo = false;
    await PetRepository.save(pet);
  }
}
