import 'reflect-metadata';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import app from '../app';
import { AppDataSource } from '../config/database';
import { UsuarioRepository } from '../repositories/UsuarioRepository';

const segredoTeste = 'chave-exclusiva-para-testes-com-mais-de-32-caracteres';
const senhaTeste = 'Teste@123';
const emailTeste = `teste.jwt.${Date.now()}@petzin.local`;

let usuarioId: string;
let tokenValido: string;

beforeAll(async () => {
  process.env.JWT_SECRET = segredoTeste;
  process.env.JWT_EXPIRES_IN = '2h';

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const senhaHash = await bcrypt.hash(senhaTeste, 12);
  const usuario = UsuarioRepository.create({
    nome: 'Usuário de Teste JWT',
    email: emailTeste,
    senhaHash,
  });

  const usuarioSalvo = await UsuarioRepository.save(usuario);
  usuarioId = usuarioSalvo.id;
  tokenValido = jwt.sign({}, segredoTeste, {
    subject: usuarioId,
    expiresIn: '2h',
  });
});

afterAll(async () => {
  if (AppDataSource.isInitialized) {
    await UsuarioRepository.delete({ email: emailTeste });
    await AppDataSource.destroy();
  }
});

describe('Autenticação de usuários', () => {
  it('retorna 400 quando e-mail e senha não são informados', async () => {
    const resposta = await request(app).post('/usuarios/login').send({});

    expect(resposta.status).toBe(400);
    expect(resposta.body).toEqual({
      mensagem: 'E-mail e senha são obrigatórios',
    });
  });

  it('retorna a mesma mensagem para e-mail inexistente e senha incorreta', async () => {
    const [emailInexistente, senhaIncorreta] = await Promise.all([
      request(app).post('/usuarios/login').send({
        email: 'inexistente@petzin.local',
        senha: senhaTeste,
      }),
      request(app).post('/usuarios/login').send({
        email: emailTeste,
        senha: 'Errada@123',
      }),
    ]);

    expect(emailInexistente.status).toBe(401);
    expect(senhaIncorreta.status).toBe(401);
    expect(emailInexistente.body).toEqual(senhaIncorreta.body);
    expect(emailInexistente.body).toEqual({
      mensagem: 'E-mail ou senha inválidos',
    });
  });

  it('autentica credenciais válidas sem expor o hash', async () => {
    const resposta = await request(app).post('/usuarios/login').send({
      email: emailTeste.toUpperCase(),
      senha: senhaTeste,
    });

    expect(resposta.status).toBe(200);
    expect(resposta.body.token).toEqual(expect.any(String));
    expect(resposta.body.token.split('.')).toHaveLength(3);
    expect(resposta.body.usuario).toMatchObject({
      id: usuarioId,
      email: emailTeste,
    });
    expect(resposta.body.usuario).not.toHaveProperty('senhaHash');
  });

  it('retorna 401 quando o token não é enviado', async () => {
    const resposta = await request(app).get('/usuarios/me');

    expect(resposta.status).toBe(401);
    expect(resposta.body).toEqual({
      mensagem: 'Token inválido ou expirado',
    });
  });

  it('retorna 401 para token inválido', async () => {
    const resposta = await request(app)
      .get('/usuarios/me')
      .set('Authorization', 'Bearer token.invalido.teste');

    expect(resposta.status).toBe(401);
  });

  it('retorna 401 para token expirado', async () => {
    const tokenExpirado = jwt.sign({}, segredoTeste, {
      subject: usuarioId,
      expiresIn: -1,
    });

    const resposta = await request(app)
      .get('/usuarios/me')
      .set('Authorization', `Bearer ${tokenExpirado}`);

    expect(resposta.status).toBe(401);
  });

  it('retorna os dados públicos do usuário autenticado', async () => {
    const resposta = await request(app)
      .get('/usuarios/me')
      .set('Authorization', `Bearer ${tokenValido}`);

    expect(resposta.status).toBe(200);
    expect(resposta.body).toMatchObject({
      id: usuarioId,
      nome: 'Usuário de Teste JWT',
      email: emailTeste,
    });
    expect(resposta.body).not.toHaveProperty('senhaHash');
  });

  it('impede criar uma segunda conta administrativa', async () => {
    const resposta = await request(app).post('/usuarios').send({
      nome: 'Outro administrador',
      email: 'outro.admin@petzin.local',
      senha: 'Teste@123',
    });

    expect(resposta.status).toBe(403);
    expect(resposta.body).toEqual({
      mensagem: 'O usuário administrativo já foi cadastrado',
    });
  });

  it('rejeita login e token de usuário inativo', async () => {
    await UsuarioRepository.update({ id: usuarioId }, { ativo: false });

    try {
      const [login, perfil] = await Promise.all([
        request(app).post('/usuarios/login').send({
          email: emailTeste,
          senha: senhaTeste,
        }),
        request(app)
          .get('/usuarios/me')
          .set('Authorization', `Bearer ${tokenValido}`),
      ]);

      expect(login.status).toBe(401);
      expect(perfil.status).toBe(401);
    } finally {
      await UsuarioRepository.update({ id: usuarioId }, { ativo: true });
    }
  });

  it('responde em JSON quando o corpo da requisição é inválido', async () => {
    const resposta = await request(app)
      .post('/usuarios/login')
      .set('Content-Type', 'application/json')
      .send('{');

    expect(resposta.status).toBe(400);
    expect(resposta.headers['content-type']).toContain('application/json');
    expect(resposta.body).toEqual({
      mensagem: 'JSON inválido',
    });
  });
});
