import 'reflect-metadata';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import app from '../app';
import { AppDataSource } from '../config/database';
import {
  ModalidadeCobranca,
  StatusReserva,
} from '../entities/Reserva';
import { PetRepository } from '../repositories/PetRepository';
import { ReservaRepository } from '../repositories/ReservaRepository';
import { TutorRepository } from '../repositories/TutorRepository';
import { UsuarioRepository } from '../repositories/UsuarioRepository';

const segredoTeste = 'chave-exclusiva-para-testes-com-mais-de-32-caracteres';
const identificadorTeste = Date.now();

let usuarioId: string;
let tokenAdministrativo: string;
let tutorId: string;
let petId: string;
let outroPetId: string;
let reservaDiariaId: string;
let reservaHoraId: string;

beforeAll(async () => {
  process.env.JWT_SECRET = segredoTeste;
  process.env.JWT_EXPIRES_IN = '2h';

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const usuario = await UsuarioRepository.save(
    UsuarioRepository.create({
      nome: 'Proprietária Teste Reserva',
      email: `teste.admin.reserva.${identificadorTeste}@petzin.local`,
      senhaHash: await bcrypt.hash('Teste@123', 12),
    }),
  );
  usuarioId = usuario.id;
  tokenAdministrativo = jwt.sign({}, segredoTeste, {
    subject: usuarioId,
    expiresIn: '2h',
  });

  const tutor = await TutorRepository.save(
    TutorRepository.create({
      nome: 'Tutor das Reservas',
      telefone: '92999999999',
    }),
  );
  tutorId = tutor.id;

  const [pet, outroPet] = await PetRepository.save([
    PetRepository.create({
      nome: 'Rex Reserva',
      especie: 'Cachorro',
      tutorId,
    }),
    PetRepository.create({
      nome: 'Luna Reserva',
      especie: 'Gato',
      tutorId,
    }),
  ]);
  petId = pet.id;
  outroPetId = outroPet.id;
});

afterAll(async () => {
  if (AppDataSource.isInitialized) {
    await ReservaRepository.delete({ petId });
    await ReservaRepository.delete({ petId: outroPetId });
    await PetRepository.delete({ id: petId });
    await PetRepository.delete({ id: outroPetId });
    await TutorRepository.delete({ id: tutorId });
    await UsuarioRepository.delete({ id: usuarioId });
    await AppDataSource.destroy();
  }
});

