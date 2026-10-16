import { PetRepository } from '../repositories/PetRepository';
import { TutorRepository } from '../repositories/TutorRepository';

export class ErroValidacaoTutor extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = 'ErroValidacaoTutor';
  }
}

export class ErroTutorNaoEncontrado extends Error {
  constructor() {
    super('Tutor não encontrado');
    this.name = 'ErroTutorNaoEncontrado';
  }
}

export class ErroConflitoTutor extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = 'ErroConflitoTutor';
  }
}

interface DadosCadastroTutor {
  nome: unknown;
  telefone: unknown;
  email?: unknown;
  observacoes?: unknown;
}

type DadosAtualizacaoTutor = Partial<DadosCadastroTutor>;

const regexUuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validarId(valor: unknown): string {
  if (typeof valor !== 'string' || !regexUuid.test(valor)) {
    throw new ErroValidacaoTutor('Informe um identificador de tutor válido');
  }

  return valor;
}

function validarNome(valor: unknown): string {
  if (typeof valor !== 'string' || valor.trim().length === 0) {
    throw new ErroValidacaoTutor('Nome é obrigatório');
  }

  const nome = valor.trim();

  if (nome.length > 150) {
    throw new ErroValidacaoTutor('Nome deve possuir no máximo 150 caracteres');
  }

  return nome;
}

function validarTelefone(valor: unknown): string {
  if (typeof valor !== 'string') {
    throw new ErroValidacaoTutor('Telefone é obrigatório');
  }

  const telefone = valor.replace(/\D/g, '');

  if (telefone.length < 10 || telefone.length > 15) {
    throw new ErroValidacaoTutor('Informe um telefone válido');
  }

  return telefone;
}

function validarEmail(valor: unknown): string | null {
  if (valor === undefined || valor === null || valor === '') {
    return null;
  }

  if (typeof valor !== 'string') {
    throw new ErroValidacaoTutor('Informe um e-mail válido');
  }

  const email = valor.trim().toLowerCase();
  const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!regexEmail.test(email) || email.length > 255) {
    throw new ErroValidacaoTutor('Informe um e-mail válido');
  }

  return email;
}

function validarObservacoes(valor: unknown): string | null {
  if (valor === undefined || valor === null || valor === '') {
    return null;
  }

  if (typeof valor !== 'string') {
    throw new ErroValidacaoTutor('Observações devem ser um texto');
  }

  const observacoes = valor.trim();

  if (observacoes.length === 0) {
    return null;
  }

  if (observacoes.length > 2000) {
    throw new ErroValidacaoTutor(
      'Observações devem possuir no máximo 2000 caracteres',
    );
  }

  return observacoes;
}

export class TutorService {
  async cadastrar(dados: DadosCadastroTutor) {
    const tutor = TutorRepository.create({
      nome: validarNome(dados.nome),
      telefone: validarTelefone(dados.telefone),
      email: validarEmail(dados.email),
      observacoes: validarObservacoes(dados.observacoes),
    });

    return TutorRepository.save(tutor);
  }

  async listar() {
    return TutorRepository.find({
      where: { ativo: true },
      order: { nome: 'ASC' },
    });
  }

  async buscarPorId(idInformado: unknown) {
    const id = validarId(idInformado);
    const tutor = await TutorRepository.createQueryBuilder('tutor')
      .leftJoinAndSelect(
        'tutor.pets',
        'pet',
        'pet.ativo = :petAtivo',
        { petAtivo: true },
      )
      .where('tutor.id = :id', { id })
      .andWhere('tutor.ativo = :tutorAtivo', { tutorAtivo: true })
      .orderBy('pet.nome', 'ASC')
      .getOne();

    if (!tutor) {
      throw new ErroTutorNaoEncontrado();
    }

    return tutor;
  }

  async atualizar(idInformado: unknown, dados: DadosAtualizacaoTutor) {
    const id = validarId(idInformado);
    const tutor = await TutorRepository.findOne({
      where: { id, ativo: true },
    });

    if (!tutor) {
      throw new ErroTutorNaoEncontrado();
    }

    const camposPermitidos = ['nome', 'telefone', 'email', 'observacoes'] as const;
    const possuiCampoParaAtualizar = camposPermitidos.some((campo) =>
      Object.prototype.hasOwnProperty.call(dados, campo),
    );

    if (!possuiCampoParaAtualizar) {
      throw new ErroValidacaoTutor('Informe ao menos um campo para atualizar');
    }

    if (Object.prototype.hasOwnProperty.call(dados, 'nome')) {
      tutor.nome = validarNome(dados.nome);
    }

    if (Object.prototype.hasOwnProperty.call(dados, 'telefone')) {
      tutor.telefone = validarTelefone(dados.telefone);
    }

    if (Object.prototype.hasOwnProperty.call(dados, 'email')) {
      tutor.email = validarEmail(dados.email);
    }

    if (Object.prototype.hasOwnProperty.call(dados, 'observacoes')) {
      tutor.observacoes = validarObservacoes(dados.observacoes);
    }

    return TutorRepository.save(tutor);
  }

  async desativar(idInformado: unknown): Promise<void> {
    const id = validarId(idInformado);
    const tutor = await TutorRepository.findOne({
      where: { id, ativo: true },
    });

    if (!tutor) {
      throw new ErroTutorNaoEncontrado();
    }

    const quantidadePetsAtivos = await PetRepository.count({
      where: { tutorId: id, ativo: true },
    });

    if (quantidadePetsAtivos > 0) {
      throw new ErroConflitoTutor(
        'Não é possível desativar um tutor que possui pets ativos',
      );
    }

    tutor.ativo = false;
    await TutorRepository.save(tutor);
  }
}
