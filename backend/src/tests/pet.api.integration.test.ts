import 'reflect-metadata';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import app from '../app';
import { AppDataSource } from '../config/database';
import { SexoPet } from '../entities/Pet';
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
let outroTutorId: string;
let petVisivelId: string;
let petInativoId: string;
let petOutroTutorId: string;

beforeAll(async () => {
  process.env.JWT_SECRET = segredoTeste;
  process.env.JWT_EXPIRES_IN = '2h';

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const usuario = await UsuarioRepository.save(
    UsuarioRepository.create({
      nome: 'Proprietária de Teste',
      email: `teste.admin.pet.${identificadorTeste}@petzin.local`,
      senhaHash: await bcrypt.hash('Teste@123', 12),
    }),
  );
  usuarioId = usuario.id;
  tokenAdministrativo = jwt.sign({}, segredoTeste, {
    subject: usuarioId,
    expiresIn: '2h',
  });

  const [tutor, outroTutor] = await TutorRepository.save([
    TutorRepository.create({
      nome: 'Carlos Almeida',
      telefone: '11999999999',
    }),
    TutorRepository.create({
      nome: 'Mariana Souza',
      telefone: '21999999999',
    }),
  ]);
  tutorId = tutor.id;
  outroTutorId = outroTutor.id;

  const [petVisivel, petInativo, petOutroTutor] = await PetRepository.save([
    PetRepository.create({
      nome: 'Pet visível',
      especie: 'Cachorro',
      tutorId,
    }),
    PetRepository.create({
      nome: 'Pet inativo',
      especie: 'Gato',
      ativo: false,
      tutorId,
    }),
    PetRepository.create({
      nome: 'Pet de outro tutor',
      especie: 'Pássaro',
      tutorId: outroTutorId,
    }),
  ]);
  petVisivelId = petVisivel.id;
  petInativoId = petInativo.id;
  petOutroTutorId = petOutroTutor.id;
});

afterAll(async () => {
  if (AppDataSource.isInitialized) {
    await ReservaRepository.delete({ petId: petVisivelId });
    await PetRepository.delete({ tutorId });
    await PetRepository.delete({ tutorId: outroTutorId });
    await TutorRepository.delete({ id: tutorId });
    await TutorRepository.delete({ id: outroTutorId });
    await UsuarioRepository.delete({ id: usuarioId });
    await AppDataSource.destroy();
  }
});