describe('API administrativa de reservas', () => {
  it('protege as rotas com JWT', async () => {
    const [cadastro, listagem] = await Promise.all([
      request(app).post('/reservas').send({}),
      request(app).get('/reservas'),
    ]);

    expect(cadastro.status).toBe(401);
    expect(listagem.status).toBe(401);
  });

  it.each([
    [
      {
        petId,
        dataEntrada: '2030-01-01T08:00:00',
        dataSaida: '2030-01-01T10:00:00-04:00',
        numeroCanil: 1,
        modalidade: 'HORA',
      },
      'Data de entrada deve ser uma data e hora ISO 8601 com fuso horário',
    ],
    [
      {
        petId,
        dataEntrada: '2030-01-01T10:00:00-04:00',
        dataSaida: '2030-01-01T09:00:00-04:00',
        numeroCanil: 1,
        modalidade: 'HORA',
      },
      'Data de saída deve ser posterior à data de entrada',
    ],
    [
      {
        petId,
        dataEntrada: '2030-01-01T08:00:00-04:00',
        dataSaida: '2030-01-01T10:00:00-04:00',
        numeroCanil: 0,
        modalidade: 'HORA',
      },
      'Número do canil deve ser um número inteiro maior que zero',
    ],
    [
      {
        petId,
        dataEntrada: '2030-01-01T08:00:00-04:00',
        dataSaida: '2030-01-01T10:00:00-04:00',
        numeroCanil: 1,
        modalidade: 'MENSAL',
      },
      'Modalidade de cobrança é inválida',
    ],
  ])('rejeita dados inválidos no cadastro', async (dados, mensagem) => {
    const resposta = await request(app)
      .post('/reservas')
      .set('Authorization', `Bearer ${tokenAdministrativo}`)
      .send({ ...dados, petId });

    expect(resposta.status).toBe(400);
    expect(resposta.body).toEqual({ mensagem });
  });

  it('cadastra múltiplas diárias e horas excedentes sem aceitar valor externo', async () => {
    const resposta = await request(app)
      .post('/reservas')
      .set('Authorization', `Bearer ${tokenAdministrativo}`)
      .send({
        petId,
        dataEntrada: '2030-01-01T08:00:00-04:00',
        dataSaida: '2030-01-03T09:01:00-04:00',
        numeroCanil: 5,
        modalidade: 'diaria',
        observacoes: '  Levar a caminha do pet.  ',
        valorTotal: 1,
        tarifaHora: 1,
        tarifaDiaria: 1,
      });

    expect(resposta.status).toBe(201);
    expect(resposta.body).toMatchObject({
      petId,
      numeroCanil: 5,
      modalidade: ModalidadeCobranca.DIARIA,
      tarifaHora: 10,
      tarifaDiaria: 240,
      valorTotal: 500,
      status: StatusReserva.AGENDADA,
      observacoes: 'Levar a caminha do pet.',
    });
    reservaDiariaId = resposta.body.id;
  });

  it('impede sobreposição no mesmo canil', async () => {
    const resposta = await request(app)
      .post('/reservas')
      .set('Authorization', `Bearer ${tokenAdministrativo}`)
      .send({
        petId: outroPetId,
        dataEntrada: '2030-01-02T08:00:00-04:00',
        dataSaida: '2030-01-02T10:00:00-04:00',
        numeroCanil: 5,
        modalidade: 'HORA',
      });

    expect(resposta.status).toBe(409);
    expect(resposta.body).toEqual({
      mensagem: 'O canil já possui uma reserva nesse período',
    });
  });

  it('impede reservas simultâneas para o mesmo pet em canis diferentes', async () => {
    const resposta = await request(app)
      .post('/reservas')
      .set('Authorization', `Bearer ${tokenAdministrativo}`)
      .send({
        petId,
        dataEntrada: '2030-01-02T08:00:00-04:00',
        dataSaida: '2030-01-02T10:00:00-04:00',
        numeroCanil: 8,
        modalidade: 'HORA',
      });

    expect(resposta.status).toBe(409);
    expect(resposta.body).toEqual({
      mensagem: 'O pet já possui uma reserva nesse período',
    });
  });

  it('aceita outra reserva iniciando exatamente após a anterior', async () => {
    const resposta = await request(app)
      .post('/reservas')
      .set('Authorization', `Bearer ${tokenAdministrativo}`)
      .send({
        petId,
        dataEntrada: '2030-01-03T09:01:00-04:00',
        dataSaida: '2030-01-03T10:02:00-04:00',
        numeroCanil: 5,
        modalidade: 'HORA',
      });

    expect(resposta.status).toBe(201);
    expect(resposta.body.valorTotal).toBe(20);
    reservaHoraId = resposta.body.id;
  });

  it('lista, filtra e consulta reservas com pet e tutor', async () => {
    const [listagem, filtro, detalhe] = await Promise.all([
      request(app)
        .get('/reservas')
        .set('Authorization', `Bearer ${tokenAdministrativo}`),
      request(app)
        .get(`/reservas?petId=${petId}&status=agendada`)
        .set('Authorization', `Bearer ${tokenAdministrativo}`),
      request(app)
        .get(`/reservas/${reservaDiariaId}`)
        .set('Authorization', `Bearer ${tokenAdministrativo}`),
    ]);

    expect(listagem.status).toBe(200);
    expect(filtro.status).toBe(200);
    expect(filtro.body).toHaveLength(2);
    expect(detalhe.status).toBe(200);
    expect(detalhe.body.pet.id).toBe(petId);
    expect(detalhe.body.pet.tutor.id).toBe(tutorId);
  });

  it('recalcula o valor ao alterar o período', async () => {
    const resposta = await request(app)
      .put(`/reservas/${reservaHoraId}`)
      .set('Authorization', `Bearer ${tokenAdministrativo}`)
      .send({ dataSaida: '2030-01-03T11:02:00-04:00' });

    expect(resposta.status).toBe(200);
    expect(resposta.body.valorTotal).toBe(30);
    expect(resposta.body.tarifaHora).toBe(10);
    expect(resposta.body.tarifaDiaria).toBe(240);
  });

  it('controla as transições de status e bloqueia edição posterior', async () => {
    const andamento = await request(app)
      .patch(`/reservas/${reservaHoraId}/status`)
      .set('Authorization', `Bearer ${tokenAdministrativo}`)
      .send({ status: 'EM_ANDAMENTO' });
    const edicao = await request(app)
      .put(`/reservas/${reservaHoraId}`)
      .set('Authorization', `Bearer ${tokenAdministrativo}`)
      .send({ numeroCanil: 9 });
    const conclusao = await request(app)
      .patch(`/reservas/${reservaHoraId}/status`)
      .set('Authorization', `Bearer ${tokenAdministrativo}`)
      .send({ status: 'CONCLUIDA' });

    expect(andamento.status).toBe(200);
    expect(andamento.body.status).toBe(StatusReserva.EM_ANDAMENTO);
    expect(edicao.status).toBe(409);
    expect(conclusao.status).toBe(200);
    expect(conclusao.body.status).toBe(StatusReserva.CONCLUIDA);
  });

  it('cancela uma reserva sem apagar o histórico', async () => {
    const cancelamento = await request(app)
      .delete(`/reservas/${reservaDiariaId}`)
      .set('Authorization', `Bearer ${tokenAdministrativo}`);
    const reservaPersistida = await ReservaRepository.findOneByOrFail({
      id: reservaDiariaId,
    });

    expect(cancelamento.status).toBe(204);
    expect(reservaPersistida.status).toBe(StatusReserva.CANCELADA);
  });
});
