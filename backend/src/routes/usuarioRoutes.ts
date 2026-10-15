import { Router } from 'express';
import { UsuarioController } from '../controllers/UsuarioController';

// Cria o roteador do Express
const router = Router();

// Instancia o Controller
const usuarioController = new UsuarioController();

// Define a rota para cadastrar usuários
router.post('/usuarios', (req, res) => {
  void usuarioController.cadastrar(req, res);
});

// Exporta as rotas
export default router;