describe('API administrativa de pets', () => {
  it('protege o cadastro e a listagem com JWT', async () => {
    const [cadastro, listagem] = await Promise.all([
      request(app).post('/pets').send({
        tutorId,
        nome: 'Sem autenticação',
        especie: 'Cachorro',
      }),
      request(app).get('/pets'),
    ]);

    expect(cadastro.status).toBe(401);
    expect(listagem.status).toBe(401);
  });

  it('exige um tutor válido no cadastro', async () => {
    const resposta = await request(app)
      .post('/pets')
      .set('Authorization', `Bearer ${tokenAdministrativo}`)
      .send({ nome: 'Rex', especie: 'Cachorro' });

    expect(resposta.status).toBe(400);
    expect(resposta.body).toEqual({ mensagem: 'Informe um tutor válido' });
  });

  it.each([
    [{}, 'Nome é obrigatório'],
    [{ nome: 'Rex' }, 'Espécie é obrigatório'],
    [
      { nome: 'Rex', especie: 'Cachorro', sexo: 'OUTRO' },
      'Sexo informado é inválido',
    ],
    [
      {
        nome: 'Rex',
        especie: 'Cachorro',
        dataNascimento: '2024-02-30',
      },
      'Data de nascimento inválida',
    ],
    [
      { nome: 'Rex', especie: 'Cachorro', pesoAtual: -1 },
      'Peso deve ser um número maior que zero e menor que 10000',
    ],
  ])('rejeita dados inválidos no cadastro', async (dados, mensagem) => {
    const resposta = await request(app)
      .post('/pets')
      .set('Authorization', `Bearer ${tokenAdministrativo}`)
      .send({ tutorId, ...dados });

    expect(resposta.status).toBe(400);
    expect(resposta.body).toEqual({ mensagem });
  });

  it('cadastra o pet para o tutor escolhido pela proprietária', async () => {
    const resposta = await request(app)
      .post('/pets')
      .set('Authorization', `Bearer ${tokenAdministrativo}`)
      .send({
        tutorId,
        nome: '  Luna  ',
        especie: '  Gato  ',
        raca: '  Siamês  ',
        sexo: 'femea',
        dataNascimento: '2022-08-15',
        pesoAtual: 4.35,
        observacoes: '  Gosta de lugares altos.  ',
        usuarioId: outroTutorId,
      });

    expect(resposta.status).toBe(201);
    expect(resposta.body).toMatchObject({
      nome: 'Luna',
      especie: 'Gato',
      raca: 'Siamês',
      sexo: SexoPet.FEMEA,
      pesoAtual: 4.35,
      tutorId,
    });
    expect(resposta.body).not.toHaveProperty('usuarioId');
  });

  it('lista todos os pets ativos para a proprietária', async () => {
    const resposta = await request(app)
      .get('/pets')
      .set('Authorization', `Bearer ${tokenAdministrativo}`);

    expect(resposta.status).toBe(200);
    expect(resposta.body.length).toBeGreaterThanOrEqual(3);
    expect(resposta.body.some((pet: { id: string }) => pet.id === petVisivelId)).toBe(
      true,
    );
    expect(
      resposta.body.some((pet: { id: string }) => pet.id === petOutroTutorId),
    ).toBe(true);
    expect(resposta.body.some((pet: { id: string }) => pet.id === petInativoId)).toBe(
      false,
    );
  });

  it('filtra a listagem pelo tutor selecionado', async () => {
    const resposta = await request(app)
      .get(`/pets?tutorId=${outroTutorId}`)
      .set('Authorization', `Bearer ${tokenAdministrativo}`);

    expect(resposta.status).toBe(200);
    expect(resposta.body).toHaveLength(1);
    expect(resposta.body[0].id).toBe(petOutroTutorId);
    expect(resposta.body[0].tutor.id).toBe(outroTutorId);
  });

  it('protege consulta, atualização e desativação com JWT', async () => {
    const [consulta, atualizacao, desativacao] = await Promise.all([
      request(app).get(`/pets/${petVisivelId}`),
      request(app).put(`/pets/${petVisivelId}`).send({ nome: 'Outro nome' }),
      request(app).delete(`/pets/${petVisivelId}`),
    ]);

    expect(consulta.status).toBe(401);
    expect(atualizacao.status).toBe(401);
    expect(desativacao.status).toBe(401);
  });

  it('retorna os detalhes do pet com seu tutor', async () => {
    const resposta = await request(app)
      .get(`/pets/${petVisivelId}`)
      .set('Authorization', `Bearer ${tokenAdministrativo}`);

    expect(resposta.status).toBe(200);
    expect(resposta.body.id).toBe(petVisivelId);
    expect(resposta.body.tutor.id).toBe(tutorId);
  });

  it('diferencia identificador inválido de pet inexistente', async () => {
    const idInexistente = '22222222-2222-4222-8222-222222222222';
    const [idInvalido, naoEncontrado] = await Promise.all([
      request(app)
        .get('/pets/id-invalido')
        .set('Authorization', `Bearer ${tokenAdministrativo}`),
      request(app)
        .get(`/pets/${idInexistente}`)
        .set('Authorization', `Bearer ${tokenAdministrativo}`),
    ]);

    expect(idInvalido.status).toBe(400);
    expect(idInvalido.body).toEqual({
      mensagem: 'Informe um identificador de pet válido',
    });
    expect(naoEncontrado.status).toBe(404);
    expect(naoEncontrado.body).toEqual({ mensagem: 'Pet não encontrado' });
  });

  it('atualiza campos do pet e permite alterar seu tutor', async () => {
    const resposta = await request(app)
      .put(`/pets/${petVisivelId}`)
      .set('Authorization', `Bearer ${tokenAdministrativo}`)
      .send({
        nome: '  Rex atualizado  ',
        raca: '  Labrador  ',
        pesoAtual: 28.5,
        tutorId: outroTutorId,
      });

    expect(resposta.status).toBe(200);
    expect(resposta.body).toMatchObject({
      id: petVisivelId,
      nome: 'Rex atualizado',
      raca: 'Labrador',
      pesoAtual: 28.5,
      tutorId: outroTutorId,
    });
    expect(resposta.body.especie).toBe('Cachorro');
  });

  it('rejeita atualização sem campos permitidos', async () => {
    const resposta = await request(app)
      .put(`/pets/${petVisivelId}`)
      .set('Authorization', `Bearer ${tokenAdministrativo}`)
      .send({ ativo: false });

    expect(resposta.status).toBe(400);
    expect(resposta.body).toEqual({
      mensagem: 'Informe ao menos um campo para atualizar',
    });
  });

  it('impede desativar um pet com reserva ativa', async () => {
    const reserva = await ReservaRepository.save(
      ReservaRepository.create({
        petId: petVisivelId,
        dataEntrada: new Date('2040-01-01T08:00:00-04:00'),
        dataSaida: new Date('2040-01-01T10:00:00-04:00'),
        numeroCanil: 99,
        modalidade: ModalidadeCobranca.HORA,
        tarifaHora: 10,
        tarifaDiaria: 240,
        valorTotal: 20,
        status: StatusReserva.AGENDADA,
      }),
    );

    const resposta = await request(app)
      .delete(`/pets/${petVisivelId}`)
      .set('Authorization', `Bearer ${tokenAdministrativo}`);

    expect(resposta.status).toBe(409);
    expect(resposta.body).toEqual({
      mensagem: 'Não é possível desativar um pet que possui reservas ativas',
    });

    await ReservaRepository.update(
      { id: reserva.id },
      { status: StatusReserva.CANCELADA },
    );
  });

  it('desativa o pet sem apagar seu registro', async () => {
    const desativacao = await request(app)
      .delete(`/pets/${petVisivelId}`)
      .set('Authorization', `Bearer ${tokenAdministrativo}`);
    const consulta = await request(app)
      .get(`/pets/${petVisivelId}`)
      .set('Authorization', `Bearer ${tokenAdministrativo}`);
    const registroPersistido = await PetRepository.findOneByOrFail({
      id: petVisivelId,
    });

    expect(desativacao.status).toBe(204);
    expect(consulta.status).toBe(404);
    expect(registroPersistido.ativo).toBe(false);
  });
});
