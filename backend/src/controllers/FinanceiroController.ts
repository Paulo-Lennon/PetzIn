import { Request, Response } from 'express';
import {
  ErroValidacaoFinanceiro,
  FinanceiroService,
} from '../services/FinanceiroService';

const financeiroService = new FinanceiroService();

export class FinanceiroController {
  async obterResumo(req: Request, res: Response): Promise<void> {
    try {
      const resumo = await financeiroService.obterResumo({
        dataInicio: req.query.dataInicio,
        dataFim: req.query.dataFim,
      });
      res.status(200).json(resumo);
    } catch (error) {
      if (error instanceof ErroValidacaoFinanceiro) {
        res.status(400).json({ mensagem: error.message });
        return;
      }

      console.error('Erro ao consultar resumo financeiro:', error);
      res.status(500).json({
        mensagem: 'Não foi possível consultar o resumo financeiro',
      });
    }
  }
}
