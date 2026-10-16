import { Request, Response } from 'express';
import {
  ErroConflitoTutor,
  ErroTutorNaoEncontrado,
  ErroValidacaoTutor,
  TutorService,
} from '../services/TutorService';

const tutorService = new TutorService();

export class TutorController {
  private tratarErro(error: unknown, res: Response, operacao: string): void {
    if (error instanceof ErroValidacaoTutor) {
      res.status(400).json({ mensagem: error.message });
      return;
    }

    if (error instanceof ErroTutorNaoEncontrado) {
      res.status(404).json({ mensagem: error.message });
      return;
    }

    if (error instanceof ErroConflitoTutor) {
      res.status(409).json({ mensagem: error.message });
      return;
    }

    console.error(`Erro ao ${operacao} tutor:`, error);
    res.status(500).json({ mensagem: `Não foi possível ${operacao} o tutor` });
  }

  async cadastrar(req: Request, res: Response): Promise<void> {
    try {
      const tutor = await tutorService.cadastrar(req.body ?? {});
      res.status(201).json(tutor);
    } catch (error) {
      this.tratarErro(error, res, 'cadastrar');
    }
  }

  async listar(_req: Request, res: Response): Promise<void> {
    try {
      const tutores = await tutorService.listar();
      res.status(200).json(tutores);
    } catch (error) {
      console.error('Erro ao listar tutores:', error);
      res.status(500).json({ mensagem: 'Não foi possível listar os tutores' });
    }
  }

  async buscarPorId(req: Request, res: Response): Promise<void> {
    try {
      const tutor = await tutorService.buscarPorId(req.params.id);
      res.status(200).json(tutor);
    } catch (error) {
      this.tratarErro(error, res, 'consultar');
    }
  }

  async atualizar(req: Request, res: Response): Promise<void> {
    try {
      const tutor = await tutorService.atualizar(req.params.id, req.body ?? {});
      res.status(200).json(tutor);
    } catch (error) {
      this.tratarErro(error, res, 'atualizar');
    }
  }

  async desativar(req: Request, res: Response): Promise<void> {
    try {
      await tutorService.desativar(req.params.id);
      res.status(204).send();
    } catch (error) {
      this.tratarErro(error, res, 'desativar');
    }
  }
}
