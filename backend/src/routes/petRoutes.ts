import { Router } from 'express';
import { PetController } from '../controllers/PetController';
import { autenticarToken } from '../middlewares/autenticacao';

const router = Router();
const petController = new PetController();

router.post('/pets', autenticarToken, (req, res) => {
  void petController.cadastrar(req, res);
});

router.get('/pets', autenticarToken, (req, res) => {
  void petController.listar(req, res);
});

router.get('/pets/:id', autenticarToken, (req, res) => {
  void petController.buscarPorId(req, res);
});

router.put('/pets/:id', autenticarToken, (req, res) => {
  void petController.atualizar(req, res);
});

router.delete('/pets/:id', autenticarToken, (req, res) => {
  void petController.desativar(req, res);
});

export default router;
