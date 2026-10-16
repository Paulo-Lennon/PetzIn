import { Router } from 'express';
import { ReservaController } from '../controllers/ReservaController';
import { autenticarToken } from '../middlewares/autenticacao';

const router = Router();
const reservaController = new ReservaController();

router.post('/reservas', autenticarToken, (req, res) => {
  void reservaController.cadastrar(req, res);
});

router.get('/reservas', autenticarToken, (req, res) => {
  void reservaController.listar(req, res);
});

router.get('/reservas/:id', autenticarToken, (req, res) => {
  void reservaController.buscarPorId(req, res);
});

router.put('/reservas/:id', autenticarToken, (req, res) => {
  void reservaController.atualizar(req, res);
});

router.patch('/reservas/:id/status', autenticarToken, (req, res) => {
  void reservaController.alterarStatus(req, res);
});

router.delete('/reservas/:id', autenticarToken, (req, res) => {
  void reservaController.cancelar(req, res);
});

export default router;
