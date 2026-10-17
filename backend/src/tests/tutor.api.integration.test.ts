import 'reflect-metadata';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import app from '../app';
import { AppDataSource } from '../config/database';
import { PetRepository } from '../repositories/PetRepository';
import { TutorRepository } from '../repositories/TutorRepository';
import { UsuarioRepository } from '../repositories/UsuarioRepository';

const segredoTeste = 'chave-exclusiva-para-testes-com-mais-de-32-caracteres';
const identificadorTeste = Date.now();

let usuarioId: string;
let tokenAdministrativo: string;
const tutoresCriados: string[] = [];

beforeAll(async () => {
  process.env.JWT_SECRET = segredoTeste;
  process.env.JWT_EXPIRES_IN = '2h';

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const usuario = await UsuarioRepository.save(
    UsuarioRepository.create({
      nome: 'Proprietária Teste Tutor',
      email: `teste.admin.tutor.${identificadorTeste}@petzin.local`,
      senhaHash: await bcrypt.hash('Teste@123', 12),
    }),
  );
  usuarioId = usuario.id;
  tokenAdministrativo = jwt.sign({}, segredoTeste, {
    subject: usuarioId,
    expiresIn: '2h',
  });
});

afterAll(async () => {
  if (AppDataSource.isInitialized) {
    for (const tutorId of tutoresCriados) {
      await PetRepository.delete({ tutorId });
      await TutorRepository.delete({ id: tutorId });
    }

    await UsuarioRepository.delete({ id: usuarioId });
    await AppDataSource.destroy();
  }
});

