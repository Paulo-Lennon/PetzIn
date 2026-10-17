import { Request, Response } from 'express';
import {
  CuidadosService,
  ErroConflitoCuidados,
  ErroCuidadosNaoEncontrado,
  ErroValidacaoCuidados,
} from '../services/CuidadosService';

const cuidadosService = new CuidadosService();

export class CuidadosController {
  private tratarErro(error: unknown, res: Response): void {
    if (error instanceof ErroValidacaoCuidados) {
      res.status(400).json({ mensagem: error.message });
      return;
    }
    if (error instanceof ErroCuidadosNaoEncontrado) {
      res.status(404).json({ mensagem: error.message });
      return;
    }
    if (error instanceof ErroConflitoCuidados) {
      res.status(409).json({ mensagem: error.message });
      return;
    }
    console.error('Erro no módulo de cuidados:', error);
    res.status(500).json({ mensagem: 'Não foi possível concluir a operação' });
  }

  async buscarFicha(req: Request, res: Response): Promise<void> {
    try {
      res.status(200).json(await cuidadosService.buscarFicha(req.params.petId));
    } catch (error) {
      this.tratarErro(error, res);
    }
  }

  async salvarFicha(req: Request, res: Response): Promise<void> {
    try {
      res.status(200).json(
        await cuidadosService.salvarFicha(req.params.petId, req.body ?? {}),
      );
    } catch (error) {
      this.tratarErro(error, res);
    }
  }

  async listarRegistros(req: Request, res: Response): Promise<void> {
    try {
      res.status(200).json(await cuidadosService.listarRegistros(req.params.petId));
    } catch (error) {
      this.tratarErro(error, res);
    }
  }

  async criarRegistro(req: Request, res: Response): Promise<void> {
    try {
      res.status(201).json(
        await cuidadosService.criarRegistro(req.params.reservaId, req.body ?? {}),
      );
    } catch (error) {
      this.tratarErro(error, res);
    }
  }

  async criarLembrete(req: Request, res: Response): Promise<void> {
    try {
      res.status(201).json(
        await cuidadosService.criarLembrete(req.params.reservaId, req.body ?? {}),
      );
    } catch (error) {
      this.tratarErro(error, res);
    }
  }

  async listarLembretes(req: Request, res: Response): Promise<void> {
    try {
      res.status(200).json(await cuidadosService.listarLembretes(req.query));
    } catch (error) {
      this.tratarErro(error, res);
    }
  }

  async alterarStatusLembrete(req: Request, res: Response): Promise<void> {
    try {
      res.status(200).json(
        await cuidadosService.alterarStatusLembrete(req.params.id, req.body ?? {}),
      );
    } catch (error) {
      this.tratarErro(error, res);
    }
  }

  async cancelarLembrete(req: Request, res: Response): Promise<void> {
    try {
      await cuidadosService.cancelarLembrete(req.params.id);
      res.status(204).send();
    } catch (error) {
      this.tratarErro(error, res);
    }
  }
}
