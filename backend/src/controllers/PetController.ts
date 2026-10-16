import { Request, Response } from 'express';
import {
  ErroPetNaoEncontrado,
  ErroValidacaoPet,
  PetService,
} from '../services/PetService';

const petService = new PetService();

export class PetController {
  private tratarErro(error: unknown, res: Response, operacao: string): void {
    if (error instanceof ErroValidacaoPet) {
      res.status(400).json({ mensagem: error.message });
      return;
    }

    if (error instanceof ErroPetNaoEncontrado) {
      res.status(404).json({ mensagem: error.message });
      return;
    }

    console.error(`Erro ao ${operacao} pet:`, error);
    res.status(500).json({ mensagem: `Não foi possível ${operacao} o pet` });
  }

  async cadastrar(req: Request, res: Response): Promise<void> {
    try {
      if (!req.usuarioId) {
        res.status(401).json({ mensagem: 'Usuário não autenticado' });
        return;
      }

      const pet = await petService.cadastrar(req.body ?? {});
      res.status(201).json(pet);
    } catch (error) {
      this.tratarErro(error, res, 'cadastrar');
    }
  }

  async listar(req: Request, res: Response): Promise<void> {
    try {
      if (!req.usuarioId) {
        res.status(401).json({ mensagem: 'Usuário não autenticado' });
        return;
      }

      const pets = await petService.listar(req.query.tutorId);
      res.status(200).json(pets);
    } catch (error) {
      this.tratarErro(error, res, 'listar');
    }
  }

  async buscarPorId(req: Request, res: Response): Promise<void> {
    try {
      const pet = await petService.buscarPorId(req.params.id);
      res.status(200).json(pet);
    } catch (error) {
      this.tratarErro(error, res, 'consultar');
    }
  }

  async atualizar(req: Request, res: Response): Promise<void> {
    try {
      const pet = await petService.atualizar(req.params.id, req.body ?? {});
      res.status(200).json(pet);
    } catch (error) {
      this.tratarErro(error, res, 'atualizar');
    }
  }

  async desativar(req: Request, res: Response): Promise<void> {
    try {
      await petService.desativar(req.params.id);
      res.status(204).send();
    } catch (error) {
      this.tratarErro(error, res, 'desativar');
    }
  }
}
