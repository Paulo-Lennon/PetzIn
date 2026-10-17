import 'reflect-metadata';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import app from '../app';
import { AppDataSource } from '../config/database';
import {
  FichaClinicaRepository,
  LembreteMedicamentoRepository,
  RegistroClinicoRepository,
} from '../repositories/CuidadosRepository';
import { PetRepository } from '../repositories/PetRepository';
import { ReservaRepository } from '../repositories/ReservaRepository';
import { TutorRepository } from '../repositories/TutorRepository';
import { UsuarioRepository } from '../repositories/UsuarioRepository';

const segredo = 'chave-de-testes-cuidados-com-mais-de-32-caracteres';
const sufixo = Date.now();
let usuarioId: string;
let tutorId: string;
let petId: string;
let reservaId: string;
let token: string;
let lembretePendenteId: string;

beforeAll(async () => {
  process.env.JWT_SECRET = segredo;
  if (!AppDataSource.isInitialized) await AppDataSource.initialize();

  const usuario = await UsuarioRepository.save(
    UsuarioRepository.create({
      nome: 'Administradora Cuidados',
      email: `cuidados.${sufixo}@petzin.local`,
      senhaHash: await bcrypt.hash('Teste@123', 12),
    }),
  );
  usuarioId = usuario.id;
  token = jwt.sign({}, segredo, { subject: usuarioId, expiresIn: '2h' });

  const tutor = await TutorRepository.save(
    TutorRepository.create({ nome: 'Tutor Cuidados', telefone: '92999999999' }),
  );
  tutorId = tutor.id;
  const pet = await PetRepository.save(
    PetRepository.create({ nome: 'Nina Cuidados', especie: 'Cachorro', tutorId }),
  );
  petId = pet.id;

  const cadastro = await request(app)
    .post('/reservas')
    .set('Authorization', `Bearer ${token}`)
    .send({
      petId,
      dataEntrada: '2035-06-10T08:00:00-04:00',
      dataSaida: '2035-06-11T08:00:00-04:00',
      numeroCanil: 91,
      modalidade: 'DIARIA',
    });
  reservaId = cadastro.body.id;
});

afterAll(async () => {
  if (AppDataSource.isInitialized) {
    await LembreteMedicamentoRepository.delete({ reservaId });
    await RegistroClinicoRepository.delete({ reservaId });
    await FichaClinicaRepository.delete({ petId });
    await ReservaRepository.delete({ id: reservaId });
    await PetRepository.delete({ id: petId });
    await TutorRepository.delete({ id: tutorId });
    await UsuarioRepository.delete({ id: usuarioId });
    await AppDataSource.destroy();
  }
});

describe('API de cuidados clínicos e medicamentos', () => {
  it('protege as rotas com JWT', async () => {
    const resposta = await request(app).get(`/pets/${petId}/ficha-clinica`);
    expect(resposta.status).toBe(401);
  });

  it('cria e atualiza a ficha clínica individual do pet', async () => {
    const atualizacao = await request(app)
      .put(`/pets/${petId}/ficha-clinica`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        vacinasEmDia: true,
        alergias: 'Dipirona',
        condicoesClinicas: 'N/A',
        restricoesAlimentares: 'Sem frango',
        veterinarioNome: 'Dra. Marina',
        veterinarioTelefone: '(92) 99999-1111',
        observacoes: 'N/A',
      });
    const consulta = await request(app)
      .get(`/pets/${petId}/ficha-clinica`)
      .set('Authorization', `Bearer ${token}`);

    expect(atualizacao.status).toBe(200);
    expect(atualizacao.body).toMatchObject({
      petId,
      vacinasEmDia: true,
      alergias: 'Dipirona',
      veterinarioTelefone: '92999991111',
    });
    expect(consulta.status).toBe(200);
    expect(consulta.body.pet.id).toBe(petId);
    expect(consulta.body.ficha.alergias).toBe('Dipirona');
  });

  it('exige o preenchimento completo da ficha clínica', async () => {
    const resposta = await request(app)
      .put(`/pets/${petId}/ficha-clinica`)
      .set('Authorization', `Bearer ${token}`)
      .send({ vacinasEmDia: true, alergias: 'N/A' });

    expect(resposta.status).toBe(400);
    expect(resposta.body).toEqual({
      mensagem:
        'Preencha todos os campos. Se não houver nada a declarar, informe N/A',
    });
  });

  it('agenda doses somente dentro do período da reserva', async () => {
    const invalido = await request(app)
      .post(`/reservas/${reservaId}/lembretes-medicamentos`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        medicamento: 'Antibiótico',
        dosagem: '1 comprimido',
        horarioProgramado: '2035-06-12T09:00:00-04:00',
      });
    const valido = await request(app)
      .post(`/reservas/${reservaId}/lembretes-medicamentos`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        medicamento: 'Antibiótico',
        dosagem: '1 comprimido',
        viaAdministracao: 'Oral',
        horarioProgramado: '2035-06-10T09:00:00-04:00',
      });

    expect(invalido.status).toBe(400);
    expect(valido.status).toBe(201);
    expect(valido.body.status).toBe('PENDENTE');
    lembretePendenteId = valido.body.id;
  });

  it('registra cuidados somente durante a hospedagem', async () => {
    const antes = await request(app)
      .post(`/reservas/${reservaId}/registros-clinicos`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        tipo: 'ALIMENTACAO',
        dataHora: '2035-06-10T08:30:00-04:00',
        descricao: 'Aceitou toda a refeição.',
      });
    await request(app)
      .patch(`/reservas/${reservaId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'EM_ANDAMENTO' });
    const durante = await request(app)
      .post(`/reservas/${reservaId}/registros-clinicos`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        tipo: 'SINAIS_VITAIS',
        dataHora: '2035-06-10T08:30:00-04:00',
        descricao: 'Avaliação de rotina sem alterações.',
        temperatura: 38.4,
        peso: 12.35,
      });

    expect(antes.status).toBe(409);
    expect(durante.status).toBe(201);
    expect(durante.body).toMatchObject({ petId, reservaId, temperatura: 38.4 });
  });

  it('impede conclusão com dose pendente e preserva a decisão clínica', async () => {
    const bloqueio = await request(app)
      .patch(`/reservas/${reservaId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'CONCLUIDA' });
    const resolucao = await request(app)
      .patch(`/lembretes-medicamentos/${lembretePendenteId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'NAO_ADMINISTRADO',
        motivoNaoAdministrado: 'Tutor solicitou suspensão.',
      });
    const conclusao = await request(app)
      .patch(`/reservas/${reservaId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'CONCLUIDA' });

    expect(bloqueio.status).toBe(409);
    expect(resolucao.status).toBe(200);
    expect(resolucao.body).toMatchObject({
      status: 'NAO_ADMINISTRADO',
      motivoNaoAdministrado: 'Tutor solicitou suspensão.',
    });
    expect(conclusao.status).toBe(200);
    expect(conclusao.body.status).toBe('CONCLUIDA');
  });

  it('consulta o histórico clínico e os lembretes da reserva', async () => {
    const [registros, lembretes] = await Promise.all([
      request(app)
        .get(`/pets/${petId}/registros-clinicos`)
        .set('Authorization', `Bearer ${token}`),
      request(app)
        .get('/lembretes-medicamentos')
        .query({ reservaId })
        .set('Authorization', `Bearer ${token}`),
    ]);
    expect(registros.status).toBe(200);
    expect(registros.body).toHaveLength(1);
    expect(lembretes.status).toBe(200);
    expect(lembretes.body).toHaveLength(1);
  });
});
