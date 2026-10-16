import { Router } from 'express';
import { FinanceiroController } from '../controllers/FinanceiroController';
import { autenticarToken } from '../middlewares/autenticacao';

const router = Router();
const financeiroController = new FinanceiroController();

router.get('/financeiro/resumo', autenticarToken, (req, res) => {
  void financeiroController.obterResumo(req, res);
});

export default router;
