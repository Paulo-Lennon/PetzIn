import { Router } from 'express';
import { TutorController } from '../controllers/TutorController';
import { autenticarToken } from '../middlewares/autenticacao';

const router = Router();
const tutorController = new TutorController();

router.post('/tutores', autenticarToken, (req, res) => {
  void tutorController.cadastrar(req, res);
});

router.get('/tutores', autenticarToken, (req, res) => {
  void tutorController.listar(req, res);
});

router.get('/tutores/:id', autenticarToken, (req, res) => {
  void tutorController.buscarPorId(req, res);
});

router.put('/tutores/:id', autenticarToken, (req, res) => {
  void tutorController.atualizar(req, res);
});

router.delete('/tutores/:id', autenticarToken, (req, res) => {
  void tutorController.desativar(req, res);
});

export default router;
