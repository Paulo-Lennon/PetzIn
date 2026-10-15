import { Request, Response } from 'express';
import { UsuarioService, ErroValidacao } from '../services/UsuarioService';

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
}
