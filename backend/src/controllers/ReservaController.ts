import { Request, Response } from 'express';
import {
  ErroConflitoReserva,
  ErroReservaNaoEncontrada,
  ErroValidacaoReserva,
  ReservaService,
} from '../services/ReservaService';

const reservaService = new ReservaService();

export class ReservaController {
  private tratarErro(error: unknown, res: Response, operacao: string): void {
    if (error instanceof ErroValidacaoReserva) {
      res.status(400).json({ mensagem: error.message });
      return;
    }

    if (error instanceof ErroReservaNaoEncontrada) {
      res.status(404).json({ mensagem: error.message });
      return;
    }

    if (error instanceof ErroConflitoReserva) {
      res.status(409).json({ mensagem: error.message });
      return;
    }

    console.error(`Erro ao ${operacao} reserva:`, error);
    res.status(500).json({ mensagem: `Não foi possível ${operacao} a reserva` });
  }

  async cadastrar(req: Request, res: Response): Promise<void> {
    try {
      const reserva = await reservaService.cadastrar(req.body ?? {});
      res.status(201).json(reserva);
    } catch (error) {
      this.tratarErro(error, res, 'cadastrar');
    }
  }

  async listar(req: Request, res: Response): Promise<void> {
    try {
      const reservas = await reservaService.listar({
        petId: req.query.petId,
        status: req.query.status,
      });
      res.status(200).json(reservas);
    } catch (error) {
      this.tratarErro(error, res, 'listar');
    }
  }

  async buscarPorId(req: Request, res: Response): Promise<void> {
    try {
      const reserva = await reservaService.buscarPorId(req.params.id);
      res.status(200).json(reserva);
    } catch (error) {
      this.tratarErro(error, res, 'consultar');
    }
  }

  async atualizar(req: Request, res: Response): Promise<void> {
    try {
      const reserva = await reservaService.atualizar(req.params.id, req.body ?? {});
      res.status(200).json(reserva);
    } catch (error) {
      this.tratarErro(error, res, 'atualizar');
    }
  }

  async alterarStatus(req: Request, res: Response): Promise<void> {
    try {
      const reserva = await reservaService.alterarStatus(
        req.params.id,
        req.body?.status,
      );
      res.status(200).json(reserva);
    } catch (error) {
      this.tratarErro(error, res, 'alterar o status da');
    }
  }

  async registrarPagamento(req: Request, res: Response): Promise<void> {
    try {
      const reserva = await reservaService.registrarPagamento(
        req.params.id,
        req.body?.valorPago,
      );
      res.status(200).json(reserva);
    } catch (error) {
      this.tratarErro(error, res, 'registrar o pagamento da');
    }
  }

  async cancelar(req: Request, res: Response): Promise<void> {
    try {
      await reservaService.cancelar(req.params.id);
      res.status(204).send();
    } catch (error) {
      this.tratarErro(error, res, 'cancelar');
    }
  }
}
