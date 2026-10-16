import 'reflect-metadata';
import bcrypt from 'bcrypt';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import app from '../app';
import { AppDataSource } from '../config/database';
import { StatusPagamento, StatusReserva } from '../entities/Reserva';
import { PetRepository } from '../repositories/PetRepository';
import { ReservaRepository } from '../repositories/ReservaRepository';
import { TutorRepository } from '../repositories/TutorRepository';
import { UsuarioRepository } from '../repositories/UsuarioRepository';

const segredoTeste = 'chave-exclusiva-para-testes-com-mais-de-32-caracteres';
const senhaTeste = 'Fluxo@123';
const identificadorTeste = Date.now();
const emailTeste = `fluxo.completo.${identificadorTeste}@petzin.local`;

let usuarioId: string | undefined;
let tutorId: string | undefined;
let petId: string | undefined;
let reservaId: string | undefined;

beforeAll(async () => {
  process.env.JWT_SECRET = segredoTeste;
  process.env.JWT_EXPIRES_IN = '2h';

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const usuario = await UsuarioRepository.save(
    UsuarioRepository.create({
      nome: 'Administradora Fluxo Completo',
      email: emailTeste,
      senhaHash: await bcrypt.hash(senhaTeste, 12),
    }),
  );
  usuarioId = usuario.id;
});

afterAll(async () => {
  if (AppDataSource.isInitialized) {
    if (reservaId) await ReservaRepository.delete({ id: reservaId });
    if (petId) await PetRepository.delete({ id: petId });
    if (tutorId) await TutorRepository.delete({ id: tutorId });
    if (usuarioId) await UsuarioRepository.delete({ id: usuarioId });
    await AppDataSource.destroy();
  }
});

describe('Fluxo principal integrado da hospedagem', () => {
  it('percorre login, tutor, pet, reserva, hospedagem e pagamento', async () => {
    const login = await request(app).post('/usuarios/login').send({
      email: emailTeste.toUpperCase(),
      senha: senhaTeste,
    });

    expect(login.status).toBe(200);
    expect(login.body.token).toEqual(expect.any(String));
    const autorizacao = `Bearer ${login.body.token}`;

    const cadastroTutor = await request(app)
      .post('/tutores')
      .set('Authorization', autorizacao)
      .send({
        nome: 'Carlos Fluxo Integrado',
        telefone: '92999999999',
        email: `carlos.${identificadorTeste}@petzin.local`,
      });

    expect(cadastroTutor.status).toBe(201);
    expect(cadastroTutor.body).toMatchObject({
      nome: 'Carlos Fluxo Integrado',
      telefone: '92999999999',
      ativo: true,
    });
    tutorId = cadastroTutor.body.id;

    const cadastroPet = await request(app)
      .post('/pets')
      .set('Authorization', autorizacao)
      .send({
        tutorId,
        nome: 'Rex Fluxo Integrado',
        especie: 'Cachorro',
        raca: 'Labrador',
        sexo: 'MACHO',
        pesoAtual: 28.5,
      });

    expect(cadastroPet.status).toBe(201);
    expect(cadastroPet.body).toMatchObject({
      tutorId,
      nome: 'Rex Fluxo Integrado',
      ativo: true,
    });
    petId = cadastroPet.body.id;

    const entrada = new Date();
    entrada.setUTCDate(entrada.getUTCDate() + 30);
    entrada.setUTCSeconds(0, 0);
    const saida = new Date(entrada.getTime() + (25 * 60 + 1) * 60_000);
    const numeroCanil = 9000 + (identificadorTeste % 999);

    const cadastroReserva = await request(app)
      .post('/reservas')
      .set('Authorization', autorizacao)
      .send({
        petId,
        dataEntrada: entrada.toISOString(),
        dataSaida: saida.toISOString(),
        numeroCanil,
        modalidade: 'DIARIA',
        observacoes: 'Fluxo completo automatizado',
      });

    expect(cadastroReserva.status).toBe(201);
    expect(cadastroReserva.body).toMatchObject({
      petId,
      numeroCanil,
      tarifaHora: 10,
      tarifaDiaria: 240,
      valorTotal: 260,
      valorPago: 0,
      status: StatusReserva.AGENDADA,
      statusPagamento: StatusPagamento.PENDENTE,
    });
    reservaId = cadastroReserva.body.id;

    const inicioHospedagem = await request(app)
      .patch(`/reservas/${reservaId}/status`)
      .set('Authorization', autorizacao)
      .send({ status: 'EM_ANDAMENTO' });
    expect(inicioHospedagem.status).toBe(200);
    expect(inicioHospedagem.body.status).toBe(StatusReserva.EM_ANDAMENTO);

    const conclusaoHospedagem = await request(app)
      .patch(`/reservas/${reservaId}/status`)
      .set('Authorization', autorizacao)
      .send({ status: 'CONCLUIDA' });
    expect(conclusaoHospedagem.status).toBe(200);
    expect(conclusaoHospedagem.body.status).toBe(StatusReserva.CONCLUIDA);

    const pagamento = await request(app)
      .patch(`/reservas/${reservaId}/pagamento`)
      .set('Authorization', autorizacao)
      .send({ valorPago: 260 });
    expect(pagamento.status).toBe(200);
    expect(pagamento.body).toMatchObject({
      valorTotal: 260,
      valorPago: 260,
      statusPagamento: StatusPagamento.PAGO,
    });
    expect(pagamento.body.pagoEm).toEqual(expect.any(String));

    const detalhe = await request(app)
      .get(`/reservas/${reservaId}`)
      .set('Authorization', autorizacao);
    expect(detalhe.status).toBe(200);
    expect(detalhe.body).toMatchObject({
      id: reservaId,
      status: StatusReserva.CONCLUIDA,
      statusPagamento: StatusPagamento.PAGO,
      pet: {
        id: petId,
        nome: 'Rex Fluxo Integrado',
        tutor: {
          id: tutorId,
          nome: 'Carlos Fluxo Integrado',
        },
      },
    });

    const reservaPersistida = await ReservaRepository.findOneByOrFail({
      id: reservaId,
    });
    expect(Number(reservaPersistida.valorTotal)).toBe(260);
    expect(Number(reservaPersistida.valorPago)).toBe(260);
    expect(reservaPersistida.status).toBe(StatusReserva.CONCLUIDA);
    expect(reservaPersistida.statusPagamento).toBe(StatusPagamento.PAGO);
  });
});