describe('API administrativa de tutores', () => {
  it('exige autenticação para cadastrar e listar tutores', async () => {
    const [cadastro, listagem] = await Promise.all([
      request(app).post('/tutores').send({
        nome: 'Carlos',
        telefone: '11999999999',
      }),
      request(app).get('/tutores'),
    ]);

    expect(cadastro.status).toBe(401);
    expect(listagem.status).toBe(401);
  });

  it.each([
    [{}, 'Nome é obrigatório'],
    [{ nome: 'Carlos' }, 'Telefone é obrigatório'],
    [{ nome: 'Carlos', telefone: '123' }, 'Informe um telefone válido'],
    [
      { nome: 'Carlos', telefone: '11999999999', email: 'email-inválido' },
      'Informe um e-mail válido',
    ],
  ])('rejeita dados inválidos', async (dados, mensagem) => {
    const resposta = await request(app)
      .post('/tutores')
      .set('Authorization', `Bearer ${tokenAdministrativo}`)
      .send(dados);

    expect(resposta.status).toBe(400);
    expect(resposta.body).toEqual({ mensagem });
  });

  it('cadastra e normaliza os dados do tutor', async () => {
    const resposta = await request(app)
      .post('/tutores')
      .set('Authorization', `Bearer ${tokenAdministrativo}`)
      .send({
        nome: '  Carlos Almeida  ',
        telefone: '(11) 99999-9999',
        email: '  CARLOS@EXEMPLO.COM  ',
        observacoes: '  Prefere contato pelo WhatsApp.  ',
      });

    expect(resposta.status).toBe(201);
    expect(resposta.body).toMatchObject({
      nome: 'Carlos Almeida',
      telefone: '11999999999',
      email: 'carlos@exemplo.com',
      observacoes: 'Prefere contato pelo WhatsApp.',
      ativo: true,
    });
    tutoresCriados.push(resposta.body.id);
  });

  it('lista os tutores ativos para a proprietária', async () => {
    const resposta = await request(app)
      .get('/tutores')
      .set('Authorization', `Bearer ${tokenAdministrativo}`);

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual(expect.any(Array));
    expect(
      resposta.body.some(
        (tutor: { id: string }) => tutor.id === tutoresCriados[0],
      ),
    ).toBe(true);
  });

  it('protege consulta, atualização e desativação com JWT', async () => {
    const tutorId = tutoresCriados[0];
    const [consulta, atualizacao, desativacao] = await Promise.all([
      request(app).get(`/tutores/${tutorId}`),
      request(app).put(`/tutores/${tutorId}`).send({ nome: 'Outro nome' }),
      request(app).delete(`/tutores/${tutorId}`),
    ]);

    expect(consulta.status).toBe(401);
    expect(atualizacao.status).toBe(401);
    expect(desativacao.status).toBe(401);
  });

  it('retorna o tutor com seus pets ativos nos detalhes', async () => {
    const tutorId = tutoresCriados[0];
    const pet = await PetRepository.save(
      PetRepository.create({
        nome: 'Rex',
        especie: 'Cachorro',
        tutorId,
      }),
    );
    await PetRepository.save(
      PetRepository.create({
        nome: 'Pet inativo do tutor',
        especie: 'Gato',
        tutorId,
        ativo: false,
      }),
    );

    const [resposta, listagem] = await Promise.all([
      request(app)
        .get(`/tutores/${tutorId}`)
        .set('Authorization', `Bearer ${tokenAdministrativo}`),
      request(app)
        .get('/tutores')
        .set('Authorization', `Bearer ${tokenAdministrativo}`),
    ]);

    expect(resposta.status).toBe(200);
    expect(resposta.body.id).toBe(tutorId);
    expect(resposta.body.pets).toHaveLength(1);
    expect(resposta.body.pets[0].id).toBe(pet.id);
    const tutorListado = listagem.body.find(
      (tutor: { id: string }) => tutor.id === tutorId,
    );
    expect(tutorListado.pets).toHaveLength(1);
    expect(tutorListado.pets[0]).toMatchObject({ id: pet.id, nome: 'Rex' });
  });

  it('diferencia identificador inválido de tutor inexistente', async () => {
    const idInexistente = '11111111-1111-4111-8111-111111111111';
    const [idInvalido, naoEncontrado] = await Promise.all([
      request(app)
        .get('/tutores/id-invalido')
        .set('Authorization', `Bearer ${tokenAdministrativo}`),
      request(app)
        .get(`/tutores/${idInexistente}`)
        .set('Authorization', `Bearer ${tokenAdministrativo}`),
    ]);

    expect(idInvalido.status).toBe(400);
    expect(idInvalido.body).toEqual({
      mensagem: 'Informe um identificador de tutor válido',
    });
    expect(naoEncontrado.status).toBe(404);
    expect(naoEncontrado.body).toEqual({ mensagem: 'Tutor não encontrado' });
  });

  it('atualiza e normaliza somente os campos informados', async () => {
    const tutorId = tutoresCriados[0];
    const resposta = await request(app)
      .put(`/tutores/${tutorId}`)
      .set('Authorization', `Bearer ${tokenAdministrativo}`)
      .send({
        nome: '  Carlos da Silva  ',
        telefone: '(92) 98888-7777',
        email: '',
      });

    expect(resposta.status).toBe(200);
    expect(resposta.body).toMatchObject({
      id: tutorId,
      nome: 'Carlos da Silva',
      telefone: '92988887777',
      email: null,
      observacoes: 'Prefere contato pelo WhatsApp.',
    });
  });

  it('rejeita atualização sem campos permitidos', async () => {
    const resposta = await request(app)
      .put(`/tutores/${tutoresCriados[0]}`)
      .set('Authorization', `Bearer ${tokenAdministrativo}`)
      .send({ ativo: false });

    expect(resposta.status).toBe(400);
    expect(resposta.body).toEqual({
      mensagem: 'Informe ao menos um campo para atualizar',
    });
  });

  it('bloqueia tutor com pet ativo e permite desativá-lo após o pet', async () => {
    const tutorId = tutoresCriados[0];
    const petAtivo = await PetRepository.findOneByOrFail({
      tutorId,
      ativo: true,
    });

    const bloqueio = await request(app)
      .delete(`/tutores/${tutorId}`)
      .set('Authorization', `Bearer ${tokenAdministrativo}`);

    expect(bloqueio.status).toBe(409);
    expect(bloqueio.body).toEqual({
      mensagem: 'Não é possível desativar um tutor que possui pets ativos',
    });

    await PetRepository.update({ id: petAtivo.id }, { ativo: false });

    const desativacao = await request(app)
      .delete(`/tutores/${tutorId}`)
      .set('Authorization', `Bearer ${tokenAdministrativo}`);
    const consulta = await request(app)
      .get(`/tutores/${tutorId}`)
      .set('Authorization', `Bearer ${tokenAdministrativo}`);
    const listagem = await request(app)
      .get('/tutores')
      .set('Authorization', `Bearer ${tokenAdministrativo}`);

    expect(desativacao.status).toBe(204);
    expect(consulta.status).toBe(404);
    expect(
      listagem.body.some((tutor: { id: string }) => tutor.id === tutorId),
    ).toBe(false);
  });
});
