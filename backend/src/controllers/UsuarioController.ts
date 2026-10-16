import { Request, Response } from 'express';
import {
  UsuarioService,
  ErroAcesso,
  ErroAutenticacao,
  ErroNaoEncontrado,
  ErroSenhaAtual,
  ErroValidacao,
} from '../services/UsuarioService';

// Instancia a classe Service
const usuarioService = new UsuarioService();

export class UsuarioController {
  async cadastrar(req: Request, res: Response): Promise<void> {
    try {
      // Recebe os dados enviados pelo cliente
      const { nome, email, senha } = req.body ?? {};

      // Executa o cadastro
      const usuario = await usuarioService.cadastrar(nome, email, senha);

      // Cadastro realizado com sucesso
      res.status(201).json(usuario);
    } catch (error) {
      if (error instanceof ErroAcesso) {
        res.status(403).json({
          mensagem: error.message,
        });
        return;
      }

      // Trata erros de validação
      if (error instanceof ErroValidacao) {
        const status =
          error.message === 'Este e-mail já está cadastrado' ? 409 : 400;

        res.status(status).json({
          mensagem: error.message,
        });
        return;
      }

      // Trata e-mail duplicado no PostgreSQL
      if (
        typeof error === 'object' &&
        error !== null &&
        'driverError' in error &&
        typeof error.driverError === 'object' &&
        error.driverError !== null &&
        'code' in error.driverError &&
        error.driverError.code === '23505'
      ) {
        res.status(409).json({
          mensagem: 'Este e-mail já está cadastrado',
        });
        return;
      }

      // Registra erros inesperados
      console.error('Erro ao cadastrar usuário:', error);

      res.status(500).json({
        mensagem: 'Não foi possível cadastrar o usuário',
      });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, senha } = req.body ?? {};
      const autenticacao = await usuarioService.autenticar(email, senha);

      res.status(200).json(autenticacao);
    } catch (error) {
      if (error instanceof ErroValidacao) {
        res.status(400).json({
          mensagem: error.message,
        });
        return;
      }

      if (error instanceof ErroAutenticacao) {
        res.status(401).json({
          mensagem: error.message,
        });
        return;
      }

      console.error('Erro ao autenticar usuário:', error);

      res.status(500).json({
        mensagem: 'Não foi possível autenticar o usuário',
      });
    }
  }

  async perfil(req: Request, res: Response): Promise<void> {
    try {
      if (!req.usuarioId) {
        res.status(401).json({
          mensagem: 'Usuário não autenticado',
        });
        return;
      }

      const usuario = await usuarioService.buscarPerfil(req.usuarioId);
      res.status(200).json(usuario);
    } catch (error) {
      if (error instanceof ErroNaoEncontrado) {
        res.status(404).json({
          mensagem: error.message,
        });
        return;
      }

      console.error('Erro ao consultar perfil do usuário:', error);

      res.status(500).json({
        mensagem: 'Não foi possível consultar o perfil do usuário',
      });
    }
  }

  async alterarSenha(req: Request, res: Response): Promise<void> {
    try {
      if (!req.usuarioId) {
        res.status(401).json({ mensagem: 'Usuário não autenticado' });
        return;
      }

      const { senhaAtual, novaSenha } = req.body ?? {};
      await usuarioService.alterarSenha(req.usuarioId, senhaAtual, novaSenha);
      res.status(204).send();
    } catch (error) {
      if (error instanceof ErroValidacao) {
        res.status(400).json({ mensagem: error.message });
        return;
      }

      if (error instanceof ErroSenhaAtual) {
        res.status(401).json({ mensagem: error.message });
        return;
      }

      if (error instanceof ErroNaoEncontrado) {
        res.status(404).json({ mensagem: error.message });
        return;
      }

      console.error('Erro ao alterar senha do usuário:', error);
      res.status(500).json({ mensagem: 'Não foi possível alterar a senha' });
    }
  }
}
