import { Router } from 'express';
import { CuidadosController } from '../controllers/CuidadosController';
import { autenticarToken } from '../middlewares/autenticacao';

const router = Router();
const controller = new CuidadosController();

router.get('/pets/:petId/ficha-clinica', autenticarToken, (req, res) => {
  void controller.buscarFicha(req, res);
});
router.put('/pets/:petId/ficha-clinica', autenticarToken, (req, res) => {
  void controller.salvarFicha(req, res);
});
router.get('/pets/:petId/registros-clinicos', autenticarToken, (req, res) => {
  void controller.listarRegistros(req, res);
});
router.post('/reservas/:reservaId/registros-clinicos', autenticarToken, (req, res) => {
  void controller.criarRegistro(req, res);
});
router.post('/reservas/:reservaId/lembretes-medicamentos', autenticarToken, (req, res) => {
  void controller.criarLembrete(req, res);
});
router.get('/lembretes-medicamentos', autenticarToken, (req, res) => {
  void controller.listarLembretes(req, res);
});
router.patch('/lembretes-medicamentos/:id/status', autenticarToken, (req, res) => {
  void controller.alterarStatusLembrete(req, res);
});
router.delete('/lembretes-medicamentos/:id', autenticarToken, (req, res) => {
  void controller.cancelarLembrete(req, res);
});

export default router;
